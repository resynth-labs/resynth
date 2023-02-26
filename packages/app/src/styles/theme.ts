import { ThemeMode } from "../contexts/ThemeModeProvider";
import { ColorPalette, getColorPalette } from "./palette";

export interface Theme {
  mode: ThemeMode;
  palette: ColorPalette;
  borderRadius: {
    sm: string;
    base: string;
    lg: string;
  };
  shadow: {
    base: string;
  };
  modal: {
    background: string;
    minWidth: string;
    maxWidth: string;
    minHeight: string;
    maxHeight: string;
  };
  spacing: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
  };
  opacity: {
    disabled: number;
    subtle: number;
  };
  transitionDuration: {
    short: string;
    base: string;
    long: string;
  };
  font: {
    family: string;
    url: string;
    size: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
    };
    weight: {
      base: number;
      bold: number;
    };
  };
  view: {
    maxWidth: string;
    elements: {
      maxWidth: string;
    };
    breakpoints: {
      mobile: string;
    };
  };
}

export const getTheme = (mode: ThemeMode): Theme => ({
  mode,
  get palette() {
    return getColorPalette(this.mode);
  },
  get borderRadius() {
    return {
      get sm() {
        return `calc(${this.base} * 0.7)`;
      },
      base: "10px",
      get lg() {
        return `calc(${this.base} * 1.75)`;
      },
    };
  },
  get shadow() {
    const alpha = this.mode === "light" ? 0.4 : 0.8;
    return {
      base: `0px 7px 30px -15px rgba(0, 0, 0, ${alpha})`,
    };
  },
  modal: {
    background: "rgba(0, 0, 0, 0.7)",
    minWidth: "300px",
    maxWidth: "500px",
    minHeight: "100px",
    maxHeight: "800px",
  },
  spacing: {
    get xs() {
      return this.base / 2.5;
    },
    get sm() {
      return this.base / 2;
    },
    base: 10,
    get lg() {
      return this.base * 1.5;
    },
    get xl() {
      return this.base * 2;
    },
  },
  opacity: {
    disabled: 0.5,
    subtle: 0.85,
  },
  transitionDuration: {
    short: "0.05s",
    base: "0.1s",
    long: "0.125s",
  },
  font: {
    family: "Outfit",
    url: "https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap",
    size: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "20px",
    },
    weight: {
      base: 400,
      bold: 700,
    },
  },
  view: {
    maxWidth: "1000px",
    elements: {
      maxWidth: "450px",
    },
    breakpoints: {
      mobile: "800px",
    },
  },
});
