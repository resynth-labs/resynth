use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::errors::*;
use crate::state::*;
use crate::types::TradeDirection;

#[derive(Accounts)]
pub struct WithdrawSingleTokenTypeExactAmountOut<'info> {
    #[account(
      mut,
      has_one = authority,
      has_one = lpmint,
      has_one = vault_a,
      has_one = vault_b,
      has_one = fee_receiver @ TokenSwapError::InvalidFeeReceiver,
      has_one = token_program @ TokenSwapError::InvalidTokenProgram,
    )]
    pub swap_pool: AccountLoader<'info, SwapPool>,

    /// CHECK:
    pub authority: UncheckedAccount<'info>,

    pub user_transfer_authority: Signer<'info>,

    #[account(mut)]
    pub lpmint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub lptoken: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub token_a: Option<Box<Account<'info, TokenAccount>>>,

    #[account(mut)]
    pub token_b: Option<Box<Account<'info, TokenAccount>>>,

    #[account(mut)]
    pub fee_receiver: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

//#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub fn execute(
    ctx: Context<WithdrawSingleTokenTypeExactAmountOut>,
    destination_token_amount: u64,
    maximum_pool_token_amount: u64,
) -> Result<()> {
    let mut swap_pool = ctx.accounts.swap_pool.load_mut()?;

    let trade_direction = if ctx.accounts.token_a.is_some() {
        TradeDirection::AtoB
    } else if ctx.accounts.token_b.is_some() {
        TradeDirection::BtoA
    } else {
        return Err(error!(TokenSwapError::IncorrectSwapAccount));
    };

    let (user_token_account_a_info, user_token_account_b_info) = match trade_direction {
        TradeDirection::AtoB => (
            Some(ctx.accounts.token_a.as_ref().unwrap().to_account_info()),
            None,
        ),
        TradeDirection::BtoA => (
            None,
            Some(ctx.accounts.token_b.as_ref().unwrap().to_account_info()),
        ),
    };

    swap_pool.check_accounts(
        &ctx.accounts.vault_a.to_account_info(),
        &ctx.accounts.vault_b.to_account_info(),
        &ctx.accounts.lpmint.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        user_token_account_a_info,
        user_token_account_b_info,
        Some(ctx.accounts.fee_receiver.to_account_info()),
    )?;

    let pool_mint_supply = u128::try_from(ctx.accounts.lpmint.supply).unwrap();
    let swap_token_a_amount = u128::try_from(ctx.accounts.vault_a.amount).unwrap();
    let swap_token_b_amount = u128::try_from(ctx.accounts.vault_b.amount).unwrap();

    let burn_pool_token_amount = swap_pool
        .swap_curve()?
        .withdraw_single_token_type_exact_out(
            u128::try_from(destination_token_amount).unwrap(),
            swap_token_a_amount,
            swap_token_b_amount,
            pool_mint_supply,
            trade_direction,
            &swap_pool.fees,
        )
        .ok_or(TokenSwapError::ZeroTradingTokens)?;

    let withdraw_fee: u128 = if ctx.accounts.fee_receiver.key() == ctx.accounts.lptoken.key() {
        // withdrawing from the fee account, don't assess withdraw fee
        0
    } else {
        swap_pool
            .fees
            .owner_withdraw_fee(burn_pool_token_amount)
            .ok_or(TokenSwapError::FeeCalculationFailure)?
    };

    let pool_token_amount = burn_pool_token_amount
        .checked_add(withdraw_fee)
        .ok_or(TokenSwapError::CalculationFailure)?;

    if u64::try_from(pool_token_amount).unwrap() > maximum_pool_token_amount {
        return Err(TokenSwapError::ExceededSlippage.into());
    }
    if pool_token_amount == 0 {
        return Err(TokenSwapError::ZeroTradingTokens.into());
    }

    if withdraw_fee > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info().clone(),
                Transfer {
                    from: ctx.accounts.lptoken.to_account_info().clone(),
                    to: ctx.accounts.fee_receiver.to_account_info().clone(),
                    authority: ctx
                        .accounts
                        .user_transfer_authority
                        .to_account_info()
                        .clone(),
                },
            ),
            u64::try_from(withdraw_fee).unwrap(),
        )?;
    }

    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info().clone(),
            Burn {
                mint: ctx.accounts.lpmint.to_account_info().clone(),
                from: ctx.accounts.lptoken.to_account_info().clone(),
                authority: ctx
                    .accounts
                    .user_transfer_authority
                    .to_account_info()
                    .clone(),
            },
        ),
        u64::try_from(pool_token_amount).unwrap(),
    )?;

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    match trade_direction {
        TradeDirection::AtoB => {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info().clone(),
                    Transfer {
                        from: ctx.accounts.vault_a.to_account_info().clone(),
                        to: ctx
                            .accounts
                            .token_a
                            .as_ref()
                            .unwrap()
                            .to_account_info()
                            .clone(),
                        authority: ctx.accounts.authority.to_account_info().clone(),
                    },
                    signer_seeds,
                ),
                destination_token_amount,
            )?;

            swap_pool.vault_a_balance = token::accessor::amount(ctx.accounts.vault_a.as_ref().as_ref())?;
        }
        TradeDirection::BtoA => {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info().clone(),
                    Transfer {
                        from: ctx.accounts.vault_b.to_account_info().clone(),
                        to: ctx
                            .accounts
                            .token_b
                            .as_ref()
                            .unwrap()
                            .to_account_info()
                            .clone(),
                        authority: ctx.accounts.authority.to_account_info().clone(),
                    },
                    signer_seeds,
                ),
                destination_token_amount,
            )?;
            swap_pool.vault_b_balance = token::accessor::amount(ctx.accounts.vault_b.as_ref().as_ref())?;
        }
    }

    ctx.accounts.lpmint.reload()?;
    swap_pool.lpmint_supply = ctx.accounts.lpmint.supply;

    Ok(())
}
