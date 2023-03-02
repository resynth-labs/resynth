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
  TransactionSignature,
} from "@solana/web3.js";
import CONFIG from "../config.json";
import { IDL, TokenFaucet } from "../idl/token_faucet";
import { Faucet } from "../types";

export class TokenFaucetClient {
  accountDiscriminators: Record<string, string> = {};
  cluster: "devnet" | "localnet" | "mainnet";
  coder: BorshCoder;
  config: any;
  connection: Connection;
  program: Program<TokenFaucet>;
  programId: PublicKey;
  provider: AnchorProvider;
  url: string;
  wallet: Wallet;

  private existing_accounts = new Set<PublicKey>();

  constructor(
    cluster: "devnet" | "localnet" | "mainnet",
    connection?: Connection,
    wallet?: Wallet
  ) {
    this.cluster = cluster;
    this.config = CONFIG[this.cluster];
    this.programId = new PublicKey(this.config.tokenFaucetProgramId);
    this.url = this.config.url;

    this.connection = connection
      ? connection
      : new Connection(this.url, "confirmed");

    this.wallet = wallet ? wallet : ({} as unknown as any);

    const opts = AnchorProvider.defaultOptions();
    this.provider = new AnchorProvider(this.connection, this.wallet, opts);
    this.program = new Program<TokenFaucet>(IDL, this.programId, this.provider);

    // @ts-ignore
    this.coder = this.program._coder;

    this.accountDiscriminators[
      BorshAccountsCoder.accountDiscriminator("Faucet").toString("base64")
    ] = "Faucet";
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
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports: await this.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        this.wallet.publicKey,
        null
      ),
      await this.program.methods
        .initializeFaucet()
        .accounts({
          faucet,
          payer: this.wallet.publicKey,
          mint: mint.publicKey,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    );
    await this.provider.sendAndConfirm(transaction, [mint], {
      commitment: "confirmed",
    });

    return [mint.publicKey, faucet];
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
    const exists = this.existing_accounts.has(tokenAccount) ? true : (await this.connection.getAccountInfo(tokenAccount)) !== null;
    const transaction = new Transaction();
    if (!exists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.wallet.publicKey,
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
      const txid = await this.provider.sendAndConfirm(transaction, [], { commitment: "confirmed", skipPreflight: true });
      this.existing_accounts.add(tokenAccount);
    }
    return tokenAccount;
  }

  async initializeFaucet(params: {
    faucetAccount: PublicKey;
    payerAccount: PublicKey;
    mintAccount: PublicKey;
  }): Promise<void> {
    const txid = await this.program.methods
      .initializeFaucet()
      .accounts({
        faucet: params.faucetAccount,
        payer: params.payerAccount,
        mint: params.mintAccount,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    await this.connection.confirmTransaction(txid, "confirmed");
  }
}
