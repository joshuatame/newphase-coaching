import { assetUrl } from "@/lib/base-path";
import type { Coach } from "@/types/newphase";

export const COACHES_SETTING_KEY = "coaches.roster";

export const DEFAULT_COACHES: Coach[] = [
  {
    id: "siegwalt",
    slug: "siegwalt",
    name: "Coach Siegwalt",
    role: "Coach",
    bio: "Strength and physique coaching built from years on the gym floor. Programs, nutrition and accountability personalised to your phase.",
    imageUrl: "/brand/coaches/siegwalt.png",
    visible: true,
    sortOrder: 0,
  },
  {
    id: "hadley",
    slug: "hadley",
    name: "Coach Hadley",
    role: "Coach",
    bio: "Hypertrophy and performance coaching with a focus on consistency, technique and results that stick.",
    imageUrl: "/brand/coaches/hadley.png",
    visible: true,
    sortOrder: 1,
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
  },
];

export function mergeCoaches(raw?: unknown): Coach[] {
  const incoming = Array.isArray(raw) ? (raw as Partial<Coach>[]) : [];
  const byId = new Map(
    incoming
      .filter((c) => c && typeof c.id === "string")
      .map((c) => [c.id as string, c]),
  );

  const merged = DEFAULT_COACHES.map((def) => {
    const patch = byId.get(def.id);
    if (!patch) return { ...def };
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
    });
  }

  return merged.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function visibleCoaches(coaches: Coach[]): Coach[] {
  return coaches.filter((c) => c.visible && c.name.trim() && c.imageUrl);
}

export function resolveCoachImage(url?: string) {
  if (!url) return "";
  if (
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.includes("/uploads") ||
    url.includes("tame-dynamics")
  ) {
    return url;
  }
  return assetUrl(url.startsWith("/") ? url : `/${url}`);
}
