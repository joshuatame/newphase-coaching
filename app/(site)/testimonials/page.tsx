"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { Reveal } from "@/components/ui/Reveal";
import { useAsync } from "@/lib/useAsync";
import { getTestimonials } from "@/lib/api/newphase";
import type { Testimonial } from "@/types/newphase";

export default function TestimonialsPage() {
  const { data: testimonials, loading } = useAsync<Testimonial[]>(
    getTestimonials,
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Testimonials"
        title="What the next phase feels like"
        intro="Honest words from clients who put in the work and changed more than their physique."
      />

      <section className="section-pad !pt-0">
        <div className="container-np">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl surface"
                />
              ))}
            </div>
          ) : testimonials.length > 0 ? (
            <div className="columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={(i % 3) * 70} className="break-inside-avoid">
                  <TestimonialCard item={t} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl surface px-8 py-24 text-center">
              <p className="display-lg text-3xl text-off-white">
                Testimonials coming soon
              </p>
              <p className="mt-3 max-w-md text-steel">
                We only publish real words from real clients. As new
                transformations complete, their stories will appear here.
              </p>
              <Link href="/apply/" className="btn btn-primary mt-7">
                Become a Success Story
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
