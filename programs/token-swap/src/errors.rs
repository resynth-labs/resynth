use anchor_lang::prelude::*;

#[error_code]
#[derive(PartialEq, Eq)]
pub enum TokenSwapError {
    #[msg("Swap pool is already initialized")]
    AlreadyInitialized = 0,

    #[msg("General calculation failure due to overflow or underflow")]
    CalculationFailure, // 1

    #[msg("Input token account empty")]
    EmptySupply, // 2

    #[msg("Swap instruction exceeds desired slippage limit")]
    ExceededSlippage, // 3

    #[msg("Fee calculation failed due to overflow, underflow, or unexpected 0")]
    FeeCalculationFailure, // 4

    #[msg("Address of the provided pool token mint is incorrect")]
    IncorrectPoolMint, // 5

    #[msg("Address of the provided swap token account is incorrect")]
    IncorrectSwapAccount, // 6

    #[msg("Invalid authority provided")]
    InvalidAuthority, // 7

    #[msg("Token account has a close authority")]
    InvalidCloseAuthority, // 8

    #[msg("The provided curve parameters are invalid")]
    InvalidCurve, // 9

    #[msg("Token account has a delegate")]
    InvalidDelegate, // 10

    #[msg("The provided fee does not match the program owner's constraints")]
    InvalidFee, // 11

    #[msg("The pool fee receiver is invalid")]
    InvalidFeeReceiver, // 12

    #[msg("Pool token mint has a freeze authority")]
    InvalidFreezeAuthority, // 13

    #[msg("InvalidInput")]
    InvalidInput, // 14

    #[msg("Input account owner is not the program address")]
    InvalidOwner, // 15

    #[msg("Pool token mint has a non-zero supply")]
    InvalidSupply, // 16

    #[msg("Invalid token program")]
    InvalidTokenProgram, // 17

    #[msg("Invalid trade direction")]
    InvalidTradeDirection, // 18

    #[msg("Swap account in not initialized")]
    NotInitialized, // 19

    #[msg("Swap input token accounts have the same mint")]
    RepeatedMint, // 20

    #[msg("The operation cannot be performed on the given curve")]
    UnsupportedCurveOperation, // 21

    #[msg("Given pool token amount results in zero trading tokens")]
    ZeroTradingTokens, // 22

    #[msg(
        "Mint B and A must switch places, because A must have lower lexicographical order than B (A < B)"
    )]
    IncorrectMintOrder, // 23
}
