"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { SceneHandle } from "./DumbbellScene";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";
import { useReducedMotion } from "@/lib/useReducedMotion";

const DumbbellScene = dynamic(
  () => import("./DumbbellScene").then((m) => m.DumbbellScene),
  { ssr: false },
);

/**
 * Vanta-style scroll experience:
 * the hex dumbbell stays large and present while continuous rotation is
 * scrubbed directly to page scroll progress (no fly-away / disappear).
 */
export function ScrollDumbbell() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [mounted, setMounted] = useState(false);
  const [lowPoly, setLowPoly] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    setLowPoly(window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4);
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglOk(Boolean(gl));
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || reducedMotion || !webglOk) return;
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const gsapMod = await import("gsap");
        const stMod = await import("gsap/ScrollTrigger");
        if (cancelled) return;
        const gsap = gsapMod.default || gsapMod.gsap;
        const ScrollTrigger = stMod.ScrollTrigger || stMod.default;
        gsap.registerPlugin(ScrollTrigger);

        const waitForHandle = () =>
          new Promise<SceneHandle>((resolve, reject) => {
            let frames = 0;
            const tick = () => {
              if (cancelled) return;
              if (handleRef.current?.group) {
                resolve(handleRef.current);
                return;
              }
              frames += 1;
              if (frames > 180) {
                reject(new Error("3D scene handle timeout"));
                return;
              }
              requestAnimationFrame(tick);
            };
            tick();
          });

        const handle = await waitForHandle();
        if (cancelled || !handle.group) return;
        const g = handle.group;

        // Hero resting pose — large, slightly right of centre (Vanta composition).
        const isMobile = window.innerWidth < 768;
        g.position.set(isMobile ? 0.15 : 1.35, isMobile ? 0.1 : 0.05, 0);
        g.rotation.set(0.25, -0.35, 0.15);
        g.scale.setScalar(isMobile ? 0.92 : 1.15);

        ctx = gsap.context(() => {
          // Continuous multi-axis spin scrubbed to full-page scroll — same feel as Vanta.
          gsap.to(g.rotation, {
            y: Math.PI * 4.25,
            x: 0.25 + Math.PI * 0.55,
            z: 0.15 + Math.PI * 0.35,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.15,
            },
          });

          // Subtle drift + scale breathing so the object feels alive while scrolling.
          gsap.to(g.position, {
            x: isMobile ? -0.1 : 0.55,
            y: isMobile ? 0.35 : 0.45,
            z: isMobile ? -0.4 : -0.85,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.15,
            },
          });

          gsap.to(g.scale, {
            x: isMobile ? 0.78 : 0.88,
            y: isMobile ? 0.78 : 0.88,
            z: isMobile ? 0.78 : 0.88,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.15,
            },
          });
        });

        ScrollTrigger.refresh();
      } catch (err) {
        console.warn("[NewPhase 3D] scroll animation skipped:", err);
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [mounted, reducedMotion, webglOk]);

  const showScene = mounted && !reducedMotion && webglOk;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <div className="absolute inset-0 radial-fade" />
      {showScene && (
        <ThreeErrorBoundary>
          <DumbbellScene
            lowPoly={lowPoly}
            onReady={(h) => {
              handleRef.current = h;
            }}
          />
        </ThreeErrorBoundary>
      )}
      {mounted && (reducedMotion || !webglOk) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-35">
          <div className="h-44 w-44 rotate-12 rounded-[28%] border border-accent/35" />
        </div>
      )}
    </div>
  );
}

export default ScrollDumbbell;
