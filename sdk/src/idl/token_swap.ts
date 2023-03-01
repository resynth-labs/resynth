export type TokenSwap = {
  "version": "0.1.0",
  "name": "token_swap",
  "constants": [
    {
      "name": "SWAP_POOL_ACCOUNT_SEED",
      "type": "bytes",
      "value": "[115, 119, 97, 112, 95, 112, 111, 111, 108]"
    }
  ],
  "instructions": [
    {
      "name": "depositAllTokenTypes",
      "docs": [
        "Deposit both types of tokens into the pool.  The output is a \"pool\"",
        "token representing ownership in the pool. Inputs are converted to",
        "the current ratio."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "maximumTokenAAmount",
          "type": "u64"
        },
        {
          "name": "maximumTokenBAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositSingleTokenTypeExactAmountIn",
      "docs": [
        "Deposit one type of tokens into the pool.  The output is a \"pool\" token",
        "representing ownership into the pool. Input token is converted as if",
        "a swap and deposit all token types were performed."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sourceTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumPoolTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeSwapPool",
      "docs": [
        "Initializes a new swap"
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "New Token-swap to create."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Pool Token Mint. Must be empty, owned by swap authority."
          ]
        },
        {
          "name": "feeReceiver",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Pool Token Account to deposit trading and withdraw fees.",
            "Must be empty, not owned by swap authority",
            "FIXME! Freeze expoit: Nothing is stopping the fee receiver from closing the account, freezing the pool funds"
          ]
        },
        {
          "name": "feeReceiverWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "sourceA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "fees",
          "type": {
            "defined": "Fees"
          }
        },
        {
          "name": "swapCurveType",
          "type": {
            "defined": "SwapCurveType"
          }
        },
        {
          "name": "tokenBPriceOrOffset",
          "type": "u64"
        },
        {
          "name": "initialTokenAAmount",
          "type": "u64"
        },
        {
          "name": "initialTokenBAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "docs": [
        "Swap the tokens in the pool."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "sourceToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "hostFeeReceiver",
          "isMut": true,
          "isSigner": false,
          "isOptional": true,
          "docs": [
            "Host fee account to receive additional trading fees"
          ]
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawAllTokenTypes",
      "docs": [
        "Withdraw both types of tokens from the pool at the current ratio, given",
        "pool tokens.  The pool tokens are burned in exchange for an equivalent",
        "amount of token A and B."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeReceiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumTokenAAmount",
          "type": "u64"
        },
        {
          "name": "minimumTokenBAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSingleTokenTypeExactAmountOut",
      "docs": [
        "Withdraw one token type from the pool at the current ratio given the",
        "exact amount out expected."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "feeReceiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "destinationTokenAmount",
          "type": "u64"
        },
        {
          "name": "maximumPoolTokenAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "swapPool",
      "docs": [
        "A token swap pool."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorityBump",
            "docs": [
              "Bump seed used in program address.",
              "The program address is created deterministically with the bump seed,",
              "swap program id, and swap account pubkey.  This program address has",
              "authority over the swap's token A account, token B account, and pool",
              "token mint."
            ],
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "vaultABump",
            "type": "u8"
          },
          {
            "name": "vaultBBump",
            "type": "u8"
          },
          {
            "name": "lpmintBump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "swapPool",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mintA",
            "docs": [
              "Mint information for token A"
            ],
            "type": "publicKey"
          },
          {
            "name": "mintB",
            "docs": [
              "Mint information for token B"
            ],
            "type": "publicKey"
          },
          {
            "name": "lpmint",
            "docs": [
              "Pool tokens are issued when A or B tokens are deposited.",
              "Pool tokens can be withdrawn back to the original A or B token."
            ],
            "type": "publicKey"
          },
          {
            "name": "vaultA",
            "docs": [
              "Token A"
            ],
            "type": "publicKey"
          },
          {
            "name": "vaultB",
            "docs": [
              "Token B"
            ],
            "type": "publicKey"
          },
          {
            "name": "feeReceiver",
            "docs": [
              "Pool token account to receive trading and / or withdrawal fees"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenProgram",
            "docs": [
              "Program ID of the tokens being exchanged."
            ],
            "type": "publicKey"
          },
          {
            "name": "fees",
            "docs": [
              "All fee information"
            ],
            "type": {
              "defined": "Fees"
            }
          },
          {
            "name": "swapCurveType",
            "docs": [
              "Swap curve parameters, to be unpacked and used by the SwapCurve, which",
              "calculates swaps, deposits, and withdrawals"
            ],
            "type": {
              "defined": "SwapCurveType"
            }
          },
          {
            "name": "tokenBPriceOrOffset",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ConstantPriceCurve",
      "docs": [
        "ConstantPriceCurve struct implementing CurveCalculator"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBPrice",
            "docs": [
              "Amount of token A required to get 1 token B"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ConstantProductCurve",
      "docs": [
        "ConstantProductCurve struct implementing CurveCalculator"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "unused",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "OffsetCurve",
      "docs": [
        "Offset curve, uses ConstantProduct under the hood, but adds an offset to",
        "one side on swap calculations"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBOffset",
            "docs": [
              "Amount to offset the token B liquidity account"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Fees",
      "docs": [
        "Encapsulates all fee information and calculations for swap operations"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tradeFeeNumerator",
            "docs": [
              "Trade fees are extra token amounts that are held inside the token",
              "accounts during a trade, making the value of liquidity tokens rise.",
              "Trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "tradeFeeDenominator",
            "docs": [
              "Trade fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerTradeFeeNumerator",
            "docs": [
              "Owner trading fees are extra token amounts that are held inside the token",
              "accounts during a trade, with the equivalent in pool tokens minted to",
              "the owner of the program.",
              "Owner trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerTradeFeeDenominator",
            "docs": [
              "Owner trade fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerWithdrawFeeNumerator",
            "docs": [
              "Owner withdraw fees are extra liquidity pool token amounts that are",
              "sent to the owner on every withdrawal.",
              "Owner withdraw fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerWithdrawFeeDenominator",
            "docs": [
              "Owner withdraw fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "hostFeeNumerator",
            "docs": [
              "Host fees are a proportion of the owner trading fees, sent to an",
              "extra account provided during the trade.",
              "Host trading fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "hostFeeDenominator",
            "docs": [
              "Host trading fee denominator"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "RoundDirection",
      "docs": [
        "The direction to round.  Used for pool token to trading token conversions to",
        "avoid losing value on any deposit or withdrawal."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Floor"
          },
          {
            "name": "Ceiling"
          }
        ]
      }
    },
    {
      "name": "SwapCurveType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ConstantProductCurve"
          },
          {
            "name": "ConstantPriceCurve"
          },
          {
            "name": "OffsetCurve"
          }
        ]
      }
    },
    {
      "name": "SwapCurve",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ConstantProductCurve"
          },
          {
            "name": "ConstantPriceCurve"
          },
          {
            "name": "OffsetCurve"
          }
        ]
      }
    },
    {
      "name": "TradeDirection",
      "docs": [
        "The direction of a trade, since curves can be specialized to treat each",
        "token differently (by adding offsets or weights)"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AtoB"
          },
          {
            "name": "BtoA"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "AlreadyInitialized",
      "msg": "Swap pool is already initialized"
    },
    {
      "code": 6001,
      "name": "CalculationFailure",
      "msg": "General calculation failure due to overflow or underflow"
    },
    {
      "code": 6002,
      "name": "EmptySupply",
      "msg": "Input token account empty"
    },
    {
      "code": 6003,
      "name": "ExceededSlippage",
      "msg": "Swap instruction exceeds desired slippage limit"
    },
    {
      "code": 6004,
      "name": "FeeCalculationFailure",
      "msg": "Fee calculation failed due to overflow, underflow, or unexpected 0"
    },
    {
      "code": 6005,
      "name": "IncorrectPoolMint",
      "msg": "Address of the provided pool token mint is incorrect"
    },
    {
      "code": 6006,
      "name": "IncorrectSwapAccount",
      "msg": "Address of the provided swap token account is incorrect"
    },
    {
      "code": 6007,
      "name": "InvalidAuthority",
      "msg": "Invalid authority provided"
    },
    {
      "code": 6008,
      "name": "InvalidCloseAuthority",
      "msg": "Token account has a close authority"
    },
    {
      "code": 6009,
      "name": "InvalidCurve",
      "msg": "The provided curve parameters are invalid"
    },
    {
      "code": 6010,
      "name": "InvalidDelegate",
      "msg": "Token account has a delegate"
    },
    {
      "code": 6011,
      "name": "InvalidFee",
      "msg": "The provided fee does not match the program owner's constraints"
    },
    {
      "code": 6012,
      "name": "InvalidFeeReceiver",
      "msg": "The pool fee receiver is invalid"
    },
    {
      "code": 6013,
      "name": "InvalidFreezeAuthority",
      "msg": "Pool token mint has a freeze authority"
    },
    {
      "code": 6014,
      "name": "InvalidInput",
      "msg": "InvalidInput"
    },
    {
      "code": 6015,
      "name": "InvalidOwner",
      "msg": "Input account owner is not the program address"
    },
    {
      "code": 6016,
      "name": "InvalidSupply",
      "msg": "Pool token mint has a non-zero supply"
    },
    {
      "code": 6017,
      "name": "InvalidTokenProgram",
      "msg": "Invalid token program"
    },
    {
      "code": 6018,
      "name": "InvalidTradeDirection",
      "msg": "Invalid trade direction"
    },
    {
      "code": 6019,
      "name": "NotInitialized",
      "msg": "Swap account in not initialized"
    },
    {
      "code": 6020,
      "name": "RepeatedMint",
      "msg": "Swap input token accounts have the same mint"
    },
    {
      "code": 6021,
      "name": "UnsupportedCurveOperation",
      "msg": "The operation cannot be performed on the given curve"
    },
    {
      "code": 6022,
      "name": "ZeroTradingTokens",
      "msg": "Given pool token amount results in zero trading tokens"
    }
  ]
};

export const IDL: TokenSwap = {
  "version": "0.1.0",
  "name": "token_swap",
  "constants": [
    {
      "name": "SWAP_POOL_ACCOUNT_SEED",
      "type": "bytes",
      "value": "[115, 119, 97, 112, 95, 112, 111, 111, 108]"
    }
  ],
  "instructions": [
    {
      "name": "depositAllTokenTypes",
      "docs": [
        "Deposit both types of tokens into the pool.  The output is a \"pool\"",
        "token representing ownership in the pool. Inputs are converted to",
        "the current ratio."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "maximumTokenAAmount",
          "type": "u64"
        },
        {
          "name": "maximumTokenBAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositSingleTokenTypeExactAmountIn",
      "docs": [
        "Deposit one type of tokens into the pool.  The output is a \"pool\" token",
        "representing ownership into the pool. Input token is converted as if",
        "a swap and deposit all token types were performed."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sourceTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumPoolTokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeSwapPool",
      "docs": [
        "Initializes a new swap"
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "New Token-swap to create."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Pool Token Mint. Must be empty, owned by swap authority."
          ]
        },
        {
          "name": "feeReceiver",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Pool Token Account to deposit trading and withdraw fees.",
            "Must be empty, not owned by swap authority",
            "FIXME! Freeze expoit: Nothing is stopping the fee receiver from closing the account, freezing the pool funds"
          ]
        },
        {
          "name": "feeReceiverWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "sourceA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "fees",
          "type": {
            "defined": "Fees"
          }
        },
        {
          "name": "swapCurveType",
          "type": {
            "defined": "SwapCurveType"
          }
        },
        {
          "name": "tokenBPriceOrOffset",
          "type": "u64"
        },
        {
          "name": "initialTokenAAmount",
          "type": "u64"
        },
        {
          "name": "initialTokenBAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "docs": [
        "Swap the tokens in the pool."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "sourceToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "hostFeeReceiver",
          "isMut": true,
          "isSigner": false,
          "isOptional": true,
          "docs": [
            "Host fee account to receive additional trading fees"
          ]
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawAllTokenTypes",
      "docs": [
        "Withdraw both types of tokens from the pool at the current ratio, given",
        "pool tokens.  The pool tokens are burned in exchange for an equivalent",
        "amount of token A and B."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeReceiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolTokenAmount",
          "type": "u64"
        },
        {
          "name": "minimumTokenAAmount",
          "type": "u64"
        },
        {
          "name": "minimumTokenBAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSingleTokenTypeExactAmountOut",
      "docs": [
        "Withdraw one token type from the pool at the current ratio given the",
        "exact amount out expected."
      ],
      "accounts": [
        {
          "name": "swapPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTransferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "lpmint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lptoken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenA",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "feeReceiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "destinationTokenAmount",
          "type": "u64"
        },
        {
          "name": "maximumPoolTokenAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "swapPool",
      "docs": [
        "A token swap pool."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorityBump",
            "docs": [
              "Bump seed used in program address.",
              "The program address is created deterministically with the bump seed,",
              "swap program id, and swap account pubkey.  This program address has",
              "authority over the swap's token A account, token B account, and pool",
              "token mint."
            ],
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          },
          {
            "name": "vaultABump",
            "type": "u8"
          },
          {
            "name": "vaultBBump",
            "type": "u8"
          },
          {
            "name": "lpmintBump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "swapPool",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mintA",
            "docs": [
              "Mint information for token A"
            ],
            "type": "publicKey"
          },
          {
            "name": "mintB",
            "docs": [
              "Mint information for token B"
            ],
            "type": "publicKey"
          },
          {
            "name": "lpmint",
            "docs": [
              "Pool tokens are issued when A or B tokens are deposited.",
              "Pool tokens can be withdrawn back to the original A or B token."
            ],
            "type": "publicKey"
          },
          {
            "name": "vaultA",
            "docs": [
              "Token A"
            ],
            "type": "publicKey"
          },
          {
            "name": "vaultB",
            "docs": [
              "Token B"
            ],
            "type": "publicKey"
          },
          {
            "name": "feeReceiver",
            "docs": [
              "Pool token account to receive trading and / or withdrawal fees"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenProgram",
            "docs": [
              "Program ID of the tokens being exchanged."
            ],
            "type": "publicKey"
          },
          {
            "name": "fees",
            "docs": [
              "All fee information"
            ],
            "type": {
              "defined": "Fees"
            }
          },
          {
            "name": "swapCurveType",
            "docs": [
              "Swap curve parameters, to be unpacked and used by the SwapCurve, which",
              "calculates swaps, deposits, and withdrawals"
            ],
            "type": {
              "defined": "SwapCurveType"
            }
          },
          {
            "name": "tokenBPriceOrOffset",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ConstantPriceCurve",
      "docs": [
        "ConstantPriceCurve struct implementing CurveCalculator"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBPrice",
            "docs": [
              "Amount of token A required to get 1 token B"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "ConstantProductCurve",
      "docs": [
        "ConstantProductCurve struct implementing CurveCalculator"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "unused",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "OffsetCurve",
      "docs": [
        "Offset curve, uses ConstantProduct under the hood, but adds an offset to",
        "one side on swap calculations"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBOffset",
            "docs": [
              "Amount to offset the token B liquidity account"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Fees",
      "docs": [
        "Encapsulates all fee information and calculations for swap operations"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tradeFeeNumerator",
            "docs": [
              "Trade fees are extra token amounts that are held inside the token",
              "accounts during a trade, making the value of liquidity tokens rise.",
              "Trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "tradeFeeDenominator",
            "docs": [
              "Trade fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerTradeFeeNumerator",
            "docs": [
              "Owner trading fees are extra token amounts that are held inside the token",
              "accounts during a trade, with the equivalent in pool tokens minted to",
              "the owner of the program.",
              "Owner trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerTradeFeeDenominator",
            "docs": [
              "Owner trade fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerWithdrawFeeNumerator",
            "docs": [
              "Owner withdraw fees are extra liquidity pool token amounts that are",
              "sent to the owner on every withdrawal.",
              "Owner withdraw fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "ownerWithdrawFeeDenominator",
            "docs": [
              "Owner withdraw fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "hostFeeNumerator",
            "docs": [
              "Host fees are a proportion of the owner trading fees, sent to an",
              "extra account provided during the trade.",
              "Host trading fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "hostFeeDenominator",
            "docs": [
              "Host trading fee denominator"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "RoundDirection",
      "docs": [
        "The direction to round.  Used for pool token to trading token conversions to",
        "avoid losing value on any deposit or withdrawal."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Floor"
          },
          {
            "name": "Ceiling"
          }
        ]
      }
    },
    {
      "name": "SwapCurveType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ConstantProductCurve"
          },
          {
            "name": "ConstantPriceCurve"
          },
          {
            "name": "OffsetCurve"
          }
        ]
      }
    },
    {
      "name": "SwapCurve",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ConstantProductCurve"
          },
          {
            "name": "ConstantPriceCurve"
          },
          {
            "name": "OffsetCurve"
          }
        ]
      }
    },
    {
      "name": "TradeDirection",
      "docs": [
        "The direction of a trade, since curves can be specialized to treat each",
        "token differently (by adding offsets or weights)"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AtoB"
          },
          {
            "name": "BtoA"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "AlreadyInitialized",
      "msg": "Swap pool is already initialized"
    },
    {
      "code": 6001,
      "name": "CalculationFailure",
      "msg": "General calculation failure due to overflow or underflow"
    },
    {
      "code": 6002,
      "name": "EmptySupply",
      "msg": "Input token account empty"
    },
    {
      "code": 6003,
      "name": "ExceededSlippage",
      "msg": "Swap instruction exceeds desired slippage limit"
    },
    {
      "code": 6004,
      "name": "FeeCalculationFailure",
      "msg": "Fee calculation failed due to overflow, underflow, or unexpected 0"
    },
    {
      "code": 6005,
      "name": "IncorrectPoolMint",
      "msg": "Address of the provided pool token mint is incorrect"
    },
    {
      "code": 6006,
      "name": "IncorrectSwapAccount",
      "msg": "Address of the provided swap token account is incorrect"
    },
    {
      "code": 6007,
      "name": "InvalidAuthority",
      "msg": "Invalid authority provided"
    },
    {
      "code": 6008,
      "name": "InvalidCloseAuthority",
      "msg": "Token account has a close authority"
    },
    {
      "code": 6009,
      "name": "InvalidCurve",
      "msg": "The provided curve parameters are invalid"
    },
    {
      "code": 6010,
      "name": "InvalidDelegate",
      "msg": "Token account has a delegate"
    },
    {
      "code": 6011,
      "name": "InvalidFee",
      "msg": "The provided fee does not match the program owner's constraints"
    },
    {
      "code": 6012,
      "name": "InvalidFeeReceiver",
      "msg": "The pool fee receiver is invalid"
    },
    {
      "code": 6013,
      "name": "InvalidFreezeAuthority",
      "msg": "Pool token mint has a freeze authority"
    },
    {
      "code": 6014,
      "name": "InvalidInput",
      "msg": "InvalidInput"
    },
    {
      "code": 6015,
      "name": "InvalidOwner",
      "msg": "Input account owner is not the program address"
    },
    {
      "code": 6016,
      "name": "InvalidSupply",
      "msg": "Pool token mint has a non-zero supply"
    },
    {
      "code": 6017,
      "name": "InvalidTokenProgram",
      "msg": "Invalid token program"
    },
    {
      "code": 6018,
      "name": "InvalidTradeDirection",
      "msg": "Invalid trade direction"
    },
    {
      "code": 6019,
      "name": "NotInitialized",
      "msg": "Swap account in not initialized"
    },
    {
      "code": 6020,
      "name": "RepeatedMint",
      "msg": "Swap input token accounts have the same mint"
    },
    {
      "code": 6021,
      "name": "UnsupportedCurveOperation",
      "msg": "The operation cannot be performed on the given curve"
    },
    {
      "code": 6022,
      "name": "ZeroTradingTokens",
      "msg": "Given pool token amount results in zero trading tokens"
    }
  ]
};
