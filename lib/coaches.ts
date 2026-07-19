import { assetUrl } from "@/lib/base-path";
import type { Coach, CoachCategory } from "@/types/newphase";

export const COACHES_SETTING_KEY = "coaches.roster";

export const DEFAULT_CATEGORY_LABELS = [
  "Achievements",
  "Specialty",
  "Education",
  "Certifications",
  "Experience",
] as const;

const emptyCategories = (): CoachCategory[] =>
  DEFAULT_CATEGORY_LABELS.map((label) => ({ label, body: "" }));

export const DEFAULT_COACHES: Coach[] = [
  {
    id: "siegwalt",
    slug: "siegwalt",
    name: "Coach Siegwalt",
    role: "Coach",
    bio: "Strength and physique coaching built from years on the gym floor. Programs, nutrition and accountability personalised to your phase.",
    imageUrl: "/brand/coaches/siegwalt-v2.png",
    visible: true,
    sortOrder: 0,
    categories: [
      {
        label: "Achievements",
        body: "Competitive physique background with proven client transformations across strength and recomposition goals.",
      },
      {
        label: "Specialty",
        body: "Hypertrophy programming, body composition, and progressive overload systems built for real life.",
      },
      {
        label: "Education",
        body: "Ongoing study in exercise science, program design and performance nutrition.",
      },
      {
        label: "Certifications",
        body: "Industry-recognised coaching credentials with continuing education in programming and nutrition.",
      },
      {
        label: "Experience",
        body: "Years on the gym floor coaching athletes and everyday clients through every phase of progress.",
      },
    ],
  },
  {
    id: "hadley",
    slug: "hadley",
    name: "Coach Hadley",
    role: "Coach",
    bio: "Hypertrophy and performance coaching with a focus on consistency, technique and results that stick.",
    imageUrl: "/brand/coaches/hadley-v2.png",
    visible: true,
    sortOrder: 1,
    categories: [
      {
        label: "Achievements",
        body: "Track record of client strength gains, lean mass improvements and long-term adherence.",
      },
      {
        label: "Specialty",
        body: "Performance coaching, technique refinement and sustainable nutrition strategies.",
      },
      {
        label: "Education",
        body: "Focused training in strength & conditioning principles and applied coaching practice.",
      },
      {
        label: "Certifications",
        body: "Accredited coaching qualifications with specialised continuous learning.",
      },
      {
        label: "Experience",
        body: "Hands-on coaching across beginner through advanced athletes in online and in-person settings.",
      },
    ],
  },
  {
    id: "coach-3",
    slug: "coach-3",
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
    visible: false,
    sortOrder: 2,
    categories: emptyCategories(),
  },
];

function mergeCategories(
  defaults: CoachCategory[] | undefined,
  incoming: unknown,
): CoachCategory[] {
  const base =
    defaults && defaults.length > 0 ? defaults : emptyCategories();
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return base.map((c) => ({ ...c }));
  }
  return incoming
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const c = item as Partial<CoachCategory>;
      const fallback = base[i] || { label: `Category ${i + 1}`, body: "" };
      return {
        label:
          typeof c.label === "string" && c.label.trim()
            ? c.label
            : fallback.label,
        body: typeof c.body === "string" ? c.body : fallback.body,
      } satisfies CoachCategory;
    })
    .filter(Boolean) as CoachCategory[];
}

export function mergeCoaches(raw?: unknown): Coach[] {
  const incoming = Array.isArray(raw) ? (raw as Partial<Coach>[]) : [];
  const byId = new Map(
    incoming
      .filter((c) => c && typeof c.id === "string")
      .map((c) => [c.id as string, c]),
  );

  const merged = DEFAULT_COACHES.map((def) => {
    const patch = byId.get(def.id);
    if (!patch) return { ...def, categories: def.categories?.map((c) => ({ ...c })) };
    return {
      ...def,
      ...patch,
      id: def.id,
      slug: String(patch.slug || def.slug),
      name: typeof patch.name === "string" ? patch.name : def.name,
      role: typeof patch.role === "string" ? patch.role : def.role,
      bio: typeof patch.bio === "string" ? patch.bio : def.bio,
      imageUrl:
        typeof patch.imageUrl === "string" ? patch.imageUrl : def.imageUrl,
      visible: patch.visible !== undefined ? Boolean(patch.visible) : def.visible,
      sortOrder:
        typeof patch.sortOrder === "number" ? patch.sortOrder : def.sortOrder,
      categories: mergeCategories(def.categories, patch.categories),
    };
  });

  for (const c of incoming) {
    if (!c?.id || DEFAULT_COACHES.some((d) => d.id === c.id)) continue;
    merged.push({
      id: String(c.id),
      slug: String(c.slug || c.id),
      name: String(c.name || ""),
      role: String(c.role || ""),
      bio: String(c.bio || ""),
      imageUrl: String(c.imageUrl || ""),
      visible: c.visible !== false,
      sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : merged.length,
      categories: mergeCategories(emptyCategories(), c.categories),
    });
  }

  return merged.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function visibleCoaches(coaches: Coach[]): Coach[] {
  return coaches.filter((c) => c.visible && c.name.trim() && c.imageUrl);
}

/** Cloudflare still caches old opaque coach PNGs under the original filenames. */
const COACH_IMAGE_CACHE_BUST: Record<string, string> = {
  "/brand/coaches/siegwalt.png": "/brand/coaches/siegwalt-v2.png",
  "/brand/coaches/hadley.png": "/brand/coaches/hadley-v2.png",
};

export function resolveCoachImage(url?: string) {
  if (!url) return "";
  let path = url;
  for (const [from, to] of Object.entries(COACH_IMAGE_CACHE_BUST)) {
    if (path === from || path.endsWith(from)) {
      path = path.replace(from, to);
      break;
    }
  }
  if (
    path.startsWith("http") ||
    path.startsWith("data:") ||
    path.includes("/uploads") ||
    path.includes("tame-dynamics")
  ) {
    return path;
  }
  return assetUrl(path.startsWith("/") ? path : `/${path}`);
}

/** Split display name for hero styling — first token(s) white, last token red. */
export function splitCoachName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

export function filledCategories(coach: Coach): CoachCategory[] {
  return (coach.categories || []).filter(
    (c) => c.label.trim() && c.body.trim(),
  );
}
