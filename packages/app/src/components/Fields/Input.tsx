import styled from "styled-components";

import { color, spacing } from "../../styles/mixins";
import { Button } from "../Buttons";
import { FieldProps, FieldContainer, FieldLabel } from ".";
import { BodyText } from "../Typography";

interface InputProps extends Omit<FieldProps, "value" | "onChange"> {
  value: string;
  type?: "text" | "number";
  max?: number;
  maxButton?: {
    isActive?: boolean;
    onClick: () => void;
  };
  onChange: (value: string) => void;
}

const StyledInput = styled.input`
  width: 100%;
  border: unset;
  color: inherit;
  background: unset;
  padding: ${spacing()} ${spacing("lg")};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "auto")};

  ::placeholder {
    color: ${color("accent")};
  }
`;

const MaxButton = styled(Button)<{ isActive?: boolean }>`
  position: absolute;
  top: 50%;
  right: ${spacing()};
  transform: translateY(-50%) !important;
  padding: ${spacing("xs")} ${spacing("sm")} calc(${spacing("xs")} - 1px)
    ${spacing("sm")};
  color: ${({ isActive }) => (isActive ? color("base") : color("accent"))};
  background: ${({ isActive }) => (isActive ? color("accent") : "unset")};
  border: 1.5px solid ${color("accent")};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.font.size.sm};
  opacity: ${({ theme }) => theme.opacity.subtle};

  ${({ disabled }) => {
    if (disabled) return "";

    return `
      &:hover {
        box-shadow: unset;
      }
    `;
  }};
`;

export const Input = ({
  type,
  max,
  maxButton,
  value,
  label,
  placeholder,
  disabled,
  onChange,
  ...fieldProps
}: InputProps) => (
  <FieldContainer
    flexColumn
    width={fieldProps.width}
    needsValue={fieldProps.needsValue}
    error={!!fieldProps.error}
    disabled={disabled}
  >
    {!!label && <FieldLabel>{label}</FieldLabel>}
    <StyledInput
      value={value?.toString()}
      placeholder={placeholder}
      onChange={(e) => {
        let input = e.target.value;
        if (type === "number") {
          while (!input.includes(".") && input.length > 1 && input[0] === "0") {
            input = input.substring(1);
          }
          if (isNaN(+input) || +input < 0 || +input > Number.MAX_SAFE_INTEGER) {
            input = "";
          }
        }

        onChange(input);
      }}
      onBlur={() => (max ? onChange(Math.min(+value, max).toString()) : null)}
      disabled={disabled}
    />
    {!!maxButton && type === "number" && (
      <MaxButton
        onClick={maxButton.onClick}
        isActive={maxButton.isActive}
        disabled={disabled}
      >
        MAX
      </MaxButton>
    )}
    {typeof fieldProps.error === "string" && (
      <BodyText color="error" size="sm">
        {fieldProps.error}
      </BodyText>
    )}
  </FieldContainer>
);
