import { BN, ProgramAccount } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import { Context, ResynthClient, TokenFaucetClient, RESYNTH_CONFIG, ResynthConfig, parsePythPriceData, SwapPool, swapPoolPDA, TokenSwapClient, syntheticAssetPDA, marginAccountPDA } from "../../sdk/src";

async function arb(): Promise<void> {
  const cluster = "localnet";
  const context = new Context(cluster, undefined, NodeWallet.local());
  const client = new ResynthClient(context);
  const tokenSwap = new TokenSwapClient(context);

  const usdcMint = new PublicKey(client.config.tokens.USDC.mint);
  const usdcTokenAccount = getAssociatedTokenAddressSync(usdcMint, context.wallet.publicKey);

  const oracles = Object.entries(context.config.oracles);

  if (cluster == "localnet") {
    const usdcBalance = await context.getTokenBalance(usdcMint, usdcTokenAccount);
    if (usdcBalance == 0) {
      const tokenFaucet = new TokenFaucetClient(context);
      await tokenFaucet.airdrop({
        amount: new BN(2_000 * 10 ** 6),
        faucet: new PublicKey(client.config.tokens["USDC"].faucet!),
        mint: usdcMint,
        owner: tokenFaucet.wallet.publicKey,
      });

      for (const [symbol, oracle] of oracles) {
        const { syntheticAsset, syntheticMint } = syntheticAssetPDA(client.programId, new PublicKey(oracle.oracle));
        if (await context.connection.getAccountInfo(syntheticAsset) != null) {
          const marginAccount = marginAccountPDA(
            client.programId,
            context.wallet.publicKey,
            syntheticAsset
          );

          if (await context.connection.getAccountInfo(marginAccount) == null) {
            await client.initializeMarginAccount({
              owner: context.wallet.payer,
              syntheticAsset,
            });
          }

          const price = await client.getOraclePrice(new PublicKey(oracle.oracle));

          await client.mintSyntheticAsset({
            owner: context.wallet.publicKey,
            syntheticOracle: new PublicKey(oracle.oracle),
            collateralMint: usdcMint,
            collateralAmount: new BN(1_000 * 10 ** 6),
            mintAmount: new BN((1_000 / price) * 10 ** 9),
          });
        }
      }
    }
  }

  const swapPools: Record<string, ProgramAccount<SwapPool>> = {};

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
              const poolPrice = (Number(swapPool.account.vaultBBalance) / 10 ** swapPool.account.mintBDecimals) / (Number(swapPool.account.vaultABalance) / 10 ** swapPool.account.mintADecimals);
              const arb = ((pythPrice.price / poolPrice) - 1) * 10_000;
              if (arb > 30) {
                await swap(context, tokenSwap, symbol, 'buy', pythPrice.price, swapPool);
              } else if (arb < -30) {
                await swap(context, tokenSwap, symbol, 'sell', pythPrice.price, swapPool);
              }
            }
          })();
        },
        'processed' as Commitment
      );
    }
  }

  const publicKeys: PublicKey[] = [];
  for (const [symbol, oracle] of oracles) {
    const { syntheticMint } = syntheticAssetPDA(client.programId, new PublicKey(oracle.oracle));
    const { swapPool } = swapPoolPDA(tokenSwap.programId, syntheticMint, usdcMint);
    publicKeys.push(swapPool);
  }

  const accountInfos = await context.connection.getMultipleAccountsInfo(publicKeys);
  for (let i = 0; i < oracles.length; i++) {
    if (accountInfos[i]) {
      swapPools[oracles[i][0]] = { account: tokenSwap.program.coder.accounts.decode<SwapPool>("swapPool", accountInfos[i]!.data), publicKey: publicKeys[i] };
    }
  }

  for (let i = 0; i < oracles.length; i++) {
    if (accountInfos[i]) {
      const symbol = oracles[i][0];
      await context.connection.onAccountChange(publicKeys[i], account => {
        swapPools[symbol].account = tokenSwap.program.coder.accounts.decode<SwapPool>("swapPool", account.data);
      }, 'processed' as Commitment);
    }
  }
}

async function swap(context: Context, tokenSwap: TokenSwapClient, symbol: string, side: 'buy' | 'sell', price: number, swapPool: ProgramAccount<SwapPool>): Promise<void> {
  const usdcTokenAccount = getAssociatedTokenAddressSync(swapPool.account.mintB, context.wallet.publicKey);
  const synthTokenAccount = getAssociatedTokenAddressSync(swapPool.account.mintA, context.wallet.publicKey);
  switch (side) {
    case 'buy': {
      const usdcBalance = await context.getTokenBalance(swapPool.account.mintB, usdcTokenAccount);
      const quantity = Math.min(usdcBalance, Math.sqrt(Number(swapPool.account.vaultABalance) / 10 ** swapPool.account.mintADecimals * Number(swapPool.account.vaultBBalance) / 10 ** swapPool.account.mintBDecimals * price) - Number(swapPool.account.vaultBBalance) / 10 ** swapPool.account.mintBDecimals);
      if (quantity > 1) {
        console.log(`${side.toUpperCase().padEnd(4)}   symbol: ${symbol}   price: ${price.toFixed(2)}   quantity: ${quantity.toFixed(2)}   usdcBalance: ${usdcBalance.toFixed(2)}`);
        await tokenSwap.swap({
          amountIn: new BN(Math.floor(quantity * 10 ** swapPool.account.mintBDecimals)),
          minimumAmountOut: new BN(0),
          swapPool: swapPool.publicKey,
          authority: swapPool.account.authority,
          owner: context.wallet.publicKey,
          sourceToken: usdcTokenAccount,
          sourceVault: swapPool.account.vaultB,
          destVault: swapPool.account.vaultA,
          destToken: synthTokenAccount,
          lpmint: swapPool.account.lpmint,
          feeReceiver: swapPool.account.feeReceiver,
          hostFeeReceiver: null,
          signers: [],
        });
      }
      break;
    }
    case 'sell': {
      const synthBalance = await context.getTokenBalance(swapPool.account.mintA, synthTokenAccount);
      const quantity = Math.min(synthBalance, Math.sqrt(Number(swapPool.account.vaultABalance) / 10 ** swapPool.account.mintADecimals * Number(swapPool.account.vaultBBalance) / 10 ** swapPool.account.mintBDecimals / price) - Number(swapPool.account.vaultABalance) / 10 ** swapPool.account.mintADecimals);
      if (quantity * price > 1) {
        console.log(`${side.toUpperCase()}   symbol: ${symbol}   price: ${price.toFixed(2)}   quantity: ${quantity.toFixed(2)}   synthBalance: ${synthBalance.toFixed(2)}`);
        await tokenSwap.swap({
          amountIn: new BN(Math.floor(quantity * 10 ** swapPool.account.mintADecimals)),
          minimumAmountOut: new BN(0),
          swapPool: swapPool.publicKey,
          authority: swapPool.account.authority,
          owner: context.wallet.publicKey,
          sourceToken: synthTokenAccount,
          sourceVault: swapPool.account.vaultA,
          destVault: swapPool.account.vaultB,
          destToken: usdcTokenAccount,
          lpmint: swapPool.account.lpmint,
          feeReceiver: swapPool.account.feeReceiver,
          hostFeeReceiver: null,
          signers: [],
        });
      }
      break;
    }
  }
}

arb();
