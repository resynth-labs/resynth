import { createContext, useContext } from "react";

import { useLocalStorage } from "../hooks/useLocalStorage";

export type Network = "mainnet" | "devnet" | "localnet";
export const networkOptions: Network[] = [
  "mainnet",
  "devnet",
  "localnet",
] as Network[];

const NetworkContext = createContext<{
  network: Network;
  setNetwork: (network: Network) => void;
}>({ network: "mainnet", setNetwork: () => {} });

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [network, setNetwork] = useLocalStorage<Network>(
    "preferredNetwork",
    "mainnet"
  );

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
