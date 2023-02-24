use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    #[msg("The oracle account provided is invalid")]
    InvalidOracle,
    #[msg("The oracle is stale")]
    StaleOracle,
    #[msg("The margin account is undercollateralized")]
    Undercollateralized,

    #[msg("Collateral decimals is rqeuired to be 6 because it's value is hardcoded to $1")]
    InvalidCollateralMintDecimals,
}
