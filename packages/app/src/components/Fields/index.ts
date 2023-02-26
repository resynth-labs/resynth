import styled from "styled-components";

import { color, spacing, transition } from "../../styles/mixins";
import { Flexbox } from "../Layout";
import { AccentText } from "../Typography";
import { SelectOption } from "./Select";

export * from "./Input";
export * from "./Select";

export interface FieldProps {
  width?: string;
  value?: string | boolean | SelectOption;
  label?: string;
  placeholder?: string;
  needsValue?: boolean;
  error?: string | boolean;
  disabled?: boolean;
  onChange?: (value: string | boolean | SelectOption) => void;
}

export const FieldLabel = styled(AccentText)`
  margin: calc(${spacing("sm")} + 3px) ${spacing("lg")} -3px;
`;

export const FieldContainer = styled(Flexbox)<FieldProps>`
  position: relative;
  width: ${({ width }) => width || "100%"};
  height: 62px;
  margin: ${spacing("sm")} 0;
  background: ${color("secondary")};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  border: 2px solid
    ${({ needsValue, error }) => {
      if (needsValue) return color("theme");
      if (error) return color("error");
      return "transparent";
    }};
  transition: ${transition()};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "")};
`;
