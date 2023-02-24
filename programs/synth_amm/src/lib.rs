use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod seeds;
mod state;

pub use errors::*;
pub use instructions::*;
pub use seeds::*;
pub use state::*;

declare_id!("EMA4zANmhMuSUqRqj3wNvAkGwRGXLJk7WpXQdW7bSwX1");

#[program]
pub mod synth_amm {
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

    pub fn initialize_amm(ctx: Context<InitializeAMM>, lp_decimals: u8) -> Result<()> {
        InitializeAMM::process(ctx, lp_decimals)
    }
}
