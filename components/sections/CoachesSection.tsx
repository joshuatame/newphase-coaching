"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getCoaches } from "@/lib/api/newphase";
import {
  DEFAULT_COACHES,
  mergeCoaches,
  resolveCoachImage,
  visibleCoaches,
} from "@/lib/coaches";
import type { Coach } from "@/types/newphase";

function CoachCard({
  coach,
  active,
  onSelect,
}: {
  coach: Coach;
  active: boolean;
  onSelect: () => void;
}) {
  const src = resolveCoachImage(coach.imageUrl);

  return (
    <article className="group relative flex flex-col items-stretch">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`relative w-full bg-transparent text-left transition-transform duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active ? "z-10 scale-[1.04] md:scale-[1.06]" : "scale-100"
        }`}
      >
        <div className="relative w-full bg-transparent">
          {src ? (
            <img
              src={src}
              alt={coach.name}
              className={`mx-auto h-auto max-h-[52vh] w-full object-contain object-bottom transition-[filter,transform] duration-500 md:max-h-[60vh] ${
                active
                  ? "scale-105 grayscale-0"
                  : "grayscale group-hover:grayscale-[40%]"
              }`}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-steel">
              Photo coming soon
            </div>
          )}
        </div>
      </button>

      <div className="mt-3 md:mt-4">
        <h3 className="font-display text-2xl tracking-wide text-off-white md:text-3xl">
          {coach.name.toUpperCase()}
        </h3>
        {coach.role && (
          <p className="mt-1 text-sm text-soft-silver">{coach.role}</p>
        )}
      </div>

      <div
        className={`mt-3 overflow-hidden transition-all duration-500 ${
          active ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <Link
          href={`/trainers/profile/?c=${encodeURIComponent(coach.slug || coach.id)}`}
          className="btn btn-primary !px-6 !py-3"
        >
          See profile
        </Link>
      </div>
    </article>
  );
}

export function CoachesSection() {
  const { data } = useAsync(getCoaches, DEFAULT_COACHES);
  const coaches = visibleCoaches(mergeCoaches(data));
  const [activeId, setActiveId] = useState<string | null>(null);

  if (coaches.length === 0) return null;

  return (
    <section
      id="coaches"
      className="section-pad relative overflow-visible !py-6 md:!py-8"
    >
      <div className="container-np">
        <Reveal>
          <p className="eyebrow mb-2 flex items-center gap-3 md:mb-3">
            <span className="h-px w-10 bg-accent" aria-hidden />
            The Coaches
          </p>
          <h2 className="display-lg max-w-2xl text-4xl text-off-white md:text-5xl">
            Meet the team behind your next phase
          </h2>
        </Reveal>

        <div
          className={`mt-3 grid gap-4 md:mt-4 md:gap-5 ${
            coaches.length === 1
              ? "md:max-w-md md:grid-cols-1"
              : coaches.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-3"
          }`}
        >
          {coaches.map((coach, i) => (
            <Reveal key={coach.id} delay={i * 80}>
              <CoachCard
                coach={coach}
                active={activeId === coach.id}
                onSelect={() =>
                  setActiveId((id) => (id === coach.id ? null : coach.id))
                }
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CoachesSection;
