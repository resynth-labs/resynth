export const bigIntToTokens = (bigInt: bigint, decimals: number) =>
  parseInt(bigInt.toString()) / 10 ** decimals;
