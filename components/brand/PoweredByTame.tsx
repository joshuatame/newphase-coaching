"use client";

import { assetUrl } from "@/lib/base-path";

/**
 * Fixed “Powered by Tame Dynamics” mark — bottom of the viewport.
 */
export function PoweredByTame() {
  return (
    <a
      href="https://tame-dynamics.com"
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-4 left-1/2 z-[40] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-[color:var(--edge-strong)] bg-near-black/85 px-4 py-2.5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition hover:border-sky-400/40 hover:bg-carbon/95 md:bottom-6"
      aria-label="Powered by Tame Dynamics"
    >
      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-steel transition group-hover:text-soft-silver">
        Powered by
      </span>
      <img
        src={assetUrl("/brand/tame-dynamics.png")}
        alt="Tame Dynamics"
        width={150}
        height={34}
        className="h-6 w-auto object-contain sm:h-7"
      />
    </a>
  );
}

export default PoweredByTame;
