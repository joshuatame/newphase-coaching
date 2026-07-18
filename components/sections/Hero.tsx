"use client";

import Link from "next/link";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Hero() {
  return (
    <section className="relative flex flex-col justify-start overflow-hidden pt-16 pb-5 md:min-h-[100svh] md:justify-center md:pt-28 md:pb-0">
      <div className="container-np grid items-center gap-3 md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,42%)]">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow mb-6 hidden items-center gap-3 md:flex">
            <span className="h-px w-10 bg-accent" aria-hidden />
            Personalised Online Coaching
          </p>

          <h1 className="display-hero text-off-white">
            Build Your
            <br />
            <span className="text-gradient">Next</span>{" "}
            <span className="text-accent">Phase</span>
          </h1>

          {/* Mobile: tight stage for the fixed dumbbell */}
          <div
            className="pointer-events-none relative my-1.5 h-[min(34vw,160px)] w-full md:hidden"
            aria-hidden
          />

          <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-steel md:mt-8 md:text-lg">
            Bespoke training, nutrition and accountability engineered around
            your body and your life. No templates. No guesswork. Just the
            system that gets you to the next level.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
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

          <div className="mt-16 hidden items-center gap-3 text-xs uppercase tracking-[0.3em] text-steel md:flex">
            <span className="animate-pulse-soft">Scroll to spin</span>
            <span className="h-10 w-px bg-gradient-to-b from-accent to-transparent" />
          </div>
        </div>

        <div className="pointer-events-none relative hidden min-h-[320px] lg:block" aria-hidden />
      </div>
    </section>
  );
}

export default Hero;
