import { BN } from "@coral-xyz/anchor"
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet"
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { assert } from "chai";
import { parsePythPriceData, PythClient } from "../sdk/src";

describe("pyth-oracle", () => {
  let pythClient: PythClient;

  before(async () => {
    pythClient = new PythClient(
      "localnet",
      undefined,
      new NodeWallet(Keypair.generate())
    );

    const airdropSignature = await pythClient.connection.requestAirdrop(
      pythClient.wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await pythClient.connection.confirmTransaction(
      airdropSignature,
      "confirmed"
    );
  });

  it("initialize", async () => {
    try {
      const price = 69420;
      const expo = -6;
      const conf = 69.420;
      const priceAccount = Keypair.generate();
      await pythClient.initialize({
        price,
        expo,
        conf,
        priceAccount: priceAccount.publicKey,
      });
      const priceData = parsePythPriceData((await pythClient.connection.getAccountInfo(priceAccount.publicKey))!.data);
      assert.ok(priceData.price === price);
    } catch (e) {
      console.log(e);
    }
  })

  it("setPrice", async () => {
    const price = 69420;
    const expo = -6;
    const conf = 69.420;
    const priceAccount = Keypair.generate();
    await pythClient.initialize({
      price,
      expo,
      conf,
      priceAccount: priceAccount.publicKey,
    });
    let priceData = parsePythPriceData((await pythClient.connection.getAccountInfo(priceAccount.publicKey))!.data);
    assert.ok(priceData.price === price);
    assert.ok(priceData.exponent === expo);

    const newPrice = 69000;
    await pythClient.setPrice({ price: new BN(newPrice * 10 ** -expo), priceAccount: priceAccount.publicKey });
    priceData = parsePythPriceData((await pythClient.connection.getAccountInfo(priceAccount.publicKey))!.data);
    assert.ok(priceData.price === newPrice);
    assert.ok(priceData.exponent === expo);
  })
})
