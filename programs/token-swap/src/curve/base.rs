//! Base curve implementation

#[cfg(test)]
mod test {
    use crate::{curve::{calculator::test::total_and_intermediate, constant_product::ConstantProductCurve}, types::*};
    use proptest::prelude::*;

    #[test]
    fn constant_product_trade_fee() {
        // calculation on https://github.com/solana-labs/solana-program-library/issues/341
        let swap_source_amount = 1000;
        let swap_destination_amount = 50000;
        let trade_fee_numerator = 1;
        let trade_fee_denominator = 100;
        let owner_trade_fee_numerator = 0;
        let owner_trade_fee_denominator = 0;
        let owner_withdraw_fee_numerator = 0;
        let owner_withdraw_fee_denominator = 0;
        let host_fee_numerator = 0;
        let host_fee_denominator = 0;

        let fees = Fees {
            trade_fee_numerator,
            trade_fee_denominator,
            owner_trade_fee_numerator,
            owner_trade_fee_denominator,
            owner_withdraw_fee_numerator,
            owner_withdraw_fee_denominator,
            host_fee_numerator,
            host_fee_denominator,
        };
        let source_amount = 100;
        let swap_curve = SwapCurve::ConstantProductCurve(ConstantProductCurve::new());
        let result = swap_curve
            .swap(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                TradeDirection::AtoB,
                &fees,
            )
            .unwrap();
        assert_eq!(result.new_swap_source_amount, 1100);
        assert_eq!(result.destination_amount_swapped, 4504);
        assert_eq!(result.new_swap_destination_amount, 45496);
        assert_eq!(result.trade_fee, 1);
        assert_eq!(result.owner_fee, 0);
    }

    #[test]
    fn constant_product_owner_fee() {
        // calculation on https://github.com/solana-labs/solana-program-library/issues/341
        let swap_source_amount = 1000;
        let swap_destination_amount = 50000;
        let trade_fee_numerator = 0;
        let trade_fee_denominator = 0;
        let owner_trade_fee_numerator = 1;
        let owner_trade_fee_denominator = 100;
        let owner_withdraw_fee_numerator = 0;
        let owner_withdraw_fee_denominator = 0;
        let host_fee_numerator = 0;
        let host_fee_denominator = 0;
        let fees = Fees {
            trade_fee_numerator,
            trade_fee_denominator,
            owner_trade_fee_numerator,
            owner_trade_fee_denominator,
            owner_withdraw_fee_numerator,
            owner_withdraw_fee_denominator,
            host_fee_numerator,
            host_fee_denominator,
        };
        let source_amount: u128 = 100;
        let swap_curve = SwapCurve::ConstantProductCurve(ConstantProductCurve::new());
        let result = swap_curve
            .swap(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                TradeDirection::AtoB,
                &fees,
            )
            .unwrap();
        assert_eq!(result.new_swap_source_amount, 1100);
        assert_eq!(result.destination_amount_swapped, 4504);
        assert_eq!(result.new_swap_destination_amount, 45496);
        assert_eq!(result.trade_fee, 0);
        assert_eq!(result.owner_fee, 1);
    }

    #[test]
    fn constant_product_no_fee() {
        let swap_source_amount: u128 = 1_000;
        let swap_destination_amount: u128 = 50_000;
        let source_amount: u128 = 100;
        let fees = Fees::default();
        let swap_curve = SwapCurve::ConstantProductCurve(ConstantProductCurve::new());
        let result = swap_curve
            .swap(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                TradeDirection::AtoB,
                &fees,
            )
            .unwrap();
        assert_eq!(result.new_swap_source_amount, 1100);
        assert_eq!(result.destination_amount_swapped, 4545);
        assert_eq!(result.new_swap_destination_amount, 45455);
    }

    fn one_sided_deposit_vs_swap(
        source_amount: u128,
        swap_source_amount: u128,
        swap_destination_amount: u128,
        pool_supply: u128,
        fees: Fees,
    ) -> (u128, u128) {
      let swap_curve = SwapCurve::ConstantProductCurve(ConstantProductCurve::new());
      // do the A to B swap
        let results = swap_curve
            .swap(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                TradeDirection::AtoB,
                &fees,
            )
            .unwrap();

        // deposit just A, get pool tokens
        let deposit_pool_tokens = swap_curve
            .deposit_single_token_type(
                results.source_amount_swapped,
                swap_source_amount,
                swap_destination_amount,
                pool_supply,
                TradeDirection::AtoB,
                &fees,
            )
            .unwrap();
        let withdraw_pool_tokens = swap_curve
            .withdraw_single_token_type_exact_out(
                results.destination_amount_swapped,
                swap_source_amount + results.source_amount_swapped,
                swap_destination_amount,
                pool_supply + deposit_pool_tokens,
                TradeDirection::BtoA,
                &fees,
            )
            .unwrap();
        (withdraw_pool_tokens, deposit_pool_tokens)
    }

    #[test]
    fn one_sided_equals_swap_with_fee_specific() {
        let pool_supply: u128 = 1_000_000;
        let swap_source_amount: u128 = 1_000_000;
        let swap_destination_amount: u128 = 50_000_000;
        let source_amount: u128 = 10_000;
        let fees = Fees {
            trade_fee_numerator: 25,
            trade_fee_denominator: 1_000,
            owner_trade_fee_numerator: 5,
            owner_trade_fee_denominator: 1_000,
            ..Fees::default()
        };
        let (withdraw_pool_tokens, deposit_pool_tokens) = one_sided_deposit_vs_swap(
            source_amount,
            swap_source_amount,
            swap_destination_amount,
            pool_supply,
            fees,
        );
        // these checks *must* always hold
        assert!(withdraw_pool_tokens >= deposit_pool_tokens);
        let epsilon = 2;
        assert!(withdraw_pool_tokens - deposit_pool_tokens <= epsilon);

        // these checks may change if the calc is updated
        assert_eq!(withdraw_pool_tokens, 4914);
        assert_eq!(deposit_pool_tokens, 4912);
    }

    proptest! {
        #[test]
        fn one_sided_equals_swap_with_fee(
            (swap_source_amount, source_amount) in total_and_intermediate(u64::MAX),
            swap_destination_amount in 1..u64::MAX,
            pool_supply in 1..u64::MAX,
        ) {
            let fees = Fees {
                trade_fee_numerator: 25,
                trade_fee_denominator: 1_000,
                owner_trade_fee_numerator: 5,
                owner_trade_fee_denominator: 1_000,
                ..Fees::default()
            };
            let (withdraw_pool_tokens, deposit_pool_tokens) = one_sided_deposit_vs_swap(
                pool_supply.into(),
                swap_source_amount.into(),
                swap_destination_amount.into(),
                source_amount.into(),
                fees
            );
            // the cost to withdraw B must always be higher than the amount gained through deposit
            assert!(withdraw_pool_tokens >= deposit_pool_tokens);
        }

        #[test]
        fn one_sided_equals_swap_with_withdrawal_fee(
            (swap_source_amount, source_amount) in total_and_intermediate(u64::MAX),
            swap_destination_amount in 1..u64::MAX,
            pool_supply in 1..u64::MAX,
        ) {
            let fees = Fees {
                trade_fee_numerator: 25,
                trade_fee_denominator: 1_000,
                owner_trade_fee_numerator: 5,
                owner_trade_fee_denominator: 1_000,
                owner_withdraw_fee_numerator: 1,
                owner_withdraw_fee_denominator: 1_000,
                ..Fees::default()
            };
            let (withdraw_pool_tokens, deposit_pool_tokens) = one_sided_deposit_vs_swap(
                pool_supply.into(),
                swap_source_amount.into(),
                swap_destination_amount.into(),
                source_amount.into(),
                fees
            );
            // the cost to withdraw B must always be higher than the amount gained through deposit
            assert!(withdraw_pool_tokens >= deposit_pool_tokens);
        }

        #[test]
        fn one_sided_equals_swap_without_fee(
            (swap_source_amount, source_amount) in total_and_intermediate(u64::MAX),
            swap_destination_amount in 1..u64::MAX,
            pool_supply in 1..u64::MAX,
        ) {
            let fees = Fees::default();
            let (withdraw_pool_tokens, deposit_pool_tokens) = one_sided_deposit_vs_swap(
                pool_supply.into(),
                swap_source_amount.into(),
                swap_destination_amount.into(),
                source_amount.into(),
                fees
            );
            let difference = if withdraw_pool_tokens >= deposit_pool_tokens {
                withdraw_pool_tokens - deposit_pool_tokens
            } else {
                deposit_pool_tokens - withdraw_pool_tokens
            };
            // Accurate to one part in 1,000,000 -- without fees, it can go either
            // way due to vast differences in the pool token and trading token
            // amounts.
            // For example, if there's only 1 pool token and 1 destination token,
            // but a source amount of 1,000,000,000, we can lose up to 1,000,000,000
            // in precision during an operation.
            // See the proptests in calculator.rs for more specific versions.
            let epsilon = std::cmp::max(1, withdraw_pool_tokens / 1_000_000);
            assert!(
                difference <= epsilon,
                "difference between {} and {} expected to be less than {}, actually {}",
                withdraw_pool_tokens,
                deposit_pool_tokens,
                epsilon,
                difference
            );
        }
    }
}
