import type { NextConfig } from "next";
import path from "node:path";

const staticExport = process.env.NP_STATIC_EXPORT === "true";

const basePath = (
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (staticExport ? "/clients/newphase-coaching" : "")
).replace(/\/$/, "");

const reactPath = path.resolve("./node_modules/react");
const reactDomPath = path.resolve("./node_modules/react-dom");
const threePath = path.resolve("./node_modules/three");

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
  // Keep R3F / drei on the same React instance as the App Router (Next 15
  // otherwise ships a second copy and Canvas dies with ReactCurrentBatchConfig).
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: reactPath,
      "react-dom": reactDomPath,
      "react/jsx-runtime": path.join(reactPath, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(reactPath, "jsx-dev-runtime.js"),
      three: threePath,
    };
    return config;
  },
};

export default nextConfig;
