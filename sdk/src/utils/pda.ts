import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Resynth } from "../idl/resynth";
import { TokenSwap } from "../idl/token_swap";

export function syntheticAssetPDA(
  program: Program<Resynth>,
  syntheticAsset: PublicKey
) {
  const collateralVault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), syntheticAsset.toBuffer()],
    program.programId
  )[0];
  const syntheticMint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), syntheticAsset.toBuffer()],
    program.programId
  )[0];
  const assetAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority"), syntheticAsset.toBuffer()],
    program.programId
  )[0];
  return { collateralVault, syntheticMint, assetAuthority };
}

export function marginAccountPDA(
  program: Program<Resynth>,
  owner: PublicKey,
  syntheticAsset: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("margin_account"),
      syntheticAsset.toBuffer(),
      owner.toBuffer(),
    ],
    program.programId
  )[0];
}

export function swapPoolPDA(
  program: Program<TokenSwap>,
  mintA: PublicKey,
  mintB: PublicKey
) {
  const swapPool = PublicKey.findProgramAddressSync(
    [Buffer.from("swap_pool"), mintA.toBuffer(), mintB.toBuffer()],
    program.programId
  )[0];
  const authority = PublicKey.findProgramAddressSync(
    [swapPool.toBuffer()],
    program.programId
  )[0];
  const vaultA = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_a"), swapPool.toBuffer()],
    program.programId
  )[0];
  const vaultB = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_b"), swapPool.toBuffer()],
    program.programId
  )[0];
  const lpmint = PublicKey.findProgramAddressSync(
    [Buffer.from("lpmint"), swapPool.toBuffer()],
    program.programId
  )[0];
  const feeReceiver = PublicKey.findProgramAddressSync(
    [Buffer.from("fee_receiver"), swapPool.toBuffer()],
    program.programId
  )[0];

  return {
    swapPool,
    authority,
    vaultA,
    vaultB,
    lpmint,
    feeReceiver,
  };
}
