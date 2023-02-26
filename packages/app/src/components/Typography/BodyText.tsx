import styled from "styled-components";

import { Theme } from "../../styles/theme";
import { ColorPalette } from "../../styles/palette";
import { color as c } from "../../styles/mixins";

export const BodyText = styled.p<{
  color?: keyof ColorPalette;
  size?: keyof Theme["font"]["size"];
  weight?: keyof Theme["font"]["weight"];
}>`
  color: ${({ color }) => (color ? c(color) : "inherit")};
  font-family: inherit;
  font-size: ${({ theme, size }) => (size ? theme.font.size[size] : "inherit")};
  font-weight: ${({ theme, weight }) => theme.font.weight[weight || "base"]};
  line-height: ${({ theme }) => theme.font.size.lg};
`;
