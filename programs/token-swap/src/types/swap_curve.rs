use anchor_lang::prelude::*;
use enum_dispatch::enum_dispatch;
use spl_math::precise_number::PreciseNumber;

use crate::{
    curve::{
        calculator::CurveCalculator, constant_price::ConstantPriceCurve,
        constant_product::ConstantProductCurve, offset::OffsetCurve,
    },
    types::*,
};

#[enum_dispatch]
#[repr(C)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum SwapCurve {
    /// Uniswap-style constant product curve, invariant = token_a_amount * token_b_amount
    ConstantProductCurve,
    /// Flat line, always providing 1:1 from one token to another
    ConstantPriceCurve,
    /// Offset curve, like Uniswap, but the token B side has a faked offset
    OffsetCurve,
}

impl Default for SwapCurve {
    fn default() -> Self {
        Self::ConstantProductCurve(ConstantProductCurve::default())
    }
}

impl SwapCurve {
    /// Subtract fees and calculate how much destination token will be provided
    /// given an amount of source token.
    pub fn swap(
        &self,
        source_amount: u128,
        swap_source_amount: u128,
        swap_destination_amount: u128,
        trade_direction: TradeDirection,
        fees: &Fees,
    ) -> Option<SwapResult> {
        // debit the fee to calculate the amount swapped
        let trade_fee = fees.trading_fee(source_amount)?;
        let owner_fee = fees.owner_trading_fee(source_amount)?;

        let total_fees = trade_fee.checked_add(owner_fee)?;
        let source_amount_less_fees = source_amount.checked_sub(total_fees)?;

        let SwapWithoutFeesResult {
            source_amount_swapped,
            destination_amount_swapped,
        } = self.swap_without_fees(
            source_amount_less_fees,
            swap_source_amount,
            swap_destination_amount,
            trade_direction,
        )?;

        let source_amount_swapped = source_amount_swapped.checked_add(total_fees)?;
        Some(SwapResult {
            new_swap_source_amount: swap_source_amount.checked_add(source_amount_swapped)?,
            new_swap_destination_amount: swap_destination_amount
                .checked_sub(destination_amount_swapped)?,
            source_amount_swapped,
            destination_amount_swapped,
            trade_fee,
            owner_fee,
        })
    }

    /// Get the amount of pool tokens for the deposited amount of token A or B
    pub fn deposit_single_token_type(
        &self,
        source_amount: u128,
        swap_token_a_amount: u128,
        swap_token_b_amount: u128,
        pool_supply: u128,
        trade_direction: TradeDirection,
        fees: &Fees,
    ) -> Option<u128> {
        if source_amount == 0 {
            return Some(0);
        }
        // Get the trading fee incurred if *half* the source amount is swapped
        // for the other side. Reference at:
        // https://github.com/balancer-labs/balancer-core/blob/f4ed5d65362a8d6cec21662fb6eae233b0babc1f/contracts/BMath.sol#L117
        let half_source_amount = std::cmp::max(1, source_amount.checked_div(2)?);
        let trade_fee = fees.trading_fee(half_source_amount)?;
        let owner_fee = fees.owner_trading_fee(half_source_amount)?;
        let total_fees = trade_fee.checked_add(owner_fee)?;
        let source_amount = source_amount.checked_sub(total_fees)?;
        CurveCalculator::deposit_single_token_type(
            self,
            source_amount,
            swap_token_a_amount,
            swap_token_b_amount,
            pool_supply,
            trade_direction,
        )
    }

    /// Get the amount of pool tokens for the withdrawn amount of token A or B
    pub fn withdraw_single_token_type_exact_out(
        &self,
        source_amount: u128,
        swap_token_a_amount: u128,
        swap_token_b_amount: u128,
        pool_supply: u128,
        trade_direction: TradeDirection,
        fees: &Fees,
    ) -> Option<u128> {
        if source_amount == 0 {
            return Some(0);
        }
        // Since we want to get the amount required to get the exact amount out,
        // we need the inverse trading fee incurred if *half* the source amount
        // is swapped for the other side. Reference at:
        // https://github.com/balancer-labs/balancer-core/blob/f4ed5d65362a8d6cec21662fb6eae233b0babc1f/contracts/BMath.sol#L117
        let half_source_amount = source_amount.checked_add(1)?.checked_div(2)?; // round up
        let pre_fee_source_amount = fees.pre_trading_fee_amount(half_source_amount)?;
        let source_amount = source_amount
            .checked_sub(half_source_amount)?
            .checked_add(pre_fee_source_amount)?;
        CurveCalculator::withdraw_single_token_type_exact_out(
            self,
            source_amount,
            swap_token_a_amount,
            swap_token_b_amount,
            pool_supply,
            trade_direction,
            RoundDirection::Ceiling,
        )
    }
}
