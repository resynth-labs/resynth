import { LinkButton } from "../Buttons";

export const Link = (props: React.HTMLProps<HTMLAnchorElement>) => (
  <a
    href={props.href}
    target={props.target}
    rel={props.rel}
    style={{ textDecoration: "none" }}
  >
    <LinkButton>{props.children}</LinkButton>
  </a>
);
