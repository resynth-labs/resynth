import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";

import { color, spacing } from "../../styles/mixins";
import { Button, ThemeToggleButton } from "../Buttons";
import { Flexbox } from ".";
import { NetworkModal, WalletModal } from "../Modals";
import { SwapArrows, Document, Graph, FullLockup, Logomark } from "../Icons";

const ROUTES: {
  path: string;
  label: string;
  icon: React.ReactNode;
  isExternal: boolean;
  isDisabled: boolean;
}[] = [
  {
    path: "/",
    label: "Swap",
    icon: <SwapArrows color="primary" />,
    isExternal: false,
    isDisabled: false,
  },
  {
    path: "#",
    label: "Docs",
    icon: <Document color="primary" />,
    isExternal: true,
    isDisabled: true,
  },
  {
    path: "#",
    label: "Data",
    icon: <Graph color="primary" />,
    isExternal: false,
    isDisabled: true,
  },
];

const NavContainer = styled(Flexbox)`
  width: 100vw;
  max-width: ${({ theme }) => theme.view.maxWidth};
  height: 75px;
  margin: 0 auto;
  padding: ${spacing("xl")};
  .mobile-logo {
    display: none;
  }

  @media screen and (max-width: ${({ theme }) =>
      theme.view.breakpoints.mobile}) {
    .mobile-logo {
      display: flex;
    }
    .desktop-logo {
      display: none;
    }
  }
`;
const NavLink = styled(Button)<{ isActive: boolean }>`
  width: ${100 / ROUTES.length}%;
  padding: ${spacing("sm")} ${spacing()};
  color: ${color("primary")};
  font-size: ${({ theme }) => theme.font.size.base};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  opacity: ${({ isActive, theme }) => (isActive ? 1 : theme.opacity.disabled)};
  svg {
    margin-right: ${spacing("sm")};
  }

  @media screen and (max-width: ${({ theme }) =>
      theme.view.breakpoints.mobile}) {
    display: ${({ disabled }) => (disabled ? "none" : "")};
  }
`;

export const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <NavContainer alignItems="center" justifyContent="space-between">
      <Flexbox width="33%" alignItems="center" justifyContent="flex-start">
        <Flexbox flexCentered className="desktop-logo">
          <FullLockup logomarkColor="theme" textColor="primary" />
        </Flexbox>
        <Flexbox flexCentered className="mobile-logo">
          <Logomark color="theme" />
        </Flexbox>
      </Flexbox>
      <Flexbox width="33%" flexCentered>
        {ROUTES.map((route) => (
          <NavLink
            key={route.label}
            isActive={route.path === location.pathname}
            disabled={route.isDisabled}
            onClick={() => {
              if (route.isDisabled) return;

              if (route.isExternal) {
                window.open(route.path, "_blank");
              } else {
                navigate(route.path);
              }
            }}
          >
            {route.icon}
            {route.label}
          </NavLink>
        ))}
      </Flexbox>
      <Flexbox width="33%" alignItems="center" justifyContent="flex-end">
        <ThemeToggleButton />
        <NetworkModal />
        <WalletModal />
      </Flexbox>
    </NavContainer>
  );
};
