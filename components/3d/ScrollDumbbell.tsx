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
 * Site-wide fixed GLB dumbbell:
 * idle Y spin + scroll grow → zoom in → disappear
 */
export function ScrollDumbbell() {
  const handleRef = useRef<SceneHandle | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [lowPoly, setLowPoly] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    // Prefer starting at top so the model is visible on first paint.
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
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
    if (!mounted || reducedMotion || !webglOk || failed) return;
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
              if (frames > 480) {
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
        const wrap = canvasWrapRef.current;
        const isMobile = window.innerWidth < 768;

        // Ensure visible starting state (guards against restored mid-scroll).
        gsap.set(g.scale, { x: 1, y: 1, z: 1 });
        gsap.set(g.position, {
          x: isMobile ? 0 : 1.15,
          y: isMobile ? 0.05 : 0.1,
          z: 0,
        });
        if (wrap) gsap.set(wrap, { opacity: 1 });

        ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.15,
              invalidateOnRefresh: true,
            },
          });

          // 0–40%: grow
          tl.to(
            g.scale,
            { x: 1.55, y: 1.55, z: 1.55, ease: "none" },
            0,
          ).to(
            g.position,
            {
              x: isMobile ? 0 : 0.9,
              y: 0.15,
              z: 0.35,
              ease: "none",
            },
            0,
          );

          // 40–70%: larger + closer
          tl.to(
            g.scale,
            { x: 2.6, y: 2.6, z: 2.6, ease: "none" },
            0.4,
          ).to(
            g.position,
            {
              x: isMobile ? 0 : 0.35,
              y: 0.2,
              z: 2.4,
              ease: "none",
            },
            0.4,
          );

          // 70–100%: zoom through camera and fade
          tl.to(
            g.scale,
            { x: 6, y: 6, z: 6, ease: "power1.in" },
            0.7,
          ).to(
            g.position,
            { x: 0, y: 0.25, z: 9, ease: "power2.in" },
            0.7,
          );

          if (wrap) {
            tl.to(wrap, { opacity: 0, ease: "power1.in" }, 0.84);
          }
        });

        ScrollTrigger.refresh();
      } catch (err) {
        console.warn("[NewPhase 3D] scroll animation skipped:", err);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [mounted, reducedMotion, webglOk, failed]);

  const showScene = mounted && !reducedMotion && webglOk && !failed;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-obsidian" />
      <div className="absolute inset-0 radial-fade" />

      {showScene && (
        <ThreeErrorBoundary
          fallback={
            <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[10%]">
              <HexFallback />
            </div>
          }
        >
          <div ref={canvasWrapRef} className="absolute inset-0 opacity-100">
            <DumbbellScene
              lowPoly={lowPoly}
              onReady={(h) => {
                handleRef.current = h;
              }}
            />
          </div>
        </ThreeErrorBoundary>
      )}

      {mounted && (reducedMotion || !webglOk || failed) && (
        <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[10%]">
          <HexFallback />
        </div>
      )}
    </div>
  );
}

function HexFallback() {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
      <div className="h-44 w-44 rotate-45 rounded-[22%] border border-accent/50 bg-gradient-to-br from-graphite to-obsidian shadow-[0_0_60px_-10px_rgba(182,255,59,0.45)]" />
      <span className="absolute text-[0.65rem] uppercase tracking-[0.25em] text-accent">
        NewPhase
      </span>
    </div>
  );
}

export default ScrollDumbbell;
