//! All fee information, to be used for validation currently

use anchor_lang::prelude::*;
use crate::errors::TokenSwapError;

/// Helper function for calculating swap fee
pub fn calculate_fee(
  token_amount: u128,
  fee_numerator: u128,
  fee_denominator: u128,
) -> Option<u128> {
  if fee_numerator == 0 || token_amount == 0 {
    Some(0)
  } else {
    let fee = token_amount
      .checked_mul(fee_numerator)?
      .checked_div(fee_denominator)?;
    if fee == 0 {
      Some(1) // minimum fee of one token
    } else {
      Some(fee)
    }
  }
}

pub fn ceil_div(dividend: u128, divisor: u128) -> Option<u128> {
  dividend
    .checked_add(divisor)?
    .checked_sub(1)?
    .checked_div(divisor)
}

pub fn pre_fee_amount(
  post_fee_amount: u128,
  fee_numerator: u128,
  fee_denominator: u128,
) -> Option<u128> {
  if fee_numerator == 0 || fee_denominator == 0 {
    Some(post_fee_amount)
  } else if fee_numerator == fee_denominator || post_fee_amount == 0 {
    Some(0)
  } else {
    let numerator = post_fee_amount.checked_mul(fee_denominator)?;
    let denominator = fee_denominator.checked_sub(fee_numerator)?;
    ceil_div(numerator, denominator)
  }
}

pub fn validate_fraction(numerator: u64, denominator: u64) -> Result<()> {
  if denominator == 0 && numerator == 0 {
    Ok(())
  } else if numerator >= denominator {
    Err(error!(TokenSwapError::InvalidFee))
  } else {
    Ok(())
  }
}
