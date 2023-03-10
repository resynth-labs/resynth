import fetch from "node-fetch";
import configs from "../config.json";
import { writeFileSync } from "fs";

// Run with ts-node -T ..

async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const config = configs.mainnet;
  const oracles = config.oracles;

  const syntheticAssets = Object.entries(oracles);

  for (let i = 0; i < syntheticAssets.length; i++) {
    const [label, oracle] = syntheticAssets[i];
    let quote = oracle.quote;
    quote = quote.toLowerCase();

    const resp = await fetch(`https://api.coingecko.com/api/v3/coins/${quote}`);
    if (resp.status === 429) {
      // retry
      console.log("Rate limited");
      await sleep(30000);
      i -= 1;
      continue;
    }
    if (resp.status !== 200) {
      console.log(`could not find ${quote}: ${resp.status}`);
      continue;
    }
    const json: any = await resp.json();
    const imgUrls = [json.image.thumb, json.image.small, json.image.large];
    const imgResp = await fetch(imgUrls[0]);
    if (imgResp.status === 429) {
      // retry
      console.log("Rate limited");
      await sleep(30000);
      i -= 1;
      continue;
    }
    const imgBuffer = await imgResp.buffer();
    writeFileSync(`${label}.png`, imgBuffer);
    console.log(`Found ${quote}`);
  }
}

main();
