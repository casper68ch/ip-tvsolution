import type { NextConfig } from "next";

/**
 * Sito interamente statico (SSG) esportabile in `out/`.
 * Compatibile con hosting Linux (nginx/Apache) e con `npm run dev` su Windows.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
