import { useState } from "react";
import styled from "styled-components";

import { color, spacing, transition } from "../../styles/mixins";
import { DownAngle } from "../Icons";
import { Flexbox } from "../Layout";
import { AccentText, BodyText } from "../Typography";
import { FieldProps, FieldContainer, FieldLabel } from ".";

interface SelectProps extends Omit<FieldProps, "value" | "onChange"> {
  value: SelectOption;
  options: SelectOption[];
  noOptionsMessage?: string;
  openOnHover?: boolean;
  onChange: (option: SelectOption) => void;
}
export interface SelectOption {
  key: string | number;
  label: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const OptionsContainer = styled(Flexbox)<{ isOpen: boolean }>`
  position: absolute;
  top: ${({ isOpen, theme }) =>
    isOpen
      ? `calc(100% + ${theme.spacing.sm}px)`
      : `calc(100% + ${theme.spacing.sm * 4}px)`};
  left: 0;
  width: 100%;
  height: auto;
  max-height: 200px;
  padding: ${spacing("sm")};
  background: ${color("secondary")};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  box-shadow: ${({ theme }) => theme.shadow.base};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  overflow: hidden auto;
  transition: ${transition("all", "long", "ease-in")};
  z-index: ${({ isOpen }) => (isOpen ? 100 : -100)};
`;

const OptionContainer = styled(Flexbox)<{
  isActive?: boolean;
  isSelectedOption?: boolean;
}>`
  min-height: 40px;
  padding: ${({ isSelectedOption, theme }) =>
    isSelectedOption
      ? `${theme.spacing.sm}px ${theme.spacing.lg}px calc(${theme.spacing.sm}px + 2px)`
      : `${theme.spacing.sm}px ${theme.spacing.base}px`};
  margin: ${({ isSelectedOption }) => (isSelectedOption ? 0 : "1px")} 0;
  color: ${color("primary")};
  background: ${({ isActive, theme }) =>
    isActive ? theme.palette.base : "unset"};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  transition: ${transition()};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};

  ${({ isSelectedOption, theme }) => {
    if (isSelectedOption) return "";

    return `
      &:hover {
        background: ${theme.palette.base};
      }
    `;
  }}
`;

const OptionText = styled(BodyText)`
  width: 100%;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const EmptyMessage = styled(Flexbox)`
  padding: ${spacing("sm")} ${spacing()};
`;

export const Select = ({
  options,
  value,
  label,
  placeholder,
  noOptionsMessage,
  openOnHover,
  disabled,
  onChange,
  ...fieldProps
}: SelectProps) => {
  const [areOptionsOpen, setAreOptionsOpen] = useState(false);

  return (
    <FieldContainer
      flexColumn
      width={fieldProps.width}
      needsValue={fieldProps.needsValue}
      error={!!fieldProps.error}
      disabled={disabled}
      onClick={() => (disabled ? null : setAreOptionsOpen(!areOptionsOpen))}
      onMouseEnter={() =>
        openOnHover && !disabled ? setAreOptionsOpen(true) : null
      }
    >
      {!!label && <FieldLabel>{label}</FieldLabel>}
      <Option
        {...value}
        rightElement={<DownAngle />}
        isSelectedOption
        disabled={disabled}
      />
      <OptionsContainer
        flexColumn
        isOpen={areOptionsOpen}
        onMouseLeave={() => setAreOptionsOpen(false)}
      >
        {options.length ? (
          options.map((option) => (
            <Flexbox
              key={option.key}
              width="100%"
              onClick={() => onChange(option)}
            >
              <Option {...option} isActive={value?.key === option.key} />
            </Flexbox>
          ))
        ) : (
          <EmptyMessage>
            <AccentText>{noOptionsMessage || "N/A"}</AccentText>
          </EmptyMessage>
        )}
      </OptionsContainer>
      {typeof fieldProps.error === "string" && (
        <BodyText color="error" size="sm">
          {fieldProps.error}
        </BodyText>
      )}
    </FieldContainer>
  );
};

const Option = (
  option: SelectOption & {
    isActive?: boolean;
    isSelectedOption?: boolean;
    disabled?: boolean;
  }
) => (
  <OptionContainer
    width="100%"
    alignItems="center"
    justifyContent="space-between"
    isActive={option.isActive}
    isSelectedOption={option.isSelectedOption}
    disabled={option.disabled}
  >
    <Flexbox
      width={option.isSelectedOption ? "calc(100% - 25px)" : "100%"}
      justifyContent="flex-start"
      alignItems="center"
    >
      {!!option.leftElement && (
        <Flexbox marginRight="sm">{option.leftElement}</Flexbox>
      )}
      <OptionText>{option.label}</OptionText>
    </Flexbox>
    <Flexbox style={{ textAlign: "right" }}>{option.rightElement}</Flexbox>
  </OptionContainer>
);
