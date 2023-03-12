import { AnchorProvider, setProvider, Wallet } from "@coral-xyz/anchor";
import { Commitment, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { AccountLayout, getAssociatedTokenAddressSync, MintLayout } from "@solana/spl-token";
import { ResynthConfig } from "../utils";

import CONFIG from "../config.json";

export class Context {
  cluster: "devnet" | "localnet" | "mainnet";
  config: ResynthConfig;
  connection: Connection;
  readCommitment: Commitment = 'processed';
  writeCommitment: Commitment | undefined = 'confirmed';
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

  async getBalance(): Promise<number> {
    return await this.connection.getBalance(this.wallet.publicKey) / LAMPORTS_PER_SOL;
  }

  async getTokenBalance(mint: PublicKey, tokenAddress?: PublicKey): Promise<number> {
    if (tokenAddress === undefined) {
      tokenAddress = getAssociatedTokenAddressSync(mint, this.wallet.publicKey);
    }
    const accountInfos = await this.connection.getMultipleAccountsInfo([mint, tokenAddress], 'confirmed');
    if (!accountInfos[1]) {
      return 0;
    }
    return Number(AccountLayout.decode(accountInfos[1].data).amount) / 10 ** MintLayout.decode(accountInfos[0]!.data).decimals;
  }

}
