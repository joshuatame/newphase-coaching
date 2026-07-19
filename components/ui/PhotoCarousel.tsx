"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselSlide } from "@/lib/carousel";

interface PhotoCarouselProps {
  slides: CarouselSlide[];
  autoSpeed?: number;
}

/**
 * Horizontal transformation rail — auto-drifts, drag/swipe to go faster.
 */
export function PhotoCarousel({
  slides,
  autoSpeed = 0.45,
}: PhotoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const xRef = useRef(0);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
  });
  const [paused, setPaused] = useState(false);

  const loop = slides.length > 0 ? [...slides, ...slides] : [];

  const tick = useCallback(() => {
    const el = trackRef.current;
    if (!el || loop.length === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const half = el.scrollWidth / 2;
    if (!dragRef.current.active && !paused) {
      if (Math.abs(dragRef.current.velocity) > 0.15) {
        xRef.current += dragRef.current.velocity;
        dragRef.current.velocity *= 0.95;
      } else {
        xRef.current -= autoSpeed;
      }
    }

    if (half > 0) {
      if (xRef.current <= -half) xRef.current += half;
      if (xRef.current > 0) xRef.current -= half;
    }

    el.style.transform = `translate3d(${xRef.current}px,0,0)`;
    rafRef.current = requestAnimationFrame(tick);
  }, [autoSpeed, loop.length, paused]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const onPointerDown = (e: React.PointerEvent) => {
    const d = dragRef.current;
    d.active = true;
    d.moved = false;
    d.startX = e.clientX;
    d.startOffset = xRef.current;
    d.lastX = e.clientX;
    d.lastT = performance.now();
    d.velocity = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPaused(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    if (Math.abs(e.clientX - d.startX) > 6) d.moved = true;
    const now = performance.now();
    const dx = e.clientX - d.startX;
    xRef.current = d.startOffset + dx;
    const dt = Math.max(now - d.lastT, 1);
    d.velocity = ((e.clientX - d.lastX) / dt) * 16;
    d.lastX = e.clientX;
    d.lastT = now;
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setPaused(false);
  };

  if (slides.length === 0) return null;

  return (
    <div className="relative">
      <div
        className="cursor-grab overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="region"
        aria-label="Transformation photo carousel — drag to browse"
      >
        <div
          ref={trackRef}
          className="flex w-max gap-4 will-change-transform md:gap-5"
          style={{ touchAction: "pan-y" }}
        >
          {loop.map((slide, i) => (
            <article
              key={`${slide.id}-${i}`}
                className="relative h-[220px] w-[160px] shrink-0 overflow-hidden rounded-2xl surface sm:h-[340px] sm:w-[240px] md:h-[400px] md:w-[280px]"
            >
              {slide.href ? (
                <Link
                  href={slide.href}
                  className="absolute inset-0 z-10"
                  draggable={false}
                  onClick={(ev) => {
                    if (dragRef.current.moved) ev.preventDefault();
                  }}
                  aria-label={slide.label}
                />
              ) : null}
              <img
                src={slide.src}
                alt={slide.label}
                draggable={false}
                className="h-full w-full object-cover"
                loading={i < 6 ? "eager" : "lazy"}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5">
                <h3 className="font-display text-xl tracking-wide text-off-white md:text-2xl">
                  {slide.label}
                </h3>
                {slide.result && (
                  <p className="mt-1 text-xs text-accent md:text-sm">
                    {slide.result}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-[0.65rem] uppercase tracking-[0.22em] text-steel">
        Drag to scroll · auto-plays
      </p>
    </div>
  );
}

export default PhotoCarousel;
