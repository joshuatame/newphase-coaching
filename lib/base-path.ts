export function withBasePath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  if (!path.startsWith("/")) return path;
  return `${base}${path}`;
}
