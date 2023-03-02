import { Address } from "@coral-xyz/anchor";

export interface Config {
  url: string;
  resynthProgramId: Address;
  pythProgramId: Address;
  tokenSwapProgramId: Address;
  collateralMint: Address;
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
