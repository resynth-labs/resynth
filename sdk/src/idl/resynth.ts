export type Resynth = {
  "version": "0.1.0",
  "name": "resynth",
  "constants": [
    {
      "name": "ASSET",
      "type": "string",
      "value": "\"asset\""
    },
    {
      "name": "AUTHORITY",
      "type": "string",
      "value": "\"authority\""
    },
    {
      "name": "VAULT",
      "type": "string",
      "value": "\"vault\""
    },
    {
      "name": "MINT",
      "type": "string",
      "value": "\"mint\""
    },
    {
      "name": "MARGIN_ACCOUNT",
      "type": "string",
      "value": "\"margin_account\""
    }
  ],
  "instructions": [
    {
      "name": "initializeSyntheticAsset",
      "docs": [
        "Initialize a new synthetic asset"
      ],
      "accounts": [
        {
          "name": "syntheticAsset",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic asset account to initialize"
          ]
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint to use as collateral for the synthetic asset"
          ]
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault of hard assets to collateralize the circulating synthetic assets"
          ]
        },
        {
          "name": "syntheticMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic asset mint"
          ]
        },
        {
          "name": "syntheticOracle",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset oracle price feed, to determine margin account health"
          ]
        },
        {
          "name": "assetAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint authority that can mint synthetic assets and transfer vault collateral"
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer of rent for various accounts"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program to initialize token accounts"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program to create accounts"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeMarginAccount",
      "docs": [
        "Initialize a new margin account"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer of margin account rent"
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The owner of the margin account, who can mint assets"
          ]
        },
        {
          "name": "syntheticAsset",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset the margin account is associated with"
          ]
        },
        {
          "name": "marginAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The margin account to initialize"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program for CPI"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "mintSyntheticAsset",
      "docs": [
        "Mint a synthetic asset"
      ],
      "accounts": [
        {
          "name": "syntheticAsset",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset account"
          ]
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault that is receiving collateral"
          ]
        },
        {
          "name": "syntheticMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic mint of the synthetic asset"
          ]
        },
        {
          "name": "syntheticOracle",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The oracle price feed, to determine margin account health"
          ]
        },
        {
          "name": "assetAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint authority that can mint synthetic assets and transfer vault collateral"
          ]
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The receiver of the synthetic asset"
          ]
        },
        {
          "name": "marginAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The margin account of the owner, to track collateral and debt"
          ]
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that collateral will be transferred from"
          ]
        },
        {
          "name": "syntheticAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that will receive synthetic tokens"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for CPI calls"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collateralAmount",
          "type": "u64"
        },
        {
          "name": "mintAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "burnSyntheticAsset",
      "docs": [
        "Burn a synthetic asset"
      ],
      "accounts": [
        {
          "name": "syntheticAsset",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset account"
          ]
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault that is receiving collateral"
          ]
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The collateral mint of the synthetic asset"
          ]
        },
        {
          "name": "syntheticMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic mint of the synthetic asset"
          ]
        },
        {
          "name": "syntheticOracle",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The oracle price feed, to determine margin account health"
          ]
        },
        {
          "name": "assetAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint authority that can mint synthetic assets and transfer vault collateral"
          ]
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The receiver of the synthetic asset"
          ]
        },
        {
          "name": "marginAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The margin account of the owner, to track collateral and debt"
          ]
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that collateral will be transferred from"
          ]
        },
        {
          "name": "syntheticAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that will receive synthetic tokens"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for CPI calls"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collateralAmount",
          "type": "u64"
        },
        {
          "name": "burnAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "marginAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "syntheticAsset",
            "type": "publicKey"
          },
          {
            "name": "collateralDeposited",
            "type": "u64"
          },
          {
            "name": "syntheticAssetBorrowed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "syntheticAsset",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "syntheticAsset",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "collateralVault",
            "type": "publicKey"
          },
          {
            "name": "syntheticMint",
            "type": "publicKey"
          },
          {
            "name": "syntheticOracle",
            "type": "publicKey"
          },
          {
            "name": "assetAuthority",
            "type": "publicKey"
          },
          {
            "name": "assetAuthorityBump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOracle",
      "msg": "The oracle account provided is invalid"
    },
    {
      "code": 6001,
      "name": "StaleOracle",
      "msg": "The oracle is stale"
    },
    {
      "code": 6002,
      "name": "Undercollateralized",
      "msg": "The margin account is undercollateralized"
    },
    {
      "code": 6003,
      "name": "InvalidCollateralMintDecimals",
      "msg": "Collateral decimals is rqeuired to be 6 because it's value is hardcoded to $1"
    }
  ]
};

export const IDL: Resynth = {
  "version": "0.1.0",
  "name": "resynth",
  "constants": [
    {
      "name": "ASSET",
      "type": "string",
      "value": "\"asset\""
    },
    {
      "name": "AUTHORITY",
      "type": "string",
      "value": "\"authority\""
    },
    {
      "name": "VAULT",
      "type": "string",
      "value": "\"vault\""
    },
    {
      "name": "MINT",
      "type": "string",
      "value": "\"mint\""
    },
    {
      "name": "MARGIN_ACCOUNT",
      "type": "string",
      "value": "\"margin_account\""
    }
  ],
  "instructions": [
    {
      "name": "initializeSyntheticAsset",
      "docs": [
        "Initialize a new synthetic asset"
      ],
      "accounts": [
        {
          "name": "syntheticAsset",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic asset account to initialize"
          ]
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint to use as collateral for the synthetic asset"
          ]
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault of hard assets to collateralize the circulating synthetic assets"
          ]
        },
        {
          "name": "syntheticMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic asset mint"
          ]
        },
        {
          "name": "syntheticOracle",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset oracle price feed, to determine margin account health"
          ]
        },
        {
          "name": "assetAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint authority that can mint synthetic assets and transfer vault collateral"
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer of rent for various accounts"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program to initialize token accounts"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program to create accounts"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeMarginAccount",
      "docs": [
        "Initialize a new margin account"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer of margin account rent"
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The owner of the margin account, who can mint assets"
          ]
        },
        {
          "name": "syntheticAsset",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset the margin account is associated with"
          ]
        },
        {
          "name": "marginAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The margin account to initialize"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program for CPI"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "mintSyntheticAsset",
      "docs": [
        "Mint a synthetic asset"
      ],
      "accounts": [
        {
          "name": "syntheticAsset",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset account"
          ]
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault that is receiving collateral"
          ]
        },
        {
          "name": "syntheticMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic mint of the synthetic asset"
          ]
        },
        {
          "name": "syntheticOracle",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The oracle price feed, to determine margin account health"
          ]
        },
        {
          "name": "assetAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint authority that can mint synthetic assets and transfer vault collateral"
          ]
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The receiver of the synthetic asset"
          ]
        },
        {
          "name": "marginAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The margin account of the owner, to track collateral and debt"
          ]
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that collateral will be transferred from"
          ]
        },
        {
          "name": "syntheticAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that will receive synthetic tokens"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for CPI calls"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collateralAmount",
          "type": "u64"
        },
        {
          "name": "mintAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "burnSyntheticAsset",
      "docs": [
        "Burn a synthetic asset"
      ],
      "accounts": [
        {
          "name": "syntheticAsset",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The synthetic asset account"
          ]
        },
        {
          "name": "collateralVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vault that is receiving collateral"
          ]
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The collateral mint of the synthetic asset"
          ]
        },
        {
          "name": "syntheticMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The synthetic mint of the synthetic asset"
          ]
        },
        {
          "name": "syntheticOracle",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The oracle price feed, to determine margin account health"
          ]
        },
        {
          "name": "assetAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint authority that can mint synthetic assets and transfer vault collateral"
          ]
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The receiver of the synthetic asset"
          ]
        },
        {
          "name": "marginAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The margin account of the owner, to track collateral and debt"
          ]
        },
        {
          "name": "collateralAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that collateral will be transferred from"
          ]
        },
        {
          "name": "syntheticAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The owners account that will receive synthetic tokens"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for CPI calls"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collateralAmount",
          "type": "u64"
        },
        {
          "name": "burnAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "marginAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "syntheticAsset",
            "type": "publicKey"
          },
          {
            "name": "collateralDeposited",
            "type": "u64"
          },
          {
            "name": "syntheticAssetBorrowed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "syntheticAsset",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "syntheticAsset",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "collateralVault",
            "type": "publicKey"
          },
          {
            "name": "syntheticMint",
            "type": "publicKey"
          },
          {
            "name": "syntheticOracle",
            "type": "publicKey"
          },
          {
            "name": "assetAuthority",
            "type": "publicKey"
          },
          {
            "name": "assetAuthorityBump",
            "type": {
              "array": [
                "u8",
                1
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOracle",
      "msg": "The oracle account provided is invalid"
    },
    {
      "code": 6001,
      "name": "StaleOracle",
      "msg": "The oracle is stale"
    },
    {
      "code": 6002,
      "name": "Undercollateralized",
      "msg": "The margin account is undercollateralized"
    },
    {
      "code": 6003,
      "name": "InvalidCollateralMintDecimals",
      "msg": "Collateral decimals is rqeuired to be 6 because it's value is hardcoded to $1"
    }
  ]
};
