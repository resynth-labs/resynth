import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type ThemeMode = "light" | "dark";

const ThemeModeContext = createContext<{
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}>({ themeMode: "dark", setThemeMode: () => {} });

export const ThemeModeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>(
    "preferredThemeMode",
    "dark"
  );

  return (
    <ThemeModeContext.Provider
      value={{
        themeMode,
        setThemeMode,
      }}
    >
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const { themeMode, setThemeMode } = useContext(ThemeModeContext);
  return {
    themeMode,
    toggleThemeMode: () =>
      setThemeMode(themeMode === "light" ? "dark" : "light"),
  };
};
