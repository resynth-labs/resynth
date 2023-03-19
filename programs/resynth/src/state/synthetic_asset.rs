use anchor_lang::prelude::*;

use crate::seeds;

#[account(zero_copy)]
pub struct SyntheticAsset {
    #[deprecated()]
    pub synthetic_asset: Pubkey, // redundant
    pub collateral_mint: Pubkey,
    #[deprecated()]
    pub collateral_vault: Pubkey, // pda
    pub collateral_oracle: Pubkey,
    pub underlying_mint: Pubkey,
    #[deprecated()]
    pub underlying_vault: Pubkey, // pda
    #[deprecated()]
    pub synthetic_mint: Pubkey, // pda
    pub synthetic_oracle: Pubkey,
    #[deprecated()]
    pub asset_authority: Pubkey, //pda
    pub collateral_vault_balance: u64,
    pub underlying_vault_balance: u64,
    pub synthetic_supply: u64,
    #[deprecated()]
    pub asset_authority_bump: [u8; 1], // pda bump
    pub synthetic_asset_flags: u8,
    pub collateral_decimals: u8,
    pub underlying_decimals: u8,
    pub synthetic_decimals: u8,
}

impl SyntheticAsset {
    pub fn signer_seeds(&self) -> [&[u8]; 3] {
        [
            seeds::AUTHORITY.clone().as_ref(),
            self.synthetic_asset.as_ref(),
            self.asset_authority_bump.as_ref(),
        ]
    }
}

pub mod synthetic_asset_flags {
    pub const UNDERLYING_INITIALIZED: u8 = 0x02;
}
