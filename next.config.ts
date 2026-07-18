import type { NextConfig } from "next";
import path from "node:path";

const staticExport = process.env.NP_STATIC_EXPORT === "true";

const basePath = (
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (staticExport ? "/clients/newphase-coaching" : "")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(process.cwd()),
  ...(staticExport ? { output: "export" } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
