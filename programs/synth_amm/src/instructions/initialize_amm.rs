use crate::{seeds, AMM};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(lp_decimals: u8)]
pub struct InitializeAMM<'info> {
    #[account(init,
      payer = payer,
      space = 8 + std::mem::size_of::<AMM>(),
    )]
    pub amm: AccountLoader<'info, AMM>,
    #[account(init,
      seeds = [
        seeds::VAULT.as_ref(),
        amm.key().as_ref(),
        base_mint.key().as_ref(),
      ],
      bump,
      payer = payer,
      token::authority = amm_authority,
      token::mint = base_mint,
    )]
    pub base_vault: Box<Account<'info, TokenAccount>>,
    #[account(init,
      seeds = [
        seeds::VAULT.as_ref(),
        amm.key().as_ref(),
        quote_mint.key().as_ref(),
      ],
      bump,
      payer = payer,
      token::authority = amm_authority,
      token::mint = quote_mint,
    )]
    pub quote_vault: Box<Account<'info, TokenAccount>>,
    pub quote_oracle: AccountInfo<'info>,
    #[account(init,
      seeds = [
        seeds::MINT.as_ref(),
        amm.key().as_ref(),
      ],
      bump,
      payer = payer,
      mint::authority = amm_authority,
      mint::decimals = lp_decimals,
    )]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(
      seeds = [
        seeds::AUTHORITY.as_ref(),
        amm.key().as_ref(),
      ],
      bump,
    )]
    pub amm_authority: AccountInfo<'info>,

    pub base_mint: Box<Account<'info, Mint>>,
    pub quote_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeAMM<'info> {
    pub fn process(ctx: Context<InitializeAMM>, _lp_decimals: u8) -> Result<()> {
        *ctx.accounts.amm.load_init()? = AMM {
            base_vault: ctx.accounts.base_vault.key(),
            quote_vault: ctx.accounts.quote_vault.key(),
            quote_oracle: ctx.accounts.quote_oracle.key(),
            lp_mint: ctx.accounts.lp_mint.key(),
            amm_authority: ctx.accounts.amm_authority.key(),
            amm_authority_bump: [ctx.bumps["amm_authority"]],
        };

        Ok(())
    }
}
