"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getCoaches } from "@/lib/api/newphase";
import {
  DEFAULT_COACHES,
  mergeCoaches,
  resolveCoachImage,
  visibleCoaches,
} from "@/lib/coaches";

export default function TrainersPage() {
  const { data } = useAsync(getCoaches, DEFAULT_COACHES);
  const coaches = visibleCoaches(mergeCoaches(data));
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <>
      <PageHeader eyebrow="Trainers" title="The coaches" />
      <section className="pb-10 pt-0 md:pb-14">
        <div
          className={`container-np grid gap-8 md:gap-6 ${
            coaches.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {coaches.map((coach, i) => {
            const active = activeId === coach.id;
            const src = resolveCoachImage(coach.imageUrl);
            return (
              <Reveal key={coach.id} delay={i * 80}>
                <article>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveId((id) => (id === coach.id ? null : coach.id))
                    }
                    className={`relative w-full bg-transparent text-left transition-transform duration-500 ${
                      active ? "scale-[1.04]" : ""
                    }`}
                  >
                    <div className="relative aspect-[3/4] bg-transparent">
                      {src ? (
                        <img
                          src={src}
                          alt={coach.name}
                          className={`h-full w-full object-contain object-bottom transition-[filter,transform] duration-500 ${
                            active ? "scale-105 grayscale-0" : "grayscale"
                          }`}
                        />
                      ) : null}
                    </div>
                  </button>
                  <h2 className="mt-5 font-display text-2xl tracking-wide text-off-white md:text-3xl">
                    {coach.name.toUpperCase()}
                  </h2>
                  {coach.role && (
                    <p className="mt-1 text-sm text-soft-silver">{coach.role}</p>
                  )}
                  <div
                    className={`mt-4 overflow-hidden transition-all duration-500 ${
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
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
