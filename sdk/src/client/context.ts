import { AnchorProvider, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Commitment, Connection } from "@solana/web3.js";
import { ResynthConfig } from "../utils";

import CONFIG from "../config.json";

export class Context {
  cluster: "devnet" | "localnet" | "mainnet";
  config: ResynthConfig;
  connection: Connection;
  readCommitment: Commitment = 'processed';
  writeCommitment: Commitment | undefined = 'confirmed';
  //writeCommitment: Commitment | undefined = 'undefined';
  provider: AnchorProvider;
  wallet: Wallet;

  constructor(cluster: "devnet" | "localnet" | "mainnet" = "localnet", connection?: Connection, wallet?: Wallet) {
    this.cluster = cluster;
    this.config = CONFIG[this.cluster] as ResynthConfig;
    this.connection = connection ? connection : new Connection(this.config.url, this.readCommitment);
    this.wallet = wallet ? wallet : ({} as unknown as any);
    this.provider = new AnchorProvider(this.connection, this.wallet, { commitment: this.writeCommitment, skipPreflight: true });
    setProvider(this.provider);


  }

}
