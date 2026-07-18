"use client";

import Image from "next/image";

interface LogoMarkProps {
  className?: string;
  /** Tailwind size classes for the mark box, e.g. "h-9 w-9" */
  boxClassName?: string;
  /** Stronger glow for hero / background use */
  glow?: "nav" | "hero";
  priority?: boolean;
}

/**
 * Transparent NP shield mark with a soft white glow.
 * Uses Next basePath automatically via next/image.
 */
export function LogoMark({
  className = "",
  boxClassName = "h-9 w-9",
  glow = "nav",
  priority = false,
}: LogoMarkProps) {
  const glowClass = glow === "hero" ? "logo-glow-hero" : "logo-glow-nav";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${boxClassName} ${glowClass} ${className}`}
    >
      <Image
        src="/brand/newphase-mark.png"
        alt=""
        fill
        sizes="(max-width: 768px) 280px, 420px"
        className="object-contain"
        priority={priority}
      />
    </span>
  );
}

export default LogoMark;
