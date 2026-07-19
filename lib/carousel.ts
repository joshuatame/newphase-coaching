import type { Client } from "@/types/newphase";

export type CarouselSlide = {
  id: string;
  src: string;
  label: string;
  result?: string;
  href?: string;
};

/** Primary photo + name only — featured clients for the homepage rail. */
export function buildFeaturedClientSlides(clients: Client[]): CarouselSlide[] {
  const slides: CarouselSlide[] = [];
  for (const c of clients) {
    const primary = c.afterImageUrl || c.imageUrl || c.beforeImageUrl;
    if (!primary) continue;
    const slug = c.slug || c.id;
    slides.push({
      id: c.id,
      src: primary,
      label: c.name,
      href: `/clients/profile/?c=${encodeURIComponent(slug)}`,
    });
  }
  return slides;
}
