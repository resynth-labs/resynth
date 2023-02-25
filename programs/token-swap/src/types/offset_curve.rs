use anchor_lang::prelude::*;

/// Offset curve, uses ConstantProduct under the hood, but adds an offset to
/// one side on swap calculations
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, Debug, Default, PartialEq)]
pub struct OffsetCurve {
  /// Amount to offset the token B liquidity account
  pub token_b_offset: u64,
}
