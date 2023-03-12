import { BN } from "@coral-xyz/anchor";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import { Context, parsePythPriceData, PythClient } from "../client";
import { ResynthConfig } from "../utils";

import CONFIG from "../config.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

const interval = 4_000;
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

    for (const [symbol, oracle] of Object.entries(this.pythnetConfig.oracles)) {
      if (this.pythClient.config.oracles[symbol]) {
        const address = new PublicKey(oracle.oracle);
        const localnetAddress = new PublicKey(this.pythClient.config.oracles[symbol].oracle);
        subscriptions.push(this.pythnetConnection.onAccountChange(
          address,
          account => {
            (async () => {
              const pythPrice = parsePythPriceData(account.data)
              await this.pythClient.setPrice({
                price: pythPrice.price,
                expo: pythPrice.exponent,
                conf: pythPrice.confidence,
                oracle: localnetAddress,
              });
              console.log(`symbol: ${symbol} price: ${pythPrice.price} oracle: ${localnetAddress.toBase58()}`);
            })();
          },
          'processed' as Commitment
        ));
      }
    }

    while (isRunning) {
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
