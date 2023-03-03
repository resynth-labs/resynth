import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { ResynthClient } from "../client";
import configs from "../config.json";
import { syntheticAssetPDA } from "../utils";

// Run with ts-node -T ..

async function main() {
  const config = configs.mainnet;
  const oracles = config.oracles;

  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const client = new ResynthClient(
    "mainnet",
    connection,
    new NodeWallet(
      Keypair.fromSecretKey(
        new Uint8Array(
          JSON.parse(
            require("fs").readFileSync(
              process.env.HOME + "/.config/solana/id.json",
              "utf-8"
            )
          )
        )
      )
    )
  );

  const syntheticAssets = Object.entries(oracles).map((entry) => {
    return {
      ...entry[1],
      ...syntheticAssetPDA(
        new PublicKey(config.resynthProgramId),
        new PublicKey(entry[1])
      ),
      oracle: new PublicKey(entry[1].oracle),
      oracleSymbol: entry[0],
    };
  });

  for (let i = 0; i < syntheticAssets.length; i++) {
    const keys = syntheticAssets[i];
    const info = await connection.getAccountInfo(keys.syntheticAsset);

    if (info && info.owner.toBase58() == config.resynthProgramId) {
      // it already exists
      console.log(`skipping ${keys.oracleSymbol}`);
      continue;
    }

    console.log(
      `initializing ${keys.oracleSymbol}`.padEnd(24) +
        `- ${keys.syntheticAsset}`
    );
    await client.initializeSyntheticAsset({
      collateralMint: new PublicKey(config.collateralMint),
      syntheticOracle: keys.oracle,
    });
  }
}

main();
