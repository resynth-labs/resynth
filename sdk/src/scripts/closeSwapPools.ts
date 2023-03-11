import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Context, ResynthClient, TokenSwapClient } from "../client";
import { readFileSync } from "fs";
import { homedir } from "os";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import assert from "assert";

// Run with ts-node -T ..

async function main() {
  const wallet = new NodeWallet(
    Keypair.fromSecretKey(
      new Uint8Array(
        JSON.parse(readFileSync(homedir() + "/.config/solana/id.json", "utf-8"))
      )
    )
  );
  const connection = new Connection(
    "https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88"
  );
  const context = new Context("mainnet", connection, wallet);
  const client = new ResynthClient(context);
  const tokenSwap = new TokenSwapClient(context);

  const {
    config,
    programId,
    wallet: { publicKey: walletPubkey },
  } = client;

  const swapPools = await tokenSwap.fetchAllSwapPools();
  for (const { publicKey, account: swapPool } of swapPools) {
    const [vaultAInfo, vaultBInfo] = await connection.getMultipleAccountsInfo([
      swapPool.vaultA,
      swapPool.vaultB,
    ]);

    assert(vaultAInfo);
    assert(vaultBInfo);

    console.log(
      unpackAccount(swapPool.vaultA, vaultAInfo).amount +
        " " +
        swapPool.mintA.toBase58()
    );
    console.log(
      unpackAccount(swapPool.vaultB, vaultBInfo).amount +
        " " +
        swapPool.mintB.toBase58()
    );

    const feeReceiverWallet = new PublicKey(
      "HjnXUGGMgtN9WaPAJxzdwnWip6f76xGp4rUMRoVicsLr"
    );
    console.log(
      "Uncomment the following code in this script and in the program to close a swap pool"
    );
    // console.log("Creating account A");
    // const { address: destA } = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   wallet.payer,
    //   swapPool.mintA,
    //   wallet.publicKey,
    //   true
    // );
    // console.log("Creating account B");
    // const { address: destB } = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   wallet.payer,
    //   swapPool.mintB,
    //   wallet.publicKey,
    //   true
    // );
    // console.log("Closing swap pool");
    // console.log(
    //   await tokenSwap.program.methods
    //     .closeSwapPool()
    //     .accountsStrict({
    //       swapPool: swapPool.swapPool,
    //       authority: swapPool.authority,
    //       vaultA: swapPool.vaultA,
    //       vaultB: swapPool.vaultB,
    //       feeReceiverWallet,
    //       signer: wallet.publicKey,
    //       mintA: swapPool.mintA,
    //       mintB: swapPool.mintB,
    //       destA,
    //       destB,
    //       systemProgram: SystemProgram.programId,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //     })
    //     .rpc()
    // );
  }
}

main();
