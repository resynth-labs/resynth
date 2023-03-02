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
import { TokenFaucetClient } from "../sdk/src";

describe("token faucet", () => {
  let tokenFaucet: TokenFaucetClient;
  const decimals = 6;
  let mint: PublicKey;
  let faucet: PublicKey;

  before(async () => {
    tokenFaucet = new TokenFaucetClient(
      "localnet",
      undefined,
      new NodeWallet(Keypair.generate())
    );

    const airdropSignature = await tokenFaucet.connection.requestAirdrop(
      tokenFaucet.wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await tokenFaucet.connection.confirmTransaction(
      airdropSignature,
      "confirmed"
    );
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

  it("Airdrop", async () => {
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
