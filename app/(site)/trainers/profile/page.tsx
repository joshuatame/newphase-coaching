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
      <div className="container-np pt-28 pb-16">
        <div className="h-[70svh] animate-pulse rounded-3xl surface" />
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
    <section className="relative overflow-hidden pt-20 pb-16 md:min-h-[100svh] md:pt-28 md:pb-20">
      <div className="container-np grid items-center gap-8 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)] lg:gap-14">
        {/* Image — left */}
        <div className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0 lg:max-w-none">
          <div className="relative aspect-[3/4] overflow-hidden bg-obsidian">
            {src ? (
              <img
                src={src}
                alt={coach.name}
                className="h-full w-full object-contain object-bottom"
              />
            ) : null}
          </div>
        </div>

        {/* Copy + categories — right */}
        <div className="relative z-10 order-1 lg:order-2">
          {(coach.role || "Coach") && (
            <p className="eyebrow mb-4 flex items-center gap-3 md:mb-6">
              <span className="h-px w-10 bg-accent" aria-hidden />
              {coach.role || "Coach"}
            </p>
          )}

          <h1 className="display-hero uppercase">
            <span className="text-off-white">{first}</span>
            {last ? (
              <>
                <br />
                <span className="text-accent">{last}</span>
              </>
            ) : null}
          </h1>

          {coach.bio && (
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-steel md:mt-8 md:text-lg">
              {coach.bio}
            </p>
          )}

          {categories.length > 0 && (
            <div className="mt-8 space-y-6 md:mt-10">
              {categories.map((cat) => (
                <div key={cat.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    {cat.label}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-soft-silver md:text-base">
                    {cat.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
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
        <div className="container-np pt-28 pb-16">
          <div className="h-[70svh] animate-pulse rounded-3xl surface" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
