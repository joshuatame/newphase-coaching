import type { Client } from "@/types/newphase";

/** Stock physique shots used until / alongside live client uploads. */
export const STOCK_TRANSFORMATION_PHOTOS: {
  id: string;
  src: string;
  label: string;
  result?: string;
}[] = [
  {
    id: "stock-1",
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
    label: "Strength Phase",
    result: "Built under load",
  },
  {
    id: "stock-2",
    src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    label: "Conditioning",
    result: "Work capacity up",
  },
  {
    id: "stock-3",
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    label: "Hypertrophy",
    result: "Lean mass focus",
  },
  {
    id: "stock-4",
    src: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
    label: "Athletic Base",
    result: "Power + control",
  },
  {
    id: "stock-5",
    src: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
    label: "Recomposition",
    result: "Shape shift",
  },
  {
    id: "stock-6",
    src: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=900&q=80",
    label: "Performance",
    result: "Next level output",
  },
];

export type CarouselSlide = {
  id: string;
  src: string;
  label: string;
  result?: string;
  href?: string;
};

/** Mixed transformation rail — client photos first, stock fillers after. */
export function buildTransformationSlides(clients: Client[]): CarouselSlide[] {
  const fromClients: CarouselSlide[] = [];
  for (const c of clients) {
    const after = c.afterImageUrl || c.imageUrl;
    const before = c.beforeImageUrl;
    if (after) {
      fromClients.push({
        id: `${c.id}-after`,
        src: after,
        label: c.name,
        result: c.result,
        href: "/clients/",
      });
    }
    if (before && before !== after) {
      fromClients.push({
        id: `${c.id}-before`,
        src: before,
        label: `${c.name} — before`,
        result: c.result,
        href: "/clients/",
      });
    }
  }
  return [...fromClients, ...STOCK_TRANSFORMATION_PHOTOS];
}
