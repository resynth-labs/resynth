use crate::{Errors, MarginAccount, SyntheticAsset};
use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, transfer, Mint, MintTo, Token, TokenAccount, Transfer};
use pyth_sdk_solana::load_price_feed_from_account_info;

#[derive(Accounts)]
pub struct MintSyntheticAsset<'info> {
    /// The synthetic asset account
    #[account(
      has_one = collateral_vault,
      has_one = synthetic_mint,
      has_one = synthetic_oracle,
      has_one = asset_authority,
    )]
    pub synthetic_asset: AccountLoader<'info, SyntheticAsset>,
    /// The vault that is receiving collateral
    #[account(mut)]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,
    /// The synthetic mint of the asset
    #[account(mut)]
    pub synthetic_mint: Box<Account<'info, Mint>>,
    /// The oracle price feed, to determine margin account health
    /// CHECK:
    pub synthetic_oracle: AccountInfo<'info>,
    /// The mint authority that can mint synthetic assets and transfer vault collateral
    /// CHECK:
    pub asset_authority: AccountInfo<'info>,

    /// The receiver of the synthetic asset
    pub owner: Signer<'info>,

    /// The margin account of the owner, to track collateral and debt
    #[account(mut,
      has_one = owner,
      has_one = synthetic_asset,
    )]
    pub margin_account: AccountLoader<'info, MarginAccount>,
    /// The owners account that collateral will be transferred from
    #[account(mut,
      token::authority = owner
    )]
    pub collateral_account: Box<Account<'info, TokenAccount>>,
    /// The owners account that will receive synthetic tokens
    #[account(mut,
        token::authority = owner,
    )]
    pub synthetic_account: Box<Account<'info, TokenAccount>>,

    /// The token program for CPI calls
    pub token_program: Program<'info, Token>,
}

impl<'info> MintSyntheticAsset<'info> {
    /// CPI context to transfer collateral from the owners account to the vault
    pub fn collateral_transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        return CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.collateral_account.to_account_info(),
                to: self.collateral_vault.to_account_info(),
                authority: self.owner.to_account_info(),
            },
        );
    }

    /// CPI context to mint synthetic tokens to the owners token account
    pub fn mint_synthetic_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        return CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.synthetic_mint.to_account_info(),
                to: self.synthetic_account.to_account_info(),
                authority: self.asset_authority.to_account_info(),
            },
        );
    }

    pub fn process(ctx: Context<Self>, collateral_amount: u64, mint_amount: u64) -> Result<()> {
        let synthetic_asset = ctx.accounts.synthetic_asset.load()?;
        let mut margin_account = ctx.accounts.margin_account.load_mut()?;

        // Unwrap the oracle price
        let oracle_price = load_price_feed_from_account_info(&ctx.accounts.synthetic_oracle)
            .map_err(|_| Errors::InvalidOracle)?
            .get_price_unchecked();

        // Update the margin account balances
        margin_account.mint_synthetic_asset(collateral_amount, mint_amount);

        // Verify minting does not make the margin account unhealthy
        margin_account.verify_healthy(oracle_price)?;

        // Transfer collateral from the user to the vault
        transfer(
            ctx.accounts.collateral_transfer_context(),
            collateral_amount,
        )?;

        // Mint the synthetic asset to the user token account
        let signer_seeds: &[&[&[u8]]] = &[&synthetic_asset.signer_seeds()];
        mint_to(
            ctx.accounts
                .mint_synthetic_context()
                .with_signer(signer_seeds),
            mint_amount,
        )?;

        Ok(())
    }
}
