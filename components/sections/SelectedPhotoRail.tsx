"use client";

import { Reveal } from "@/components/ui/Reveal";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";
import { useAsync } from "@/lib/useAsync";
import { getPhotoRail } from "@/lib/api/newphase";
import { DEFAULT_PHOTO_RAIL, mergePhotoRail } from "@/lib/gallery";
import type { CarouselSlide } from "@/lib/carousel";

/** Top homepage rail — photos chosen in Admin → Settings. */
export function SelectedPhotoRail() {
  const { data: rail } = useAsync(getPhotoRail, DEFAULT_PHOTO_RAIL);
  const slides: CarouselSlide[] = mergePhotoRail(rail).map((s) => ({
    id: s.id,
    src: s.src,
    label: s.label || "",
  }));

  if (slides.length === 0) return null;

  return (
    <section className="relative overflow-hidden pb-4 md:pb-8">
      <Reveal>
        <PhotoCarousel slides={slides} />
      </Reveal>
    </section>
  );
}

export default SelectedPhotoRail;
