import { PublicKey } from "@solana/web3.js";
import { parsePythPriceData, ResynthClient } from "../client";
import assert from "assert";
import { marginAccountPDA, syntheticAssetPDA } from "./pda";
import { translateAddress } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";

export interface ResynthToken {
  balance: number;
  configuration: {
    mint: PublicKey;
    symbol: string;
    logoUrl: string;
    decimals: 6;
  };
}

export interface OracleQuery {
  price: number;
  status: number;
}

export type SyntheticAssetQuery = OracleQuery & {
  marginAccount: any;
  walletBalance: number;
  syntheticBalance: number;
  collateralBalance: number;
};

export async function fetchOracle(
  client: ResynthClient,
  syntheticAssetLabel: string
): Promise<OracleQuery> {
  const {
    config: { oracles },
    connection,
  } = client;
  assert(oracles);
  const { oracle } = oracles[syntheticAssetLabel];

  const oracleInfo = await connection.getAccountInfo(translateAddress(oracle));

  assert(oracleInfo);

  const { price, status } = parsePythPriceData(oracleInfo.data);

  return {
    price,
    status,
  };
}

export async function fetchSyntheticAsset(
  client: ResynthClient,
  syntheticAssetLabel: string
): Promise<SyntheticAssetQuery> {
  const {
    config: { oracles, tokens },
    connection,
    programId,
    wallet: { publicKey },
  } = client;
  assert(oracles);

  if (!publicKey) {
    const { price, status } = await fetchOracle(client, syntheticAssetLabel);
    return {
      price,
      status,
      marginAccount: null,
      walletBalance: 0,
      syntheticBalance: 0,
      collateralBalance: 0,
    };
  }

  const collateralMintAddress = translateAddress(tokens.USDC.mint);
  const { oracle } = oracles[syntheticAssetLabel];
  const { syntheticAsset, collateralVault, syntheticMint } = syntheticAssetPDA(
    client.programId,
    translateAddress(oracle)
  );

  // wallet accounts
  const marginAccountKey = marginAccountPDA(
    programId,
    publicKey,
    syntheticAsset
  );
  const syntheticTokenAccountKey = getAssociatedTokenAddressSync(
    syntheticMint,
    publicKey
  );
  const collateralTokenAccountKey = getAssociatedTokenAddressSync(
    collateralMintAddress,
    publicKey
  );

  const [
    oracleInfo,
    walletInfo,
    marginAccountInfo,
    syntheticAccountInfo,
    collateralAccountInfo,
  ] = await connection.getMultipleAccountsInfo([
    // global accounts
    translateAddress(oracle),
    // wallet accounts
    publicKey,
    marginAccountKey,
    syntheticTokenAccountKey,
    collateralTokenAccountKey,
  ]);

  assert(oracleInfo);

  const { price, status } = parsePythPriceData(oracleInfo.data);
  const walletBalance = walletInfo?.lamports ?? 0;
  const marginAccount = marginAccountInfo
    ? client.program.coder.accounts.decode(
      "marginAccount",
      marginAccountInfo.data
    )
    : undefined;
  const syntheticBalance = syntheticAccountInfo
    ? Number(
      unpackAccount(syntheticTokenAccountKey, syntheticAccountInfo).amount
    )
    : 0;
  const collateralBalance = collateralAccountInfo
    ? Number(
      unpackAccount(
        collateralMintAddress,
        collateralAccountInfo,
        TOKEN_PROGRAM_ID
      ).amount
    )
    : 0;

  return {
    price,
    status,
    marginAccount,
    walletBalance,
    syntheticBalance,
    collateralBalance,
  };

  // Two ways of doing this:

  // Calculating token acct from every oracle,
  // and getMultipleAccountInfos

  // Or calculating token mint from every oracle
  // and getTokenAccountsByOwner + zip

  // We also need for selected:
  // - USDC balance
  // - margin account debt / borrowed
  // - oracle price

  // - burn amount
}
