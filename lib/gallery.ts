import type { GallerySlide } from "@/types/newphase";
import { STOCK_TRANSFORMATION_PHOTOS } from "@/lib/carousel";

export const GALLERY_SETTING_KEY = "home.photoRail";

export const DEFAULT_PHOTO_RAIL: GallerySlide[] = STOCK_TRANSFORMATION_PHOTOS.slice(
  0,
  6,
).map((s) => ({
  id: s.id,
  src: s.src,
  label: s.label,
}));

export function mergePhotoRail(raw?: unknown): GallerySlide[] {
  if (!Array.isArray(raw)) return DEFAULT_PHOTO_RAIL.map((s) => ({ ...s }));
  const slides = raw
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const s = item as Partial<GallerySlide>;
      if (!s.src || typeof s.src !== "string") return null;
      return {
        id: String(s.id || `slide-${i}`),
        src: s.src,
        label: typeof s.label === "string" ? s.label : undefined,
      } satisfies GallerySlide;
    })
    .filter(Boolean) as GallerySlide[];
  return slides.length > 0 ? slides : DEFAULT_PHOTO_RAIL.map((s) => ({ ...s }));
}
