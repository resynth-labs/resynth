use anchor_lang::prelude::*;

use crate::seeds;

#[account(zero_copy)]
pub struct SyntheticAsset {
    pub synthetic_asset: Pubkey,
    pub collateral_mint: Pubkey,
    pub collateral_vault: Pubkey,
    pub synthetic_mint: Pubkey,
    pub synthetic_oracle: Pubkey,
    pub asset_authority: Pubkey,
    pub asset_authority_bump: [u8; 1],
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
