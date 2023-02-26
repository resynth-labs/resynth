import { createGlobalStyle } from "styled-components";

import { color } from "./mixins";

export const GlobalStyles = createGlobalStyle`
  @import url(${({ theme }) => theme.font.url});

  body {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    background: ${color("secondary")};
    color: ${color("primary")};
    font-family: ${({ theme }) =>
      theme.font.family}, Open-Sans, Helvetica, Sans-Serif;
    font-size: ${({ theme }) => theme.font.size.base};
    font-weight: ${({ theme }) => theme.font.weight.base};
    overflow: hidden;
  }
  h1, h2, h3, h4, p, span {
    margin: unset;
  }
  * {
    box-sizing: border-box;
  }
  *:focus-visible {
    outline: unset;
  }
`;
