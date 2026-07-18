"use client";

import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28">
      <div className="container-np">
        <p className="eyebrow mb-6 flex items-center gap-3">
          <span className="h-px w-10 bg-accent" aria-hidden />
          Personalised Online Coaching
        </p>

        <h1 className="display-hero text-off-white">
          Build Your
          <br />
          <span className="text-gradient">Next</span>{" "}
          <span className="text-accent">Phase</span>
        </h1>

        <div className="mt-10 flex max-w-2xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg leading-relaxed text-steel">
            Bespoke training, nutrition and accountability engineered around
            your body and your life. No templates. No guesswork. Just the
            system that gets you to the next level.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton href="/apply/" variant="primary">
              Start Your Next Phase
            </MagneticButton>
            <Link
              href="/packages/"
              className="link-underline text-sm uppercase tracking-[0.2em] text-soft-silver"
            >
              View Packages
            </Link>
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div className="container-np mt-16 hidden items-center gap-3 text-xs uppercase tracking-[0.3em] text-steel md:flex">
        <span className="animate-pulse-soft">Scroll to begin</span>
        <span className="h-10 w-px bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}

export default Hero;
