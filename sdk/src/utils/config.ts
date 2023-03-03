import { Address } from "@coral-xyz/anchor";

export interface ResynthConfig {
  url: string;
  resynthProgramId: Address;
  pythProgramId: Address;
  tokenFaucetProgramId?: Address;
  tokenSwapProgramId: Address;
  collateralMint: Address;
  collateralDecimals: number;
  oracles?: Record<string, Oracle>;
}

export interface Oracle {
  class: "Crypto" | "Equity" | "FX" | "Metal";
  region?: "US" | "GB";
  oracle: Address;
  pair: string;
  base: "USD";
  quote: string;
}
