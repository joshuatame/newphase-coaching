"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";
import { STOCK_TRANSFORMATION_PHOTOS } from "@/lib/carousel";

/** Bottom homepage rail — built-in stock training imagery. */
export function ClientsPreview() {
  const slides = STOCK_TRANSFORMATION_PHOTOS.map((s) => ({
    id: s.id,
    src: s.src,
    label: s.label,
    result: s.result,
  }));

  return (
    <section className="relative overflow-hidden py-3 md:py-4">
      <div className="container-np">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Real Transformations"
            title="Results that speak for themselves"
          />
          <Link
            href="/clients/"
            className="btn btn-ghost hidden md:inline-flex"
          >
            All Clients
          </Link>
        </div>
      </div>

      <Reveal>
        <div className="mt-3 md:mt-4">
          <PhotoCarousel slides={slides} />
        </div>
      </Reveal>

      <div className="container-np mt-4 md:hidden">
        <Link href="/clients/" className="btn btn-ghost w-full">
          All Clients
        </Link>
      </div>
    </section>
  );
}

export default ClientsPreview;
