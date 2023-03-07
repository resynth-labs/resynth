import { AnchorProvider, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Commitment, Connection } from "@solana/web3.js";
import { ResynthConfig } from "../utils";

import CONFIG from "../config.json";

export class Context {
  cluster: "devnet" | "localnet" | "mainnet";
  config: ResynthConfig;
  readCommitment: Commitment = 'processed';
  writeCommitment: Commitment | undefined = 'confirmed';
  //writeCommitment: Commitment | undefined = 'undefined';
  provider: AnchorProvider;

  constructor(cluster: "devnet" | "localnet" | "mainnet" = "localnet", provider?: AnchorProvider) {
    this.cluster = cluster;
    this.config = CONFIG[this.cluster] as ResynthConfig;
    if (provider) {
      this.provider = provider;
    } else {
      const process = require("process");
      const url = process.env.ANCHOR_PROVIDER_URL;
      if (url === undefined) {
        throw new Error("ANCHOR_PROVIDER_URL is not defined");
      }
      const connection = new Connection(url, this.readCommitment);
      const wallet = NodeWallet.local();

      this.provider = new AnchorProvider(connection, wallet, { commitment: this.writeCommitment, skipPreflight: true });
    }
    setProvider(this.provider);


  }

}
