# Running the bot simulation suite

## Prepare the environment

`(yarn && yarn build && cd bots && yarn)`

## Run a localnet validator

`anchor localnet`

## Run a localnet pyth price crank

`ANCHOR_WALLET=~/.config/solana/id.json ts-node sdk/src/cranks/pyth.ts`

## Run a localnet lp bot

At the moment, the lp bot will initialize pools and make an initial deposit. But does not rebalance.

`ANCHOR_WALLET=~/.config/solana/id.json ts-node bots/src/lp.ts`

## Run a localnet arbitrage bot

`ANCHOR_WALLET=~/.config/solana/id.json ts-node bots/src/arb.ts`
