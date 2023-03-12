import {
  BN,
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
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import { IDL, TokenSwap } from "../idl/token_swap";
import { SwapPool } from "../types";
import { Fees, SwapCurveType } from "../types";
import { ResynthConfig, swapPoolPDA } from "../utils";
import { Context } from "./context";
import assert from "assert";

export class TokenSwapClient {
  context: Context;
  program: Program<TokenSwap>;
  programId: PublicKey;

  constructor(context: Context) {
    this.context = context;
    this.programId = new PublicKey(this.context.config.tokenSwapProgramId);
    this.program = new Program<TokenSwap>(IDL, this.programId, this.context.provider);
  }

  get config(): ResynthConfig {
    return this.context.config;
  }

  get connection(): Connection {
    return this.context.connection;
  }

  get wallet(): Wallet {
    return this.context.wallet;
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
    maximumTokenAAmount: BN;
    maximumTokenBAmount: BN;
    swapPool: ProgramAccount<SwapPool>;
    owner: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    lptoken: PublicKey;
    signers: Signer[];
  }): Promise<TransactionSignature> {
    const poolTokenAmount = BN.min(
      params.maximumTokenAAmount.mul(params.swapPool.account.lpmintSupply).div(params.swapPool.account.vaultABalance),
      params.maximumTokenBAmount.mul(params.swapPool.account.lpmintSupply).div(params.swapPool.account.vaultBBalance),
    );

    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.tokenA,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.maximumTokenAAmount)), //TODO this isn't great. we should probable convert everything to bigint
      ),
      createApproveInstruction(
        params.tokenB,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.maximumTokenBAmount)), //TODO this isn't great. we should probable convert everything to bigint
      ),
    );

    transaction.add(
      await this.program.methods
        .depositAllTokenTypes(poolTokenAmount, params.maximumTokenAAmount, params.maximumTokenBAmount)
        .accounts({
          swapPool: params.swapPool.publicKey,
          authority: params.swapPool.account.authority,
          owner: params.owner,
          userTransferAuthority: userTransferAuthority.publicKey,
          tokenA: params.tokenA,
          tokenB: params.tokenB,
          vaultA: params.swapPool.account.vaultA,
          vaultB: params.swapPool.account.vaultB,
          lpmint: params.swapPool.account.lpmint,
          lptoken: params.lptoken,
          mintA: params.swapPool.account.mintA,
          mintB: params.swapPool.account.mintB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    return await this.context.provider.sendAndConfirm(transaction, [...params.signers, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  async depositAllTokenTypesInstruction(params: {
    poolTokenAmount: BN;
    maximumTokenAAmount: BN;
    maximumTokenBAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    owner: PublicKey;
    userTransferAuthority: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .depositAllTokenTypes(params.poolTokenAmount, params.maximumTokenAAmount, params.maximumTokenBAmount)
      .accountsStrict({
        swapPool: params.swapPool,
        authority: params.authority,
        owner: params.owner,
        userTransferAuthority: params.userTransferAuthority,
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
      .instruction();
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
    owner: PublicKey;
    tokenA: PublicKey | null;
    tokenB: PublicKey | null;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    signers: Signer[];
  }): Promise<TransactionSignature> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    const sourceToken = params.tokenA !== null ? params.tokenA : params.tokenB;
    transaction.add(
      createApproveInstruction(
        sourceToken!,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.sourceTokenAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .depositSingleTokenTypeExactAmountIn(params.sourceTokenAmount, params.minimumPoolTokenAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          owner: params.owner,
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

    return await this.context.provider.sendAndConfirm(transaction, [...params.signers, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  async depositSingleTokenTypeExactAmountInInstruction(params: {
    sourceTokenAmount: BN;
    minimumPoolTokenAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    owner: PublicKey;
    userTransferAuthority: PublicKey;
    tokenA: PublicKey | null;
    tokenB: PublicKey | null;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .depositSingleTokenTypeExactAmountIn(params.sourceTokenAmount, params.minimumPoolTokenAmount)
      .accountsStrict({
        swapPool: params.swapPool,
        authority: params.authority,
        owner: params.owner,
        userTransferAuthority: params.userTransferAuthority,
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
      .instruction();
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
    mintA: PublicKey;
    mintB: PublicKey;
    owner: PublicKey;
    sourceA: PublicKey;
    sourceB: PublicKey;
    signers: Signer[];
  }): Promise<PublicKey> {
    const { mintA, mintB, swapPool, authority, vaultA, vaultB, lpmint, feeReceiver, feeReceiverWallet } =
      swapPoolPDA(this.programId, params.mintA, params.mintB);

    assert(mintA.equals(params.mintA))
    assert(mintB.equals(params.mintB))

    const lptoken = getAssociatedTokenAddressSync(lpmint, params.owner);

    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.sourceA,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.initialTokenAAmount)), //TODO this isn't great
      ),
      createApproveInstruction(
        params.sourceB,
        userTransferAuthority.publicKey,
        params.owner,
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
          feeReceiver,
          feeReceiverWallet,
          mintA: params.mintA,
          mintB: params.mintB,
          owner: params.owner,
          userTransferAuthority: userTransferAuthority.publicKey,
          sourceA: params.sourceA,
          sourceB: params.sourceB,
          lptoken: lptoken,
          payer: this.context.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction(),
    );

    await this.context.provider.sendAndConfirm(transaction, [...params.signers, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
    return swapPool;
  }

  async initializeSwapPoolInstruction(params: {
    fees: Fees;
    swapCurveType: SwapCurveType;
    tokenBPriceOrOffset: BN;
    initialTokenAAmount: BN;
    initialTokenBAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    feeReceiver: PublicKey;
    feeReceiverWallet: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    owner: PublicKey;
    userTransferAuthority: PublicKey;
    sourceA: PublicKey;
    sourceB: PublicKey;
    lptoken: PublicKey;
    associatedTokenProgram: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .initializeSwapPool(params.fees, params.swapCurveType, params.tokenBPriceOrOffset, params.initialTokenAAmount, params.initialTokenBAmount)
      .accountsStrict({
        swapPool: params.swapPool,
        authority: params.authority,
        vaultA: params.vaultA,
        vaultB: params.vaultB,
        lpmint: params.lpmint,
        feeReceiver: params.feeReceiver,
        feeReceiverWallet: params.feeReceiverWallet,
        mintA: params.mintA,
        mintB: params.mintB,
        owner: params.owner,
        userTransferAuthority: params.userTransferAuthority,
        sourceA: params.sourceA,
        sourceB: params.sourceB,
        lptoken: params.lptoken,
        payer: this.context.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  //
  // Swap the tokens in the pool.
  //
  async swap(params: {
    amountIn: BN;
    minimumAmountOut: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    owner: PublicKey;
    sourceToken: PublicKey;
    sourceVault: PublicKey;
    destVault: PublicKey;
    destToken: PublicKey;
    lpmint: PublicKey;
    feeReceiver: PublicKey;
    hostFeeReceiver: PublicKey | null;
    signers: Signer[];
  }): Promise<TransactionSignature> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.sourceToken,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.amountIn)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .swap(params.amountIn, params.minimumAmountOut)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          owner: params.owner,
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

    return await this.context.provider.sendAndConfirm(transaction, [...params.signers, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  async swapInstruction(params: {
    amountIn: BN;
    minimumAmountOut: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    owner: PublicKey;
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
        owner: params.owner,
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
    owner: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    feeReceiver: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    signers: Signer[];
  }): Promise<TransactionSignature> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.lptoken,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.poolTokenAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .withdrawAllTokenTypes(params.poolTokenAmount, params.minimumTokenAAmount, params.minimumTokenBAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          owner: params.owner,
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

    return await this.context.provider.sendAndConfirm(transaction, [...params.signers, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  async withdrawAllTokenTypesInstruction(params: {
    poolTokenAmount: BN;
    minimumTokenAAmount: BN;
    minimumTokenBAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    owner: PublicKey;
    userTransferAuthority: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    feeReceiver: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .withdrawAllTokenTypes(params.poolTokenAmount, params.minimumTokenAAmount, params.minimumTokenBAmount)
      .accountsStrict({
        swapPool: params.swapPool,
        authority: params.authority,
        owner: params.owner,
        userTransferAuthority: params.userTransferAuthority,
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
      .instruction();
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
    owner: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    tokenA: PublicKey | null;
    tokenB: PublicKey | null;
    feeReceiver: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
    signers: Signer[];
  }): Promise<TransactionSignature> {
    const transaction = new Transaction();

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        params.lptoken,
        userTransferAuthority.publicKey,
        params.owner,
        BigInt(Number(params.maximumPoolTokenAmount)), //TODO this isn't great
      ),
    );

    transaction.add(
      await this.program.methods
        .withdrawSingleTokenTypeExactAmountOut(params.destinationTokenAmount, params.maximumPoolTokenAmount)
        .accounts({
          swapPool: params.swapPool,
          authority: params.authority,
          owner: params.owner,
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

    return await this.context.provider.sendAndConfirm(transaction, [...params.signers, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });
  }

  async withdrawSingleTokenTypeExactAmountOutInstruction(params: {
    destinationTokenAmount: BN;
    maximumPoolTokenAmount: BN;
    swapPool: PublicKey;
    authority: PublicKey;
    owner: PublicKey;
    userTransferAuthority: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    tokenA: PublicKey | null;
    tokenB: PublicKey | null;
    feeReceiver: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .withdrawSingleTokenTypeExactAmountOut(params.destinationTokenAmount, params.maximumPoolTokenAmount)
      .accountsStrict({
        swapPool: params.swapPool,
        authority: params.authority,
        owner: params.owner,
        userTransferAuthority: params.userTransferAuthority,
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
      .instruction();
  }
}
