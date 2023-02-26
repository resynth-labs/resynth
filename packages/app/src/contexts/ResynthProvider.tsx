import { createContext, useContext, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ResynthClient } from "@resynth/resynth-sdk";

import { useNetwork } from "./NetworkProvider";

const ResynthContext = createContext<{
  client: ResynthClient;
  isClientLoading: boolean;
}>({ client: {} as ResynthClient, isClientLoading: false });

export const ResynthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { network } = useNetwork();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [client, setClient] = useState(
    // new ResynthClient(network, connection, publicKey)
    new ResynthClient(network, connection)
  );
  const [isClientLoading, setIsClientLoading] = useState(false);

  // After initial render, we can load async data from ResynthClient and reset
  useEffect(() => {
    // setIsClientLoading(true);
    // ResynthClient.create(network, connection, publicKey)
    //   .then((resynth) => {
    //     setClient(resynth);
    //     setIsClientLoading(false);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     setIsClientLoading(false);
    //   });
  }, [connection, network, publicKey]);

  return (
    <ResynthContext.Provider value={{ client, isClientLoading }}>
      {children}
    </ResynthContext.Provider>
  );
};

export const useResynth = () => useContext(ResynthContext);
