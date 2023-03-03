use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::curve::calculator::CurveCalculator;
use crate::errors::*;
use crate::state::*;
use crate::types::RoundDirection;

#[derive(Accounts)]
pub struct WithdrawAllTokenTypes<'info> {
    #[account(
        seeds = [SWAP_POOL_ACCOUNT_SEED, mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump = swap_pool.load().unwrap().bump,
        constraint = swap_pool.load().unwrap().token_program.key() == token_program.key() @ TokenSwapError::InvalidTokenProgram,
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
    pub owner: UncheckedAccount<'info>,

    #[account()]
    pub user_transfer_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"lpmint", swap_pool.key().as_ref()],
        bump = swap_pool.load().unwrap().lpmint_bump,
        mint::authority = authority,
    )]
    pub lpmint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        token::authority = owner,
        token::mint = swap_pool.load().unwrap().lpmint,
    )]
    pub lptoken: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"vault_a", swap_pool.key().as_ref()],
        bump = swap_pool.load().unwrap().vault_a_bump,
        token::authority = authority,
        token::mint = swap_pool.load().unwrap().mint_a,
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"vault_b", swap_pool.key().as_ref()],
        bump = swap_pool.load().unwrap().vault_b_bump,
        token::authority = authority,
        token::mint = swap_pool.load().unwrap().mint_b,
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::authority = owner,
        token::mint = swap_pool.load().unwrap().mint_a,
    )]
    pub token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::authority = owner,
        token::mint = swap_pool.load().unwrap().mint_b,
    )]
    pub token_b: Box<Account<'info, TokenAccount>>,

    #[account(
        token::mint = swap_pool.load().unwrap().lpmint,
        constraint = swap_pool.load().unwrap().fee_receiver.key() == fee_receiver.key() @ TokenSwapError::InvalidFeeReceiver,
    )]
    pub fee_receiver: Box<Account<'info, TokenAccount>>,

    #[account()]
    pub mint_a: Box<Account<'info, Mint>>,

    #[account()]
    pub mint_b: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
}

//#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub fn execute(
    ctx: Context<WithdrawAllTokenTypes>,
    pool_token_amount: u64,
    minimum_token_a_amount: u64,
    minimum_token_b_amount: u64,
) -> Result<()> {
    let swap_pool = ctx.accounts.swap_pool.load()?;

    swap_pool.check_accounts(
        &ctx.accounts.vault_a.to_account_info(),
        &ctx.accounts.vault_b.to_account_info(),
        &ctx.accounts.lpmint.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_a.to_account_info()),
        Some(ctx.accounts.token_b.to_account_info()),
        Some(ctx.accounts.fee_receiver.to_account_info()),
    )?;

    let withdraw_fee: u128 = if ctx.accounts.fee_receiver.key() == ctx.accounts.lptoken.key() {
        // withdrawing from the fee account, don't assess withdraw fee
        0
    } else {
        swap_pool
            .fees
            .owner_withdraw_fee(u128::try_from(pool_token_amount).unwrap())
            .ok_or(TokenSwapError::FeeCalculationFailure)?
    };

    let pool_token_amount = u128::try_from(pool_token_amount)
        .unwrap()
        .checked_sub(withdraw_fee)
        .ok_or(TokenSwapError::CalculationFailure)?;

    let results = swap_pool
        .swap_curve()?
        .pool_tokens_to_trading_tokens(
            pool_token_amount,
            u128::try_from(ctx.accounts.lpmint.supply).unwrap(),
            u128::try_from(ctx.accounts.vault_a.amount).unwrap(),
            u128::try_from(ctx.accounts.vault_b.amount).unwrap(),
            RoundDirection::Floor,
        )
        .ok_or(TokenSwapError::ZeroTradingTokens)?;

    let token_a_amount = u64::try_from(results.token_a_amount).unwrap();
    let token_a_amount = std::cmp::min(ctx.accounts.vault_a.amount, token_a_amount);
    if token_a_amount < minimum_token_a_amount {
        return Err(TokenSwapError::ExceededSlippage.into());
    }
    if token_a_amount == 0 && ctx.accounts.vault_a.amount != 0 {
        return Err(TokenSwapError::ZeroTradingTokens.into());
    }

    let token_b_amount = u64::try_from(results.token_b_amount).unwrap();
    let token_b_amount = std::cmp::min(ctx.accounts.vault_b.amount, token_b_amount);
    if token_b_amount < minimum_token_b_amount {
        return Err(TokenSwapError::ExceededSlippage.into());
    }
    if token_b_amount == 0 && ctx.accounts.vault_b.amount != 0 {
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

    if token_a_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info().clone(),
                Transfer {
                    from: ctx.accounts.vault_a.to_account_info().clone(),
                    to: ctx.accounts.token_a.to_account_info().clone(),
                    authority: ctx.accounts.authority.to_account_info().clone(),
                },
                signer_seeds,
            ),
            token_a_amount,
        )?;
    }
    if token_b_amount > 0 {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info().clone(),
                Transfer {
                    from: ctx.accounts.vault_b.to_account_info().clone(),
                    to: ctx.accounts.token_b.to_account_info().clone(),
                    authority: ctx.accounts.authority.to_account_info().clone(),
                },
                signer_seeds,
            ),
            token_b_amount,
        )?;
    }

    Ok(())
}
