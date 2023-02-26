import styled from "styled-components";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";

import { useModals } from "../../contexts/ModalsProvider";
import { formatPublicKey } from "../../utils/format";
import { spacing } from "../../styles/mixins";
import { Flexbox, Spacer } from "../Layout";
import { AccentText, Link } from "../Typography";
import { IconButton, LinkButton } from "../Buttons";
import { Modal } from ".";
import { Wallet } from "../Icons";

const WalletOptionContainer = styled(Flexbox)<{
  isConnected: boolean;
  isDisabled: boolean;
}>`
  margin-bottom: ${spacing()};
  padding: ${spacing()} ${spacing("lg")};
  background: ${({ isConnected, theme }) =>
    isConnected ? theme.palette.primary : theme.palette.secondary};
  box-shadow: ${({ isConnected, theme }) =>
    isConnected ? theme.shadow.base : "unset"};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  opacity: ${({ isDisabled, theme }) =>
    isDisabled ? theme.opacity.subtle : 1};
`;

export const WalletOption = ({
  label,
  iconUrl,
  isConnected,
  isDisabled,
  onClick,
}: {
  label: string;
  iconUrl: string;
  isConnected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) => (
  <WalletOptionContainer
    width="100%"
    alignItems="center"
    justifyContent="space-between"
    isConnected={isConnected}
    isDisabled={isDisabled}
  >
    <img width="30px" height="auto" src={iconUrl} alt={label} />
    <Flexbox justifyContent="center" alignItems="flex-end" flexColumn>
      <AccentText color={isConnected ? "base" : "accent"}>{label}</AccentText>
      <Spacer size="xs" />
      <LinkButton onClick={onClick} disabled={isDisabled}>
        {isConnected ? "Disconnect" : "Connect"}
      </LinkButton>
    </Flexbox>
  </WalletOptionContainer>
);

export const WalletModal = () => {
  const { wallets, select, wallet, publicKey } = useWallet();
  const { isWalletModalOpen, setIsWalletModalOpen } = useModals();
  const detectedWallets = wallets.filter(
    (wallet) =>
      wallet.readyState === WalletReadyState.Installed ||
      wallet.readyState === WalletReadyState.Loadable
  );

  return (
    <>
      <IconButton onClick={() => setIsWalletModalOpen(true)}>
        <Flexbox marginX={publicKey ? "xs" : undefined}>
          <Wallet color="base" />
          {publicKey && (
            <AccentText color="base" weight="bold" size="xs">
              &nbsp;&nbsp;{formatPublicKey(publicKey)}
            </AccentText>
          )}
        </Flexbox>
      </IconButton>
      <Modal
        title="Select a Wallet"
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      >
        <Flexbox width="100%" flexWrap>
          {detectedWallets.length ? (
            detectedWallets.map((wal) => (
              <WalletOption
                key={wal.adapter.name}
                label={
                  wal.adapter.publicKey
                    ? formatPublicKey(wal.adapter.publicKey)
                    : wal.adapter.name
                }
                iconUrl={wal.adapter.icon}
                isConnected={
                  !!(
                    wallet?.adapter.connected &&
                    wallet.adapter.name === wal.adapter.name
                  )
                }
                isDisabled={
                  !!(
                    wallet?.adapter.connected &&
                    wallet.adapter.name !== wal.adapter.name
                  )
                }
                onClick={() => {
                  select(wal.adapter.name);
                  wal.adapter[
                    wal.adapter.connected ? "disconnect" : "connect"
                  ]().then(() => setIsWalletModalOpen(false));
                }}
              />
            ))
          ) : (
            <Link
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Don't have a wallet?
            </Link>
          )}
        </Flexbox>
      </Modal>
    </>
  );
};
