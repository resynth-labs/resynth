import { Network } from "../contexts/NetworkProvider";

export const openTxInExplorer = (txId: string, network?: Network) =>
  window.open(
    `https://solscan.io/${txId}${
      network && network !== "mainnet" ? `?cluster=${network}` : ""
    }`,
    "_blank",
    "noopener noreferrer"
  );
