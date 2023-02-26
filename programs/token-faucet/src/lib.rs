use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("73ZZXhTSpH2nrm347fzoaRcjyCuMJ3u4jPq9jsrotin2");

#[program]
pub mod token_faucet {
  use super::*;

  pub fn airdrop(ctx: Context<Airdrop>, amount: u64) -> Result<()> {
    instructions::airdrop::execute(ctx, amount)
  }

  pub fn initialize_faucet(ctx: Context<InitializeFaucet>) -> Result<()> {
    instructions::initialize_faucet::execute(ctx)
  }

}
