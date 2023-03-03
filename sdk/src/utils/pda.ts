import { Address, translateAddress } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export function syntheticAssetPDA(
  programId: PublicKey,
  syntheticOracle: Address
) {
  const syntheticAsset = PublicKey.findProgramAddressSync(
    [Buffer.from("asset"), translateAddress(syntheticOracle).toBuffer()],
    programId
  )[0];
  const collateralVault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), syntheticAsset.toBuffer()],
    programId
  )[0];
  const syntheticMint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), syntheticAsset.toBuffer()],
    programId
  )[0];
  const assetAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority"), syntheticAsset.toBuffer()],
    programId
  )[0];
  return { syntheticAsset, collateralVault, syntheticMint, assetAuthority };
}

export function marginAccountPDA(
  programId: PublicKey,
  owner: PublicKey,
  syntheticAsset: Address
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("margin_account"),
      translateAddress(syntheticAsset).toBuffer(),
      owner.toBuffer(),
    ],
    programId
  )[0];
}

export function swapPoolPDA(
  programId: PublicKey,
  mintA: Address,
  mintB: Address
) {
  const swapPool = PublicKey.findProgramAddressSync(
    [
      Buffer.from("swap_pool"),
      translateAddress(mintA).toBuffer(),
      translateAddress(mintB).toBuffer(),
    ],
    programId
  )[0];
  const authority = PublicKey.findProgramAddressSync(
    [swapPool.toBuffer()],
    programId
  )[0];
  const vaultA = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_a"), swapPool.toBuffer()],
    programId
  )[0];
  const vaultB = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_b"), swapPool.toBuffer()],
    programId
  )[0];
  const lpmint = PublicKey.findProgramAddressSync(
    [Buffer.from("lpmint"), swapPool.toBuffer()],
    programId
  )[0];

  return {
    swapPool,
    authority,
    vaultA,
    vaultB,
    lpmint,
  };
}
