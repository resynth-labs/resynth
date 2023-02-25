use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::curve::calculator::CurveCalculator;
use crate::errors::*;
use crate::state::*;
use crate::types::*;

#[derive(Accounts)]
pub struct InitializeSwapPool<'info> {
  /// New Token-swap to create.
  #[account(init, payer = payer, space = 8 + std::mem::size_of::<SwapPool>(), seeds = [SWAP_POOL_ACCOUNT_SEED, mint_a.key().as_ref(), mint_b.key().as_ref()], bump)]
  pub swap_pool: Box<Account<'info, SwapPool>>,

  #[account(seeds = [swap_pool.key().as_ref()], bump)]
  /// CHECK:
  pub authority: UncheckedAccount<'info>,

  #[account(init, payer = payer, seeds = [b"vault_a", swap_pool.key().as_ref()], bump, token::authority = authority, token::mint = mint_a)]
  pub vault_a: Box<Account<'info, TokenAccount>>,

  #[account(init, payer = payer, seeds = [b"vault_b", swap_pool.key().as_ref()], bump, token::authority = authority, token::mint = mint_b)]
  pub vault_b: Box<Account<'info, TokenAccount>>,

  /// Pool Token Mint. Must be empty, owned by swap authority.
  #[account(init, payer = payer, seeds = [b"lpmint", swap_pool.key().as_ref()], bump, mint::authority = authority, mint::decimals = 0)]
  pub lpmint: Box<Account<'info, Mint>>,

  /// Pool Token Account to deposit trading and withdraw fees.
  /// Must be empty, not owned by swap authority
  #[account(token::mint = lpmint)]
  pub fee_receiver: Box<Account<'info, TokenAccount>>,

  #[account()]
  pub mint_a: Box<Account<'info, Mint>>,

  #[account()]
  pub mint_b: Box<Account<'info, Mint>>,

  #[account(mut)]
  pub payer: Signer<'info>,

  pub system_program: Program<'info, System>,

  pub token_program: Program<'info, Token>,
}

pub fn execute(ctx: Context<InitializeSwapPool>, fees: Fees, swap_curve: SwapCurve) -> Result<()> {
  let (authority, authority_bump) = Pubkey::find_program_address(
    &[&ctx.accounts.swap_pool.key().to_bytes()],
    ctx.program_id,
  );
  if *ctx.accounts.authority.key != authority {
    return Err(error!(TokenSwapError::InvalidAuthority));
  }
  if *ctx.accounts.authority.key != ctx.accounts.lpmint.mint_authority.unwrap() {
    return Err(TokenSwapError::InvalidOwner.into());
  }

  if ctx.accounts.vault_a.mint == ctx.accounts.vault_b.mint {
    return Err(error!(TokenSwapError::RepeatedMint));
  }

  swap_curve
    .validate_supply(ctx.accounts.vault_a.amount, ctx.accounts.vault_b.amount)?;

  if ctx.accounts.vault_a.delegate.is_some() {
    return Err(TokenSwapError::InvalidDelegate.into());
  }
  if ctx.accounts.vault_b.delegate.is_some() {
    return Err(TokenSwapError::InvalidDelegate.into());
  }
  if ctx.accounts.vault_a.close_authority.is_some() {
    return Err(TokenSwapError::InvalidCloseAuthority.into());
  }
  if ctx.accounts.vault_b.close_authority.is_some() {
    return Err(TokenSwapError::InvalidCloseAuthority.into());
  }

  if ctx.accounts.lpmint.supply != 0 {
    return Err(TokenSwapError::InvalidSupply.into());
  }
  if ctx.accounts.lpmint.freeze_authority.is_some() {
    return Err(TokenSwapError::InvalidFreezeAuthority.into());
  }

  fees.validate()?;
  swap_curve.validate()?;

  // let initial_amount = u64::try_from(swap_curve.new_pool_supply()).unwrap();

  //TODO DELETE
  // token::mint_to(
  //   CpiContext::new(
  //     ctx.accounts.token_program.to_account_info().clone(),
  //     MintTo {
  //       mint: ctx.accounts.lpmint.to_account_info().clone(),
  //       to: ctx.accounts.lptoken.to_account_info().clone(),
  //       authority: ctx.accounts.authority.to_account_info().clone(),
  //     },
  //   ),
  //   initial_amount,
  // )?;

  let swap_pool = &mut ctx.accounts.swap_pool;
  if swap_pool.is_initialized {
    return Err(TokenSwapError::AlreadyInitialized.into());
  }
  swap_pool.is_initialized = true;
  swap_pool.bump = *ctx.bumps.get("swap_pool").unwrap();
  swap_pool.authority_bump = authority_bump;
  swap_pool.token_program = *ctx.accounts.token_program.key;
  swap_pool.vault_a = ctx.accounts.vault_a.key();
  swap_pool.vault_b = ctx.accounts.vault_b.key();
  swap_pool.lpmint = ctx.accounts.lpmint.key();
  swap_pool.mint_a = ctx.accounts.mint_a.key();
  swap_pool.mint_b = ctx.accounts.mint_b.key();
  swap_pool.fee_receiver = ctx.accounts.fee_receiver.key();
  swap_pool.fees = fees;
  swap_pool.swap_curve = swap_curve;

  Ok(())
}
