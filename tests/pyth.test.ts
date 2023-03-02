import { BN } from "@coral-xyz/anchor"
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet"
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { assert } from "chai";
import { parsePythPriceData, PythClient } from "../sdk/src";

describe("pyth", () => {
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
    const price = 69420;
    const expo = -6;
    const conf = 69.420;
    const priceAccount = await pythClient.initialize({
      price,
      expo,
      conf,
    });
    assert.ok(await pythClient.getPrice(priceAccount) === price);
  })

  it("setPrice", async () => {
    const price = 69420;
    const expo = -6;
    const conf = 69.420;
    const priceAccount = await pythClient.initialize({
      price,
      expo,
      conf,
    });
    let priceData = parsePythPriceData((await pythClient.connection.getAccountInfo(priceAccount))!.data);
    assert.ok(priceData.price === price);
    assert.ok(priceData.exponent === expo);

    const newPrice = 69000;
    await pythClient.setPrice({ price: new BN(newPrice * 10 ** -expo), priceAccount: priceAccount });
    priceData = parsePythPriceData((await pythClient.connection.getAccountInfo(priceAccount))!.data);
    assert.ok(priceData.price === newPrice);
    assert.ok(priceData.exponent === expo);
  })
})
