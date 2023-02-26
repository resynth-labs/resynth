use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Mint, SetAuthority, spl_token::instruction::AuthorityType, Token };

use crate::state::*;

#[derive(Accounts)]
pub struct InitializeFaucet<'info> {
  #[account(init, payer = payer, space = 8 + std::mem::size_of::<Faucet>(), seeds = [b"faucet".as_ref(), mint.key().as_ref()], bump)]
  pub faucet: Box<Account<'info, Faucet>>,

  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(mut)]
  pub mint: Box<Account<'info, Mint>>,

  pub rent: Sysvar<'info, Rent>,

  pub system_program: Program<'info, System>,

  pub token_program: Program<'info, Token>,
}

pub fn execute(ctx: Context<InitializeFaucet>) -> Result<()> {
  token::set_authority(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      SetAuthority {
        current_authority: ctx.accounts.payer.to_account_info(),
        account_or_mint: ctx.accounts.mint.to_account_info(),
      },
    ),
    AuthorityType::MintTokens,
    Some(ctx.accounts.faucet.key())
  ).unwrap();

  **ctx.accounts.faucet = Faucet {
    mint: *ctx.accounts.mint.to_account_info().key,
    bump: *ctx.bumps.get("faucet").unwrap(),
  };

  Ok(())
}
