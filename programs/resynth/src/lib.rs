use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod seeds;
mod state;

pub use errors::*;
pub use instructions::*;
pub use seeds::*;
pub use state::*;

declare_id!("synttWtyx32zPvSm7gioaHUGJ4ZFsZUmnviEvjtoyoa");

#[program]
pub mod resynth {
    use super::*;

    /// Initialize a new synthetic asset
    pub fn initialize_synthetic_asset(ctx: Context<InitializeSyntheticAsset>) -> Result<()> {
        InitializeSyntheticAsset::process(ctx)
    }

    /// Initialize a new margin account
    pub fn initialize_margin_account(ctx: Context<InitializeMarginAccount>) -> Result<()> {
        InitializeMarginAccount::process(ctx)
    }

    /// Mint a synthetic asset
    pub fn mint_synthetic_asset(
        ctx: Context<MintSyntheticAsset>,
        collateral_amount: u64,
        mint_amount: u64,
    ) -> Result<()> {
        MintSyntheticAsset::process(ctx, collateral_amount, mint_amount)
    }

    /// Burn a synthetic asset
    pub fn burn_synthetic_asset(
        ctx: Context<BurnSyntheticAsset>,
        collateral_amount: u64,
        burn_amount: u64,
    ) -> Result<()> {
        BurnSyntheticAsset::process(ctx, collateral_amount, burn_amount)
    }
}
