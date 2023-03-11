use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::{curve::calculator::CurveCalculator, errors::TokenSwapError, types::TradeDirection};

#[derive(Accounts)]
pub struct DepositSingleTokenTypeExactAmountIn<'info> {
    #[account(
        mut,
        has_one = authority,
        has_one = vault_a,
        has_one = vault_b,
        has_one = lpmint,
        has_one = mint_a,
        has_one = mint_b,
        has_one = token_program @ TokenSwapError::InvalidTokenProgram,
    )]
    pub swap_pool: AccountLoader<'info, SwapPool>,

    /// CHECK:
    pub authority: UncheckedAccount<'info>,

    /// CHECK:
    pub owner: UncheckedAccount<'info>,

    pub user_transfer_authority: Signer<'info>,

    #[account(
        mut,
        token::authority = owner,
        token::mint = swap_pool.load().unwrap().mint_a,
    )]
    pub token_a: Option<Box<Account<'info, TokenAccount>>>,

    #[account(
        mut,
        token::authority = owner,
        token::mint = swap_pool.load().unwrap().mint_b,
    )]
    pub token_b: Option<Box<Account<'info, TokenAccount>>>,

    #[account(
        mut,
        token::mint = swap_pool.load().unwrap().mint_a,
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = swap_pool.load().unwrap().mint_b,
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        mint::authority = authority,
    )]
    pub lpmint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        token::mint = swap_pool.load().unwrap().lpmint,
    )]
    pub lptoken: Box<Account<'info, TokenAccount>>,

    pub mint_a: Box<Account<'info, Mint>>,

    pub mint_b: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
}

//#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub fn execute(
    ctx: Context<DepositSingleTokenTypeExactAmountIn>,
    source_token_amount: u64,
    minimum_pool_token_amount: u64,
) -> Result<()> {
    let mut swap_pool = ctx.accounts.swap_pool.load_mut()?;

    let trade_direction = if ctx.accounts.token_a.is_some() {
        TradeDirection::AtoB
    } else if ctx.accounts.token_b.is_some() {
        TradeDirection::BtoA
    } else {
        return Err(error!(TokenSwapError::InvalidTradeDirection));
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
        None,
    )?;

    let pool_mint_supply = u128::try_from(ctx.accounts.lpmint.supply).unwrap();
    let pool_token_amount = if pool_mint_supply > 0 {
        swap_pool
            .swap_curve()?
            .deposit_single_token_type(
                u128::try_from(source_token_amount).unwrap(),
                u128::try_from(ctx.accounts.vault_a.amount).unwrap(),
                u128::try_from(ctx.accounts.vault_b.amount).unwrap(),
                pool_mint_supply,
                trade_direction,
                &swap_pool.fees,
            )
            .ok_or(TokenSwapError::ZeroTradingTokens)?
    } else {
        swap_pool.swap_curve()?.new_pool_supply()
    };

    let pool_token_amount = u64::try_from(pool_token_amount).unwrap();
    if pool_token_amount < minimum_pool_token_amount {
        return Err(TokenSwapError::ExceededSlippage.into());
    }
    if pool_token_amount == 0 {
        return Err(TokenSwapError::ZeroTradingTokens.into());
    }

    match trade_direction {
        TradeDirection::AtoB => {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info().clone(),
                    Transfer {
                        from: ctx
                            .accounts
                            .token_a
                            .as_ref()
                            .unwrap()
                            .to_account_info()
                            .clone(),
                        to: ctx.accounts.vault_a.to_account_info().clone(),
                        authority: ctx
                            .accounts
                            .user_transfer_authority
                            .to_account_info()
                            .clone(),
                    },
                ),
                source_token_amount,
            )?;

            ctx.accounts.vault_a.reload()?;
            swap_pool.vault_a_balance = ctx.accounts.vault_a.amount;
        }
        TradeDirection::BtoA => {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info().clone(),
                    Transfer {
                        from: ctx
                            .accounts
                            .token_b
                            .as_ref()
                            .unwrap()
                            .to_account_info()
                            .clone(),
                        to: ctx.accounts.vault_b.to_account_info().clone(),
                        authority: ctx
                            .accounts
                            .user_transfer_authority
                            .to_account_info()
                            .clone(),
                    },
                ),
                source_token_amount,
            )?;

            ctx.accounts.vault_b.reload()?;
            swap_pool.vault_b_balance = ctx.accounts.vault_b.amount;
        }
    }

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(),
            MintTo {
                mint: ctx.accounts.lpmint.to_account_info().clone(),
                to: ctx.accounts.lptoken.to_account_info().clone(),
                authority: ctx.accounts.authority.to_account_info().clone(),
            },
            signer_seeds,
        ),
        u64::try_from(pool_token_amount).unwrap(),
    )?;

    ctx.accounts.lpmint.reload()?;
    swap_pool.lpmint_supply = ctx.accounts.lpmint.supply;

    Ok(())
}
