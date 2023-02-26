import { Theme } from "./theme";

export const color =
  (color: keyof Theme["palette"]) =>
  ({ theme }: { theme: Theme }) =>
    theme.palette[color];

export const spacing =
  (size?: keyof Theme["spacing"]) =>
  ({ theme }: { theme: Theme }) =>
    theme.spacing[size || "base"] + "px";

export const transition =
  (
    property?: string,
    duration?: keyof Theme["transitionDuration"],
    effect?: "ease" | "ease-in" | "ease-out" | "ease-in-out"
  ) =>
  ({ theme }: { theme: Theme }) =>
    `${property || "all"} ${theme.transitionDuration[duration || "base"]} ${
      effect || "ease"
    }`;
