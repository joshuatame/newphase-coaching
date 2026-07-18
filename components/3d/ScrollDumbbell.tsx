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
 * - idle slow Y spin (in model)
 * - scroll: grow → zoom toward camera → disappear
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
              if (frames > 360) {
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

        const startScale = isMobile ? 0.95 : 1.15;
        g.scale.setScalar(startScale);

        ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.2,
            },
          });

          // 0 → 45%: grow in place
          tl.to(
            g.scale,
            {
              x: startScale * 1.45,
              y: startScale * 1.45,
              z: startScale * 1.45,
              ease: "none",
            },
            0,
          ).to(
            g.position,
            {
              x: isMobile ? 0.05 : 0.85,
              y: isMobile ? 0.05 : 0.1,
              z: 0.4,
              ease: "none",
            },
            0,
          );

          // 45 → 75%: keep growing, pull toward camera
          tl.to(
            g.scale,
            {
              x: startScale * 2.4,
              y: startScale * 2.4,
              z: startScale * 2.4,
              ease: "none",
            },
            0.45,
          ).to(
            g.position,
            {
              x: isMobile ? 0 : 0.35,
              y: 0.15,
              z: 2.2,
              ease: "none",
            },
            0.45,
          );

          // 75 → 100%: zoom through camera and disappear
          tl.to(
            g.scale,
            {
              x: startScale * 5.5,
              y: startScale * 5.5,
              z: startScale * 5.5,
              ease: "power1.in",
            },
            0.75,
          )
            .to(
              g.position,
              {
                x: 0,
                y: 0.2,
                z: 8.5,
                ease: "power2.in",
              },
              0.75,
            );

          if (wrap) {
            tl.to(wrap, { opacity: 0, ease: "power1.in" }, 0.82);
          }
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
  }, [mounted, reducedMotion, webglOk, failed]);

  const showScene = mounted && !reducedMotion && webglOk && !failed;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-[100svh] w-full"
    >
      <div className="absolute inset-0 bg-obsidian" />
      <div className="absolute inset-0 radial-fade" />

      {showScene && (
        <ThreeErrorBoundary
          fallback={
            <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[12%]">
              <HexFallback />
            </div>
          }
        >
          <div ref={canvasWrapRef} className="absolute inset-0">
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
        <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[12%]">
          <HexFallback />
        </div>
      )}
    </div>
  );
}

function HexFallback() {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
      <div className="h-40 w-40 rotate-45 rounded-[22%] border border-accent/45 bg-gradient-to-br from-graphite to-obsidian shadow-[0_0_50px_-12px_rgba(182,255,59,0.4)]" />
    </div>
  );
}

export default ScrollDumbbell;
