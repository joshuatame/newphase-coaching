"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PackageCard } from "@/components/ui/PackageCard";
import { useAsync } from "@/lib/useAsync";
import { getPackages } from "@/lib/api/newphase";
import { FALLBACK_PACKAGES } from "@/lib/fallbacks";
import { packageGridClass } from "@/lib/package-grid";
import type { Package } from "@/types/newphase";

export function PackagesPreview() {
  const { data: packages } = useAsync<Package[]>(
    getPackages,
    FALLBACK_PACKAGES,
  );

  const sorted = [...packages].sort(
    (a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0),
  );

  return (
    <section className="section-pad relative">
      <div className="container-np">
        <SectionHeading
          align="center"
          eyebrow="Coaching Packages"
          title="Choose your level of support"
          intro="Every package is built on the same personalised foundation. Pick the level of accountability that fits where you are right now."
        />

        <div className={`mt-16 ${packageGridClass(sorted.length)}`}>
          {sorted.map((pkg, i) => (
            <Reveal key={pkg.id} delay={Math.min(i, 5) * 90}>
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
