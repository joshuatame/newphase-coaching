"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { getClient } from "@/lib/api/newphase";
import type { Client } from "@/types/newphase";

function ClientProfileContent() {
  const params = useSearchParams();
  const slug = params.get("c") || "";
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLoading(false);
      setError("No client selected.");
      return;
    }
    setLoading(true);
    getClient(slug)
      .then((data) => {
        if (!active) return;
        if (!data) setError("Client not found.");
        else setClient(data);
      })
      .catch(() => {
        if (active) setError("Could not load this client profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-np section-pad !pt-0">
        <div className="h-[28rem] animate-pulse rounded-3xl surface" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <>
        <PageHeader
          eyebrow="Client"
          title="Profile unavailable"
          intro={error || "We could not find that client."}
        />
        <section className="section-pad !pt-0">
          <div className="container-np">
            <Link href="/clients/" className="btn btn-ghost">
              Back to Clients
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={client.category || "Client Story"}
        title={client.name}
        intro={client.result || client.headline || client.summary || ""}
      />
      <section className="section-pad !pt-0">
        <div className="container-np grid gap-8 lg:grid-cols-2 lg:gap-12">
          <BeforeAfterSlider
            beforeUrl={client.beforeImageUrl}
            afterUrl={client.afterImageUrl || client.imageUrl}
          />
          <div>
            {client.stats && client.stats.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                {client.stats.map((s, i) => (
                  <div key={i} className="surface rounded-xl p-4">
                    <p className="font-display text-2xl text-accent">{s.value}</p>
                    <p className="text-xs text-steel">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="leading-relaxed text-soft-silver">
              {client.story ||
                client.summary ||
                "This client committed to the process and transformed their training, nutrition and mindset."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply/" className="btn btn-primary">
                Start Your Transformation
              </Link>
              <Link href="/clients/" className="btn btn-ghost">
                All Clients
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ClientProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="container-np section-pad">
          <div className="h-[28rem] animate-pulse rounded-3xl surface" />
        </div>
      }
    >
      <ClientProfileContent />
    </Suspense>
  );
}
