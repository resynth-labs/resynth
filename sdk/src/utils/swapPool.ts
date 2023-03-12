import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TokenSwapClient } from "../client";
import { Fees, SwapPool } from "../types";
import { swapPoolPDA } from "./pda";

export interface SwapPoolQuery {
  swapPool: SwapPool | undefined;
  swapWithoutFees: (
    amount: BN,
    mint: PublicKey
  ) =>
    | {
        /** Amount of source token swapped */
        sourceAmountSwapped: BN;
        /** Amount of destination token swapped */
        destinationAmountSwapped: BN;
      }
    | undefined;
}

export async function fetchSwapPool(
  tokenSwap: TokenSwapClient,
  mint1: PublicKey,
  mint2: PublicKey
): Promise<SwapPoolQuery> {
  const { connection, programId } = tokenSwap;

  const { swapPool } = swapPoolPDA(programId, mint1, mint2);

  const swapPoolInfo = await connection.getAccountInfo(swapPool);

  const swapPoolData = swapPoolInfo
    ? (tokenSwap.program.coder.accounts.decode(
        "swapPool",
        swapPoolInfo.data
      ) as SwapPool)
    : undefined;

  function calculateSwapWithoutFees(amount: BN, mint: PublicKey) {
    if (!swapPoolData) {
      return undefined;
    }
    const sourceVaultAmount = mint.equals(swapPoolData.mintA)
      ? swapPoolData.vaultABalance
      : swapPoolData.vaultBBalance;
    const destVaultAmount = mint.equals(swapPoolData.mintA)
      ? swapPoolData.vaultBBalance
      : swapPoolData.vaultABalance;
    return swapWithoutFees(amount, sourceVaultAmount, destVaultAmount);
  }

  return {
    swapPool: swapPoolData,
    swapWithoutFees: calculateSwapWithoutFees,
  };
}

export function tradingTokensToPoolTokens(
  fees: SwapPool | Fees,
  sourceAmount: number,
  swapSourceAmount: number,
  poolAmount: number
): number {
  if ("fees" in fees) {
    // Unwrap fees inside swap pool
    fees = fees.fees;
  }

  const tradingFee =
    (sourceAmount / 2) *
    (fees.tradeFeeNumerator.toNumber() / fees.tradeFeeDenominator.toNumber());
  const ownerTradingFee =
    (sourceAmount / 2) *
    (fees.ownerTradeFeeNumerator.toNumber() /
      fees.ownerTradeFeeDenominator.toNumber());
  const sourceAmountPostFee = sourceAmount - tradingFee - ownerTradingFee;
  const root = Math.sqrt(sourceAmountPostFee / swapSourceAmount + 1);
  return Math.floor(poolAmount * (root - 1));
}

/**
 * This sorry function is all the math needed for the Resynth UI.
 * it would be very happy a dev added all the function
 * implementations of CurveCalculator in token_swap program.
 *
 * Calculate how much destination token will be provided given an amount
 * of source token. x * y = k
 */
export function swapWithoutFees(
  sourceAmount: BN,
  sourceVaultAmount: BN,
  destVaultAmount: BN
):
  | {
      /** Amount of source token swapped */
      sourceAmountSwapped: BN;
      /** Amount of destination token swapped */
      destinationAmountSwapped: BN;
    }
  | undefined {
  const invariant = sourceVaultAmount.mul(destVaultAmount);

  let newSwapSourceAmount = sourceVaultAmount.add(sourceAmount);
  let {
    ok,
    quotient: newSwapDestinationAmount,
    b,
  } = checkedCeilDiv(invariant, newSwapSourceAmount);
  newSwapSourceAmount = b;

  const sourceAmountSwapped = newSwapSourceAmount.sub(sourceVaultAmount);
  const destinationAmountSwapped = destVaultAmount.sub(
    newSwapDestinationAmount
  );

  if (
    !ok ||
    sourceAmountSwapped.lt(new BN(0)) ||
    destinationAmountSwapped.lt(new BN(1))
  ) {
    return undefined;
  }

  return {
    sourceAmountSwapped,
    destinationAmountSwapped,
  };
}

function checkedCeilDiv(
  a: BN,
  b: BN
): {
  ok: boolean;
  quotient: BN;
  b: BN;
} {
  let quotient = a.div(b);
  // Avoid dividing a small number by a big one and returning 1, and instead
  // fail.
  // Also return none if b is also zero, emulates checked_rem
  if (quotient.isZero() || b.isZero()) {
    return {
      ok: false,
      quotient: new BN(0),
      b: new BN(0),
    };
  }

  // Ceiling the destination amount if there's any remainder, which will
  // almost always be the case.
  const remainder = a.mod(b);
  if (!remainder.isZero()) {
    quotient = quotient.add(new BN(1));
    // calculate the minimum amount needed to get the dividend amount to
    // avoid truncating too much
    b = a.div(quotient);
    const remainder = a.mod(quotient);
    if (!remainder.isZero()) {
      b = b.add(new BN(1));
    }
  }

  return {
    ok: true,
    quotient,
    b,
  };
}
