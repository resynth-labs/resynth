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
    pub swap_pool: AccountLoader<'info, SwapPool>,

    #[account(
        seeds = [swap_pool.key().as_ref()],
        bump = swap_pool.load().unwrap().authority_bump[0],
    )]
    /// CHECK:
    pub authority: UncheckedAccount<'info>,

    #[account()]
    /// CHECK:
    pub source: UncheckedAccount<'info>,

    #[account()]
    pub user_transfer_authority: Signer<'info>,

    #[account(mut,
        token::authority = source,
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
        token::mint = swap_pool.load().unwrap().lpmint,
    )]
    pub fee_receiver: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,

    /// Host fee account to receive additional trading fees
    #[account(mut,
        token::mint = swap_pool.load().unwrap().lpmint,
    )]
    pub host_fee_receiver: Option<Box<Account<'info, TokenAccount>>>,
}

//#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub fn execute(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    let swap_pool = ctx.accounts.swap_pool.load()?;

    let trade_direction = if ctx.accounts.source_token.mint == swap_pool.mint_a {
        TradeDirection::AtoB
    } else if ctx.accounts.source_token.mint == swap_pool.mint_b {
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
        .swap_curve()?
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

    // // Re-calculate the source amount swapped based on what the curve says
    // let (source_transfer_amount, source_mint_decimals) = {
    //     let source_amount_swapped = to_u64(result.source_amount_swapped)?;

    //     let source_mint_data = source_token_mint_info.data.borrow();
    //     let source_mint = Self::unpack_mint_with_extensions(
    //         &source_mint_data,
    //         source_token_mint_info.owner,
    //         token_swap.token_program_id(),
    //     )?;
    //     let amount =
    //         if let Ok(transfer_fee_config) = source_mint.get_extension::<TransferFeeConfig>() {
    //             source_amount_swapped.saturating_add(
    //                 transfer_fee_config
    //                     .calculate_inverse_epoch_fee(Clock::get()?.epoch, source_amount_swapped)
    //                     .ok_or(SwapError::FeeCalculationFailure)?,
    //             )
    //         } else {
    //             source_amount_swapped
    //         };
    //     (amount, source_mint.base.decimals)
    // };

    // let (destination_transfer_amount, destination_mint_decimals) = {
    //     let destination_mint_data = destination_token_mint_info.data.borrow();
    //     let destination_mint = Self::unpack_mint_with_extensions(
    //         &destination_mint_data,
    //         source_token_mint_info.owner,
    //         token_swap.token_program_id(),
    //     )?;
    //     let amount_out = to_u64(result.destination_amount_swapped)?;
    //     let amount_received = if let Ok(transfer_fee_config) =
    //         destination_mint.get_extension::<TransferFeeConfig>()
    //     {
    //         amount_out.saturating_sub(
    //             transfer_fee_config
    //                 .calculate_epoch_fee(Clock::get()?.epoch, amount_out)
    //                 .ok_or(SwapError::FeeCalculationFailure)?,
    //         )
    //     } else {
    //         amount_out
    //     };
    //     if amount_received < minimum_amount_out {
    //         return Err(SwapError::ExceededSlippage.into());
    //     }
    //     (amount_out, destination_mint.base.decimals)
    // };

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
                to: ctx.accounts.source_vault.to_account_info().clone(),
                authority: ctx
                    .accounts
                    .user_transfer_authority
                    .to_account_info()
                    .clone(),
            },
        ),
        u64::try_from(result.source_amount_swapped).unwrap(),
    )?;

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    if result.owner_fee > 0 {
        let mut pool_token_amount = swap_pool
            .swap_curve()?
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
                        CpiContext::new_with_signer(
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
                            signer_seeds,
                        ),
                        u64::try_from(host_fee).unwrap(),
                    )?;
                }
            }
            token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info().clone(),
                    MintTo {
                        mint: ctx.accounts.lpmint.to_account_info().clone(),
                        to: ctx.accounts.fee_receiver.to_account_info().clone(),
                        authority: ctx.accounts.authority.to_account_info().clone(),
                    },
                    signer_seeds,
                ),
                u64::try_from(pool_token_amount).unwrap(),
            )?;
        }
    }

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.dest_vault.to_account_info().clone(),
                to: ctx.accounts.dest_token.to_account_info().clone(),
                authority: ctx.accounts.authority.to_account_info().clone(),
            },
            signer_seeds,
        ),
        u64::try_from(result.destination_amount_swapped).unwrap(),
    )?;

    Ok(())
}
