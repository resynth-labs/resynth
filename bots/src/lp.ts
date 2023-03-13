import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AccountLayout, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Context, marginAccountPDA, ResynthClient, SwapCurveType, swapPoolPDA, syntheticAssetPDA, TokenFaucetClient, TokenSwapClient } from "../../sdk/src";

const max_lp_portfolio_amount = 20_000;

async function lp(): Promise<void> {
  const cluster = "localnet";
  const context = new Context(cluster, undefined, NodeWallet.local());
  const client = new ResynthClient(context);
  const tokenSwap = new TokenSwapClient(context);

  const collateralMint = new PublicKey(client.config.tokens.USDC.mint);
  const collateralTokenAccount = getAssociatedTokenAddressSync(collateralMint, context.wallet.publicKey);

  if (cluster == "localnet") {
    const collateralBalance = await context.getTokenBalance(collateralMint, collateralTokenAccount);
    if (collateralBalance == 0) {
      const tokenFaucet = new TokenFaucetClient(context);
      try {
        await tokenFaucet.airdrop({
          amount: new BN(max_lp_portfolio_amount * 10 ** 6),
          faucet: new PublicKey(client.config.tokens.USDC.faucet!),
          mint: collateralMint,
          owner: tokenFaucet.wallet.publicKey,
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  for (const [symbol, oracle] of Object.entries(client.config.oracles)) {
    const address = new PublicKey(oracle.oracle);
    const price = await client.getOraclePrice(address);

    console.log(`symbol: ${symbol} price: ${price} oracle: ${address.toBase58()}`);

    const { syntheticAsset, collateralVault, syntheticMint, assetAuthority } = syntheticAssetPDA(client.programId, address);

    const synthTokenAccount = getAssociatedTokenAddressSync(syntheticMint, context.wallet.publicKey);

    const synthBalance = await context.getTokenBalance(syntheticMint);

    if (synthBalance == 0) {
      if (await context.connection.getAccountInfo(syntheticAsset) == null) {
        await client.initializeSyntheticAsset({
          collateralMint: collateralMint,
          syntheticOracle: address,
        });
      }

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

      await client.mintSyntheticAsset({
        owner: context.wallet.publicKey,
        syntheticOracle: address,
        collateralMint: collateralMint,
        collateralAmount: new BN(10_000 * 10 ** 6),
        mintAmount: new BN((10_000 / price) * 10 ** 9),
      });

      const synthTokens = AccountLayout.decode((await context.connection.getAccountInfo(synthTokenAccount))!.data).amount;

      const { mintA, mintB, swapPool, authority, vaultA, vaultB, lpmint, feeReceiver, feeReceiverWallet } =
        swapPoolPDA(tokenSwap.programId, syntheticMint, collateralMint);

      if (await context.connection.getAccountInfo(swapPool) == null) {
        await tokenSwap.initializeSwapPool({
          initialTokenAAmount: new BN(Number(synthTokens)),
          initialTokenBAmount: new BN(10_000 * 10 ** 6),
          mintA,
          mintB,
          owner: context.wallet.publicKey,
          sourceA: synthTokenAccount,
          sourceB: collateralTokenAccount,
          signers: [],
        });
      }

      // await tokenSwap.depositAllTokenTypes({
      //   maximumTokenAAmount: new BN(Number(synthTokens)),
      //   maximumTokenBAmount: new BN(1_000 * 10 ** 6),
      //   swapPool: await tokenSwap.fetchSwapPool(swapPool),
      //   owner: context.wallet.publicKey,
      //   tokenA: synthTokenAccount,
      //   tokenB: collateralTokenAccount,
      //   lptoken: getAssociatedTokenAddressSync(lpmint, context.wallet.publicKey),
      //   signers: [],
      // });
    }
  }
}

lp();
