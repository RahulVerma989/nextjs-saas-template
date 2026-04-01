import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Use absolute URLs for /_next/static/ assets when deployed behind a
  // reverse proxy.  In dev NEXT_PUBLIC_APP_URL is unset so Next.js
  // falls back to relative paths.
  assetPrefix: process.env.NEXT_PUBLIC_APP_URL || undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "@infisical/sdk",
    "mongoose",
    "agenda",
    "ioredis",
  ],
  async headers() {
    return [
      {
        // Allow cross-origin loading of static assets
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/api/og",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
