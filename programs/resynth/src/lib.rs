use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod seeds;
mod state;

pub use errors::*;
pub use instructions::*;
pub use seeds::*;
pub use state::*;

declare_id!("BWxFf9EizbS1hxKPKJguxmvvxSggaVNK6V3TogPhuzAs");

#[program]
pub mod resynth {
    use super::*;

    pub fn initialize_synthetic_asset(
        ctx: Context<InitializeSyntheticAsset>,
        decimals: u8,
    ) -> Result<()> {
        InitializeSyntheticAsset::process(ctx, decimals)
    }

    pub fn initialize_margin_account(ctx: Context<InitializeMarginAccount>) -> Result<()> {
        InitializeMarginAccount::process(ctx)
    }

    pub fn mint_synthetic_asset(
        ctx: Context<MintSyntheticAsset>,
        collateral_amount: u64,
        mint_amount: u64,
    ) -> Result<()> {
        MintSyntheticAsset::process(ctx, collateral_amount, mint_amount)
    }
}
