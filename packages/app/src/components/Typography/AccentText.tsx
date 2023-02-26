import styled from "styled-components";

import { Theme } from "../../styles/theme";
import { ColorPalette } from "../../styles/palette";
import { color as c } from "../../styles/mixins";

export const AccentText = styled.span<{
  color?: keyof ColorPalette;
  size?: keyof Theme["font"]["size"];
  weight?: keyof Theme["font"]["weight"];
}>`
  color: ${({ color }) => c(color || "accent")};
  font-family: inherit;
  font-size: ${({ theme, size }) => theme.font.size[size || "sm"]};
  font-weight: ${({ theme, weight }) => theme.font.weight[weight || "base"]};
  line-height: ${({ theme }) => theme.font.size.base};
`;
