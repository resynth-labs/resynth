import { createContext, useContext, useState } from "react";

const ModalsContext = createContext<{
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (isWalletModalOpen: boolean) => void;
}>({ isWalletModalOpen: false, setIsWalletModalOpen: () => {} });

export const ModalsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  return (
    <ModalsContext.Provider
      value={{
        isWalletModalOpen,
        setIsWalletModalOpen,
      }}
    >
      {children}
    </ModalsContext.Provider>
  );
};

export const useModals = () => useContext(ModalsContext);
