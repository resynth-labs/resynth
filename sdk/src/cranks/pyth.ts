import { BN } from "@coral-xyz/anchor";
import { Commitment, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Context, parsePythPriceData, PythClient } from "../client";
import { ResynthConfig } from "../utils";

import CONFIG from "../config.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

const interval = 1_000;
let isRunning = true;

export class PythCrank {
  pythClient: PythClient;
  pythnetConnection: Connection;
  pythnetConfig: ResynthConfig;

  constructor(pythClient: PythClient) {
    this.pythClient = pythClient;
    this.pythnetConnection = new Connection("https://pythnet.rpcpool.com", "processed");
    this.pythnetConfig = CONFIG["mainnet"] as ResynthConfig;
  }

  async start() {
    console.log(`RUNNING PYTH CRANK`)

    const subscriptions: number[] = [];

    const prices: Record<string, any> = {};

    for (const [symbol, oracle] of Object.entries(this.pythnetConfig.oracles)) {
      if (this.pythClient.config.oracles[symbol]) {
        const address = new PublicKey(oracle.oracle);
        subscriptions.push(this.pythnetConnection.onAccountChange(
          address,
          account => { prices[symbol] = parsePythPriceData(account.data); },
          'processed' as Commitment
        ));
      }
    }

    while (isRunning) {
      for (const [symbol, price] of Object.entries(prices)) {
        try {
          const address = new PublicKey(this.pythClient.config.oracles[symbol].oracle);
          await this.pythClient.setPrice({
            price: price.price,
            expo: price.exponent,
            conf: price.confidence,
            oracle: address,
          });
          console.log(`symbol: ${symbol} price: ${price.price} oracle: ${address.toBase58()}`);
        } catch (e) {
          console.log(e)
        }
      }
      await sleep(interval);
    }

    for (const subscription of subscriptions) {
      this.pythnetConnection.removeAccountChangeListener(subscription);
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

process.on('SIGINT', async () => {
  console.log('Caught keyboard interrupt. Exiting.')

  isRunning = false

  // Wait for the main loop to  exit.
  await sleep(interval)

  process.exit()
})

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled rejection (promise: ', promise, ', reason: ', err, ').')
})

const pythCrank = new PythCrank(new PythClient(new Context("localnet", undefined, NodeWallet.local())));
pythCrank.start();
