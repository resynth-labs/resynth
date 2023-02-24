use crate::{errors::Errors, seeds, state::SyntheticAsset};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use pyth_sdk_solana::load_price_feed_from_account_info;

#[derive(Accounts)]
#[instruction(decimals: u8)]
pub struct InitializeSyntheticAsset<'info> {
    /// The synthetic asset account to initialize
    #[account(init,
        payer = payer,
        space = 8 + std::mem::size_of::<SyntheticAsset>(),
    )]
    pub synthetic_asset: AccountLoader<'info, SyntheticAsset>,

    /// The mint to use as collateral for the synthetic asset
    pub collateral_mint: Box<Account<'info, Mint>>,

    /// The vault of hard assets to collateralize the circulating synthetic assets
    #[account(init,
        seeds = [
            seeds::VAULT.as_ref(),
            synthetic_asset.key().as_ref(),
        ],
        bump,
        payer = payer,
        token::mint = collateral_mint,
        token::authority = asset_authority,
    )]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,

    /// The synthetic asset mint
    #[account(init,
        seeds = [
            seeds::MINT.as_ref(),
            synthetic_asset.key().as_ref(),
        ],
        bump,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = asset_authority,
    )]
    pub synthetic_mint: Box<Account<'info, Mint>>,

    /// The synthetic asset oracle price feed, to determine margin account health
    pub synthetic_oracle: AccountInfo<'info>,

    /// The mint authority that can mint synthetic assets and transfer vault collateral
    #[account(
      seeds = [
        seeds::AUTHORITY.as_ref(),
        synthetic_asset.key().as_ref()
      ],
      bump,
    )]
    pub asset_authority: AccountInfo<'info>,

    /// The payer of rent for various accounts
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The token program to initialize token accounts
    pub token_program: Program<'info, Token>,

    /// The system program to create accounts
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeSyntheticAsset<'info> {
    pub fn process(ctx: Context<Self>, _decimals: u8) -> Result<()> {
        // Load the price feed to validate it's a feed
        // This doesn't verify it's owned by the pyth program.
        // Assume users trust the admin configured the synthetic asset correctly.
        load_price_feed_from_account_info(&ctx.accounts.synthetic_oracle)
            .map_err(|_| Errors::InvalidOracle)?;

        // The USD price of one unit of collateral is hard coded to 1,
        // so the conversion between one token and one unit must be constant.
        require!(
            ctx.accounts.collateral_mint.decimals == 6,
            Errors::InvalidCollateralMintDecimals
        );

        // Initialize all synthetic asset fields
        *ctx.accounts.synthetic_asset.load_init()? = SyntheticAsset {
            synthetic_asset: ctx.accounts.synthetic_asset.key(),
            collateral_mint: ctx.accounts.collateral_mint.key(),
            collateral_vault: ctx.accounts.collateral_vault.key(),
            synthetic_mint: ctx.accounts.synthetic_mint.key(),
            synthetic_oracle: ctx.accounts.synthetic_oracle.key(),
            asset_authority: ctx.accounts.asset_authority.key(),
            asset_authority_bump: [ctx.bumps["asset_authority"]],
        };

        Ok(())
    }
}
