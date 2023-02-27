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
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionSignature,
} from "@solana/web3.js";
import CONFIG from "../config.json";
import { IDL, Pyth } from "../idl/pyth";
import { PriceStatus, CorpAction, PriceType } from "../types";

export class PythClient {
  accountDiscriminators: Record<string, string> = {};
  cluster: "devnet" | "localnet" | "mainnet";
  coder: BorshCoder;
  config: any;
  connection: Connection;
  program: Program<Pyth>;
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
    this.programId = new PublicKey(this.config.pythProgramId);
    this.url = this.config.url;

    this.connection = connection
      ? connection
      : new Connection(this.url, "confirmed");

    this.wallet = wallet ? wallet : ({} as unknown as any);

    const opts = AnchorProvider.defaultOptions();
    this.provider = new AnchorProvider(this.connection, this.wallet, opts);
    this.program = new Program<Pyth>(IDL, this.programId, this.provider);

    // @ts-ignore
    this.coder = this.program._coder;
  }

  // Instructions -------------------------------------------------------------

  decodeInstruction(str: string): Instruction {
    return this.coder.instruction.decode(str, "base58");
  }

  async initialize(params: {
    price: BN;
    expo: number;
    conf: BN;
    priceAccount: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.rpc.initialize(params.price, params.expo, params.conf, {
      accounts: {
        price: params.priceAccount,
      },
    });
  }

  async setPrice(params: {
    price: BN;
    priceAccount: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.rpc.setPrice(params.price, {
      accounts: {
        price: params.priceAccount,
      },
    });
  }

  async setPriceInfo(params: {
    price: BN;
    conf: BN;
    slot: BN;
    priceAccount: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.rpc.setPriceInfo(
      params.price,
      params.conf,
      params.slot,
      {
        accounts: {
          price: params.priceAccount,
        },
      }
    );
  }

  async setTwap(params: {
    twap: BN;
    priceAccount: PublicKey;
  }): Promise<TransactionSignature> {
    return this.program.rpc.setTwap(params.twap, {
      accounts: {
        price: params.priceAccount,
      },
    });
  }
}
