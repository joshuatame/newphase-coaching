export function withBasePath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  if (!path.startsWith("/")) return path;
  return `${base}${path}`;
}

/** Absolute URL for static public assets (img / GLB / HDR). */
export function assetUrl(path: string): string {
  return withBasePath(path.startsWith("/") ? path : `/${path}`);
}
