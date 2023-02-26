import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Accounts -----------------------------------------------------------------

export type Faucet = {
  mint: PublicKey;
  bump: number;
};
