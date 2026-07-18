"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { SceneHandle } from "./DumbbellScene";
import { useReducedMotion } from "@/lib/useReducedMotion";

const DumbbellScene = dynamic(
  () => import("./DumbbellScene").then((m) => m.DumbbellScene),
  { ssr: false },
);

/**
 * Fixed full-screen canvas that sits behind page content and is driven by
 * scroll position through GSAP ScrollTrigger. Falls back to a static hero
 * render when the user prefers reduced motion.
 */
export function ScrollDumbbell() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lowPoly, setLowPoly] = useState(false);
  const reducedMotion = useReducedMotion();

  // Defer mounting the (heavy) canvas until after first paint.
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLowPoly(window.innerWidth < 768 || navigator.hardwareConcurrency <= 4);
    }
  }, []);

  // Pause rendering when the canvas is scrolled well out of view.
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  // GSAP scroll-driven animation.
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default || gsapMod.gsap;
      const ScrollTrigger = stMod.ScrollTrigger || stMod.default;
      gsap.registerPlugin(ScrollTrigger);

      // Wait until the 3D group handle is available.
      const waitForHandle = () =>
        new Promise<SceneHandle>((resolve) => {
          const tick = () => {
            if (handleRef.current?.group) resolve(handleRef.current);
            else requestAnimationFrame(tick);
          };
          tick();
        });

      const handle = await waitForHandle();
      if (cancelled || !handle.group) return;
      const g = handle.group;
      const key = handle.keyLight;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        // Phase 1 (0 - 20%): rotate, drift horizontally, shrink slightly.
        tl.to(
          g.rotation,
          { y: Math.PI * 0.7, x: 0.2, ease: "none" },
          0,
        )
          .to(g.position, { x: 2.2, z: -0.5, ease: "none" }, 0)
          .to(g.scale, { x: 0.85, y: 0.85, z: 0.85, ease: "none" }, 0);

        // Phase 2 (20 - 50%): more rotation, move up, deeper into scene.
        tl.to(
          g.rotation,
          { y: Math.PI * 1.6, x: -0.35, ease: "none" },
          0.2,
        )
          .to(g.position, { x: -1.8, y: 1.2, z: -2.5, ease: "none" }, 0.2)
          .to(g.scale, { x: 0.7, y: 0.7, z: 0.7, ease: "none" }, 0.2);

        // Phase 3 (50 - 65%): rise toward the top, scale down, light fades.
        tl.to(
          g.position,
          { x: 0, y: 4.2, z: -3.5, ease: "power1.in" },
          0.5,
        )
          .to(g.rotation, { y: Math.PI * 2.2, ease: "none" }, 0.5)
          .to(g.scale, { x: 0.4, y: 0.4, z: 0.4, ease: "none" }, 0.5);
        if (key) {
          tl.to(key, { intensity: 0.2, ease: "none" }, 0.5);
        }

        // Phase 4 (65%+): disappear above the viewport.
        tl.to(
          g.position,
          { y: 9, ease: "power2.in" },
          0.65,
        ).to(g.scale, { x: 0.05, y: 0.05, z: 0.05, ease: "none" }, 0.65);
      });

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [mounted, reducedMotion]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      {/* atmospheric backdrop always present */}
      <div className="absolute inset-0 radial-fade" />
      {mounted && !reducedMotion && visible && (
        <DumbbellScene
          lowPoly={lowPoly}
          onReady={(h) => (handleRef.current = h)}
        />
      )}
      {mounted && reducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="h-40 w-40 rounded-full border border-accent/30" />
        </div>
      )}
    </div>
  );
}

export default ScrollDumbbell;
