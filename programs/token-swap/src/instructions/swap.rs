use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::errors::*;
use crate::state::*;
use crate::types::TradeDirection;

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        has_one = token_program @ TokenSwapError::InvalidTokenProgram,
        has_one = fee_receiver @ TokenSwapError::InvalidFeeReceiver,
    )]
    pub swap_pool: Box<Account<'info, SwapPool>>,

    #[account(
        seeds = [swap_pool.key().as_ref()],
        bump = swap_pool.authority_bump[0],
    )]
    /// CHECK:
    pub authority: UncheckedAccount<'info>,

    #[account()]
    pub user_transfer_authority: Signer<'info>,

    #[account(mut,
        token::authority = user_transfer_authority,
    )]
    pub source_token: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub source_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        token::authority = authority,
    )]
    pub dest_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub dest_token: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        mint::authority = authority,
    )]
    pub lpmint: Box<Account<'info, Mint>>,

    #[account(mut,
        token::mint = swap_pool.lpmint,
    )]
    pub fee_receiver: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,

    /// Host fee account to receive additional trading fees
    #[account(mut,
        token::mint = swap_pool.lpmint,
    )]
    pub host_fee_receiver: Option<Box<Account<'info, TokenAccount>>>,
}

//#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub fn execute(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    let swap_pool = &ctx.accounts.swap_pool;

    let trade_direction = if ctx.accounts.source_token.mint == swap_pool.vault_a {
        TradeDirection::AtoB
    } else if ctx.accounts.source_token.mint == swap_pool.vault_b {
        TradeDirection::BtoA
    } else {
        return Err(error!(TokenSwapError::IncorrectSwapAccount));
    };

    let (vault_a_info, vault_b_info, user_token_account_a_info, user_token_account_b_info) =
        match trade_direction {
            TradeDirection::AtoB => (
                ctx.accounts.source_vault.to_account_info(),
                ctx.accounts.dest_vault.to_account_info(),
                ctx.accounts.source_token.to_account_info(),
                ctx.accounts.dest_token.to_account_info(),
            ),
            TradeDirection::BtoA => (
                ctx.accounts.dest_vault.to_account_info(),
                ctx.accounts.source_vault.to_account_info(),
                ctx.accounts.dest_token.to_account_info(),
                ctx.accounts.source_token.to_account_info(),
            ),
        };

    swap_pool.check_accounts(
        &vault_a_info,
        &vault_b_info,
        &ctx.accounts.lpmint.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        Some(user_token_account_a_info),
        Some(user_token_account_b_info),
        Some(ctx.accounts.fee_receiver.to_account_info()),
    )?;

    // Calculate the trade amounts
    let result = swap_pool
        .swap_curve
        .swap(
            u128::try_from(amount_in).unwrap(),
            u128::try_from(ctx.accounts.source_vault.amount).unwrap(),
            u128::try_from(ctx.accounts.dest_vault.amount).unwrap(),
            trade_direction,
            &swap_pool.fees,
        )
        .ok_or(TokenSwapError::ZeroTradingTokens)?;

    if result.destination_amount_swapped < u128::try_from(minimum_amount_out).unwrap() {
        return Err(TokenSwapError::ExceededSlippage.into());
    }

    let (swap_token_a_amount, swap_token_b_amount) = match trade_direction {
        TradeDirection::AtoB => (
            result.new_swap_source_amount,
            result.new_swap_destination_amount,
        ),
        TradeDirection::BtoA => (
            result.new_swap_destination_amount,
            result.new_swap_source_amount,
        ),
    };

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.source_token.to_account_info().clone(),
                to: ctx.accounts.source_token.to_account_info().clone(),
                authority: ctx
                    .accounts
                    .user_transfer_authority
                    .to_account_info()
                    .clone(),
            },
        ),
        u64::try_from(result.source_amount_swapped).unwrap(),
    )?;

    if result.owner_fee > 0 {
        let mut pool_token_amount = swap_pool
            .swap_curve
            .withdraw_single_token_type_exact_out(
                result.owner_fee,
                swap_token_a_amount,
                swap_token_b_amount,
                u128::try_from(ctx.accounts.lpmint.supply).unwrap(),
                trade_direction,
                &swap_pool.fees,
            )
            .ok_or(TokenSwapError::FeeCalculationFailure)?;

        if pool_token_amount > 0 {
            // Allow error to fall through
            if ctx.accounts.host_fee_receiver.is_some() {
                let host = &ctx.accounts.host_fee_receiver.as_ref().unwrap();
                if *ctx.accounts.lpmint.to_account_info().key != host.mint {
                    return Err(TokenSwapError::IncorrectPoolMint.into());
                }
                let host_fee = swap_pool
                    .fees
                    .host_fee(pool_token_amount)
                    .ok_or(TokenSwapError::FeeCalculationFailure)?;
                if host_fee > 0 {
                    pool_token_amount = pool_token_amount
                        .checked_sub(host_fee)
                        .ok_or(TokenSwapError::FeeCalculationFailure)?;
                    token::mint_to(
                        CpiContext::new(
                            ctx.accounts.token_program.to_account_info().clone(),
                            MintTo {
                                mint: ctx.accounts.lpmint.to_account_info().clone(),
                                to: ctx
                                    .accounts
                                    .host_fee_receiver
                                    .as_ref()
                                    .unwrap()
                                    .to_account_info()
                                    .clone(),
                                authority: ctx.accounts.authority.to_account_info().clone(),
                            },
                        ),
                        u64::try_from(host_fee).unwrap(),
                    )?;
                }
            }
            token::mint_to(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info().clone(),
                    MintTo {
                        mint: ctx.accounts.lpmint.to_account_info().clone(),
                        to: ctx.accounts.fee_receiver.to_account_info().clone(),
                        authority: ctx.accounts.authority.to_account_info().clone(),
                    },
                ),
                u64::try_from(pool_token_amount).unwrap(),
            )?;
        }
    }

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.dest_vault.to_account_info().clone(),
                to: ctx.accounts.dest_token.to_account_info().clone(),
                authority: ctx.accounts.authority.to_account_info().clone(),
            },
        ),
        u64::try_from(result.destination_amount_swapped).unwrap(),
    )?;

    Ok(())
}
