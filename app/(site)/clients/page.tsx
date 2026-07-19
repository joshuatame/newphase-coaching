"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientCard } from "@/components/ui/ClientCard";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getClients } from "@/lib/api/newphase";
import type { Client } from "@/types/newphase";

export default function ClientsPage() {
  const { data: clients, loading } = useAsync<Client[]>(
    () => getClients(),
    [],
  );
  const [active, setActive] = useState<string>("All");
  const [selected, setSelected] = useState<Client | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => c.category && set.add(c.category));
    return ["All", ...Array.from(set)];
  }, [clients]);

  const filtered = useMemo(
    () =>
      active === "All"
        ? clients
        : clients.filter((c) => c.category === active),
    [clients, active],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <>
      <PageHeader
        eyebrow="Client Stories"
        title="Proof that the next phase is possible"
        intro="Browse real transformations from people who trusted the process. Filter by goal and open any story to see the full journey."
      />

      <section className="section-pad !pt-0">
        <div className="container-np">
          {categories.length > 1 && (
            <div className="hide-scrollbar mb-12 flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActive(cat)}
                  className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm transition-colors ${
                    active === cat
                      ? "border-accent bg-accent text-off-white"
                      : "border-[color:var(--edge-strong)] text-soft-silver hover:text-off-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-2xl surface"
                />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((client, i) => (
                <Reveal key={client.id} delay={(i % 3) * 80}>
                  <ClientCard
                    client={client}
                    onClick={() => setSelected(client)}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl surface px-8 py-24 text-center">
              <p className="display-lg text-3xl text-off-white">
                Client stories coming soon
              </p>
              <p className="mt-3 max-w-md text-steel">
                We&rsquo;re preparing a showcase of real transformations. Want to
                be featured? Your journey could start here.
              </p>
              <Link href="/apply/" className="btn btn-primary mt-7">
                Start Your Journey
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Story modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-obsidian/85 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} story`}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative my-8 w-full max-w-4xl overflow-hidden rounded-3xl surface-carbon"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full glass text-off-white hover:text-accent"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="grid md:grid-cols-2">
              <div className="p-4">
                <BeforeAfterSlider
                  beforeUrl={selected.beforeImageUrl}
                  afterUrl={selected.afterImageUrl || selected.imageUrl}
                />
              </div>
              <div className="p-8">
                {selected.category && (
                  <p className="eyebrow mb-3">{selected.category}</p>
                )}
                <h2 className="display-lg text-3xl text-off-white">
                  {selected.name}
                </h2>
                {selected.result && (
                  <p className="mt-2 text-accent">{selected.result}</p>
                )}

                {selected.stats && selected.stats.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {selected.stats.map((s, i) => (
                      <div key={i} className="surface rounded-xl p-4">
                        <p className="font-display text-2xl text-accent">
                          {s.value}
                        </p>
                        <p className="text-xs text-steel">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-6 leading-relaxed text-soft-silver">
                  {selected.story ||
                    selected.summary ||
                    "This client committed to the process and transformed their training, nutrition and mindset."}
                </p>

                <Link href="/apply/" className="btn btn-primary mt-8">
                  Start Your Transformation
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
