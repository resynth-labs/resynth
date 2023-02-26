import { useTheme } from "styled-components";
import { Toaster } from "react-hot-toast";

export const Notifications = () => {
  const theme = useTheme();

  return (
    <Toaster
      gutter={theme.spacing.lg}
      toastOptions={{
        style: {
          maxWidth: "375px",
          padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
          color: theme.palette.base,
          background: theme.palette.primary,
          fontSize: theme.font.size.base,
          fontWeight: theme.font.weight.base,
          boxShadow: theme.shadow.base,
          transitionDuration: theme.transitionDuration.base,
        },
      }}
    />
  );
};
