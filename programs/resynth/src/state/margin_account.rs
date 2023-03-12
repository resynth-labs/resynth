use anchor_lang::prelude::*;
use pyth_sdk_solana::Price;

use crate::Errors;

/// The numerator of value of one lamport of collateral
const COLLATERAL_VALUE_NUMERATOR: u64 = 1;
/// The denominator of value of one lamport of collateral
/// Collateral mint is hardcoded to 6 decimals, for now.
const COLLATERAL_VALUE_DENOMINATOR: u64 = 1_000_000;

const COLLATERAL_RATIO_NUMERATOR: u64 = 15;
const COLLATERAL_RATIO_DENOMINATOR: u64 = 10;

#[account(zero_copy)]
pub struct MarginAccount {
    pub owner: Pubkey,
    pub synthetic_asset: Pubkey,
    pub collateral_deposited: u64,
    pub synthetic_asset_borrowed: u64,
}

impl MarginAccount {
    pub fn mint_synthetic_asset(&mut self, collateral_amount: u64, mint_amount: u64) {
        // Overflow checks are implicit because
        // of the cargo.toml parameter overflow-checks = true
        self.collateral_deposited += collateral_amount;
        self.synthetic_asset_borrowed += mint_amount;
    }

    pub fn burn_synthetic_asset(&mut self, collateral_amount: u64, burn_amount: u64) {
        // Overflow checks are implicit because
        // of the cargo.toml parameter overflow-checks = true
        self.collateral_deposited -= collateral_amount;
        self.synthetic_asset_borrowed -= burn_amount;
    }

    pub fn verify_healthy(&self, oracle_price: Price) -> Result<bool> {
        assert!(
            oracle_price.expo <= 0,
            "Oracle exponent is positive, which is not yet supported by this code"
        );

        let price = u64::try_from(oracle_price.price).map_err(|_| Errors::Undercollateralized)?;
        let price_expo =
            u32::try_from(-oracle_price.expo).map_err(|_| Errors::Undercollateralized)?;

        /*
         * The original formula is:
         *  collateral_value / (oracle_price * minted_amount) >= 1.5
         *
         * This uses floats, which get emulated with integers
         * It also uses division, which is the slowest operation
         *
         * The formula can be rethought as
         *  collateral_value >= oracle_price * minted_amount * 1.5
         *
         * The fraction can be eliminated with a numerator and denominator
         *  collateral_value >= oracle_price * minted_amount * 15 / 10
         *
         * Some variable must be expanded
         *  collateral_value = collateral_balance * 15 / 10
         *
         * All together, with collateral denominator moved to the other side of the equation
         *  collateral_balance * collateral_numerator >= oracle_price * minted_amount * collateral_denominator * 15 / 10
         *
         * Then the formula works perfectly well with integers :)
         */

        msg!(&("oracle price ".to_owned() + &price.to_string()));
        msg!(&("oracle expo ".to_owned() + &oracle_price.expo.to_string()));

        let healthy = u128::from(
            &self.collateral_deposited * COLLATERAL_VALUE_NUMERATOR * COLLATERAL_RATIO_DENOMINATOR,
        ) * u128::from(10u64.pow(price_expo))
            >= u128::from(price)
                * u128::from(self.synthetic_asset_borrowed)
                * u128::from(COLLATERAL_VALUE_DENOMINATOR)
                * u128::from(COLLATERAL_RATIO_NUMERATOR);

        Ok(healthy)
    }
}
