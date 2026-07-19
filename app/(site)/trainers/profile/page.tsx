"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCoaches } from "@/lib/api/newphase";
import {
  filledCategories,
  mergeCoaches,
  resolveCoachImage,
  splitCoachName,
  visibleCoaches,
} from "@/lib/coaches";
import type { Coach } from "@/types/newphase";

function ProfileContent() {
  const params = useSearchParams();
  const slug = params.get("c") || "";
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCoaches()
      .then((list) => {
        if (!active) return;
        const all = mergeCoaches(list);
        const found =
          all.find((c) => c.slug === slug || c.id === slug) ||
          visibleCoaches(all).find((c) => c.slug === slug);
        setCoach(found || null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-np pt-20 pb-10">
        <div className="h-80 animate-pulse rounded-3xl surface" />
      </div>
    );
  }

  if (!coach) {
    return (
      <>
        <PageHeader
          eyebrow="Trainer"
          title="Profile unavailable"
          intro="We could not find that coach."
        />
        <section className="section-pad !pt-0">
          <div className="container-np">
            <Link href="/trainers/" className="btn btn-ghost">
              Back to Trainers
            </Link>
          </div>
        </section>
      </>
    );
  }

  const src = resolveCoachImage(coach.imageUrl);
  const { first, last } = splitCoachName(coach.name);
  const categories = filledCategories(coach);

  return (
    <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16">
      <div className="container-np grid items-start gap-4 md:gap-8 lg:grid-cols-[minmax(0,40%)_minmax(0,1fr)] lg:gap-10">
        {/* Image first — top on mobile, left on desktop */}
        <div className="relative w-full max-w-sm md:max-w-md lg:max-w-none">
          {src ? (
            <img
              src={src}
              alt={coach.name}
              className="mx-auto h-auto max-h-[42vh] w-full object-contain object-top md:max-h-[70vh] lg:mx-0"
            />
          ) : null}
        </div>

        {/* Copy + categories */}
        <div className="relative z-10 min-w-0 pt-0 lg:pt-2">
          <p className="eyebrow mb-2 flex items-center gap-3 md:mb-4">
            <span className="h-px w-10 bg-accent" aria-hidden />
            {coach.role || "Coach"}
          </p>

          <h1 className="display-hero uppercase leading-[0.86]">
            <span className="text-off-white">{first}</span>
            {last ? (
              <>
                <br />
                <span className="text-accent">{last}</span>
              </>
            ) : null}
          </h1>

          {coach.bio && (
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-steel md:mt-5 md:text-lg">
              {coach.bio}
            </p>
          )}

          {categories.length > 0 && (
            <div className="mt-5 space-y-4 md:mt-7 md:space-y-5">
              {categories.map((cat) => (
                <div key={cat.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    {cat.label}
                  </p>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-soft-silver md:text-base">
                    {cat.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8 md:gap-4">
            <Link href="/apply/" className="btn btn-primary">
              Apply for coaching
            </Link>
            <Link
              href="/trainers/"
              className="link-underline text-sm uppercase tracking-[0.2em] text-soft-silver"
            >
              All trainers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TrainerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="container-np pt-20 pb-10">
          <div className="h-80 animate-pulse rounded-3xl surface" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
