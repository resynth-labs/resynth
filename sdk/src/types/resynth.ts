import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Constants ----------------------------------------------------------------

export const ASSET: string = "asset";
export const AUTHORITY: string = "authority";
export const VAULT: string = "vault";
export const MINT: string = "mint";
export const MARGIN_ACCOUNT: string = "margin_account";

// Accounts -----------------------------------------------------------------

export type MarginAccount = {
  owner: PublicKey;
  syntheticAsset: PublicKey;
  collateralDeposited: BN;
  syntheticAssetBorrowed: BN;
};

export type SyntheticAsset = {
  syntheticAsset: PublicKey;
  collateralMint: PublicKey;
  collateralVault: PublicKey;
  syntheticMint: PublicKey;
  syntheticOracle: PublicKey;
  assetAuthority: PublicKey;
  assetAuthorityBump: number[];
};

// Errors -------------------------------------------------------------------

export class ResynthError {
  static readonly InvalidOracle = { name: "InvalidOracle", code: 6000, message: "The oracle account provided is invalid" };
  static readonly StaleOracle = { name: "StaleOracle", code: 6001, message: "The oracle is stale" };
  static readonly Undercollateralized = { name: "Undercollateralized", code: 6002, message: "The margin account is undercollateralized" };
  static readonly InvalidCollateralMintDecimals = { name: "InvalidCollateralMintDecimals", code: 6003, message: "Collateral decimals is rqeuired to be 6 because it's value is hardcoded to $1" };

  static fromErrorCode(errorCode: number): any {
    switch (errorCode) {
      case 6000: return ResynthError.InvalidOracle;
      case 6001: return ResynthError.StaleOracle;
      case 6002: return ResynthError.Undercollateralized;
      case 6003: return ResynthError.InvalidCollateralMintDecimals;
      default: return { name: "Unknown", code: errorCode };
    }
  }
}
