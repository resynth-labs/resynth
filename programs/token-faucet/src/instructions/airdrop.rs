use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::state::*;

#[derive(Accounts)]
pub struct Airdrop<'info> {
    #[account(seeds = [b"faucet".as_ref(), mint.key().as_ref()], bump = faucet.bump)]
    pub faucet: Box<Account<'info, Faucet>>,

    #[account(mut, mint::authority = faucet)]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut, token::mint = mint)]
    pub token_account: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

pub fn execute(ctx: Context<Airdrop>, amount: u64) -> Result<()> {
    let signer_seeds = [
        b"faucet".as_ref(),
        ctx.accounts.faucet.mint.as_ref(),
        &[ctx.accounts.faucet.bump],
    ];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.faucet.to_account_info(),
            },
            &[&signer_seeds[..]],
        ),
        amount,
    )
    .unwrap();

    Ok(())
}
