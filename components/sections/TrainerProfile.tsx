"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getSections } from "@/lib/api/newphase";
import { assetUrl } from "@/lib/base-path";
import type { Section } from "@/types/newphase";

const FALLBACK: Section = {
  id: "trainer-fallback",
  key: "trainer",
  eyebrow: "Your Coach",
  title: "Meet the NewPhase coach",
  subtitle: "",
  body: "Hands-on coaching built from real gym floor experience. Programming, nutrition and accountability — personalised to the phase you are in now.",
  imageUrl: "",
  ctaLabel: "Apply for coaching",
  ctaHref: "/apply/",
};

function resolveImage(url?: string) {
  if (!url) return assetUrl("/brand/nav-duo.png");
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return assetUrl(url.startsWith("/") ? url : `/${url}`);
}

function pickTrainer(sections: Section[]): Section {
  return sections.find((s) => s.key === "trainer") || FALLBACK;
}

export function TrainerProfile() {
  const { data: sections } = useAsync(getSections, []);
  const trainer = pickTrainer(sections);
  const photo = resolveImage(trainer.imageUrl);
  const ctaHref = trainer.ctaHref || "/apply/";
  const ctaLabel = trainer.ctaLabel || "Apply for coaching";

  return (
    <section className="section-pad relative overflow-hidden">
      <div className="container-np grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl surface sm:aspect-[5/6] lg:aspect-[4/5]">
            <img
              src={photo}
              alt={trainer.title || "Coach"}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/50 via-transparent to-transparent" />
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div>
            {trainer.eyebrow && (
              <p className="eyebrow mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-accent" aria-hidden />
                {trainer.eyebrow}
              </p>
            )}
            <h2 className="display-lg text-4xl text-off-white md:text-5xl">
              {trainer.title}
            </h2>
            {trainer.subtitle && (
              <p className="mt-3 text-lg text-accent">{trainer.subtitle}</p>
            )}
            {trainer.body && (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-steel md:text-lg">
                {trainer.body}
              </p>
            )}
            <Link href={ctaHref} className="btn btn-primary mt-8">
              {ctaLabel}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default TrainerProfile;
