"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { useAsync } from "@/lib/useAsync";
import { getTestimonials } from "@/lib/api/newphase";
import type { Testimonial } from "@/types/newphase";

export function TestimonialsPreview() {
  const { data: testimonials } = useAsync<Testimonial[]>(getTestimonials, []);
  const featured = testimonials.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="section-pad relative">
      <div className="container-np">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="In Their Words"
            title="Trusted by people who committed"
          />
          <Link
            href="/testimonials/"
            className="btn btn-ghost hidden md:inline-flex"
          >
            Read All
          </Link>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {featured.map((t, i) => (
            <Reveal key={t.id} delay={i * 90}>
              <TestimonialCard item={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsPreview;
