import {
  BN,
  Program,
  ProgramAccount,
  Wallet,
} from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import { IDL, TokenFaucet } from "../idl/token_faucet";
import { Faucet } from "../types";
import { ResynthConfig } from "../utils";
import { Context } from "./context";

export class TokenFaucetClient {
  context: Context;
  program: Program<TokenFaucet>;
  programId: PublicKey;

  private existing_accounts = new Set<PublicKey>();

  constructor(context: Context) {
    this.context = context;
    this.programId = this.context.config.tokenFaucetProgramId ? new PublicKey(this.context.config.tokenFaucetProgramId) : PublicKey.default;
    this.program = new Program<TokenFaucet>(IDL, this.programId, this.context.provider);
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

  async fetchAllFaucets(): Promise<ProgramAccount<Faucet>[]> {
    return (await this.program.account.faucet.all()) as ProgramAccount<Faucet>[];
  }

  async fetchFaucet(address: PublicKey): Promise<ProgramAccount<Faucet>> {
    return {
      publicKey: address,
      account: await this.program.account.faucet.fetch(address),
    } as ProgramAccount<Faucet>;
  }

  // Instructions -------------------------------------------------------------

  async airdrop(params: {
    amount: BN;
    faucet: PublicKey;
    mint: PublicKey;
    owner: PublicKey;
  }): Promise<PublicKey> {
    const tokenAccount = getAssociatedTokenAddressSync(params.mint, params.owner);
    const exists = this.existing_accounts.has(tokenAccount) ? true : (await this.context.provider.connection.getAccountInfo(tokenAccount)) !== null;
    const transaction = new Transaction();
    if (!exists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.context.provider.wallet.publicKey,
          tokenAccount,
          params.owner,
          params.mint
        )
      );
    }
    if (params.amount.gt(new BN(0))) {
      transaction.add(
        await this.program.methods
          .airdrop(params.amount)
          .accounts({
            faucet: params.faucet,
            mint: params.mint,
            tokenAccount: tokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction(),
      );
    }
    if (transaction.instructions.length > 0) {
      const txid = await this.context.provider.sendAndConfirm(transaction, [], { commitment: "confirmed", skipPreflight: true });
      this.existing_accounts.add(tokenAccount);
    }
    return tokenAccount;
  }

  async airdropInstruction(params: {
    amount: BN;
    faucet: PublicKey;
    mint: PublicKey;
    tokenAccount: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .airdrop(params.amount)
      .accountsStrict({
        faucet: params.faucet,
        mint: params.mint,
        tokenAccount: params.tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async createMintAndFaucet(decimals: number): Promise<[PublicKey, PublicKey]> {
    const mint = Keypair.generate();
    const faucet = PublicKey.findProgramAddressSync(
      [Buffer.from("faucet"), mint.publicKey.toBuffer()],
      this.program.programId
    )[0];

    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: this.context.provider.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports: await this.context.provider.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        this.context.provider.wallet.publicKey,
        null
      ),
      await this.program.methods
        .initializeFaucet()
        .accounts({
          faucet,
          payer: this.context.provider.wallet.publicKey,
          mint: mint.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    );
    await this.context.provider.sendAndConfirm(transaction, [mint], {
      commitment: "confirmed",
    });

    return [mint.publicKey, faucet];
  }

  async initializeFaucet(params: {
    faucet: PublicKey;
    mint: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.methods
      .initializeFaucet()
      .accountsStrict({
        faucet: params.faucet,
        payer: this.context.provider.wallet.publicKey,
        mint: params.mint,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed", skipPreflight: true });
  }

  async initializeFaucetInstruction(params: {
    faucet: PublicKey;
    mint: PublicKey;
  }): Promise<TransactionInstruction> {
    return this.program.methods
      .initializeFaucet()
      .accountsStrict({
        faucet: params.faucet,
        payer: this.context.provider.wallet.publicKey,
        mint: params.mint,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }
}
