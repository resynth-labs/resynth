import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import { Context, ResynthClient, TokenFaucetClient, RESYNTH_CONFIG, ResynthConfig, parsePythPriceData, SwapPool, swapPoolPDA, TokenSwapClient, syntheticAssetPDA } from "../../sdk/src";

const max_portfolio_amount = 1_000;

async function swap(symbol: string, side: 'buy' | 'sell', price: number, swapPool: SwapPool): Promise<void> {
  console.log(`symbol: ${symbol} price: ${price.toFixed(2)}`);

  // calculate quantity to swap
  // clip by the number of tokens you have
  // send the swap tx
}

async function arb(): Promise<void> {
  const cluster = "localnet";
  const context = new Context(cluster, undefined, NodeWallet.local());
  const client = new ResynthClient(context);
  const tokenSwap = new TokenSwapClient(context);

  const usdcMint = new PublicKey(client.config.tokens.USDC.mint);
  const usdcTokenAccount = getAssociatedTokenAddressSync(usdcMint, context.wallet.publicKey);

  if (cluster == "localnet") {
    const usdcBalance = await context.getTokenBalance(usdcMint, usdcTokenAccount);
    if (usdcBalance == 0) {
      const tokenFaucet = new TokenFaucetClient(context);
      try {
        await tokenFaucet.airdrop({
          amount: new BN(max_portfolio_amount * 10 ** 6),
          faucet: new PublicKey(client.config.tokens["USDC"].faucet!),
          mint: usdcMint,
          owner: tokenFaucet.wallet.publicKey,
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  const swapPools: Record<string, SwapPool> = {};

  const pythnetConnection = new Connection("https://pythnet.rpcpool.com", "processed");
  const pythnetConfig = RESYNTH_CONFIG["mainnet"] as ResynthConfig;

  for (const [symbol, oracle] of Object.entries(pythnetConfig.oracles)) {
    if (client.config.oracles[symbol]) {
      const pythnetAddress = new PublicKey(oracle.oracle);
      pythnetConnection.onAccountChange(
        pythnetAddress,
        account => {
          (async () => {
            const swapPool = swapPools[symbol];
            if (swapPool) {
              const pythPrice = parsePythPriceData(account.data);
              const poolPrice = (Number(swapPool.vaultBBalance) / 10 ** swapPool.mintBDecimals) / (Number(swapPool.vaultABalance) / 10 ** swapPool.mintADecimals);
              const arb = ((pythPrice.price / poolPrice) - 1) * 10_000;
              if (arb > 30) {
                await swap(symbol, 'buy', pythPrice.price, swapPool);
              } else if (arb < -30) {
                await swap(symbol, 'sell', pythPrice.price, swapPool);
              }
            }
          })();
        },
        'processed' as Commitment
      );
    }
  }

  const publicKeys: PublicKey[] = [];
  const oracles = Object.entries(context.config.oracles);
  for (const [symbol, oracle] of oracles) {
    const { syntheticMint } = syntheticAssetPDA(client.programId, new PublicKey(oracle.oracle));
    const { swapPool } = swapPoolPDA(tokenSwap.programId, syntheticMint, usdcMint);
    publicKeys.push(swapPool);
  }

  const accountInfos = await context.connection.getMultipleAccountsInfo(publicKeys);
  for (let i = 0; i < oracles.length; i++) {
    if (accountInfos[i]) {
      swapPools[oracles[i][0]] = tokenSwap.program.coder.accounts.decode<SwapPool>("swapPool", accountInfos[i]!.data);
    }
  }

  for (let i = 0; i < oracles.length; i++) {
    if (accountInfos[i]) {
      const symbol = oracles[i][0];
      await context.connection.onAccountChange(publicKeys[i], account => {
        swapPools[symbol] = tokenSwap.program.coder.accounts.decode<SwapPool>("swapPool", account.data);
      }, 'processed' as Commitment);
    }
  }
}

arb();
