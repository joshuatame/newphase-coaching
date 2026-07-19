"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";
import type { SceneHandle } from "./DumbbellScene";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";
import { LogoMark } from "@/components/brand/LogoMark";
import { useReducedMotion } from "@/lib/useReducedMotion";

const DumbbellScene = dynamic(
  () => import("./DumbbellScene").then((m) => m.DumbbellScene),
  { ssr: false },
);

/**
 * Site-wide fixed stage:
 * GLB dumbbell on the right → scroll grow / zoom / fade,
 * NP mark blooms in as the hand-off.
 */
export function ScrollDumbbell() {
  const handleRef = useRef<SceneHandle | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [lowPoly, setLowPoly] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const reducedMotion = useReducedMotion();

  const onReady = useCallback((h: SceneHandle) => {
    handleRef.current = h;
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    setLowPoly(
      window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4,
    );
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

        const logo = logoRef.current;
        const isMobile = window.innerWidth < 768;

        if (logo) {
          gsap.set(logo, { opacity: 0.1, scale: 0.94 });
        }

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
              if (frames > 600) {
                reject(new Error("3D scene handle timeout"));
                return;
              }
              requestAnimationFrame(tick);
            };
            tick();
          });

        let handle: SceneHandle;
        try {
          handle = await waitForHandle();
        } catch (err) {
          // Keep the canvas spinning — never swap to the diamond fallback.
          console.warn("[NewPhase 3D] scroll sync skipped:", err);
          if (logo) gsap.set(logo, { opacity: 0.22, scale: 1 });
          return;
        }

        if (cancelled || !handle.group) return;
        const g = handle.group;
        const wrap = canvasWrapRef.current;
        const coaches = document.getElementById("coaches");

        const startX = isMobile ? 0.35 : 1.15;
        gsap.set(g.scale, { x: 1, y: 1, z: 1 });
        gsap.set(g.position, {
          x: startX,
          y: isMobile ? -0.15 : 0.1,
          z: 0,
        });
        if (wrap) gsap.set(wrap, { opacity: 1 });

        ctx = gsap.context(() => {
          // Grow through the upper page, then exit right as Coaches enters.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              endTrigger: coaches || undefined,
              end: coaches ? "top 45%" : "+=1800",
              scrub: 1.1,
              invalidateOnRefresh: true,
            },
          });

          // Early scroll — gentle grow, still on the right
          tl.to(
            g.scale,
            { x: 1.35, y: 1.35, z: 1.35, ease: "none" },
            0,
          ).to(
            g.position,
            {
              x: isMobile ? 0.55 : 1.35,
              y: isMobile ? -0.05 : 0.12,
              z: 0.25,
              ease: "none",
            },
            0,
          );

          // Mid — a bit larger, still framed
          tl.to(
            g.scale,
            { x: 1.65, y: 1.65, z: 1.65, ease: "none" },
            0.45,
          ).to(
            g.position,
            {
              x: isMobile ? 0.9 : 1.7,
              y: 0.1,
              z: 0.45,
              ease: "none",
            },
            0.45,
          );

          // Final — slide off the right edge as Coaches arrives
          tl.to(
            g.scale,
            { x: 1.85, y: 1.85, z: 1.85, ease: "power1.in" },
            0.72,
          ).to(
            g.position,
            {
              x: isMobile ? 5.5 : 8.5,
              y: 0.15,
              z: 0.6,
              ease: "power2.in",
            },
            0.72,
          );

          if (wrap) {
            tl.to(wrap, { opacity: 0, ease: "power1.in" }, 0.78);
          }

          if (logo) {
            tl.to(logo, { opacity: 0.2, scale: 0.98, ease: "none" }, 0.5).to(
              logo,
              { opacity: 0.38, scale: 1.03, ease: "power1.out" },
              0.75,
            );
          }
        });

        // Recalculate once fonts/images settle (coaches height can shift)
        requestAnimationFrame(() => ScrollTrigger.refresh());
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
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-obsidian" />
      <div className="absolute inset-0 radial-fade" />

      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center opacity-[0.12]"
      >
        <LogoMark
          glow="hero"
          boxClassName="h-[min(48vh,240px)] w-[min(48vw,240px)] md:h-[min(62vh,460px)] md:w-[min(42vw,460px)]"
        />
      </div>

      {showScene && (
        <ThreeErrorBoundary fallback={null}>
          <div ref={canvasWrapRef} className="absolute inset-0 z-[2] opacity-100">
            <DumbbellScene lowPoly={lowPoly} onReady={onReady} />
          </div>
        </ThreeErrorBoundary>
      )}

      {mounted && (reducedMotion || !webglOk) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.14]">
          <LogoMark
            glow="hero"
            boxClassName="h-[min(52vh,280px)] w-[min(60vw,280px)] md:h-[360px] md:w-[360px]"
          />
        </div>
      )}
    </div>
  );
}

export default ScrollDumbbell;
