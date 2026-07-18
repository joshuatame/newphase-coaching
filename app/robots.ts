import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const SITE = "https://tame-dynamics.com";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: `${BASE}/admin/`,
    },
    sitemap: `${SITE}${BASE}/sitemap.xml`,
  };
}
