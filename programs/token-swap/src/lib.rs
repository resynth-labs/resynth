use anchor_lang::prelude::*;

pub mod constants;
pub mod curve;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod types;

#[cfg(test)]
pub mod tests;

use instructions::*;
use types::*;

declare_id!("85aooyAumUJKEfcw84mnacWKGN5dTqb4EX5YQRp5SuLX");

#[program]
pub mod token_swap {
  use super::*;

  /// Deposit both types of tokens into the pool.  The output is a "pool"
  /// token representing ownership in the pool. Inputs are converted to
  /// the current ratio.
  pub fn deposit_all_token_types(ctx: Context<DepositAllTokenTypes>, pool_token_amount: u64, maximum_token_a_amount: u64, maximum_token_b_amount: u64) -> Result<()> {
    instructions::deposit_all_token_types::execute(ctx, pool_token_amount, maximum_token_a_amount, maximum_token_b_amount)
  }

  /// Deposit one type of tokens into the pool.  The output is a "pool" token
  /// representing ownership into the pool. Input token is converted as if
  /// a swap and deposit all token types were performed.
  pub fn deposit_single_token_type_exact_amount_in(ctx: Context<DepositSingleTokenTypeExactAmountIn>, source_token_amount: u64, minimum_pool_token_amount: u64) -> Result<()> {
    instructions::deposit_single_token_type_exact_amount_in::execute(ctx, source_token_amount, minimum_pool_token_amount)
  }

  /// Initializes a new swap
  pub fn initialize_swap_pool(ctx: Context<InitializeSwapPool>, fees: Fees, swap_curve: SwapCurve) -> Result<()> {
    instructions::initialize_swap_pool::execute(ctx, fees, swap_curve)
  }

  /// Swap the tokens in the pool.
  pub fn swap_a_to_b(ctx: Context<SwapAToB>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    instructions::swap_a_to_b::execute(ctx, amount_in, minimum_amount_out)
  }

  pub fn swap_b_to_a(ctx: Context<SwapBToA>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    instructions::swap_b_to_a::execute(ctx, amount_in, minimum_amount_out)
  }

  /// Withdraw both types of tokens from the pool at the current ratio, given
  /// pool tokens.  The pool tokens are burned in exchange for an equivalent
  /// amount of token A and B.
  pub fn withdraw_all_token_types(ctx: Context<WithdrawAllTokenTypes>, pool_token_amount: u64, minimum_token_a_amount: u64, minimum_token_b_amount: u64) -> Result<()> {
    instructions::withdraw_all_token_types::execute(ctx, pool_token_amount, minimum_token_a_amount, minimum_token_b_amount)
  }

  /// Withdraw one token type from the pool at the current ratio given the
  /// exact amount out expected.
  pub fn withdraw_single_token_type_exact_amount_out(ctx: Context<WithdrawSingleTokenTypeExactAmountOut>, destination_token_amount: u64, maximum_pool_token_amount: u64) -> Result<()> {
    instructions::withdraw_single_token_type_exact_amount_out::execute(ctx, destination_token_amount, maximum_pool_token_amount)
  }

}
