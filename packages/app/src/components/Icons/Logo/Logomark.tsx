import { useTheme } from "styled-components";

import { ColorPalette } from "../../../styles/palette";

export const Logomark = ({
  color,
  size,
}: {
  color?: keyof ColorPalette;
  size?: number;
}) => {
  const { palette } = useTheme();

  return (
    <svg
      width={size || "30px"}
      viewBox="0 0 500 314"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M197.001 100.281L168.012 1.94548C167.246 -0.632379 162.212 -0.632379 159.44 1.94548L53.395 100.281C50.878 102.616 52.1183 105.376 55.6932 105.376H75.7689C78.4197 105.376 79.9518 106.944 79.1979 108.89L0.196382 310.473C-0.569678 312.419 0.974603 313.988 3.62542 313.988H79.3195C81.9703 313.988 84.7306 312.419 85.4966 310.473L164.474 108.89C165.24 106.944 168 105.376 170.651 105.376H190.727C194.302 105.376 197.694 102.628 197.013 100.281H197.001Z"
        fill={palette[color || "accent"]}
      />
      <path
        d="M175.563 213.707L204.552 312.042C205.318 314.62 210.352 314.62 213.125 312.042L319.169 213.707C321.687 211.372 320.446 208.612 316.871 208.612H296.796C294.145 208.612 292.613 207.043 293.367 205.098L372.344 3.51417C373.11 1.56862 371.566 0 368.915 0H293.221C290.57 0 287.81 1.56862 287.044 3.51417L208.066 205.098C207.3 207.043 204.54 208.612 201.889 208.612H181.814C178.239 208.612 174.846 211.36 175.527 213.707H175.563Z"
        fill={palette[color || "accent"]}
      />
      <g opacity="0.6">
        <path
          d="M499.741 308.406L412.507 85.7502C411.243 82.5157 406.671 82.5157 405.406 85.7502L368.234 180.632C367.006 183.782 367.006 187.284 368.234 190.433L415.401 310.814C416.131 312.687 418.478 313.988 421.153 313.988H494.014C497.99 313.988 500.86 311.203 499.765 308.406H499.741Z"
          fill={palette[color || "accent"]}
        />
      </g>
    </svg>
  );
};
