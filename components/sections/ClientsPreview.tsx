"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getClients } from "@/lib/api/newphase";
import type { Client } from "@/types/newphase";

export function ClientsPreview() {
  const { data: clients } = useAsync<Client[]>(
    () => getClients({ featured: true }),
    [],
  );

  const featured = clients.slice(0, 3);

  return (
    <section className="section-pad relative">
      <div className="container-np">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Real Transformations"
            title="Results that speak for themselves"
            intro="Every client starts somewhere. These are the people who committed to their next phase."
          />
          <Link
            href="/clients/"
            className="btn btn-ghost hidden md:inline-flex"
          >
            All Clients
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {featured.map((client, i) => (
              <Reveal key={client.id} delay={i * 90} as="article">
                <Link
                  href="/clients/"
                  className="group block overflow-hidden rounded-2xl surface"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
                    {client.afterImageUrl || client.imageUrl ? (
                      <img
                        src={client.afterImageUrl || client.imageUrl}
                        alt={client.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-6xl text-graphite">
                        {client.name?.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
                    <div className="absolute bottom-0 p-6">
                      <h3 className="display-lg text-2xl text-off-white">
                        {client.name}
                      </h3>
                      {client.result && (
                        <p className="text-sm text-accent">{client.result}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="mt-14 flex flex-col items-center justify-center rounded-2xl surface px-8 py-20 text-center">
              <p className="display-lg text-3xl text-off-white">
                Transformations launching soon
              </p>
              <p className="mt-3 max-w-md text-steel">
                Client stories are being prepared. Yours could be the first we
                feature — start your next phase today.
              </p>
              <Link href="/apply/" className="btn btn-primary mt-7">
                Apply Now
              </Link>
            </div>
          </Reveal>
        )}

        <div className="mt-10 md:hidden">
          <Link href="/clients/" className="btn btn-ghost w-full">
            All Clients
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ClientsPreview;
