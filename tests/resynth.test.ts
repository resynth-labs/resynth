import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
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
  Context,
  PythClient,
  ResynthClient,
  syntheticAssetPDA,
  TokenFaucetClient,
} from "../sdk/src";

chaiUse(chaiAsPromised.default);

describe("resynth", () => {
  const context = new Context('localnet', undefined, NodeWallet.local());

  // // The mock pyth program, from Drift-v2 repo
  const pyth = new PythClient(context);

  // The main synthetic asset program
  const resynth = new ResynthClient(context);

  const tokenFaucet = new TokenFaucetClient(context);

  // The stablecoin as the base pair of the amm
  let stablecoinMint: PublicKey = new PublicKey(context.config.tokens.USDC.mint);

  const stablecoinDecimals: number = 6;

  let stablecoinFaucet: PublicKey = new PublicKey(context.config.tokens.USDC.faucet!);

  const goldDecimals: number = 9;

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
      fromPubkey: resynth.wallet.publicKey,
      toPubkey: wallet.publicKey,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });
    const transaction = new Transaction().add(transferInstruction);
    await context.provider.sendAndConfirm(transaction);

    return {
      wallet,
      tokenAccounts: {},
    };
  }

  before(async () => {
    const airdropSignature = await resynth.connection.requestAirdrop(
      resynth.wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await resynth.connection.confirmTransaction(
      airdropSignature,
      "confirmed"
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
    await resynth.initializeSyntheticAsset({
      collateralMint: stablecoinMint,
      syntheticOracle: goldOracle,
    });

    ({ syntheticAsset: goldAsset, syntheticMint: goldMint } = syntheticAssetPDA(
      resynth.programId,
      goldOracle
    ));
  });

  it("Airdrop stablecoins", async () => {
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
  });

  it("Initialize margin accounts", async () => {
    await resynth.initializeMarginAccount({
      owner: userA.wallet,
      syntheticAsset: goldAsset,
    });
    await resynth.initializeMarginAccount({
      owner: userB.wallet,
      syntheticAsset: goldAsset,
    });
  });

  it("User A mints synthetic gold", async () => {
    await pyth.setPrice({
      price: 1_800,
      expo: -goldDecimals,
      conf: 1,
      oracle: goldOracle,
    });
    await resynth.mintSyntheticAsset({
      owner: userA.wallet.publicKey,
      syntheticOracle: goldOracle,
      collateralMint: stablecoinMint,
      collateralAmount: new BN(2000 * 10 ** stablecoinDecimals),
      mintAmount: new BN(0.1 * 10 ** goldDecimals),
      signers: [userA.wallet],
    });
  });

  //TODO: Fix this test
  // it("User B mints an unhealthy amount of synthetic gold", async () => {
  //   await expect(
  //     mintSyntheticAsset(userB, goldOracle, goldAsset, 2000, 1)
  //   ).to.be.rejectedWith('"Custom":1');
  // });

  it("User B mints a healthy amount of synthetic gold", async () => {
    await resynth.mintSyntheticAsset({
      owner: userB.wallet.publicKey,
      syntheticOracle: goldOracle,
      collateralMint: stablecoinMint,
      collateralAmount: new BN(100 * 10 ** stablecoinDecimals),
      mintAmount: new BN(0.005 * 10 ** goldDecimals),
      signers: [userB.wallet],
    });
  });

  it("User A burns synthetic gold", async () => {
    await pyth.setPrice({
      price: 1_800,
      expo: -goldDecimals,
      conf: 1,
      oracle: goldOracle,
    });
    await resynth.burnSyntheticAsset({
      owner: userA.wallet.publicKey,
      syntheticOracle: goldOracle,
      collateralMint: stablecoinMint,
      collateralAmount: new BN(2000 * 10 ** stablecoinDecimals),
      burnAmount: new BN(0.1 * 10 ** goldDecimals),
      signers: [userA.wallet],
    });
  });

  it("User B burns synthetic gold", async () => {
    await resynth.burnSyntheticAsset({
      owner: userB.wallet.publicKey,
      syntheticOracle: goldOracle,
      collateralMint: stablecoinMint,
      collateralAmount: new BN(100 * 10 ** stablecoinDecimals),
      burnAmount: new BN(0.005 * 10 ** goldDecimals),
      signers: [userB.wallet],
    });
  });
});
