import { useTheme } from "styled-components";

import { ColorPalette } from "../../styles/palette";

export const ThemeCircle = ({
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
      viewBox="0 0 18 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.75 9.93318C15.75 6.21521 12.7266 3.19873 9 3.19873V16.6676C12.7266 16.6676 15.75 13.6512 15.75 9.93318ZM18 9.93318C18 14.8928 13.9711 18.9124 9 18.9124C4.02891 18.9124 0 14.8928 0 9.93318C0 4.97354 4.02891 0.953918 9 0.953918C13.9711 0.953918 18 4.97354 18 9.93318Z"
        fill={palette[color || "accent"]}
      />
    </svg>
  );
};
