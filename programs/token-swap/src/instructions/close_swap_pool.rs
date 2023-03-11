/*
use anchor_lang::prelude::*;
use anchor_spl::token::{close_account, transfer, CloseAccount, Transfer};
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::*;
use crate::state::*;
*/

// This instruction dumps the vaults to the fee receiver wallet,
// and closes all accounts except mints. After running this there is no
// going back: the swap pool PDA must be bumped.
/*
// replace with your local wallet to control closing
mod signer_key {
    use anchor_lang::prelude::*;

    declare_id!("EjvPni9o9ku9oeNBdXwEAY4YxzyNi5E335wQP97YQmdM");
}

// FIXME: replace with swap_pool.fee_recevier_wallet
mod fee_receiver_wallet_key {
    use anchor_lang::prelude::*;

    declare_id!("HjnXUGGMgtN9WaPAJxzdwnWip6f76xGp4rUMRoVicsLr");
}

#[derive(Accounts)]
pub struct CloseSwapPool<'info> {
    /// New Token-swap to create.
    #[account(mut,
      close = signer,
      has_one = token_program,
      has_one = vault_a,
      has_one = vault_b,
      has_one = mint_a,
      has_one = mint_b,
    )]
    pub swap_pool: AccountLoader<'info, SwapPool>,

    #[account(seeds = [swap_pool.key().as_ref()], bump)]
    /// CHECK:
    pub authority: AccountInfo<'info>,

    #[account(mut,
        token::authority = authority,
        token::mint = mint_a
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        token::authority = authority,
        token::mint = mint_b
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    /// CHECK:
    #[account(mut,
      address = fee_receiver_wallet_key::ID,
    )]
    pub fee_receiver_wallet: AccountInfo<'info>,

    #[account(address = signer_key::ID)]
    pub signer: Signer<'info>,

    pub mint_a: Box<Account<'info, Mint>>,

    pub mint_b: Box<Account<'info, Mint>>,

    #[account(
      mut,
      token::authority = signer,
      token::mint = mint_a,
    )]
    pub dest_a: Box<Account<'info, TokenAccount>>,

    #[account(
      mut,
      token::authority = signer,
      token::mint = mint_b,
    )]
    pub dest_b: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
}

impl<'info> CloseSwapPool<'info> {
    pub fn transfer_vault_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.vault_a.to_account_info(),
                to: self.dest_a.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
    pub fn transfer_vault_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.vault_b.to_account_info(),
                to: self.dest_b.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
    pub fn close_vault_a_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.vault_a.to_account_info(),
                destination: self.signer.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
    pub fn close_vault_b_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.vault_b.to_account_info(),
                destination: self.signer.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}

pub fn execute(ctx: Context<CloseSwapPool>) -> Result<()> {
    if ctx.accounts.vault_a.delegate.is_some() {
        return Err(TokenSwapError::InvalidDelegate.into());
    }
    if ctx.accounts.vault_b.delegate.is_some() {
        return Err(TokenSwapError::InvalidDelegate.into());
    }

    let swap_pool = ctx.accounts.swap_pool.load()?;

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    // This is a departure from the non-anchor spl-token-swap.
    // Because vaults aren't preinitialized with a balance,
    // they must be seeded before validating a supply.
    transfer(
        ctx.accounts
            .transfer_vault_a_context()
            .with_signer(signer_seeds),
        ctx.accounts.vault_a.amount,
    )?;
    transfer(
        ctx.accounts
            .transfer_vault_b_context()
            .with_signer(signer_seeds),
        ctx.accounts.vault_b.amount,
    )?;
    close_account(
        ctx.accounts
            .close_vault_a_context()
            .with_signer(signer_seeds),
    )?;
    close_account(
        ctx.accounts
            .close_vault_b_context()
            .with_signer(signer_seeds),
    )?;

    Ok(())
}
 */
