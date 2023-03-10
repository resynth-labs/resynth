import { Address, translateAddress } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

const FEE_RECEIVER_WALLET = new PublicKey(
  "HjnXUGGMgtN9WaPAJxzdwnWip6f76xGp4rUMRoVicsLr"
);

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

/** Get only the synthetic mint from a synthetic oracle */
export function syntheticMintPDA(
  programId: PublicKey,
  syntheticOracle: Address
) {
  const syntheticAsset = PublicKey.findProgramAddressSync(
    [Buffer.from("asset"), translateAddress(syntheticOracle).toBuffer()],
    programId
  )[0];
  const syntheticMint = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), syntheticAsset.toBuffer()],
    programId
  )[0];
  return syntheticMint;
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

const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export function swapPoolPDA(
  programId: PublicKey,
  mint1: Address,
  mint2: Address
) {
  let mintA: PublicKey;
  let mintB: PublicKey;
  mint1 = translateAddress(mint1);
  mint2 = translateAddress(mint2);
  if (mint1.equals(USDC)) {
    mintA = mint2;
    mintB = mint1;
  } else if (mint2.equals(USDC)) {
    mintA = mint1;
    mintB = mint2;
  } else {
    ({ mintA, mintB } = sortedOrder(
      translateAddress(mint1),
      translateAddress(mint2)
    ));
  }

  const swapPool = PublicKey.findProgramAddressSync(
    [
      Buffer.from("swap_pool2"),
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
  const feeReceiver = getAssociatedTokenAddressSync(
    lpmint,
    FEE_RECEIVER_WALLET,
    true
  );

  return {
    mintA,
    mintB,
    swapPool,
    authority,
    vaultA,
    vaultB,
    lpmint,
    feeReceiver,
    feeReceiverWallet: FEE_RECEIVER_WALLET,
  };
}

/**
 * Sorts two public keys using lexicographical order.
 * The canonical pool is one where mintA < mintB.
 * If mintB < mintA, the mints must be swapped.
 * @returns
 */
function sortedOrder(mint1: PublicKey, mint2: PublicKey) {
  let bytes1 = mint1.toBytes();
  let bytes2 = mint2.toBytes();
  let len = Math.min(bytes1.length, bytes2.length);

  for (let i = 0; i < len; i++) {
    if (bytes1[i] === bytes2[i]) {
      continue;
    }
    if (bytes1[i] < bytes2[i]) {
      return { mintA: mint1, mintB: mint2 };
    } else {
      return { mintB: mint1, mintA: mint2 };
    }
  }

  // This should never happen with pubkeys, but for completeness sake,
  // this is the remainder of lexicographical ordering,
  // Break a tie by comparing lengths
  if (bytes1.length < bytes2.length) {
    return { mintA: mint1, mintB: mint2 };
  } else if (bytes1.length > bytes2.length) {
    return { mintB: mint1, mintA: mint2 };
  } else {
    // No way to return equality here, just say A is less
    return { mintA: mint1, mintB: mint2 };
  }
}
