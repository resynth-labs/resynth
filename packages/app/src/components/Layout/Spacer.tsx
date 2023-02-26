import { useTheme } from "styled-components";
import { Theme } from "../../styles/theme";

export const Spacer = ({ size }: { size?: keyof Theme["spacing"] }) => {
  const theme = useTheme();
  const height = theme.spacing[size || "base"];

  return <div style={{ width: "100%", height }}></div>;
};
