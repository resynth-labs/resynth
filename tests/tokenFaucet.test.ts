import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { Context, TokenFaucetClient } from "../sdk/src";

describe("token faucet", () => {
  let context: Context;
  let tokenFaucet: TokenFaucetClient;
  const decimals = 6;
  let mint: PublicKey;
  let faucet: PublicKey;

  before(async () => {
    context = new Context('localnet', undefined, NodeWallet.local());
    tokenFaucet = new TokenFaucetClient(context);
  });

  it("Create Faucet", async () => {
    [mint, faucet] = await tokenFaucet.createMintAndFaucet(decimals);

    const mintAccountInfo = await tokenFaucet.connection.getAccountInfo(mint);
    assert(mintAccountInfo !== null, "mint does not exist");

    const faucetAccountInfo = await tokenFaucet.connection.getAccountInfo(
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
      tokenFaucet.wallet.publicKey
    );
    assert(
      (await tokenFaucet.connection.getAccountInfo(tokenAccount)) === null,
      "token account already exists"
    );

    await tokenFaucet.airdrop({
      amount: new BN(1_000_000),
      faucet: faucet,
      mint: mint,
      owner: tokenFaucet.wallet.publicKey,
    });

    assert(
      (await tokenFaucet.connection.getTokenAccountBalance(tokenAccount)).value.uiAmount === 1,
      "token account balance is not 1"
    );
  });
});
