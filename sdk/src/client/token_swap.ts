import {
  AnchorProvider,
  BN,
  BorshAccountsCoder,
  BorshCoder,
  Idl,
  Instruction,
  Program,
  ProgramAccount,
  Wallet,
} from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createApproveInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import CONFIG from "../config.json";
import { IDL, TokenSwap } from "../idl/token_swap";
import { SwapPool } from "../types";
import {
  ConstantPriceCurve,
  ConstantProductCurve,
  OffsetCurve,
  Fees,
  RoundDirection,
  SwapCurveType,
  SwapCurve,
  TradeDirection,
} from "../types";
import { swapPoolPDA } from "../utils";
import assert from "assert";

export class TokenSwapClient {
  accountDiscriminators: Record<string, string> = {};
  cluster: "devnet" | "localnet" | "mainnet";
  coder: BorshCoder;
  config: any;
  connection: Connection;
  program: Program<TokenSwap>;
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
    this.config = CONFIG[this.cluster];
    this.programId = new PublicKey(this.config.tokenSwapProgramId);
    this.url = this.config.url;

    this.connection = connection
      ? connection
      : new Connection(this.url, "confirmed");

    this.wallet = wallet ? wallet : ({} as unknown as any);

    const opts = AnchorProvider.defaultOptions();
    this.provider = new AnchorProvider(this.connection, this.wallet, opts);
    this.program = new Program<TokenSwap>(IDL, this.programId, this.provider);

    // @ts-ignore
    this.coder = this.program._coder;

    this.accountDiscriminators[
      BorshAccountsCoder.accountDiscriminator("SwapPool").toString("base64")
    ] = "SwapPool";
  }

  // Accounts -----------------------------------------------------------------

  async fetchAllSwapPools(): Promise<ProgramAccount<SwapPool>[]> {
    return (await this.program.account.swapPool.all()) as ProgramAccount<SwapPool>[];
  }

  async fetchSwapPool(address: PublicKey): Promise<ProgramAccount<SwapPool>> {
    return {
      publicKey: address,
      account: await this.program.account.swapPool.fetch(address),
    } as ProgramAccount<SwapPool>;
  }

  // Instructions -------------------------------------------------------------

  //
  // Deposit both types of tokens into the pool.  The output is a "pool"
  // token representing ownership in the pool. Inputs are converted to
  // the current ratio.
  //
  async depositAllTokenTypes(params: {
    poolTokenAmount: BN;
    maximumTokenAAmount: BN;
    maximumTokenBAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    source: Signer,
    tokenA: PublicKey;
    tokenB: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<void> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.tokenA,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.maximumTokenAAmount)), //TODO this isn't great
      ),
      createApproveInstruction(
        params.tokenB,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.maximumTokenBAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .depositAllTokenTypes(params.poolTokenAmount, params.maximumTokenAAmount, params.maximumTokenBAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source.publicKey,
          userTransferAuthority: userTransferAuthority.publicKey,
          tokenA: params.tokenA,
          tokenB: params.tokenB,
          vaultA: params.vaultA,
          vaultB: params.vaultB,
          lpmint: params.lpmint,
          lptoken: params.lptoken,
          mintA: params.mintA,
          mintB: params.mintB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    await this.provider.sendAndConfirm(transaction, [params.source, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  //
  // Deposit one type of tokens into the pool.  The output is a "pool" token
  // representing ownership into the pool. Input token is converted as if
  // a swap and deposit all token types were performed.
  //
  async depositSingleTokenTypeExactAmountIn(params: {
    sourceTokenAmount: BN;
    minimumPoolTokenAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    source: Signer;
    tokenA: PublicKey | null;
    tokenB: PublicKey | null;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<void> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    const sourceToken = params.tokenA !== null ? params.tokenA : params.tokenB;
    assert(sourceToken);
    transaction.add(
      createApproveInstruction(
        sourceToken,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.sourceTokenAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .depositSingleTokenTypeExactAmountIn(params.sourceTokenAmount, params.minimumPoolTokenAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source.publicKey,
          userTransferAuthority: userTransferAuthority.publicKey,
          tokenA: params.tokenA,
          tokenB: params.tokenB,
          vaultA: params.vaultA,
          vaultB: params.vaultB,
          lpmint: params.lpmint,
          lptoken: params.lptoken,
          mintA: params.mintA,
          mintB: params.mintB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    await this.provider.sendAndConfirm(transaction, [params.source, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  //
  // Initializes a new swap
  //
  async initializeSwapPool(params: {
    fees: Fees;
    swapCurveType: SwapCurveType;
    tokenBPriceOrOffset: BN;
    initialTokenAAmount: BN;
    initialTokenBAmount: BN;
    feeReceiver: PublicKey;
    feeReceiverWallet: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    source: Signer;
    sourceA: PublicKey;
    sourceB: PublicKey;
  }): Promise<PublicKey> {
    const { swapPool, authority, vaultA, vaultB, lpmint } =
      swapPoolPDA(this.programId, params.mintA, params.mintB);

    const lptoken = getAssociatedTokenAddressSync(lpmint, params.source.publicKey);

    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.sourceA,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.initialTokenAAmount)), //TODO this isn't great
      ),
      createApproveInstruction(
        params.sourceB,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.initialTokenBAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .initializeSwapPool(params.fees, params.swapCurveType, params.tokenBPriceOrOffset, params.initialTokenAAmount, params.initialTokenBAmount)
        .accounts({
          swapPool,
          authority,
          vaultA,
          vaultB,
          lpmint,
          feeReceiver: params.feeReceiver,
          feeReceiverWallet: params.feeReceiverWallet,
          mintA: params.mintA,
          mintB: params.mintB,
          source: params.source.publicKey,
          userTransferAuthority: userTransferAuthority.publicKey,
          sourceA: params.sourceA,
          sourceB: params.sourceB,
          lptoken: lptoken,
          payer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    await this.provider.sendAndConfirm(transaction, [params.source, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
    return swapPool;
  }

  //
  // Swap the tokens in the pool.
  //
  async swap(params: {
    amountIn: BN;
    minimumAmountOut: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    source: Signer;
    sourceToken: PublicKey;
    sourceVault: PublicKey;
    destVault: PublicKey;
    destToken: PublicKey;
    lpmint: PublicKey;
    feeReceiver: PublicKey;
    hostFeeReceiver: PublicKey | null;
  }): Promise<void> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.sourceToken,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.amountIn)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .swap(params.amountIn, params.minimumAmountOut)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source.publicKey,
          userTransferAuthority: userTransferAuthority.publicKey,
          sourceToken: params.sourceToken,
          sourceVault: params.sourceVault,
          destVault: params.destVault,
          destToken: params.destToken,
          lpmint: params.lpmint,
          feeReceiver: params.feeReceiver,
          tokenProgram: TOKEN_PROGRAM_ID,
          hostFeeReceiver: params.hostFeeReceiver,
        })
        .instruction(),
    );

    await this.provider.sendAndConfirm(transaction, [params.source, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  async swapInstruction(params: {
    amountIn: BN;
    minimumAmountOut: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    source: PublicKey;
    userTransferAuthority: PublicKey;
    sourceTokenAccount: PublicKey;
    sourceVault: PublicKey;
    destVault: PublicKey;
    destTokenAccount: PublicKey;
    lpmint: PublicKey;
    feeReceiver: PublicKey;
    hostFeeReceiver: PublicKey | null;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .swap(params.amountIn, params.minimumAmountOut)
      .accounts({
        swapPool: params.swapPool,
        authority: params.authority,
        source: params.source,
        userTransferAuthority: params.userTransferAuthority,
        sourceToken: params.sourceTokenAccount,
        sourceVault: params.sourceVault,
        destVault: params.destVault,
        destToken: params.destTokenAccount,
        lpmint: params.lpmint,
        feeReceiver: params.feeReceiver,
        tokenProgram: TOKEN_PROGRAM_ID,
        hostFeeReceiver: params.hostFeeReceiver,
      })
      .instruction();
  }

  //
  // Withdraw both types of tokens from the pool at the current ratio, given
  // pool tokens.  The pool tokens are burned in exchange for an equivalent
  // amount of token A and B.
  //
  async withdrawAllTokenTypes(params: {
    poolTokenAmount: BN;
    minimumTokenAAmount: BN;
    minimumTokenBAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    source: Signer;
    lpmint: PublicKey;
    lptoken: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    feeReceiver: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<void> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.lptoken,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.poolTokenAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .withdrawAllTokenTypes(params.poolTokenAmount, params.minimumTokenAAmount, params.minimumTokenBAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source.publicKey,
          userTransferAuthority: userTransferAuthority.publicKey,
          lpmint: params.lpmint,
          lptoken: params.lptoken,
          vaultA: params.vaultA,
          vaultB: params.vaultB,
          tokenA: params.tokenA,
          tokenB: params.tokenB,
          feeReceiver: params.feeReceiver,
          mintA: params.mintA,
          mintB: params.mintB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    await this.provider.sendAndConfirm(transaction, [params.source, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  //
  // Withdraw one token type from the pool at the current ratio given the
  // exact amount out expected.
  //
  async withdrawSingleTokenTypeExactAmountOut(params: {
    destinationTokenAmount: BN;
    maximumPoolTokenAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    source: Signer;
    lpmint: PublicKey;
    lptoken: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    tokenA: PublicKey | null;
    tokenB: PublicKey | null;
    feeReceiver: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<void> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.lptoken,
        userTransferAuthority.publicKey,
        params.source.publicKey,
        BigInt(Number(params.maximumPoolTokenAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .withdrawSingleTokenTypeExactAmountOut(params.destinationTokenAmount, params.maximumPoolTokenAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source.publicKey,
          userTransferAuthority: userTransferAuthority.publicKey,
          lpmint: params.lpmint,
          lptoken: params.lptoken,
          vaultA: params.vaultA,
          vaultB: params.vaultB,
          tokenA: params.tokenA,
          tokenB: params.tokenB,
          feeReceiver: params.feeReceiver,
          mintA: params.mintA,
          mintB: params.mintB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    await this.provider.sendAndConfirm(transaction, [params.source, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }
}
