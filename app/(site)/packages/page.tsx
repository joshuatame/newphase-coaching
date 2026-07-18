"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PackageCard } from "@/components/ui/PackageCard";
import { Accordion } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getPackages, getFaqs } from "@/lib/api/newphase";
import { FALLBACK_PACKAGES, FALLBACK_FAQS } from "@/lib/fallbacks";
import { packageGridClass } from "@/lib/package-grid";
import type { Faq, Package } from "@/types/newphase";

function useMatrix(packages: Package[]) {
  return useMemo(() => {
    const featureLabels: string[] = [];
    packages.forEach((p) =>
      (p.features || []).forEach((f) => {
        if (!featureLabels.includes(f.label)) featureLabels.push(f.label);
      }),
    );
    return featureLabels;
  }, [packages]);
}

export default function PackagesPage() {
  const { data: packages } = useAsync<Package[]>(getPackages, FALLBACK_PACKAGES);
  const { data: faqs } = useAsync<Faq[]>(getFaqs, FALLBACK_FAQS);

  const sorted = [...packages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const featureLabels = useMatrix(sorted);

  const has = (pkg: Package, label: string) =>
    Boolean(pkg.features?.find((f) => f.label === label)?.included);

  return (
    <>
      <PageHeader
        eyebrow="Coaching Packages"
        title="Invest in the phase you want to reach"
        intro="Transparent pricing. Real coaching. Choose the level of support that matches your goals and momentum."
      />

      {/* Cards */}
      <section className="section-pad !pt-0">
        <div className={`container-np ${packageGridClass(sorted.length)}`}>
          {sorted.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 90}>
              <PackageCard pkg={pkg} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Comparison matrix */}
      {featureLabels.length > 0 && (
        <section className="section-pad !pt-0">
          <div className="container-np">
            <SectionHeading
              align="center"
              eyebrow="Compare"
              title="Every package, side by side"
            />
            <Reveal className="mt-12">
              <div className="hide-scrollbar overflow-x-auto rounded-2xl surface">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[color:var(--edge-strong)]">
                      <th className="p-5 text-sm font-medium text-steel">
                        Feature
                      </th>
                      {sorted.map((pkg) => (
                        <th
                          key={pkg.id}
                          className={`p-5 text-center font-display text-xl ${
                            pkg.featured ? "text-accent" : "text-off-white"
                          }`}
                        >
                          {pkg.name}
                          {pkg.priceLabel && (
                            <span className="mt-1 block text-xs font-normal tracking-normal text-steel">
                              {pkg.priceLabel}
                              {pkg.interval}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureLabels.map((label, i) => (
                      <tr
                        key={label}
                        className={
                          i % 2 === 0 ? "bg-transparent" : "bg-[color:var(--carbon)]"
                        }
                      >
                        <td className="p-5 text-sm text-soft-silver">{label}</td>
                        {sorted.map((pkg) => (
                          <td key={pkg.id} className="p-5 text-center">
                            {has(pkg, label) ? (
                              <svg
                                viewBox="0 0 20 20"
                                className="mx-auto h-5 w-5 text-accent"
                                fill="none"
                                aria-label="Included"
                              >
                                <path
                                  d="M4 10.5l4 4 8-9"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              <span
                                className="mx-auto block h-px w-4 bg-steel/40"
                                aria-label="Not included"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section-pad !pt-0">
        <div className="container-np grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            intro="Everything you need to know before you apply."
          />
          <Reveal>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
