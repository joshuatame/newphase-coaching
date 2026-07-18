"use client";

import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function FinalCta() {
  return (
    <section className="section-pad relative">
      <div className="container-np">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-3xl surface-carbon px-5 py-12 text-center md:px-8 md:py-28">
            <div className="radial-fade absolute inset-0" aria-hidden />
            <div className="relative z-10 mx-auto max-w-3xl">
              <p className="eyebrow mb-4 md:mb-6">Your Next Phase Starts Now</p>
              <h2 className="display-xl text-off-white">
                Stop starting over.
                <br />
                <span className="text-accent">Start progressing.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-steel md:mt-6 md:text-lg">
                Apply today and get a coaching plan built entirely around you.
                Limited spots to keep every client fully supported.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:mt-10 md:gap-4">
                <MagneticButton href="/apply/" variant="primary">
                  Apply for Coaching
                </MagneticButton>
                <MagneticButton href="/packages/" variant="ghost">
                  View Packages
                </MagneticButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default FinalCta;
