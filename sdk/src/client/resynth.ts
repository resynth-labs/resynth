import {
  AnchorProvider,
  BN,
  Program,
  ProgramAccount,
  Wallet,
} from "@coral-xyz/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import CONFIG from "../config.json";
import { IDL, Resynth } from "../idl/resynth";
import { MarginAccount, SyntheticAsset } from "../types";
import { marginAccountPDA, ResynthConfig, syntheticAssetPDA } from "../utils";

export class ResynthClient {
  cluster: "devnet" | "localnet" | "mainnet";
  config: ResynthConfig;
  connection: Connection;
  program: Program<Resynth>;
  programId: PublicKey;
  provider: AnchorProvider;
  url: string;
  wallet: Wallet;

  constructor(
    cluster: "devnet" | "localnet" | "mainnet",
    connection?: Connection,
    wallet?: Wallet
  ) {
    this.cluster = cluster;
    this.config = CONFIG[this.cluster] as ResynthConfig;
    this.programId = new PublicKey(this.config.resynthProgramId);
    this.url = this.config.url;

    this.connection = connection
      ? connection
      : new Connection(this.url, "confirmed");

    this.wallet = wallet ? wallet : ({} as unknown as any);

    const opts = AnchorProvider.defaultOptions();
    this.provider = new AnchorProvider(this.connection, this.wallet, opts);
    this.program = new Program<Resynth>(IDL, this.programId, this.provider);
  }

  // Accounts -----------------------------------------------------------------

  async fetchAllMarginAccounts(): Promise<ProgramAccount<MarginAccount>[]> {
    return (await this.program.account.marginAccount.all()) as ProgramAccount<MarginAccount>[];
  }

  async fetchMarginAccount(
    address: PublicKey
  ): Promise<ProgramAccount<MarginAccount>> {
    return {
      publicKey: address,
      account: await this.program.account.marginAccount.fetch(address),
    } as ProgramAccount<MarginAccount>;
  }

  async fetchAllSyntheticAssets(): Promise<ProgramAccount<SyntheticAsset>[]> {
    return (await this.program.account.syntheticAsset.all()) as ProgramAccount<SyntheticAsset>[];
  }

  async fetchSyntheticAsset(
    address: PublicKey
  ): Promise<ProgramAccount<SyntheticAsset>> {
    return {
      publicKey: address,
      account: await this.program.account.syntheticAsset.fetch(address),
    } as ProgramAccount<SyntheticAsset>;
  }

  // Instructions -------------------------------------------------------------

  async initializeSyntheticAsset(params: {
    collateralMint: PublicKey;
    syntheticOracle: PublicKey;
  }): Promise<TransactionSignature> {
    let { syntheticAsset, collateralVault, syntheticMint, assetAuthority } =
      syntheticAssetPDA(this.programId, params.syntheticOracle);

    return this.program.methods
      .initializeSyntheticAsset()
      .accountsStrict({
        syntheticAsset: syntheticAsset,
        collateralMint: params.collateralMint,
        collateralVault: collateralVault,
        syntheticMint: syntheticMint,
        syntheticOracle: params.syntheticOracle,
        assetAuthority: assetAuthority,
        payer: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed", skipPreflight: true });
  }

  async initializeSyntheticAssetInstruction(params: {
    syntheticAsset: PublicKey;
    collateralMint: PublicKey;
    collateralVault: PublicKey;
    syntheticMint: PublicKey;
    syntheticOracle: PublicKey;
    assetAuthority: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .initializeSyntheticAsset()
      .accountsStrict({
        syntheticAsset: params.syntheticAsset,
        collateralMint: params.collateralMint,
        collateralVault: params.collateralVault,
        syntheticMint: params.syntheticMint,
        syntheticOracle: params.syntheticOracle,
        assetAuthority: params.assetAuthority,
        payer: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  /**
   * Initialize a margin account associated with the user and synthetic asset
   *
   * @param {TestUser} owner The owner of the margin account
   * @param {PublicKey} syntheticAsset The synthetic asset associated with the margin account
   * @return {Promise<TransactionSignature>}
   */
  async initializeMarginAccount(params: {
    owner: Signer;
    syntheticAsset: PublicKey;
  }): Promise<TransactionSignature> {
    const marginAccount = marginAccountPDA(
      this.programId,
      params.owner.publicKey,
      params.syntheticAsset
    );
    return this.program.methods
      .initializeMarginAccount()
      .accountsStrict({
        payer: params.owner.publicKey,
        owner: params.owner.publicKey,
        syntheticAsset: params.syntheticAsset,
        marginAccount: marginAccount,
        systemProgram: SystemProgram.programId,
      })
      .signers([params.owner])
      .rpc({ commitment: "confirmed", skipPreflight: true });
  }

  async initializeMarginAccountInstruction(params: {
    owner: PublicKey;
    syntheticAsset: PublicKey;
    marginAccount: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .initializeMarginAccount()
      .accountsStrict({
        payer: this.wallet.publicKey,
        owner: params.owner,
        syntheticAsset: params.syntheticAsset,
        marginAccount: params.marginAccount,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  /**
   * Mints synthetic assets and provides collateral to the margin account
   *
   * @param {TestUser} owner The owner that receives the synthetic asset
   * @param {PublicKey} syntheticOracle The price oracle of the synthetic asset
   * @param {PublicKey} syntheticAsset The synthetic asset account
   * @param {number} collateralAmount The amount of collateral to provide
   * @param {number} mintAmount The amount of synthetic tokens to mint
   * @return {Promise<TransactionSignature>}
   */
  async mintSyntheticAsset(params: {
    collateralAmount: BN;
    mintAmount: BN;
    syntheticOracle: PublicKey;
    owner: PublicKey;
    collateralMint: PublicKey;
    collateralAccount?: PublicKey;
    syntheticAccount?: PublicKey;
    signers?: Signer[];
  }): Promise<TransactionSignature> {
    const instruction = await this.mintSyntheticAssetInstruction({
      collateralAmount: params.collateralAmount,
      mintAmount: params.mintAmount,
      syntheticOracle: params.syntheticOracle,
      owner: params.owner,
      collateralMint: params.collateralMint,
      collateralAccount: params.collateralAccount,
      syntheticAccount: params.syntheticAccount,
    });
    const transaction = new Transaction().add(instruction);
    return await this.provider.sendAndConfirm(transaction, params.signers, {
      commitment: "confirmed",
      skipPreflight: true,
    });
  }

  async mintSyntheticAssetInstruction(params: {
    collateralAmount: BN;
    mintAmount: BN;
    syntheticOracle: PublicKey;
    owner: PublicKey;
    collateralMint: PublicKey;
    collateralAccount?: PublicKey;
    syntheticAccount?: PublicKey;
  }): Promise<TransactionInstruction> {
    const { syntheticAsset, collateralVault, syntheticMint, assetAuthority } =
      syntheticAssetPDA(this.programId, params.syntheticOracle);

    const marginAccount = marginAccountPDA(
      this.programId,
      params.owner,
      syntheticAsset
    );

    const collateralAccount =
      params.collateralAccount ??
      getAssociatedTokenAddressSync(params.collateralMint, params.owner);

    const syntheticAccount =
      params.syntheticAccount ??
      getAssociatedTokenAddressSync(syntheticMint, params.owner);

    return this.program.methods
      .mintSyntheticAsset(params.collateralAmount, params.mintAmount)
      .accountsStrict({
        syntheticAsset: syntheticAsset,
        collateralVault: collateralVault,
        syntheticMint: syntheticMint,
        syntheticOracle: params.syntheticOracle,
        assetAuthority: assetAuthority,
        owner: params.owner,
        marginAccount: marginAccount,
        collateralAccount,
        syntheticAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .instruction();
  }
}
