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
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
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

  decodeAccountName(buffer: Buffer): string {
    const accountDiscriminator = buffer.slice(0, 8).toString("base64");
    return this.accountDiscriminators[accountDiscriminator];
  }

  decodeAccount(accountName: string, buffer: Buffer): any {
    // Anchor uses camelCase for account names, but the discriminator is in PascalCase.
    accountName = accountName.charAt(0).toLowerCase() + accountName.slice(1);
    return this.coder.accounts.decodeUnchecked(accountName, buffer);
  }

  encodeAccount(accountName: string, account: any): Buffer {
    const buffer = Buffer.alloc(8192);
    // @ts-ignore
    const layout = this.coder.accounts.accountLayouts.get(accountName);
    if (!layout) {
      throw new Error(`Unknown account: ${accountName}`);
    }
    const len = layout.encode(account, buffer);
    let accountData = buffer.slice(0, len);
    let discriminator = BorshAccountsCoder.accountDiscriminator(accountName);
    return Buffer.concat([discriminator, accountData]);
  }

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

  decodeInstruction(str: string): Instruction {
    return this.coder.instruction.decode(str, "base58");
  }

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
    source: PublicKey,
    userTransferAuthority: Signer;
    tokenA: PublicKey;
    tokenB: PublicKey;
    vaultA: PublicKey;
    vaultB: PublicKey;
    lpmint: PublicKey;
    lptoken: PublicKey;
    mintA: PublicKey;
    mintB: PublicKey;
  }): Promise<void> {
    const txid = await this.program.rpc.depositAllTokenTypes(
      params.poolTokenAmount,
      params.maximumTokenAAmount,
      params.maximumTokenBAmount,
      {
        accounts: {
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source,
          userTransferAuthority: params.userTransferAuthority.publicKey,
          tokenA: params.tokenA,
          tokenB: params.tokenB,
          vaultA: params.vaultA,
          vaultB: params.vaultB,
          lpmint: params.lpmint,
          lptoken: params.lptoken,
          mintA: params.mintA,
          mintB: params.mintB,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [params.userTransferAuthority],
      }
    );
    await this.connection.confirmTransaction(txid, "confirmed");
  }

  //
  // Deposit one type of tokens into the pool.  The output is a "pool" token
  // representing ownership into the pool. Input token is converted as if
  // a swap and deposit all token types were performed.
  //
  async depositSingleTokenTypeExactAmountIn(params: {
    sourceTokenAmount: BN;
    minimumPoolTokenAmount: BN;
    swapPoolAccount: PublicKey;
    authorityAccount: PublicKey;
    userTransferAuthorityAccount: PublicKey;
    tokenAAccount: PublicKey;
    tokenBAccount: PublicKey;
    vaultAAccount: PublicKey;
    vaultBAccount: PublicKey;
    lpmintAccount: PublicKey;
    lptokenAccount: PublicKey;
    mintAAccount: PublicKey;
    mintBAccount: PublicKey;
  }): Promise<void> {
    const txid = await this.program.rpc.depositSingleTokenTypeExactAmountIn(
      params.sourceTokenAmount,
      params.minimumPoolTokenAmount,
      {
        accounts: {
          swapPool: params.swapPoolAccount,
          authority: params.authorityAccount,
          userTransferAuthority: params.userTransferAuthorityAccount,
          tokenA: params.tokenAAccount,
          tokenB: params.tokenBAccount,
          vaultA: params.vaultAAccount,
          vaultB: params.vaultBAccount,
          lpmint: params.lpmintAccount,
          lptoken: params.lptokenAccount,
          mintA: params.mintAAccount,
          mintB: params.mintBAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    await this.connection.confirmTransaction(txid, "confirmed");
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
    source: PublicKey;
    userTransferAuthority: Signer;
    sourceA: PublicKey;
    sourceB: PublicKey;
  }): Promise<PublicKey> {
    const { swapPool, authority, vaultA, vaultB, lpmint } =
      swapPoolPDA(this.programId, params.mintA, params.mintB);

    const lptoken = getAssociatedTokenAddressSync(lpmint, params.source);

    const txid = await this.program.rpc.initializeSwapPool(
      params.fees,
      params.swapCurveType,
      params.tokenBPriceOrOffset,
      params.initialTokenAAmount,
      params.initialTokenBAmount,
      {
        accounts: {
          swapPool,
          authority,
          vaultA,
          vaultB,
          lpmint,
          feeReceiver: params.feeReceiver,
          feeReceiverWallet: params.feeReceiverWallet,
          mintA: params.mintA,
          mintB: params.mintB,
          source: params.source,
          userTransferAuthority: params.userTransferAuthority.publicKey,
          sourceA: params.sourceA,
          sourceB: params.sourceB,
          lptoken: lptoken,
          payer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        },
        signers: [params.userTransferAuthority],
      }
    );
    await this.connection.confirmTransaction(txid, "confirmed");
    return swapPool;
  }

  //
  // Swap the tokens in the pool.
  //
  async swap(params: {
    amountIn: BN;
    minimumAmountOut: BN;
    swapPoolAccount: PublicKey;
    authorityAccount: PublicKey;
    userTransferAuthorityAccount: PublicKey;
    sourceTokenAccount: PublicKey;
    sourceVaultAccount: PublicKey;
    destVaultAccount: PublicKey;
    destTokenAccount: PublicKey;
    lpmintAccount: PublicKey;
    feeReceiverAccount: PublicKey;
    hostFeeReceiverAccount: PublicKey;
  }): Promise<void> {
    const txid = await this.program.rpc.swap(params.amountIn, params.minimumAmountOut, {
      accounts: {
        swapPool: params.swapPoolAccount,
        authority: params.authorityAccount,
        userTransferAuthority: params.userTransferAuthorityAccount,
        sourceToken: params.sourceTokenAccount,
        sourceVault: params.sourceVaultAccount,
        destVault: params.destVaultAccount,
        destToken: params.destTokenAccount,
        lpmint: params.lpmintAccount,
        feeReceiver: params.feeReceiverAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        hostFeeReceiver: params.hostFeeReceiverAccount,
      },
    });
    await this.connection.confirmTransaction(txid, "confirmed");
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
    source: PublicKey;
    userTransferAuthority: Signer;
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
    const txid = await this.program.rpc.withdrawAllTokenTypes(
      params.poolTokenAmount,
      params.minimumTokenAAmount,
      params.minimumTokenBAmount,
      {
        accounts: {
          swapPool: params.swapPool,
          authority: params.authority,
          source: params.source,
          userTransferAuthority: params.userTransferAuthority.publicKey,
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
        },
        signers: [params.userTransferAuthority],
      }
    );
    await this.connection.confirmTransaction(txid, "confirmed");
  }

  //
  // Withdraw one token type from the pool at the current ratio given the
  // exact amount out expected.
  //
  async withdrawSingleTokenTypeExactAmountOut(params: {
    destinationTokenAmount: BN;
    maximumPoolTokenAmount: BN;
    swapPoolAccount: PublicKey;
    authorityAccount: PublicKey;
    userTransferAuthorityAccount: PublicKey;
    lpmintAccount: PublicKey;
    lptokenAccount: PublicKey;
    vaultAAccount: PublicKey;
    vaultBAccount: PublicKey;
    tokenAAccount: PublicKey;
    tokenBAccount: PublicKey;
    feeReceiverAccount: PublicKey;
    mintAAccount: PublicKey;
    mintBAccount: PublicKey;
  }): Promise<void> {
    const txid = await this.program.rpc.withdrawSingleTokenTypeExactAmountOut(
      params.destinationTokenAmount,
      params.maximumPoolTokenAmount,
      {
        accounts: {
          swapPool: params.swapPoolAccount,
          authority: params.authorityAccount,
          userTransferAuthority: params.userTransferAuthorityAccount,
          lpmint: params.lpmintAccount,
          lptoken: params.lptokenAccount,
          vaultA: params.vaultAAccount,
          vaultB: params.vaultBAccount,
          tokenA: params.tokenAAccount,
          tokenB: params.tokenBAccount,
          feeReceiver: params.feeReceiverAccount,
          mintA: params.mintAAccount,
          mintB: params.mintBAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
    await this.connection.confirmTransaction(txid, "confirmed");
  }
}
