use anchor_lang::prelude::*;

use crate::{
    errors::TokenSwapError,
    types::{
        swap_curve::{SwapCurve, SwapCurveType},
        Fees,
    },
};

/// A token swap pool.
#[account(zero_copy)]
pub struct SwapPool {
    pub version: u8,

    pub bump: u8,

    /// Bump seed used in program address.
    /// The program address is created deterministically with the bump seed,
    /// swap program id, and swap account pubkey.  This program address has
    /// authority over the swap's token A account, token B account, and pool
    /// token mint.
    pub authority_bump: [u8; 1],

    pub vault_a_bump: u8,

    pub vault_b_bump: u8,

    pub lpmint_bump: u8,

    pub swap_pool: Pubkey,

    pub authority: Pubkey,

    /// Mint information for token A
    pub mint_a: Pubkey,

    /// Mint information for token B
    pub mint_b: Pubkey,

    /// Pool tokens are issued when A or B tokens are deposited.
    /// Pool tokens can be withdrawn back to the original A or B token.
    pub lpmint: Pubkey,

    /// Token A
    pub vault_a: Pubkey,

    /// Token B
    pub vault_b: Pubkey,

    /// Pool token account to receive trading and / or withdrawal fees
    pub fee_receiver: Pubkey,

    /// Program ID of the tokens being exchanged.
    pub token_program: Pubkey,

    /// All fee information
    pub fees: Fees,

    /// Swap curve parameters, to be unpacked and used by the SwapCurve, which
    /// calculates swaps, deposits, and withdrawals
    pub swap_curve_type: SwapCurveType,

    pub token_b_price_or_offset: u64,
}

impl SwapPool {
    pub fn check_accounts(
        &self,
        vault_a_info: &AccountInfo,
        vault_b_info: &AccountInfo,
        pool_mint_info: &AccountInfo,
        token_program_info: &AccountInfo,
        token_a_info: Option<AccountInfo>,
        token_b_info: Option<AccountInfo>,
        fee_receiver_info: Option<AccountInfo>,
    ) -> Result<()> {
        if *vault_a_info.key != self.vault_a {
            return Err(TokenSwapError::IncorrectSwapAccount.into());
        }
        if *vault_b_info.key != self.vault_b {
            return Err(TokenSwapError::IncorrectSwapAccount.into());
        }
        if *pool_mint_info.key != self.lpmint {
            return Err(TokenSwapError::IncorrectPoolMint.into());
        }
        if *token_program_info.key != self.token_program {
            return Err(TokenSwapError::InvalidTokenProgram.into());
        }
        if let Some(token_account_a_info) = token_a_info {
            if vault_a_info.key == token_account_a_info.key {
                return Err(TokenSwapError::InvalidInput.into());
            }
        }
        if let Some(token_account_b_info) = token_b_info {
            if vault_b_info.key == token_account_b_info.key {
                return Err(TokenSwapError::InvalidInput.into());
            }
        }
        if let Some(fee_receiver_info) = fee_receiver_info {
            if *fee_receiver_info.key != self.fee_receiver {
                return Err(TokenSwapError::InvalidFeeReceiver.into());
            }
        }
        Ok(())
    }

    pub fn signer_seeds(&self) -> [&[u8]; 2] {
        [
            self.swap_pool.as_ref().clone(),
            self.authority_bump.as_ref().clone(),
        ]
    }

    pub fn swap_curve(&self) -> Result<SwapCurve> {
        self.swap_curve_type
            .try_into_swap_curve(self.token_b_price_or_offset)
    }
}
