import { useState } from "react";
import styled from "styled-components";

import { useSolanaRpc } from "../../contexts/SolanaProvider";
import { networkOptions, useNetwork } from "../../contexts/NetworkProvider";
import { Theme } from "../../styles/theme";
import { spacing } from "../../styles/mixins";
import { Flexbox, Spacer } from "../Layout";
import { IconButton, LinkButton } from "../Buttons";
import { Modal } from ".";
import { Signal } from "../Icons";
import { AccentText } from "../Typography";

const NetworkOption = styled(Flexbox)<{
  isConnected: boolean;
}>`
  margin-bottom: ${spacing()};
  padding: ${spacing()} ${spacing("lg")};
  background: ${({ isConnected, theme }) =>
    isConnected ? theme.palette.primary : theme.palette.secondary};
  box-shadow: ${({ isConnected, theme }) =>
    isConnected ? theme.shadow.base : "unset"};
  border-radius: ${({ theme }) => theme.borderRadius.base};
`;

const TpsIndicator = styled(Flexbox)<{ color: keyof Theme["palette"] }>`
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50px;
  background: ${({ theme, color }) => theme.palette[color]};
  &::before {
    content: "";
    position: absolute;
    border-radius: 50px;
    background: ${({ theme, color }) => theme.palette[color]};
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 0.2;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
      top: -2px;
      left: -2px;
    }
    50% {
      opacity: ${({ theme }) => theme.opacity.disabled};
      width: calc(100% + 8px);
      height: calc(100% + 8px);
      top: -4px;
      left: -4px;
    }
    100% {
      opacity: 0.2;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
      top: -2px;
      left: -2px;
    }
  }
`;

export const NetworkModal = () => {
  const { rpcEndpoints } = useSolanaRpc();
  const { network, setNetwork } = useNetwork();
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setIsNetworkModalOpen(true)}>
        <Signal color="base" />
      </IconButton>
      <Modal
        title="Select a Network"
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      >
        <Flexbox
          width="100%"
          alignItems="center"
          justifyContent="space-between"
          flexWrap
        >
          {networkOptions.map((networkOption) => {
            const isConnected = networkOption === network;
            const tps = rpcEndpoints[networkOption].tps;
            let tpsColor: keyof Theme["palette"] = isConnected
              ? "base"
              : "accent";
            if (tps > 0) {
              tpsColor =
                tps < 1000 ? "error" : tps < 1500 ? "warning" : "success";
            }

            return (
              <NetworkOption
                width="100%"
                alignItems="center"
                justifyContent="space-between"
                key={networkOption}
                isConnected={isConnected}
                onClick={() => {
                  setNetwork(networkOption);
                  setIsNetworkModalOpen(false);
                }}
              >
                <Flexbox flexCentered>
                  {!!tps && (
                    <TpsIndicator color={tpsColor} marginRight="base" />
                  )}
                  <AccentText color={tpsColor}>
                    {!!tps ? `${tps} TPS` : "N/A"}
                  </AccentText>
                </Flexbox>
                <Flexbox alignItems="flex-end" flexColumn>
                  <AccentText color={isConnected ? "base" : "accent"}>
                    {networkOption.includes("mainnet")
                      ? "Mainnet"
                      : networkOption[0].toUpperCase() + networkOption.slice(1)}
                  </AccentText>
                  <Spacer size="xs" />
                  <LinkButton
                    onClick={() => setNetwork(networkOption)}
                    disabled={isConnected}
                  >
                    {isConnected ? "Connected" : "Connect"}
                  </LinkButton>
                </Flexbox>
              </NetworkOption>
            );
          })}
        </Flexbox>
      </Modal>
    </>
  );
};
