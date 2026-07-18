import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "Honest words from NewPhase Coaching clients about their results, mindset and experience.",
};

export default function TestimonialsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
