import styled from "styled-components";

import { color, spacing, transition } from "../../styles/mixins";
import { Flexbox, Spacer } from "../Layout";
import { BodyText } from "../Typography";
import { CloseButton } from "../Buttons";

export * from "./WalletModal";
export * from "./NetworkModal";

export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const ModalContainer = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  background: ${({ theme }) => theme.modal.background};
  transition: ${transition("all", "long", "ease")};
  overflow: hidden auto;
  z-index: ${({ isOpen }) => (isOpen ? 1000 : -1000)};
`;

const StyledModal = styled(Flexbox)<{ isOpen: boolean }>`
  position: absolute;
  top: ${({ isOpen }) => (isOpen ? "50%" : "calc(50% + 100px)")};
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: ${({ theme }) => theme.modal.minWidth};
  max-width: ${({ theme }) => theme.modal.maxWidth};
  min-height: ${({ theme }) => theme.modal.minHeight};
  max-height: ${({ theme }) => theme.modal.maxHeight};
  padding: ${spacing("xl")};
  background: ${color("base")};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: ${transition("all", "long", "ease-in")};
`;

export const Modal = ({
  title,
  isOpen,
  onClose,
  children,
}: ModalProps & { children: React.ReactNode }) => (
  <ModalContainer isOpen={isOpen}>
    <StyledModal flexColumn isOpen={isOpen}>
      <BodyText weight="bold">{title}</BodyText>
      <Spacer size="xl" />
      {children}
      <CloseButton onClick={onClose} />
    </StyledModal>
  </ModalContainer>
);
