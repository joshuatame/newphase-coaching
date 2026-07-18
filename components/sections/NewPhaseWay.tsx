"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NEWPHASE_WAY } from "@/lib/fallbacks";

export function NewPhaseWay() {
  return (
    <section className="section-pad relative">
      <div className="container-np">
        <SectionHeading
          eyebrow="The NewPhase Way"
          title="A method built to move you forward"
          intro="Four principles turn effort into transformation. This is how every client gets to their next phase."
        />

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {NEWPHASE_WAY.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} as="article">
              <div className="surface group h-full rounded-2xl p-8 transition-colors duration-500 hover:border-[color:var(--edge-strong)]">
                <span className="font-display text-5xl text-graphite transition-colors duration-500 group-hover:text-accent">
                  {item.index}
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

export default NewPhaseWay;
