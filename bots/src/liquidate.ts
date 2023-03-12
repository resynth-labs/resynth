import { Context } from "../../sdk/src";

async function liquidate(): Promise<void> {
  const context = new Context();

  //TODO check which synth accounts can be liquidated

  //TODO liquidate them via the token swap
}

liquidate();
