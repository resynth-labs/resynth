import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { assert } from "chai";
import { Context, parsePythPriceData, PythClient } from "../sdk/src";

describe("pyth", () => {
  let context: Context;
  let pyth: PythClient;

  before(async () => {
    context = new Context('localnet', undefined, NodeWallet.local());
    pyth = new PythClient(context);
  });

  it("initialize", async () => {
    const price = 69420;
    const expo = -6;
    const conf = 69.420;

    const oracle = await pyth.initialize({
      price,
      expo,
      conf,
    });

    assert.ok(await pyth.getPrice(oracle) === price);
  })

  it("setPrice", async () => {
    const price = 69420;
    const expo = -6;
    const conf = 69.420;

    const oracle = await pyth.initialize({
      price,
      expo,
      conf,
    });

    let priceData = parsePythPriceData((await pyth.connection.getAccountInfo(oracle))!.data);
    assert.ok(priceData.price === price);
    assert.ok(priceData.exponent === expo);

    const newPrice = 69000;
    await pyth.setPrice({ price: new BN(newPrice * 10 ** -expo), oracle });
    priceData = parsePythPriceData((await pyth.connection.getAccountInfo(oracle))!.data);
    assert.ok(priceData.price === newPrice);
    assert.ok(priceData.exponent === expo);
  })
})
