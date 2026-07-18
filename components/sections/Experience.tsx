"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { EXPERIENCE_GRID } from "@/lib/fallbacks";

export function Experience() {
  return (
    <section className="section-pad relative">
      <div className="container-np">
        <SectionHeading
          eyebrow="The Experience"
          title="Everything you need in one system"
          intro="Coaching that goes far beyond a workout PDF — a complete performance environment behind you."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--edge)] bg-[color:var(--edge)] sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCE_GRID.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 80} as="article">
              <div className="group h-full bg-near-black p-8 transition-colors duration-500 hover:bg-carbon">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-graphite text-accent transition-colors duration-500 group-hover:bg-accent group-hover:text-obsidian">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path
                      d="M5 12h14m-6-6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="display-lg mt-6 text-2xl text-off-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experience;
