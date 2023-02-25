use crate::{seeds, MarginAccount, SyntheticAsset};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeMarginAccount<'info> {
    /// The payer of margin account rent
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The owner of the margin account, who can mint assets
    pub owner: AccountInfo<'info>,

    /// The synthetic asset the margin account is associated with
    pub synthetic_asset: AccountLoader<'info, SyntheticAsset>,

    /// The margin account to initialize
    #[account(init,
      seeds = [
        seeds::MARGIN_ACCOUNT.as_ref(),
        synthetic_asset.key().as_ref(),
        owner.key().as_ref(),
      ],
      bump,
      payer = payer,
      space = 8 + std::mem::size_of::<MarginAccount>(),
    )]
    pub margin_account: AccountLoader<'info, MarginAccount>,

    /// System program for CPI
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeMarginAccount<'info> {
    pub fn process(ctx: Context<Self>) -> Result<()> {
        // Initialize all margin account fields
        *ctx.accounts.margin_account.load_init()? = MarginAccount {
            owner: ctx.accounts.owner.key(),
            synthetic_asset: ctx.accounts.synthetic_asset.key(),
            collateral_deposited: 0,
            synthetic_asset_borrowed: 0,
        };

        Ok(())
    }
}
