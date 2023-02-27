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

    /// Initialize a new synthetic asset
    pub fn initialize_synthetic_asset(
        ctx: Context<InitializeSyntheticAsset>,
        decimals: u8,
    ) -> Result<()> {
        InitializeSyntheticAsset::process(ctx, decimals)
    }

    pub fn initialize_margin_account(ctx: Context<InitializeMarginAccount>) -> Result<()> {
        InitializeMarginAccount::process(ctx)
    }

    // /// Mint a synthetic asset

    /// this instruction allows the user to deposit stable coin
    /// collateral and mint synthetic asset. The user should be able to choose how
    /// much they can mint but it should be restricted with a collateralization ratio such
    /// that collateral_value / (oracle_price * minted_amount) >= 1.5
    pub fn mint_synthetic_asset(
        ctx: Context<MintSyntheticAsset>,
        collateral_amount: u64,
        mint_amount: u64,
    ) -> Result<()> {
        MintSyntheticAsset::process(ctx, collateral_amount, mint_amount)
    }

    // /// Burn a synthetic asset
    // pub fn burn_synthetic_asset(
    //     ctx: Context<BurnSyntheticAsset>,
    //     burn_amount: u64,
    //     collateral_amount: u64,
    // ) -> Result<()> {
    //     BurnSyntheticAsset::process(ctx, burn_amount, collateral_amount)
    // }

    // /// deposit: this instruction allows a user to contribute X amount of synthetic asset and Y amount of stable coin to an AMM pool.
    // ///
    // /// If the pool is empty then Y = oracle_price * X
    // /// Otherwise Y = pool_price * X
    // /// There should be a mechanism in place to keep track of how much relative
    // /// liquidity the user has provided. As an example if there is $100 of liquidity
    // /// already in the pool and the user contributes $50 of liquidity. They now own
    // /// 1/3 of the liquidity in the pool.

    // /// withdraw: this instruction allows a user to withdraw any
    // /// amount of their liquidity from the AMM. It should be using the tracking
    // /// mechanism from before to figure out how much of each asset it can withdraw.

    // /// swap: instruction to allow a user to buy or sell, the trade
    // /// should follow the standard x * y = k constant product formula, assume no fees.
}
