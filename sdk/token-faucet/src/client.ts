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
  createInitializeMintInstruction,
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
import TOKEN_FAUCET_CONFIG from "./config.json";
import { IDL, TokenFaucet } from "./idl";
import { Faucet } from "./types";

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

  constructor(
    cluster: "devnet" | "localnet" | "mainnet",
    connection?: Connection,
    wallet?: Wallet
  ) {
    this.cluster = cluster;
    this.config = TOKEN_FAUCET_CONFIG[this.cluster];
    this.programId = new PublicKey(this.config.programId);
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

  decodeInstruction(str: string): Instruction {
    return this.coder.instruction.decode(str, "base58");
  }

  async airdrop(params: {
    amount: BN;
    faucetAccount: PublicKey;
    mintAccount: PublicKey;
    tokenAccountAccount: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.rpc.airdrop(params.amount, {
      accounts: {
        faucet: params.faucetAccount,
        mint: params.mintAccount,
        tokenAccount: params.tokenAccountAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  async initializeFaucet(params: {
    faucetAccount: PublicKey;
    payerAccount: PublicKey;
    mintAccount: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.rpc.initializeFaucet({
      accounts: {
        faucet: params.faucetAccount,
        payer: params.payerAccount,
        mint: params.mintAccount,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }
}
