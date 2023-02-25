use anchor_lang::prelude::*;

/// ConstantPriceCurve struct implementing CurveCalculator
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, Debug, Default, PartialEq)]
pub struct ConstantPriceCurve {
    /// Amount of token A required to get 1 token B
    pub token_b_price: u64,
}
