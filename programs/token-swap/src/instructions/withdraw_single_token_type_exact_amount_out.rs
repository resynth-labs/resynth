use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Burn, Transfer, self};

use crate::constants::*;
use crate::errors::*;
use crate::state::*;
use crate::types::TradeDirection;

#[derive(Accounts)]
pub struct WithdrawSingleTokenTypeExactAmountOut<'info> {
  #[account(
    seeds = [SWAP_POOL_ACCOUNT_SEED, mint_a.key().as_ref(), mint_b.key().as_ref()],
    bump = swap_pool.bump,
    constraint = swap_pool.token_program.key() == token_program.key() @ TokenSwapError::InvalidTokenProgram,
  )]
  pub swap_pool: Box<Account<'info, SwapPool>>,

  #[account(
    seeds = [swap_pool.key().as_ref()],
    bump = swap_pool.authority_bump,
  )]
  /// CHECK:
  pub authority: UncheckedAccount<'info>,

  #[account()]
  pub user_transfer_authority: Signer<'info>,

  #[account(
    mut,
    seeds = [b"lpmint", swap_pool.key().as_ref()],
    bump = swap_pool.lpmint_bump,
    mint::authority = authority,
  )]
  pub lpmint: Box<Account<'info, Mint>>,

  #[account(
    mut,
    token::authority = user_transfer_authority,
    token::mint = swap_pool.lpmint,
  )]
  pub lptoken: Box<Account<'info, TokenAccount>>,

  #[account(
    mut,
    seeds = [b"vault_a", swap_pool.key().as_ref()],
    bump = swap_pool.vault_a_bump,
    token::authority = authority,
    token::mint = swap_pool.mint_a,
  )]
  pub vault_a: Box<Account<'info, TokenAccount>>,

  #[account(
    mut,
    seeds = [b"vault_b", swap_pool.key().as_ref()],
    bump = swap_pool.vault_b_bump,
    token::authority = authority,
    token::mint = swap_pool.mint_b,
  )]
  pub vault_b: Box<Account<'info, TokenAccount>>,

  #[account(
    mut,
    token::mint = swap_pool.mint_a,
  )]
  pub token_a: Option<Box<Account<'info, TokenAccount>>>,

  #[account(
    mut,
    token::mint = swap_pool.mint_b,
  )]
  pub token_b: Option<Box<Account<'info, TokenAccount>>>,

  #[account(
    token::mint = swap_pool.lpmint,
    constraint = swap_pool.fee_receiver.key() == fee_receiver.key() @ TokenSwapError::InvalidFeeReceiver,
  )]
  pub fee_receiver: Box<Account<'info, TokenAccount>>,

  #[account(
  )]
  pub mint_a: Box<Account<'info, Mint>>,

  #[account(
  )]
  pub mint_b: Box<Account<'info, Mint>>,

  pub token_program: Program<'info, Token>,
}

//#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub fn execute(ctx: Context<WithdrawSingleTokenTypeExactAmountOut>, destination_token_amount: u64, maximum_pool_token_amount: u64) -> Result<()> {
  let swap_pool = &ctx.accounts.swap_pool;

  let trade_direction = if ctx.accounts.token_a.is_some() {
    TradeDirection::AtoB
  } else if ctx.accounts.token_b.is_some() {
    TradeDirection::BtoA
  } else {
    return Err(error!(TokenSwapError::IncorrectSwapAccount));
  };

  let (user_token_account_a_info, user_token_account_b_info) = match trade_direction {
    TradeDirection::AtoB => (Some(ctx.accounts.token_a.as_ref().unwrap().to_account_info()), None),
    TradeDirection::BtoA => (None, Some(ctx.accounts.token_b.as_ref().unwrap().to_account_info())),
  };

  swap_pool.check_accounts(
    &ctx.accounts.vault_a.to_account_info(),
    &ctx.accounts.vault_b.to_account_info(),
    &ctx.accounts.lpmint.to_account_info(),
    &ctx.accounts.token_program.to_account_info(),
    user_token_account_a_info,
    user_token_account_b_info,
    Some(ctx.accounts.fee_receiver.to_account_info()),
  )?;

  let pool_mint_supply = u128::try_from(ctx.accounts.lpmint.supply).unwrap();
  let swap_token_a_amount = u128::try_from(ctx.accounts.vault_a.amount).unwrap();
  let swap_token_b_amount = u128::try_from(ctx.accounts.vault_b.amount).unwrap();

  let burn_pool_token_amount = swap_pool.swap_curve
    .withdraw_single_token_type_exact_out(
      u128::try_from(destination_token_amount).unwrap(),
      swap_token_a_amount,
      swap_token_b_amount,
      pool_mint_supply,
      trade_direction,
      &swap_pool.fees,
    )
    .ok_or(TokenSwapError::ZeroTradingTokens)?;

  let withdraw_fee: u128 =
    if ctx.accounts.fee_receiver.key() == ctx.accounts.lptoken.key() {
      // withdrawing from the fee account, don't assess withdraw fee
      0
    } else {
      swap_pool.fees.owner_withdraw_fee(burn_pool_token_amount)
        .ok_or(TokenSwapError::FeeCalculationFailure)?
    };

  let pool_token_amount = burn_pool_token_amount
    .checked_add(withdraw_fee)
    .ok_or(TokenSwapError::CalculationFailure)?;

  if u64::try_from(pool_token_amount).unwrap() > maximum_pool_token_amount {
    return Err(TokenSwapError::ExceededSlippage.into());
  }
  if pool_token_amount == 0 {
    return Err(TokenSwapError::ZeroTradingTokens.into());
  }

  if withdraw_fee > 0 {
    token::transfer(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info().clone(),
        Transfer {
          from: ctx.accounts.lptoken.to_account_info().clone(),
          to: ctx.accounts.fee_receiver.to_account_info().clone(),
          authority: ctx.accounts.user_transfer_authority.to_account_info().clone(),
        },
      ),
      u64::try_from(withdraw_fee).unwrap(),
    )?;
  }

  token::burn(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info().clone(),
      Burn {
        mint: ctx.accounts.lpmint.to_account_info().clone(),
        from: ctx.accounts.lptoken.to_account_info().clone(),
        authority: ctx.accounts.user_transfer_authority.to_account_info().clone(),
      },
    ),
    u64::try_from(pool_token_amount).unwrap(),
  )?;

  match trade_direction {
    TradeDirection::AtoB => {
      token::transfer(
        CpiContext::new(
          ctx.accounts.token_program.to_account_info().clone(),
          Transfer {
            from: ctx.accounts.vault_a.to_account_info().clone(),
            to: ctx.accounts.token_a.as_ref().unwrap().to_account_info().clone(),
            authority: ctx.accounts.authority.to_account_info().clone(),
          },
        ),
        destination_token_amount,
      )?;
    }
    TradeDirection::BtoA => {
      token::transfer(
        CpiContext::new(
          ctx.accounts.token_program.to_account_info().clone(),
          Transfer {
            from: ctx.accounts.vault_b.to_account_info().clone(),
            to: ctx.accounts.token_b.as_ref().unwrap().to_account_info().clone(),
            authority: ctx.accounts.authority.to_account_info().clone(),
          },
        ),
        destination_token_amount,
      )?;
    }
  }

  Ok(())
}
