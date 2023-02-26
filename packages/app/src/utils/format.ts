import { PublicKey } from "@solana/web3.js";

export const formatPublicKey = (
  publicKey: string | PublicKey,
  halfLength = 4
): string =>
  `${publicKey.toString().substring(0, halfLength)}...${publicKey
    .toString()
    .substring(publicKey.toString().length - halfLength)}`;
