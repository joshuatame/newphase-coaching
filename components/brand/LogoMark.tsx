"use client";

import { assetUrl } from "@/lib/base-path";

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
 * Plain <img> + assetUrl so basePath is never dropped (next/image was).
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
      <img
        src={assetUrl("/brand/newphase-mark.png")}
        alt=""
        width={420}
        height={380}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export default LogoMark;
