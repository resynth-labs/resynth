import { Address } from "@coral-xyz/anchor";

export interface ResynthConfig {
  url: string;
  resynthProgramId: Address;
  pythProgramId: Address;
  tokenFaucetProgramId?: Address;
  tokenSwapProgramId: Address;
  tokens: Record<string, TokenConfig>;
  oracles: Record<string, OracleConfig>;
}

export interface TokenConfig {
  mint: Address;
  faucet?: Address;
  decimals: number;
}

export interface OracleConfig {
  class: "Crypto" | "Equity" | "FX" | "Metal";
  region?: "US" | "GB";
  oracle: Address;
  pair: string;
  base: "USD";
  quote: string;
}
