import { useThemeMode } from "../../contexts/ThemeModeProvider";
import { ThemeCircle } from "../Icons";
import { IconButton } from "./Button";

export const ThemeToggleButton = () => {
  const { toggleThemeMode } = useThemeMode();

  const handleToggle = () => {
    const transitions: string[] = [];
    const elements = document.querySelectorAll<HTMLElement>("*");
    elements.forEach((element) => {
      transitions.push(element.style.transition);
      element.style.transition = "unset";
    });

    toggleThemeMode();
    setTimeout(() => {
      elements.forEach((element, i) => {
        element.style.transition = transitions[i];
      });
    }, 500);
  };

  return (
    <IconButton onClick={handleToggle}>
      <ThemeCircle color="base" />
    </IconButton>
  );
};
