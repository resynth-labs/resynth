import { useTheme } from "styled-components";

import { ColorPalette } from "../../../styles/palette";

export const Loader = ({ color }: { color?: keyof ColorPalette }) => {
  const { palette } = useTheme();

  return (
    <svg
      width={30}
      height={20}
      version="1.1"
      id="L4"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 100 100"
      xmlSpace="preserve"
    >
      <circle
        fill={palette[color || "primary"]}
        stroke="none"
        cx="0%"
        cy="50%"
        r={15}
      >
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin="0.1"
        />
      </circle>
      <circle
        fill={palette[color || "primary"]}
        stroke="none"
        cx="50%"
        cy="50%"
        r={15}
      >
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin="0.2"
        />
      </circle>
      <circle
        fill={palette[color || "primary"]}
        stroke="none"
        cx="100%"
        cy="50%"
        r={15}
      >
        <animate
          attributeName="opacity"
          dur="1s"
          values="0;1;0"
          repeatCount="indefinite"
          begin="0.3"
        />
      </circle>
    </svg>
  );
};
