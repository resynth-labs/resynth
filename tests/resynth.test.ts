import { AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import {
  Fees,
  marginAccountPDA,
  PythClient,
  ResynthClient,
  SwapCurve,
  swapPoolPDA,
  syntheticAssetPDA,
  TokenFaucetClient,
  TokenSwapClient,
} from "../sdk/src";

chaiUse(chaiAsPromised.default);

function sleep(ms: number): Promise<boolean> {
  return new Promise((res) => {
    setTimeout(() => res(true), ms);
  });
}

describe("resynth", () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();

  // Deconstruct web3 objects for convenience
  const { connection, wallet } = provider;
  const payer = (wallet as NodeWallet).payer;

  provider.opts.skipPreflight = true;
  provider.opts.commitment = "processed";
  setProvider(provider);

  // // The mock pyth program, from Drift-v2 repo
  const pyth = new PythClient("localnet", connection, wallet as NodeWallet);

  // The main synthetic asset program
  const resynth = new ResynthClient(
    "localnet",
    connection,
    wallet as NodeWallet
  );

  const tokenFaucet = new TokenFaucetClient(
    "localnet",
    connection,
    wallet as NodeWallet
  );

  const tokenSwap = new TokenSwapClient(
    "localnet",
    connection,
    wallet as NodeWallet
  );

  // Sytem program
  const systemProgram = SystemProgram.programId;

  // The token program used by the synth amm
  const tokenProgram = TOKEN_PROGRAM_ID;

  // The associated token program
  const associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID;

  // The stablecoin as the base pair of the amm
  let stablecoinMint: PublicKey;

  const stablecoinDecimals: number = 6;

  let stablecoinFaucet: PublicKey;

  const goldDecimals: number = 3;

  // The gold synthetic asset account
  let goldAsset: PublicKey;

  // The gold synthetic mint
  let goldMint: PublicKey;

  // The pyth price account of physical gold
  let goldOracle: PublicKey;

  // User A will follow the happy path
  let userA: TestUser;

  // User B will trade against user A and follow the sad path
  let userB: TestUser;

  async function checkBalance(tokenAccount: PublicKey): Promise<BN> {
    let info = await provider.connection.getAccountInfo(tokenAccount);
    const account = AccountLayout.decode(info.data);

    return new BN(account.amount.toString());
  }

  async function checkWalletBalance(tokenAccount: PublicKey): Promise<number> {
    let info = await provider.connection.getAccountInfo(tokenAccount);
    let amount = info.lamports;

    return amount;
  }

  interface TestUser {
    wallet: Keypair;
    tokenAccounts: Record<string, PublicKey>;
  }

  async function createTestUser(): Promise<TestUser> {
    // Generate a new keypair
    const wallet = Keypair.generate();

    // Airdrop the wallet
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: wallet.publicKey,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });
    const transaction = new Transaction().add(transferInstruction);
    await provider.sendAndConfirm(transaction);

    return {
      wallet,
      tokenAccounts: {},
    };
  }

  /**
   * Creates a token account for the user. And mints a number of stablecoins to the account.
   *
   * @param {PublicKey} mint
   * @param {PublicKey} wallet
   * @param {number} amount
   * @returns {Promise<void>}
   */
  async function airdropStablecoin(
    mint: PublicKey,
    wallet: PublicKey,
    amount?: number
  ): Promise<void> {
    const { address: tokenAccount } = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      wallet
    );
    if (amount && amount > 0) {
      const txid = await tokenFaucet.airdrop({
        amount: new BN(amount),
        faucetAccount: stablecoinFaucet,
        mintAccount: mint,
        tokenAccountAccount: tokenAccount,
      });
      await tokenFaucet.connection.confirmTransaction(txid, "confirmed");
    }
  }

  /**
   * Creates a token account for the user. And mints a number of tokens to the account.
   *
   * @param {PublicKey} mint
   * @param {PublicKey} wallet
   * @param {number} amount
   * @returns {Promise<void>}
   */
  async function mintTestToken(
    mint: PublicKey,
    wallet: PublicKey,
    amount?: number
  ): Promise<void> {
    const { address: tokenAccount } = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      wallet
    );
    if (amount && amount > 0) {
      await mintTo(connection, payer, mint, tokenAccount, payer, amount);
    }
  }

  /**
   * Initialize a pyth price account for a token
   *
   * @param {PublicKey} mint the token mint to get decimals from
   * @param {number} price The price of a token in USD
   * @param {number} confidence The price confidence in percentage terms
   * @return {Promise<PublicKey>}
   */
  async function createOracle(
    decimals: number,
    price: number,
    confidence: number
  ): Promise<PublicKey> {
    const priceKeypair = Keypair.generate();

    const PYTH_PRICE_SIZE = 3312;

    console.log("price", price ** decimals);
    console.log("confidence", (confidence / 100) * price ** decimals);
    const unitPrice = new BN(price ** decimals);
    const absoluteConfidence = new BN((confidence / 100) ** decimals);

    await pyth.program.methods
      .initialize(unitPrice, -decimals, absoluteConfidence)
      .accountsStrict({
        price: priceKeypair.publicKey,
      })
      .preInstructions([
        SystemProgram.createAccount({
          /** The account that will transfer lamports to the created account */
          fromPubkey: payer.publicKey,
          /** Public key of the created account */
          newAccountPubkey: priceKeypair.publicKey,
          /** Amount of lamports to transfer to the created account */
          lamports: await connection.getMinimumBalanceForRentExemption(
            PYTH_PRICE_SIZE
          ),
          /** Amount of space in bytes to allocate to the created account */
          space: PYTH_PRICE_SIZE,
          /** Public key of the program to assign as the owner of the created account */
          programId: pyth.programId,
        }),
      ])
      .signers([priceKeypair])
      .rpc();

    return priceKeypair.publicKey;
  }

  /**
   * Set the price of a pyth account
   *
   * @param {PublicKey} priceAccount
   * @param {number} decimals
   * @param {number} price
   * @returns {Promise<void>}
   */
  async function setOracle(
    priceAccount: PublicKey,
    price: number,
    decimals: number
  ): Promise<void> {
    const unitPrice = new BN(price ** decimals);

    await pyth.program.methods
      .setPrice(unitPrice)
      .accountsStrict({
        price: priceAccount,
      })
      .rpc();
  }

  async function initializeSyntheticAsset(
    collateralMint: PublicKey,
    syntheticOracle: PublicKey,
    syntheticDecimals: number
  ): Promise<{ syntheticAsset: PublicKey; syntheticMint: PublicKey }> {
    const syntheticAssetKeypair = Keypair.generate();
    const syntheticAsset = syntheticAssetKeypair.publicKey;

    let { collateralVault, syntheticMint, assetAuthority } = syntheticAssetPDA(
      resynth.program,
      syntheticAsset
    );

    await resynth.program.methods
      .initializeSyntheticAsset(syntheticDecimals)
      .accountsStrict({
        syntheticAsset,
        collateralMint,
        collateralVault,
        syntheticMint,
        syntheticOracle,
        assetAuthority,
        payer: payer.publicKey,
        tokenProgram,
        systemProgram,
      })
      .signers([syntheticAssetKeypair])
      .rpc();

    return { syntheticAsset, syntheticMint };
  }

  /**
   * Initialize a margin account associated with the user and synthetic asset
   *
   * @param {TestUser} owner The owner of the margin account
   * @param {PublicKey} syntheticAsset The synthetic asset associated with the margin account
   * @return {Promise<void>}
   */
  async function initializeMarginAccount(
    owner: TestUser,
    syntheticAsset: PublicKey
  ): Promise<void> {
    const marginAccount = marginAccountPDA(
      resynth.program,
      owner.wallet.publicKey,
      syntheticAsset
    );
    resynth.program.methods
      .initializeMarginAccount()
      .accountsStrict({
        payer: owner.wallet.publicKey,
        owner: owner.wallet.publicKey,
        syntheticAsset,
        marginAccount,
        systemProgram,
      })
      .signers([owner.wallet])
      .rpc();
  }

  /**
   * Mints synthetic assets and provides collateral to the margin account
   *
   * @param {TestUser} owner The owner that receives the synthetic asset
   * @param {PublicKey} syntheticOracle The price oracle of the synthetic asset
   * @param {PublicKey} syntheticAsset The synthetic asset account
   * @param {number} collateralAmount The amount of collateral to provide
   * @param {number} mintAmount The amount of synthetic tokens to mint
   * @return {Promise<void>}
   */
  async function mintSyntheticAsset(
    owner: TestUser,
    syntheticOracle: PublicKey,
    syntheticAsset: PublicKey,
    collateralAmount: number,
    mintAmount: number
  ): Promise<void> {
    const { collateralVault, syntheticMint, assetAuthority } =
      syntheticAssetPDA(resynth.program, syntheticAsset);
    const marginAccount = marginAccountPDA(
      resynth.program,
      owner.wallet.publicKey,
      syntheticAsset
    );

    const collateralAccount = getAssociatedTokenAddressSync(
      stablecoinMint,
      owner.wallet.publicKey
    );

    const syntheticAccount = getAssociatedTokenAddressSync(
      goldMint,
      owner.wallet.publicKey
    );

    await resynth.program.methods
      .mintSyntheticAsset(new BN(collateralAmount), new BN(mintAmount))
      .accountsStrict({
        syntheticAsset,
        collateralVault,
        syntheticMint,
        syntheticOracle,
        assetAuthority,

        owner: owner.wallet.publicKey,
        marginAccount,
        collateralAccount,
        syntheticAccount,

        tokenProgram,
      })
      .signers([owner.wallet])
      .rpc();
  }

  async function initializeSwapPool(
    mintA: PublicKey,
    mintB: PublicKey,
    source: Keypair,
    feeReceiverWallet: PublicKey,
    fees: Fees,
    swapCurve: SwapCurve,
    tokenBPriceOrOffset: BN
  ) {
    const { swapPool, authority, vaultA, vaultB, lpmint, feeReceiver } =
      swapPoolPDA(tokenSwap.program, mintA, mintB);
    const { address: sourceA } = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintA,
      source.publicKey
    );
    const { address: sourceB } = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintB,
      source.publicKey
    );
    const lptoken = getAssociatedTokenAddressSync(lpmint, source.publicKey);

    await tokenSwap.program.methods
      .initializeSwapPool(fees, swapCurve, tokenBPriceOrOffset)
      .accountsStrict({
        swapPool,
        authority,

        vaultA,
        vaultB,
        lpmint,

        feeReceiver,
        feeReceiverWallet,

        mintA,
        mintB,
        source: userA.wallet.publicKey,
        sourceA,
        sourceB,
        lptoken,

        payer: payer.publicKey,

        systemProgram,
        tokenProgram,
        associatedTokenProgram,
      })
      .signers([source])
      .rpc();
  }

  async function provideLiquidityToAMM() {}

  before(async () => {
    const airdropSignature = await tokenFaucet.connection.requestAirdrop(
      wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await tokenFaucet.connection.confirmTransaction(
      airdropSignature,
      "confirmed"
    );
  });

  it("Create stablecoin", async () => {
    [stablecoinMint, stablecoinFaucet] = await tokenFaucet.createMintAndFaucet(
      stablecoinDecimals
    );
  });

  it("Create users", async () => {
    userA = await createTestUser();
    userB = await createTestUser();
  });

  it("Initialize synthetic gold price oracle", async () => {
    goldOracle = await createOracle(goldDecimals, 1_800, 1);
  });

  it("Initialize synthetic gold asset", async () => {
    ({ syntheticAsset: goldAsset, syntheticMint: goldMint } =
      await initializeSyntheticAsset(stablecoinMint, goldOracle, goldDecimals));
  });

  it("Mint stablecoins, and init gold accounts", async () => {
    await airdropStablecoin(
      stablecoinMint,
      userA.wallet.publicKey,
      2500 * 10 ** stablecoinDecimals
    );
    await airdropStablecoin(
      stablecoinMint,
      userB.wallet.publicKey,
      250 * 10 ** stablecoinDecimals
    );
    await mintTestToken(goldMint, userA.wallet.publicKey);
    await mintTestToken(goldMint, userB.wallet.publicKey);
  });

  it("Initialize margin accounts", async () => {
    await initializeMarginAccount(userA, goldAsset);
    await initializeMarginAccount(userB, goldAsset);
  });

  it("User A mints synthetic gold", async () => {
    await setOracle(goldOracle, 1_800, goldDecimals);
    await mintSyntheticAsset(userA, goldOracle, goldAsset, 2000, 0.1);
  });

  // it("User B mints an unhealthy amount of synthetic gold", async () => {
  //   await expect(
  //     mintSyntheticAsset(userB, goldOracle, goldAsset, 2000, 1)
  //   ).to.be.rejectedWith('"Custom":1');
  // });

  it("User B mints a healthy amount of synthetic gold", async () => {
    await mintSyntheticAsset(userB, goldOracle, goldAsset, 100, 0.005);
  });

  // it("Initialize gold swap pool", async () => {
  //   const fees: Fees = {
  //     tradeFeeNumerator: new BN(15),
  //     tradeFeeDenominator: new BN(10_000),
  //     ownerTradeFeeNumerator: new BN(5),
  //     ownerTradeFeeDenominator: new BN(10_000),
  //     ownerWithdrawFeeNumerator: new BN(0),
  //     ownerWithdrawFeeDenominator: new BN(10_000),
  //     hostFeeNumerator: new BN(5),
  //     hostFeeDenominator: new BN(10_000),
  //   };
  //   try {
  //     await initializeSwapPool(
  //       stablecoinMint,
  //       goldMint,
  //       userA.wallet,
  //       payer.publicKey,
  //       fees,
  //       SwapCurve.ConstantProductCurve,
  //       new BN(0)
  //     );
  //   } catch (e) {
  //     console.log(e);
  //     throw e; // fail the test
  //   }
  // });

  // it("User A provides liquidity to the AMM", async () => {});
});
