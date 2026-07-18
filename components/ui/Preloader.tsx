"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [gone, setGone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1500);
    const t2 = setTimeout(() => setHidden(true), 2100);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-obsidian transition-opacity duration-500 ${
        gone ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={gone}
    >
      <p className="font-display text-5xl tracking-wide text-off-white sm:text-7xl">
        NEW<span className="text-accent">PHASE</span>
      </p>
      <p className="mt-4 eyebrow animate-pulse-soft">Building your next phase</p>
      <div className="mt-8 h-px w-40 overflow-hidden bg-graphite">
        <span className="block h-full w-full origin-left animate-[np-fade-up_1.4s_ease-out] bg-accent" />
      </div>
    </div>
  );
}

export default Preloader;
