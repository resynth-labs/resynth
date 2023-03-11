use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::curve::calculator::CurveCalculator;
use crate::errors::*;
use crate::state::*;
use crate::types::*;

#[derive(Accounts)]
pub struct DepositAllTokenTypes<'info> {
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
    pub token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::authority = owner,
        token::mint = swap_pool.load().unwrap().mint_b,
    )]
    pub token_b: Box<Account<'info, TokenAccount>>,

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
    ctx: Context<DepositAllTokenTypes>,
    pool_token_amount: u64,
    maximum_token_a_amount: u64,
    maximum_token_b_amount: u64,
) -> Result<()> {
    let mut swap_pool = ctx.accounts.swap_pool.load_mut()?;

    // let curve = build_curve(&pool.curve).unwrap();
    // let calculator = curve.calculator;
    let calculator = swap_pool.swap_curve()?;
    if !calculator.allows_deposits() {
        return Err(TokenSwapError::UnsupportedCurveOperation.into());
    }

    swap_pool.check_accounts(
        &ctx.accounts.vault_a.to_account_info(),
        &ctx.accounts.vault_b.to_account_info(),
        &ctx.accounts.lpmint.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        Some(ctx.accounts.token_a.to_account_info()),
        Some(ctx.accounts.token_b.to_account_info()),
        None,
    )?;

    let current_pool_mint_supply = u128::try_from(ctx.accounts.lpmint.supply).unwrap();
    let (pool_token_amount, pool_mint_supply) = if current_pool_mint_supply > 0 {
        (
            u128::try_from(pool_token_amount).unwrap(),
            current_pool_mint_supply,
        )
    } else {
        (calculator.new_pool_supply(), calculator.new_pool_supply())
    };

    let results = calculator
        .pool_tokens_to_trading_tokens(
            pool_token_amount,
            pool_mint_supply,
            u128::try_from(ctx.accounts.vault_a.amount).unwrap(),
            u128::try_from(ctx.accounts.vault_b.amount).unwrap(),
            RoundDirection::Ceiling,
        )
        .ok_or(TokenSwapError::ZeroTradingTokens)?;

    let token_a_amount = u64::try_from(results.token_a_amount).unwrap();
    if token_a_amount > maximum_token_a_amount {
        return Err(error!(TokenSwapError::ExceededSlippage));
    }
    if token_a_amount == 0 {
        return Err(error!(TokenSwapError::ZeroTradingTokens));
    }

    let token_b_amount = u64::try_from(results.token_b_amount).unwrap();
    if token_b_amount > maximum_token_b_amount {
        return Err(error!(TokenSwapError::ExceededSlippage));
    }
    if token_b_amount == 0 {
        return Err(error!(TokenSwapError::ZeroTradingTokens));
    }

    let pool_token_amount = u64::try_from(pool_token_amount).unwrap();

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.token_a.to_account_info().clone(),
                to: ctx.accounts.vault_a.to_account_info().clone(),
                authority: ctx
                    .accounts
                    .user_transfer_authority
                    .to_account_info()
                    .clone(),
            },
        ),
        token_a_amount,
    )?;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.token_b.to_account_info().clone(),
                to: ctx.accounts.vault_b.to_account_info().clone(),
                authority: ctx
                    .accounts
                    .user_transfer_authority
                    .to_account_info()
                    .clone(),
            },
        ),
        token_b_amount,
    )?;

    ctx.accounts.vault_a.reload()?;
    swap_pool.vault_a_balance = ctx.accounts.vault_a.amount;
    ctx.accounts.vault_b.reload()?;
    swap_pool.vault_b_balance = ctx.accounts.vault_b.amount;

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(),
            MintTo {
                mint: ctx.accounts.lpmint.to_account_info().clone(),
                to: ctx.accounts.lptoken.to_account_info().clone(),
                authority: ctx.accounts.authority.to_account_info().clone(),
            },
            &signer_seeds,
        ),
        u64::try_from(pool_token_amount).unwrap(),
    )?;

    Ok(())
}
