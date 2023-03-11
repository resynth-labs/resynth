import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Constants ----------------------------------------------------------------

export const SWAP_POOL_ACCOUNT_SEED: Buffer = Buffer.from("swap_pool");

// Accounts -----------------------------------------------------------------

//
// A token swap pool.
//
export type SwapPool = {
  version: number;
  bump: number;
  // Bump seed used in program address.
  // The program address is created deterministically with the bump seed,
  // swap program id, and swap account pubkey.  This program address has
  // authority over the swap's token A account, token B account, and pool
  // token mint.
  authorityBump: number[];
  vaultABump: number;
  vaultBBump: number;
  lpmintBump: number;
  swapPool: PublicKey;
  authority: PublicKey;
  // Mint information for token A
  mintA: PublicKey;
  // Mint information for token B
  mintB: PublicKey;
  // Pool tokens are issued when A or B tokens are deposited.
  // Pool tokens can be withdrawn back to the original A or B token.
  lpmint: PublicKey;
  // Token A
  vaultA: PublicKey;
  // Token B
  vaultB: PublicKey;
  // Pool token account to receive trading and / or withdrawal fees
  feeReceiver: PublicKey;
  // Program ID of the tokens being exchanged.
  tokenProgram: PublicKey;
  // All fee information
  fees: Fees;
  // Swap curve parameters, to be unpacked and used by the SwapCurve, which
  // calculates swaps, deposits, and withdrawals
  swapCurveType: SwapCurveType;
  lpmintDecimals: number;
  tokenBPriceOrOffset: BN;
  vaultABalance: BN;
  vaultBBalance: BN;
  lpmintSupply: BN;
  mintADecimals: number;
  mintBDecimals: number;
};

// Types --------------------------------------------------------------------

//
// ConstantPriceCurve struct implementing CurveCalculator
//
export type ConstantPriceCurve = {
  // Amount of token A required to get 1 token B
  tokenBPrice: BN;
};

//
// ConstantProductCurve struct implementing CurveCalculator
//
export type ConstantProductCurve = {
  unused: number;
};

//
// Offset curve, uses ConstantProduct under the hood, but adds an offset to
// one side on swap calculations
//
export type OffsetCurve = {
  // Amount to offset the token B liquidity account
  tokenBOffset: BN;
};

//
// Encapsulates all fee information and calculations for swap operations
//
export type Fees = {
  // Trade fees are extra token amounts that are held inside the token
  // accounts during a trade, making the value of liquidity tokens rise.
  // Trade fee numerator
  tradeFeeNumerator: BN;
  // Trade fee denominator
  tradeFeeDenominator: BN;
  // Owner trading fees are extra token amounts that are held inside the token
  // accounts during a trade, with the equivalent in pool tokens minted to
  // the owner of the program.
  // Owner trade fee numerator
  ownerTradeFeeNumerator: BN;
  // Owner trade fee denominator
  ownerTradeFeeDenominator: BN;
  // Owner withdraw fees are extra liquidity pool token amounts that are
  // sent to the owner on every withdrawal.
  // Owner withdraw fee numerator
  ownerWithdrawFeeNumerator: BN;
  // Owner withdraw fee denominator
  ownerWithdrawFeeDenominator: BN;
  // Host fees are a proportion of the owner trading fees, sent to an
  // extra account provided during the trade.
  // Host trading fee numerator
  hostFeeNumerator: BN;
  // Host trading fee denominator
  hostFeeDenominator: BN;
};

//
// The direction to round.  Used for pool token to trading token conversions to
// avoid losing value on any deposit or withdrawal.
//
export class RoundDirection {
  static readonly Floor = { floor: {} };
  static readonly Ceiling = { ceiling: {} };

  static toString(roundDirection: any): string {
    if (roundDirection["floor"]) return "Floor";
    if (roundDirection["ceiling"]) return "Ceiling";
    return "unknown";
  }
}

export class SwapCurveType {
  static readonly ConstantProductCurve = { constantProductCurve: {} };
  static readonly ConstantPriceCurve = { constantPriceCurve: {} };
  static readonly OffsetCurve = { offsetCurve: {} };

  static toString(swapCurveType: any): string {
    if (swapCurveType["constantProductCurve"]) return "ConstantProductCurve";
    if (swapCurveType["constantPriceCurve"]) return "ConstantPriceCurve";
    if (swapCurveType["offsetCurve"]) return "OffsetCurve";
    return "unknown";
  }
}

export class SwapCurve {
  static readonly ConstantProductCurve = { constantProductCurve: {} };
  static readonly ConstantPriceCurve = { constantPriceCurve: {} };
  static readonly OffsetCurve = { offsetCurve: {} };

  static toString(swapCurve: any): string {
    if (swapCurve["constantProductCurve"]) return "ConstantProductCurve";
    if (swapCurve["constantPriceCurve"]) return "ConstantPriceCurve";
    if (swapCurve["offsetCurve"]) return "OffsetCurve";
    return "unknown";
  }
}

//
// The direction of a trade, since curves can be specialized to treat each
// token differently (by adding offsets or weights)
//
export class TradeDirection {
  static readonly AtoB = { atoB: {} };
  static readonly BtoA = { btoA: {} };

  static toString(tradeDirection: any): string {
    if (tradeDirection["atoB"]) return "AtoB";
    if (tradeDirection["btoA"]) return "BtoA";
    return "unknown";
  }
}

// Errors -------------------------------------------------------------------

export class TokenSwapError {
  static readonly AlreadyInitialized = {
    name: "AlreadyInitialized",
    code: 6000,
    message: "Swap pool is already initialized",
  };
  static readonly CalculationFailure = {
    name: "CalculationFailure",
    code: 6001,
    message: "General calculation failure due to overflow or underflow",
  };
  static readonly EmptySupply = {
    name: "EmptySupply",
    code: 6002,
    message: "Input token account empty",
  };
  static readonly ExceededSlippage = {
    name: "ExceededSlippage",
    code: 6003,
    message: "Swap instruction exceeds desired slippage limit",
  };
  static readonly FeeCalculationFailure = {
    name: "FeeCalculationFailure",
    code: 6004,
    message:
      "Fee calculation failed due to overflow, underflow, or unexpected 0",
  };
  static readonly IncorrectPoolMint = {
    name: "IncorrectPoolMint",
    code: 6005,
    message: "Address of the provided pool token mint is incorrect",
  };
  static readonly IncorrectSwapAccount = {
    name: "IncorrectSwapAccount",
    code: 6006,
    message: "Address of the provided swap token account is incorrect",
  };
  static readonly InvalidAuthority = {
    name: "InvalidAuthority",
    code: 6007,
    message: "Invalid authority provided",
  };
  static readonly InvalidCloseAuthority = {
    name: "InvalidCloseAuthority",
    code: 6008,
    message: "Token account has a close authority",
  };
  static readonly InvalidCurve = {
    name: "InvalidCurve",
    code: 6009,
    message: "The provided curve parameters are invalid",
  };
  static readonly InvalidDelegate = {
    name: "InvalidDelegate",
    code: 6010,
    message: "Token account has a delegate",
  };
  static readonly InvalidFee = {
    name: "InvalidFee",
    code: 6011,
    message: "The provided fee does not match the program owner's constraints",
  };
  static readonly InvalidFeeReceiver = {
    name: "InvalidFeeReceiver",
    code: 6012,
    message: "The pool fee receiver is invalid",
  };
  static readonly InvalidFreezeAuthority = {
    name: "InvalidFreezeAuthority",
    code: 6013,
    message: "Pool token mint has a freeze authority",
  };
  static readonly InvalidInput = {
    name: "InvalidInput",
    code: 6014,
    message: "InvalidInput",
  };
  static readonly InvalidOwner = {
    name: "InvalidOwner",
    code: 6015,
    message: "Input account owner is not the program address",
  };
  static readonly InvalidSupply = {
    name: "InvalidSupply",
    code: 6016,
    message: "Pool token mint has a non-zero supply",
  };
  static readonly InvalidTokenProgram = {
    name: "InvalidTokenProgram",
    code: 6017,
    message: "Invalid token program",
  };
  static readonly InvalidTradeDirection = {
    name: "InvalidTradeDirection",
    code: 6018,
    message: "Invalid trade direction",
  };
  static readonly NotInitialized = {
    name: "NotInitialized",
    code: 6019,
    message: "Swap account in not initialized",
  };
  static readonly RepeatedMint = {
    name: "RepeatedMint",
    code: 6020,
    message: "Swap input token accounts have the same mint",
  };
  static readonly UnsupportedCurveOperation = {
    name: "UnsupportedCurveOperation",
    code: 6021,
    message: "The operation cannot be performed on the given curve",
  };
  static readonly ZeroTradingTokens = {
    name: "ZeroTradingTokens",
    code: 6022,
    message: "Given pool token amount results in zero trading tokens",
  };

  static fromErrorCode(errorCode: number): any {
    switch (errorCode) {
      case 6000:
        return TokenSwapError.AlreadyInitialized;
      case 6001:
        return TokenSwapError.CalculationFailure;
      case 6002:
        return TokenSwapError.EmptySupply;
      case 6003:
        return TokenSwapError.ExceededSlippage;
      case 6004:
        return TokenSwapError.FeeCalculationFailure;
      case 6005:
        return TokenSwapError.IncorrectPoolMint;
      case 6006:
        return TokenSwapError.IncorrectSwapAccount;
      case 6007:
        return TokenSwapError.InvalidAuthority;
      case 6008:
        return TokenSwapError.InvalidCloseAuthority;
      case 6009:
        return TokenSwapError.InvalidCurve;
      case 6010:
        return TokenSwapError.InvalidDelegate;
      case 6011:
        return TokenSwapError.InvalidFee;
      case 6012:
        return TokenSwapError.InvalidFeeReceiver;
      case 6013:
        return TokenSwapError.InvalidFreezeAuthority;
      case 6014:
        return TokenSwapError.InvalidInput;
      case 6015:
        return TokenSwapError.InvalidOwner;
      case 6016:
        return TokenSwapError.InvalidSupply;
      case 6017:
        return TokenSwapError.InvalidTokenProgram;
      case 6018:
        return TokenSwapError.InvalidTradeDirection;
      case 6019:
        return TokenSwapError.NotInitialized;
      case 6020:
        return TokenSwapError.RepeatedMint;
      case 6021:
        return TokenSwapError.UnsupportedCurveOperation;
      case 6022:
        return TokenSwapError.ZeroTradingTokens;
      default:
        return { name: "Unknown", code: errorCode };
    }
  }
}
