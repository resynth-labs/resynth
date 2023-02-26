import styled from "styled-components";

import { spacing } from "../../styles/mixins";
import { Close } from "../Icons";
import { Button } from "./Button";

const StyledCloseButton = styled(Button)`
  position: absolute;
  top: ${spacing("lg")};
  right: ${spacing("lg")};
  padding: ${spacing("xs")};
`;

export const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <StyledCloseButton onClick={onClick}>
    <Close color="primary" />
  </StyledCloseButton>
);
