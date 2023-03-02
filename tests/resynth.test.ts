import { AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
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
import { use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import {
  marginAccountPDA,
  PythClient,
  ResynthClient,
  syntheticAssetPDA,
  TokenFaucetClient,
  TokenSwapClient,
} from "../sdk/src";

chaiUse(chaiAsPromised.default);

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

  async function initializeSyntheticAsset(
    collateralMint: PublicKey,
    syntheticOracle: PublicKey,
    syntheticDecimals: number
  ): Promise<void> {
    let { syntheticAsset, collateralVault, syntheticMint, assetAuthority } =
      syntheticAssetPDA(resynth.programId, syntheticOracle);

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
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
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
      resynth.programId,
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
        systemProgram: SystemProgram.programId,
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
    collateralMint: PublicKey,
    collateralAmount: number,
    mintAmount: number
  ): Promise<void> {
    const { syntheticAsset, collateralVault, syntheticMint, assetAuthority } =
      syntheticAssetPDA(resynth.programId, syntheticOracle);
    const marginAccount = marginAccountPDA(
      resynth.programId,
      owner.wallet.publicKey,
      syntheticAsset
    );

    const collateralAccount = getAssociatedTokenAddressSync(
      collateralMint,
      owner.wallet.publicKey
    );

    const syntheticAccount = getAssociatedTokenAddressSync(
      syntheticMint,
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

        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([owner.wallet])
      .rpc();
  }

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
    goldOracle = await pyth.initialize({
      price: 1_800,
      expo: -goldDecimals,
      conf: 1,
    });
  });

  it("Initialize synthetic gold asset", async () => {
    await initializeSyntheticAsset(stablecoinMint, goldOracle, goldDecimals);

    ({ syntheticAsset: goldAsset, syntheticMint: goldMint } = syntheticAssetPDA(
      resynth.programId,
      goldOracle
    ));
  });

  it("Mint stablecoins, and init gold accounts", async () => {
    await tokenFaucet.airdrop({
      amount: new BN(2500 * 10 ** stablecoinDecimals),
      faucet: stablecoinFaucet,
      mint: stablecoinMint,
      owner: userA.wallet.publicKey,
    });
    await tokenFaucet.airdrop({
      amount: new BN(250 * 10 ** stablecoinDecimals),
      faucet: stablecoinFaucet,
      mint: stablecoinMint,
      owner: userB.wallet.publicKey,
    });
    await mintTestToken(goldMint, userA.wallet.publicKey);
    await mintTestToken(goldMint, userB.wallet.publicKey);
  });

  it("Initialize margin accounts", async () => {
    await initializeMarginAccount(userA, goldAsset);
    await initializeMarginAccount(userB, goldAsset);
  });

  it("User A mints synthetic gold", async () => {
    await pyth.setPrice({
      price: new BN(1_800 * 10 ** goldDecimals),
      priceAccount: goldOracle,
    });
    await mintSyntheticAsset(
      userA,
      goldOracle,
      stablecoinMint,
      2000 * 10 ** stablecoinDecimals,
      0.1 * 10 ** goldDecimals
    );
  });

  //TODO: Fix this test
  // it("User B mints an unhealthy amount of synthetic gold", async () => {
  //   await expect(
  //     mintSyntheticAsset(userB, goldOracle, goldAsset, 2000, 1)
  //   ).to.be.rejectedWith('"Custom":1');
  // });

  it("User B mints a healthy amount of synthetic gold", async () => {
    await mintSyntheticAsset(
      userB,
      goldOracle,
      stablecoinMint,
      100 * 10 ** stablecoinDecimals,
      0.005 * 10 ** goldDecimals
    );
  });

});
