import styled from "styled-components";

import { color, spacing, transition } from "../../styles/mixins";
import { Loader } from "../Icons";

export const Button = styled.button<{
  halfWidth?: boolean;
  fullWidth?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ halfWidth, fullWidth }) =>
    halfWidth ? "48%" : fullWidth ? "100%" : "unset"};
  max-height: 45px;
  color: inherit;
  margin: unset;
  padding: unset;
  background: unset;
  border: unset;
  border-radius: ${({ theme }) => theme.borderRadius.base};
  font-size: ${({ theme }) => theme.font.size.base};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  opacity: ${({ disabled, theme }) => (disabled ? theme.opacity.disabled : 1)};
  transition: ${transition()};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};

  ${({ disabled, theme }) => {
    if (disabled) return "";

    return `
      &:hover {
        margin-top: -2px;
        margin-bottom: 2px;
        opacity: 1;
      }
      &:active {
        margin-top: -1px;
        margin-bottom: 1px;
        opacity: ${theme.opacity.subtle};
        transition: all ${theme.transitionDuration.short} ease;
      }
    `;
  }}
`;

const StyledPrimaryButton = styled(Button)`
  padding: ${spacing()} ${spacing("lg")} calc(${spacing()} - 2px)
    ${spacing("lg")};
  color: ${color("base")};
  background: ${color("primary")};
`;
export const PrimaryButton = ({
  halfWidth,
  fullWidth,
  label,
  isLoading,
  ...buttonProps
}: React.HTMLProps<HTMLButtonElement> & {
  halfWidth?: boolean;
  fullWidth?: boolean;
  label: string;
  isLoading?: boolean;
}) => (
  <StyledPrimaryButton
    halfWidth={halfWidth}
    fullWidth={fullWidth}
    disabled={isLoading || buttonProps.disabled}
    onClick={buttonProps.onClick}
  >
    {isLoading ? <Loader color="base" /> : label}
  </StyledPrimaryButton>
);

export const IconButton = styled(Button)`
  padding: ${spacing("sm")};
  margin: 0 ${spacing("sm")};
  background: ${color("accent")};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const LinkButton = styled(Button)`
  color: ${color("theme")};
  font-size: ${({ theme }) => theme.font.size.sm};

  ${({ disabled }) => {
    if (disabled) return "";

    return `
      &:hover {
        margin: unset;
      }
      &:active {
        margin-top: 1px;
        margin-bottom: -1px;
      }
    `;
  }}
`;
