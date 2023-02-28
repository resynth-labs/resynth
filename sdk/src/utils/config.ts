import { PublicKey } from "@solana/web3.js";
import config from "../config.json";
import assert from "assert";
import { syntheticAssetPDA } from "./pda";

type AssetClass = "Crypto" | "Equity" | "FX" | "Metal";

type Region = "US" | "GB";

export const SYNTH_DECIMALS = 9;

interface Token {
  assetClass: AssetClass;
  region?: Region;
  mint: PublicKey;
  symbol: string;
  oracle: PublicKey;
  oraclePair: string;
  oracleBase: string;
  oracleQuote: string;
  decimals: number;
}

export function getToken(
  programId: PublicKey,
  cluster: "devnet" | "localnet" | "mainnet",
  oracleLabel: string
): Token {
  const oracleAddress: string | undefined = (config as any)[cluster].synths[
    oracleLabel
  ];

  if (!oracleAddress) {
    throw new Error(`oracle not found, ${oracleLabel}`);
  }

  const split = oracleLabel.split(".");

  assert(split.length === 2 || split.length === 3);

  // asset class is the first item
  const assetClass = split[0] as AssetClass;
  const oraclePair = split[split.length - 1];
  const [oracleQuote, oracleBase] = oraclePair.split("/");
  const symbol = "n" + oracleQuote;
  const region = (split.length === 3 ? split[1] : undefined) as
    | Region
    | undefined;

  const oracle = new PublicKey(oracleAddress);
  const decimals = SYNTH_DECIMALS;

  const { syntheticMint: mint } = syntheticAssetPDA(programId, oracle);

  const token: Token = {
    assetClass,
    region,
    mint,
    symbol,

    oracle,
    oraclePair,
    oracleBase,
    oracleQuote,
    decimals,
  };

  return token;
}
