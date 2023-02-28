use anchor_lang::prelude::*;
use anchor_spl::associated_token::{AssociatedToken, Create};
use anchor_spl::token::{self, transfer, MintTo, Transfer};
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::curve::calculator::CurveCalculator;
use crate::errors::*;
use crate::state::*;
use crate::types::*;

#[derive(Accounts)]
pub struct InitializeSwapPool<'info> {
    /// New Token-swap to create.
    #[account(init,
        payer = payer,
        space = 8 + std::mem::size_of::<SwapPool>(),
        seeds = [
            SWAP_POOL_ACCOUNT_SEED,
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump
    )]
    pub swap_pool: AccountLoader<'info, SwapPool>,

    #[account(seeds = [swap_pool.key().as_ref()], bump)]
    /// CHECK:
    pub authority: AccountInfo<'info>,

    #[account(init,
        payer = payer,
        seeds = [
            b"vault_a",
            swap_pool.key().as_ref()
        ],
        bump,
        token::authority = authority,
        token::mint = mint_a
    )]
    pub vault_a: Box<Account<'info, TokenAccount>>,

    #[account(init,
        payer = payer,
        seeds = [
            b"vault_b",
            swap_pool.key().as_ref()
        ],
        bump,
        token::authority = authority,
        token::mint = mint_b
    )]
    pub vault_b: Box<Account<'info, TokenAccount>>,

    /// Pool Token Mint. Must be empty, owned by swap authority.
    #[account(init,
        payer = payer,
        seeds = [
            b"lpmint",
            swap_pool.key().as_ref()
        ],
        bump,
        mint::authority = authority,
        mint::decimals = 0
    )]
    pub lpmint: Box<Account<'info, Mint>>,

    /// Pool Token Account to deposit trading and withdraw fees.
    /// Must be empty, not owned by swap authority
    /// FIXME! Freeze expoit: Nothing is stopping the fee receiver from closing the account, freezing the pool funds
    #[account(init,
        seeds = [
            b"fee_receiver",
            swap_pool.key().as_ref(),
        ],
        bump,
        payer = payer,
        token::authority = fee_receiver_wallet,
        token::mint = lpmint,
    )]
    pub fee_receiver: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    pub fee_receiver_wallet: AccountInfo<'info>,

    pub mint_a: Box<Account<'info, Mint>>,

    pub mint_b: Box<Account<'info, Mint>>,

    pub source: Signer<'info>,

    #[account(mut)]
    pub source_a: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub source_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: This associated token account will be created during execution
    #[account(mut)]
    pub lptoken: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> InitializeSwapPool<'info> {
    pub fn transfer_source_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.source_a.to_account_info(),
                to: self.vault_a.to_account_info(),
                authority: self.source.to_account_info(),
            },
        )
    }
    pub fn transfer_source_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.source_b.to_account_info(),
                to: self.vault_b.to_account_info(),
                authority: self.source.to_account_info(),
            },
        )
    }

    pub fn create_lptoken_context(&self) -> CpiContext<'_, '_, '_, 'info, Create<'info>> {
        CpiContext::new(
            self.associated_token_program.to_account_info(),
            Create {
                payer: self.payer.to_account_info(),
                associated_token: self.lptoken.to_account_info(),
                authority: self.source.to_account_info(),
                mint: self.lpmint.to_account_info(),
                system_program: self.system_program.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
        )
    }

    pub fn mint_to_lptoken_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.associated_token_program.to_account_info(),
            MintTo {
                mint: self.lpmint.to_account_info(),
                to: self.lptoken.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}

pub fn execute(
    ctx: Context<InitializeSwapPool>,
    fees: Fees,
    swap_curve_type: SwapCurveType,
    token_b_price_or_offset: u64,
) -> Result<()> {
    if *ctx.accounts.authority.key != ctx.accounts.lpmint.mint_authority.unwrap() {
        return Err(TokenSwapError::InvalidOwner.into());
    }
    if ctx.accounts.vault_a.mint == ctx.accounts.vault_b.mint {
        return Err(error!(TokenSwapError::RepeatedMint));
    }
    if ctx.accounts.vault_a.delegate.is_some() {
        return Err(TokenSwapError::InvalidDelegate.into());
    }
    if ctx.accounts.vault_b.delegate.is_some() {
        return Err(TokenSwapError::InvalidDelegate.into());
    }
    if ctx.accounts.vault_a.close_authority.is_some() {
        return Err(TokenSwapError::InvalidCloseAuthority.into());
    }
    if ctx.accounts.vault_b.close_authority.is_some() {
        return Err(TokenSwapError::InvalidCloseAuthority.into());
    }
    if ctx.accounts.lpmint.supply != 0 {
        return Err(TokenSwapError::InvalidSupply.into());
    }
    if ctx.accounts.lpmint.freeze_authority.is_some() {
        return Err(TokenSwapError::InvalidFreezeAuthority.into());
    }

    let swap_curve = swap_curve_type.try_into_swap_curve(token_b_price_or_offset)?;

    swap_curve.validate_supply(ctx.accounts.source_a.amount, ctx.accounts.source_b.amount)?;
    fees.validate()?;
    swap_curve.validate()?;

    let initial_lp_amount = u64::try_from(swap_curve.new_pool_supply()).unwrap();

    let mut swap_pool = ctx.accounts.swap_pool.load_init()?;
    *swap_pool = SwapPool {
        version: 1,
        bump: ctx.bumps["swap_pool"],
        authority_bump: [ctx.bumps["authority"]],
        vault_a_bump: ctx.bumps["vault_a"],
        vault_b_bump: ctx.bumps["vault_b"],
        lpmint_bump: ctx.bumps["lpmint"],
        swap_pool: ctx.accounts.swap_pool.key(),
        authority: ctx.accounts.authority.key(),
        token_program: *ctx.accounts.token_program.key,
        vault_a: ctx.accounts.vault_a.key(),
        vault_b: ctx.accounts.vault_b.key(),
        lpmint: ctx.accounts.lpmint.key(),
        mint_a: ctx.accounts.mint_a.key(),
        mint_b: ctx.accounts.mint_b.key(),
        fee_receiver: ctx.accounts.fee_receiver.key(),
        fees,
        swap_curve_type,
        token_b_price_or_offset,
    };

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    // This is a departure from the non-anchor spl-token-swap.
    // Because vaults aren't preinitialized with a balance,
    // they must be seeded before validating a supply.
    transfer(
        ctx.accounts.transfer_source_a_context(),
        ctx.accounts.source_a.amount,
    )?;
    transfer(
        ctx.accounts.transfer_source_b_context(),
        ctx.accounts.source_b.amount,
    )?;
    anchor_spl::associated_token::create_idempotent(ctx.accounts.create_lptoken_context())?;
    token::mint_to(
        ctx.accounts
            .mint_to_lptoken_context()
            .with_signer(signer_seeds),
        initial_lp_amount,
    )?;

    Ok(())
}
