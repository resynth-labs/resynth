use anchor_lang::prelude::*;

/// ConstantProductCurve struct implementing CurveCalculator
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, Debug, Default, PartialEq)]
pub struct ConstantProductCurve {
    pub unused: u8,
}
