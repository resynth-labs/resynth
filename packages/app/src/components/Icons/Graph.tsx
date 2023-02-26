import { useTheme } from "styled-components";

import { ColorPalette } from "../../styles/palette";

export const Graph = ({
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
      version="1.1"
      id="Capa_1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 60 60"
      xmlSpace="preserve"
      fill={palette[color || "accent"]}
    >
      <path
        d="M59,51.5h-1v-37H46v37h-3v-45H31v45h-3v-14H16v14h-3v-23H1v23c-0.552,0-1,0.447-1,1s0.448,1,1,1h12h3h12h3h12h3h12h1
	c0.552,0,1-0.447,1-1S59.552,51.5,59,51.5z"
      />
    </svg>
  );
};
