import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev-only Next.js badge away from the sidebar brand.
  devIndicators: { position: "bottom-right" },
  // Project screenshots: let browsers keep them for a day (and quietly refresh
  // for a week after), so repeat visits show them with no download at all.
  async headers() {
    return [
      {
        source: "/projects/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
