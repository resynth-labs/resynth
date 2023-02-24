use anchor_lang::prelude::*;

#[account(zero_copy)]
pub struct AMM {
    pub base_vault: Pubkey,
    pub quote_vault: Pubkey,
    pub quote_oracle: Pubkey,
    pub lp_mint: Pubkey,
    pub amm_authority: Pubkey,
    pub amm_authority_bump: [u8; 1],
}
