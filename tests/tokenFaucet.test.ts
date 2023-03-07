import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { assert } from "chai";
import { Context, TokenFaucetClient } from "../sdk/src";

describe("token faucet", () => {
  let context: Context;
  let tokenFaucet: TokenFaucetClient;
  const decimals = 6;
  let mint: PublicKey;
  let faucet: PublicKey;

  before(async () => {
    context = new Context();
    tokenFaucet = new TokenFaucetClient(context);
  });

  it("Create Faucet", async () => {
    [mint, faucet] = await tokenFaucet.createMintAndFaucet(decimals);

    const mintAccountInfo = await context.provider.connection.getAccountInfo(mint);
    assert(mintAccountInfo !== null, "mint does not exist");

    const faucetAccountInfo = await context.provider.connection.getAccountInfo(
      faucet
    );
    assert(faucetAccountInfo !== null, "faucet does not exist");

    assert(
      (await tokenFaucet.fetchFaucet(faucet)).account.mint.equals(mint),
      "faucet mint does not match"
    );
  });

  it("airdrop", async () => {
    const tokenAccount = getAssociatedTokenAddressSync(
      mint,
      context.provider.wallet.publicKey
    );
    assert(
      (await context.provider.connection.getAccountInfo(tokenAccount)) === null,
      "token account already exists"
    );

    await tokenFaucet.airdrop({
      amount: new BN(1_000_000),
      faucet: faucet,
      mint: mint,
      owner: context.provider.wallet.publicKey,
    });

    assert(
      (await context.provider.connection.getTokenAccountBalance(tokenAccount)).value.uiAmount === 1,
      "token account balance is not 1"
    );
  });
});
