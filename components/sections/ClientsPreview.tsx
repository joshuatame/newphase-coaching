"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";
import { useAsync } from "@/lib/useAsync";
import { getClients } from "@/lib/api/newphase";
import { buildFeaturedClientSlides } from "@/lib/carousel";
import type { Client } from "@/types/newphase";

export function ClientsPreview() {
  const { data: clients } = useAsync<Client[]>(
    () => getClients({ featured: true }),
    [],
  );
  const slides = buildFeaturedClientSlides(clients);

  if (slides.length === 0) return null;

  return (
    <section className="section-pad !pt-0 relative overflow-hidden">
      <div className="container-np">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Client Transformations"
            title="Meet the people putting in the work"
            intro="Featured clients from the roster. Tap a photo to open their story."
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
        <div className="mt-6 md:mt-10">
          <PhotoCarousel slides={slides} />
        </div>
      </Reveal>

      <div className="container-np mt-6 md:hidden">
        <Link href="/clients/" className="btn btn-ghost w-full">
          All Clients
        </Link>
      </div>
    </section>
  );
}

export default ClientsPreview;
