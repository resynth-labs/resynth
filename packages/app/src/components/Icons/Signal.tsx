import { useTheme } from "styled-components";

import { ColorPalette } from "../../styles/palette";

export const Signal = ({
  color,
  size,
}: {
  color?: keyof ColorPalette;
  size?: string;
}) => {
  const { palette, font } = useTheme();

  return (
    <svg
      width={size || font.size.lg}
      height={size || font.size.lg}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      stroke={palette[color || "accent"]}
      color={palette[color || "accent"]}
      style={{ margin: "-3px 0 0 -4px" }}
    >
      <path d="M18 5C11.372583 5 6 10.372583 6 17M18 9C13.581722 9 10 12.581722 10 17M18 13C15.790861 13 14 14.790861 14 17" />
    </svg>
  );
};
