use anchor_lang::prelude::*;
use anchor_spl::associated_token::{AssociatedToken, Create};
use anchor_spl::token::{self, transfer, MintTo, Transfer};
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::curve::calculator::CurveCalculator;
use crate::errors::*;
use crate::state::*;
use crate::types::*;

mod usdc {
    use anchor_lang::prelude::*;

    declare_id!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
}

mod fee_receiver_wallet {
    use anchor_lang::prelude::*;

    declare_id!("HjnXUGGMgtN9WaPAJxzdwnWip6f76xGp4rUMRoVicsLr");
}

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
        mint::decimals = DEFAULT_LPMINT_DECIMALS,
    )]
    pub lpmint: Box<Account<'info, Mint>>,

    /// Pool Token Account to deposit trading and withdraw fees.
    /// Must be empty, not owned by swap authority
    #[account(
      init_if_needed,
      payer = payer,
      associated_token::mint = lpmint,
      associated_token::authority = fee_receiver_wallet,
    )]
    pub fee_receiver: Box<Account<'info, TokenAccount>>,

    /// CHECK:
    #[account(address = fee_receiver_wallet::ID)]
    pub fee_receiver_wallet: AccountInfo<'info>,

    pub mint_a: Box<Account<'info, Mint>>,

    pub mint_b: Box<Account<'info, Mint>>,

    /// CHECK:
    pub owner: UncheckedAccount<'info>,

    pub user_transfer_authority: Signer<'info>,

    #[account(
      mut,
      token::authority = owner,
      token::mint = mint_a,
    )]
    pub source_a: Box<Account<'info, TokenAccount>>,

    #[account(
      mut,
      token::authority = owner,
      token::mint = mint_b,
    )]
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
                authority: self.user_transfer_authority.to_account_info(),
            },
        )
    }
    pub fn transfer_source_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.source_b.to_account_info(),
                to: self.vault_b.to_account_info(),
                authority: self.user_transfer_authority.to_account_info(),
            },
        )
    }

    pub fn create_lptoken_context(&self) -> CpiContext<'_, '_, '_, 'info, Create<'info>> {
        CpiContext::new(
            self.associated_token_program.to_account_info(),
            Create {
                payer: self.payer.to_account_info(),
                associated_token: self.lptoken.to_account_info(),
                authority: self.owner.to_account_info(),
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
    // fees: Fees,
    // swap_curve_type: SwapCurveType,
    // token_b_price_or_offset: u64,
    initial_token_a_amount: u64,
    initial_token_b_amount: u64,
) -> Result<()> {
    if *ctx.accounts.authority.key != ctx.accounts.lpmint.mint_authority.unwrap() {
        return Err(TokenSwapError::InvalidOwner.into());
    }
    if ctx.accounts.mint_a.key() == ctx.accounts.mint_b.key() {
        return Err(error!(TokenSwapError::RepeatedMint));
    }
    // USDC is always mint B. If USDC is not present, mints are in sorted order
    if ctx.accounts.mint_a.key() == usdc::ID {
        return Err(TokenSwapError::IncorrectMintOrder.into());
    }
    if ctx.accounts.mint_b.key() != usdc::ID
        && ctx.accounts.mint_a.key().as_ref() >= ctx.accounts.mint_b.key().as_ref()
    {
        return Err(TokenSwapError::IncorrectMintOrder.into());
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

    let fees = Fees {
        trade_fee_numerator: 25,
        trade_fee_denominator: 10_000,
        owner_trade_fee_numerator: 5,
        owner_trade_fee_denominator: 10_000,
        owner_withdraw_fee_numerator: 0,
        owner_withdraw_fee_denominator: 0,
        host_fee_numerator: 20,
        host_fee_denominator: 100,
    };
    let swap_curve_type = SwapCurveType::ConstantProductCurve;
    let token_b_price_or_offset: u64 = 0;

    let swap_curve = swap_curve_type.try_into_swap_curve(token_b_price_or_offset)?;

    swap_curve.validate_supply(ctx.accounts.source_a.amount, ctx.accounts.source_b.amount)?;
    fees.validate()?;
    swap_curve.validate()?;

    let initial_lpmint_supply = u64::try_from(swap_curve.new_pool_supply()).unwrap();

    let mut swap_pool = ctx.accounts.swap_pool.load_init()?;
    *swap_pool = SwapPool {
        version: 2,
        authority_bump: [ctx.bumps["authority"]],
        mint_a_decimals: ctx.accounts.mint_a.decimals,
        mint_b_decimals: ctx.accounts.mint_b.decimals,
        lpmint_decimals: ctx.accounts.lpmint.decimals,
        swap_curve_type,
        padding: [0; 2],
        swap_pool: ctx.accounts.swap_pool.key(),
        authority: ctx.accounts.authority.key(),
        mint_a: ctx.accounts.mint_a.key(),
        mint_b: ctx.accounts.mint_b.key(),
        lpmint: ctx.accounts.lpmint.key(),
        vault_a: ctx.accounts.vault_a.key(),
        vault_b: ctx.accounts.vault_b.key(),
        fee_receiver: ctx.accounts.fee_receiver.key(),
        token_program: *ctx.accounts.token_program.key,
        fees,
        token_b_price_or_offset,
        vault_a_balance: 0,
        vault_b_balance: 0,
        lpmint_supply: initial_lpmint_supply,
    };

    let signer_seeds: &[&[&[u8]]] = &[&swap_pool.signer_seeds()];

    // This is a departure from the non-anchor spl-token-swap.
    // Because vaults aren't preinitialized with a balance,
    // they must be seeded before validating a supply.
    transfer(
        ctx.accounts.transfer_source_a_context(),
        initial_token_a_amount,
    )?;
    transfer(
        ctx.accounts.transfer_source_b_context(),
        initial_token_b_amount,
    )?;

    anchor_spl::associated_token::create_idempotent(ctx.accounts.create_lptoken_context())?;
    token::mint_to(
        ctx.accounts
            .mint_to_lptoken_context()
            .with_signer(signer_seeds),
        initial_lpmint_supply,
    )?;

    ctx.accounts.vault_a.reload()?;
    swap_pool.vault_a_balance = ctx.accounts.vault_a.amount;
    ctx.accounts.vault_b.reload()?;
    swap_pool.vault_b_balance = ctx.accounts.vault_b.amount;
    ctx.accounts.lpmint.reload()?;
    swap_pool.lpmint_supply = ctx.accounts.lpmint.supply;

    msg!(
        "ctx.accounts.vault_a.amount: {}",
        ctx.accounts.vault_a.amount
    );
    msg!("vault_a_balance: {}", swap_pool.vault_a_balance);
    msg!(
        "ctx.accounts.vault_b.amount: {}",
        ctx.accounts.vault_b.amount
    );
    msg!("vault_b_balance: {}", swap_pool.vault_b_balance);

    Ok(())
}
