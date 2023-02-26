import { useTheme } from "styled-components";

import { ColorPalette } from "../../styles/palette";

export const UnknownToken = ({
  color,
  size,
}: {
  color?: keyof ColorPalette;
  size?: string;
}) => {
  const { palette, font } = useTheme();

  return (
    <svg
      width={size || font.size.base}
      height={size || font.size.base}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        opacity="0.25"
        cx="100"
        cy="100"
        r="100"
        fill={palette[color || "accent"]}
      />
      <circle
        opacity="0.35"
        cx="100"
        cy="100"
        r="75"
        fill={palette[color || "accent"]}
      />
    </svg>
  );
};
