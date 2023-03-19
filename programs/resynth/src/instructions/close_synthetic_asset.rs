use crate::SyntheticAsset;
use anchor_lang::prelude::*;
use anchor_spl::token::{close_account, transfer, CloseAccount, Token, TokenAccount, Transfer};

// This instruction dumps all collateral to the signer wallet,
// and closes the synthetic asset account. After running this there is no
// going back: the margin account PDA must be bumped.

// replace with your local wallet to control closing
mod signer_key {
    use anchor_lang::prelude::*;

    declare_id!("EjvPni9o9ku9oeNBdXwEAY4YxzyNi5E335wQP97YQmdM");
}

#[derive(Accounts)]
pub struct CloseSyntheticAsset<'info> {
    /// The synthetic asset to close
    #[account(mut,
      has_one = asset_authority,
      has_one = collateral_vault,
      close = signer,
    )]
    pub synthetic_asset: AccountLoader<'info, SyntheticAsset>,
    /// The vault to close
    #[account(mut)]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,
    /// The mint authority that can transfer vault collateral
    /// CHECK:
    pub asset_authority: AccountInfo<'info>,

    /// The receiver of the vault collateral
    #[account(mut,
      address = signer_key::ID,
    )]
    pub signer: Signer<'info>,

    /// The owners account that vault collateral will be transferred to
    #[account(mut,
      token::authority = signer
    )]
    pub collateral_account: Box<Account<'info, TokenAccount>>,

    /// The token program for CPI calls
    pub token_program: Program<'info, Token>,
}

impl<'info> CloseSyntheticAsset<'info> {
    /// CPI context to transfer collateral from the owners account to the vault
    pub fn collateral_transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        return CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.collateral_vault.to_account_info(),
                to: self.collateral_account.to_account_info(),
                authority: self.asset_authority.to_account_info(),
            },
        );
    }

    /// CPI context to mint synthetic tokens to the owners token account
    pub fn close_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        return CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.collateral_vault.to_account_info(),
                destination: self.collateral_account.to_account_info(),
                authority: self.asset_authority.to_account_info(),
            },
        );
    }

    pub fn process(ctx: Context<Self>) -> Result<()> {
        let synthetic_asset = ctx.accounts.synthetic_asset.load()?;

        // Mint the synthetic asset to the user token account
        let signer_seeds: &[&[&[u8]]] = &[&synthetic_asset.signer_seeds()];

        // Transfer collateral from the user to the vault
        transfer(
            ctx.accounts
                .collateral_transfer_context()
                .with_signer(signer_seeds),
            ctx.accounts.collateral_vault.amount,
        )?;

        close_account(
            ctx.accounts
                .close_vault_context()
                .with_signer(signer_seeds)
                .with_signer(signer_seeds),
        )?;

        Ok(())
    }
}
