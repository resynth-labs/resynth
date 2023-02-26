import { useTheme } from "styled-components";

import { ColorPalette } from "../../styles/palette";

export const DownAngle = ({
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
      height={`calc(${size || font.size.base} - 4px)`}
      viewBox="0 0 16 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.80774 9.35702C7.30986 9.85798 8.12531 9.85798 8.62743 9.35702L15.0546 2.94469C15.5567 2.44373 15.5567 1.63016 15.0546 1.1292C14.5524 0.628238 13.737 0.628238 13.2349 1.1292L7.71558 6.63579L2.19627 1.13321C1.69415 0.632246 0.87871 0.632246 0.37659 1.13321C-0.12553 1.63417 -0.12553 2.44774 0.37659 2.9487L6.80373 9.36103L6.80774 9.35702Z"
        fill={palette[color || "accent"]}
      />
    </svg>
  );
};
