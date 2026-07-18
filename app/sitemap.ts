import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const SITE = "https://tame-dynamics.com";

export const dynamic = "force-static";

const ROUTES = ["/", "/clients/", "/testimonials/", "/packages/", "/apply/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE}${BASE}${route}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
