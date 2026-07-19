"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";
import { useAsync } from "@/lib/useAsync";
import { getClients } from "@/lib/api/newphase";
import { buildTransformationSlides } from "@/lib/carousel";
import type { Client } from "@/types/newphase";

/** Original mixed transformation rail (clients + stock). */
export function ClientsPreview() {
  const { data: clients } = useAsync<Client[]>(() => getClients(), []);
  const slides = buildTransformationSlides(clients);

  return (
    <section className="section-pad relative overflow-hidden">
      <div className="container-np">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Real Transformations"
            title="Results that speak for themselves"
            intro="Swipe the rail — client photos mix with training imagery."
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
        <div className="mt-6 md:mt-14">
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
