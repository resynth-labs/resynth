import { ThemeMode } from "../contexts/ThemeModeProvider";

export interface ColorPalette {
  base: string;
  primary: string;
  secondary: string;
  accent: string;
  theme: string;
  error: string;
  warning: string;
  success: string;
}

const lightThemePalette: ColorPalette = {
  base: "#ffffff",
  primary: "#242429",
  secondary: "#f2f2f2",
  accent: "#61646b",
  theme: "#dc6a6c",
  error: "red",
  warning: "#f5c416",
  success: "#4bb543",
};

const darkThemePalette: ColorPalette = {
  ...lightThemePalette,
  base: "#242429",
  primary: "#ffffff",
  secondary: "#1E1E21",
  accent: "#97949e",
};

export const getColorPalette = (mode: ThemeMode): ColorPalette =>
  mode === "light" ? lightThemePalette : darkThemePalette;
