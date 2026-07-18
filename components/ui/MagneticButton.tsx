"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}

export function MagneticButton({
  href,
  children,
  variant = "primary",
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  const cls = [
    "btn",
    variant === "primary" ? "btn-primary" : "btn-ghost",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <span
      ref={ref}
      className="inline-flex items-center gap-2 transition-transform duration-300 ease-out"
    >
      {children}
    </span>
  );

  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} onMouseMove={onMove} onMouseLeave={onLeave}>
      {inner}
    </Link>
  );
}

export default MagneticButton;
