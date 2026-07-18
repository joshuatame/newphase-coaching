import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost";

interface CommonProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = CommonProps & {
  href: string;
  external?: boolean;
};

function classes(variant: Variant, className?: string) {
  const base = "btn";
  const v = variant === "primary" ? "btn-primary" : "btn-ghost";
  return [base, v, className].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", className, children } = props;

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external || href.startsWith("http")) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes(variant, className)}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes(variant, className)}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, className: _className, children: _children, ...rest } =
    props as ButtonProps;
  void _variant;
  void _className;
  void _children;
  return (
    <button className={classes(variant, className)} {...rest}>
      {children}
    </button>
  );
}

export default Button;
