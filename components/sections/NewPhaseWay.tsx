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

        <div className="mt-5 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {NEWPHASE_WAY.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} as="article">
              <div className="surface group h-full rounded-2xl p-5 transition-colors duration-500 hover:border-[color:var(--edge-strong)] md:p-8">
                <span className="font-display text-4xl text-graphite transition-colors duration-500 group-hover:text-accent md:text-5xl">
                  {item.index}
                </span>
                <h3 className="display-lg mt-4 text-xl text-off-white md:mt-6 md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-steel md:mt-3">
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
