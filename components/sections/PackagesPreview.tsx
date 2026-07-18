"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PackageCard } from "@/components/ui/PackageCard";
import { useAsync } from "@/lib/useAsync";
import { getPackages } from "@/lib/api/newphase";
import { FALLBACK_PACKAGES } from "@/lib/fallbacks";
import type { Package } from "@/types/newphase";

export function PackagesPreview() {
  const { data: packages } = useAsync<Package[]>(
    getPackages,
    FALLBACK_PACKAGES,
  );

  const sorted = [...packages]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 3);

  return (
    <section className="section-pad relative">
      <div className="container-np">
        <SectionHeading
          align="center"
          eyebrow="Coaching Packages"
          title="Choose your level of support"
          intro="Every package is built on the same personalised foundation. Pick the level of accountability that fits where you are right now."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {sorted.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 90}>
              <PackageCard pkg={pkg} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/packages/" className="btn btn-ghost">
            Compare All Packages
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PackagesPreview;
