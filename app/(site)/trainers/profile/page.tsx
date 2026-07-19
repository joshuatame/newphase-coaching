"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCoaches } from "@/lib/api/newphase";
import {
  mergeCoaches,
  resolveCoachImage,
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
      <div className="container-np section-pad !pt-0">
        <div className="h-[28rem] animate-pulse rounded-3xl surface" />
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

  return (
    <>
      <PageHeader
        eyebrow={coach.role || "Coach"}
        title={coach.name}
        intro=""
      />
      <section className="section-pad !pt-0">
        <div className="container-np grid items-start gap-10 lg:grid-cols-2">
          <div className="relative aspect-[3/4] overflow-hidden bg-obsidian">
            {src ? (
              <img
                src={src}
                alt={coach.name}
                className="h-full w-full object-contain object-bottom"
              />
            ) : null}
          </div>
          <div>
            {coach.role && (
              <p className="eyebrow mb-3">{coach.role}</p>
            )}
            <h2 className="display-lg text-4xl text-off-white">{coach.name}</h2>
            <p className="mt-6 leading-relaxed text-soft-silver">
              {coach.bio ||
                "NewPhase coaching — programs, nutrition and accountability built around your next phase."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply/" className="btn btn-primary">
                Apply for coaching
              </Link>
              <Link href="/trainers/" className="btn btn-ghost">
                All trainers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function TrainerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="container-np section-pad">
          <div className="h-[28rem] animate-pulse rounded-3xl surface" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
