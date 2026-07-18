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
 * Vanta-style fixed canvas: hex dumbbell stays large and spins with scroll.
 */
export function ScrollDumbbell() {
  const handleRef = useRef<SceneHandle | null>(null);
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
              if (frames > 240) {
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
        const isMobile = window.innerWidth < 768;

        ctx = gsap.context(() => {
          gsap.to(g.rotation, {
            y: "+=8.5",
            x: "+=1.1",
            z: "+=0.85",
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.1,
            },
          });

          gsap.to(g.position, {
            x: isMobile ? 0.05 : 1.05,
            y: isMobile ? 0.25 : 0.2,
            z: isMobile ? -0.2 : -0.45,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.1,
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
          <div
            className="absolute inset-0"
            onErrorCapture={() => setFailed(true)}
          >
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
    <div className="relative h-56 w-56 sm:h-72 sm:w-72">
      <div className="absolute inset-6 rotate-12 rounded-[28%] border border-accent/40 bg-gradient-to-br from-graphite via-carbon to-obsidian shadow-[0_0_60px_-10px_rgba(182,255,59,0.35)]" />
      <div className="absolute inset-x-[28%] inset-y-[42%] rounded-full bg-soft-silver/40" />
      <div className="absolute left-[18%] top-[38%] h-[24%] w-[16%] rotate-0 rounded-md bg-accent/80" />
      <div className="absolute right-[18%] top-[38%] h-[24%] w-[16%] rounded-md bg-accent/80" />
    </div>
  );
}

export default ScrollDumbbell;
