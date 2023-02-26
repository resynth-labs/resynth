import styled from "styled-components";
import { Theme } from "../../styles/theme";

export interface FlexboxProps extends React.HTMLProps<HTMLDivElement> {
  flexCentered?: boolean;
  flexColumn?: boolean;
  flexWrap?: boolean;
  justifyContent?:
    | "center"
    | "flex-start"
    | "flex-end"
    | "space-between"
    | "space-evenly";
  alignItems?:
    | "center"
    | "flex-start"
    | "flex-end"
    | "space-between"
    | "space-evenly";
  margin?: keyof Theme["spacing"];
  marginX?: keyof Theme["spacing"];
  marginY?: keyof Theme["spacing"];
  marginLeft?: keyof Theme["spacing"];
  marginRight?: keyof Theme["spacing"];
  marginTop?: keyof Theme["spacing"];
  marginBottom?: keyof Theme["spacing"];
}

export const Flexbox = styled.div<FlexboxProps>`
  display: flex;
  width: ${({ width }) => width || "unset"};
  height: ${({ height }) => height || "unset"};
  align-items: ${({ flexCentered, alignItems }) =>
    flexCentered ? "center" : alignItems || "flex-start"};
  justify-content: ${({ flexCentered, justifyContent }) =>
    flexCentered ? "center" : justifyContent || "flex-start"};
  flex-direction: ${({ flexColumn }) => (flexColumn ? "column" : "row")};
  flex-wrap: ${({ flexWrap }) => (flexWrap ? "wrap" : "no-wrap")};
  margin: ${({ margin, marginX, marginY, theme }) =>
    margin
      ? `${theme.spacing[margin]}px`
      : marginX
      ? `0 ${theme.spacing[marginX]}px`
      : marginY
      ? `${theme.spacing[marginY]}px 0`
      : "unset"};
  margin-left: ${({ marginLeft, theme }) =>
    marginLeft ? `${theme.spacing[marginLeft]}px` : ""};
  margin-right: ${({ marginRight, theme }) =>
    marginRight ? `${theme.spacing[marginRight]}px` : ""};
  margin-top: ${({ marginTop, theme }) =>
    marginTop ? `${theme.spacing[marginTop]}px` : ""};
  margin-bottom: ${({ marginBottom, theme }) =>
    marginBottom ? `${theme.spacing[marginBottom]}px` : ""};
`;
