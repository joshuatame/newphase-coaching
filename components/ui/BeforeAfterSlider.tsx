"use client";

import { useCallback, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  beforeUrl?: string;
  afterUrl?: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
    if (e.key === "Home") setPos(0);
    if (e.key === "End") setPos(100);
  };

  if (!beforeUrl && !afterUrl) {
    return (
      <div
        className={`flex aspect-[4/5] items-center justify-center rounded-2xl surface ${className}`}
      >
        <span className="eyebrow">Transformation coming soon</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[4/5] w-full select-none overflow-hidden rounded-2xl surface ${className}`}
      onMouseMove={(e) => dragging.current && setFromClientX(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={(e) => setFromClientX(e.touches[0].clientX)}
    >
      {/* After (base layer) */}
      {afterUrl && (
        <img
          src={afterUrl}
          alt={afterLabel}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}
      <span className="absolute right-4 top-4 rounded-full glass px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-off-white">
        {afterLabel}
      </span>

      {/* Before (clipped layer) */}
      {beforeUrl && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pos}%` }}
        >
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ width: containerRef.current?.offsetWidth || "100%" }}
            draggable={false}
          />
          <span className="absolute left-4 top-4 rounded-full glass px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-off-white">
            {beforeLabel}
          </span>
        </div>
      )}

      {/* Handle */}
      <button
        type="button"
        role="slider"
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKeyDown}
        onMouseDown={() => (dragging.current = true)}
        onTouchStart={() => (dragging.current = true)}
        className="absolute top-0 z-10 flex h-full w-10 -translate-x-1/2 cursor-ew-resize items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent" />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent text-obsidian shadow-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M8 7l-5 5 5 5V7zm8 0v10l5-5-5-5z" />
          </svg>
        </span>
      </button>
    </div>
  );
}

export default BeforeAfterSlider;
