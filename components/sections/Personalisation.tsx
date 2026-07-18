"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PERSONALISATION_POINTS } from "@/lib/fallbacks";

export function Personalisation() {
  return (
    <section className="section-pad relative">
      <div className="container-np grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <SectionHeading
            eyebrow="Truly Personalised"
            title="Your programme, adjusted every single week"
            intro="No two bodies respond the same way. Your plan is written for you and re-tuned continuously against your data, recovery and results."
          />
          <ul className="mt-6 space-y-3 md:mt-10 md:space-y-4">
            {PERSONALISATION_POINTS.map((point, i) => (
              <Reveal key={point} delay={i * 70} as="li">
                <div className="flex items-center gap-4">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M4 10.5l4 4 8-9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-soft-silver">{point}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Mock coaching interface visual */}
        <Reveal delay={120}>
          <div className="glass relative overflow-hidden rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">This Week</p>
                <p className="font-display text-2xl text-off-white">
                  Phase 3 · Progressive Overload
                </p>
              </div>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                On Track
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Adherence", value: "94%" },
                { label: "Sessions", value: "5/5" },
                { label: "Avg Sleep", value: "7.4h" },
              ].map((stat) => (
                <div key={stat.label} className="surface rounded-xl p-4">
                  <p className="font-display text-3xl text-accent">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-steel">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {[
                { name: "Lower — Strength", detail: "Squat · RPE 8", pct: 100 },
                { name: "Upper — Hypertrophy", detail: "Push focus", pct: 100 },
                { name: "Conditioning", detail: "Zone 2 · 35min", pct: 60 },
              ].map((row) => (
                <div key={row.name} className="surface rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-off-white">
                      {row.name}
                    </p>
                    <p className="text-xs text-steel">{row.detail}</p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-graphite">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Personalisation;
