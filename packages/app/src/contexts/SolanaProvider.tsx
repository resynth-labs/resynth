import { createContext, useContext, useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  BackpackWalletAdapter,
  SolflareWalletAdapter,
  SolongWalletAdapter,
  CoinbaseWalletAdapter,
  TorusWalletAdapter,
  SlopeWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { Network, useNetwork } from "./NetworkProvider";

interface RpcEndpoint {
  url: string;
  tps: number;
}

const defaultRpcEndpoints: Record<Network, RpcEndpoint> = {
  mainnet: {
    url: "https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88",
    tps: 0,
  },
  devnet: {
    url: "https://api.devnet.solana.com",
    tps: 0,
  },
  localnet: {
    url: "http://localhost:8899",
    tps: 0,
  },
};

export const SolanaRpcContext = createContext<{
  rpcEndpoints: Record<Network, RpcEndpoint>;
}>({ rpcEndpoints: defaultRpcEndpoints });

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const [rpcEndpoints, setRpcEndpoints] =
    useState<Record<Network, RpcEndpoint>>(defaultRpcEndpoints);
  const { network } = useNetwork();

  useEffect(() => {
    const getSolanaTps = async (connection: Connection) => {
      try {
        const samples = await connection.getRecentPerformanceSamples(15);
        const totalTps = samples.reduce((acc, val) => {
          return acc + val.numTransactions / val.samplePeriodSecs;
        }, 0);
        const aveTps = Math.round(totalTps / samples.length);
        return aveTps;
      } catch (err) {
        console.error(err);
        return;
      }
    };

    for (const network of Object.keys(rpcEndpoints)) {
      const connection = new Connection(rpcEndpoints[network as Network].url);
      getSolanaTps(connection).then((tps) => {
        if (!tps) return;

        rpcEndpoints[network as Network].tps = tps;
        setRpcEndpoints({ ...rpcEndpoints });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wallets = [
    new PhantomWalletAdapter(),
    new BackpackWalletAdapter(),
    new SolflareWalletAdapter(),
    new SolongWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TorusWalletAdapter(),
    new SlopeWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={rpcEndpoints[network].url}>
      <WalletProvider wallets={wallets} autoConnect>
        <SolanaRpcContext.Provider value={{ rpcEndpoints }}>
          {children}
        </SolanaRpcContext.Provider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const useSolanaRpc = () => useContext(SolanaRpcContext);
