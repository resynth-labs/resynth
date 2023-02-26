use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Faucet {
  pub mint: Pubkey,
  pub bump: u8,
}
