import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // HARNESS (owner, 2026-11-08): hide the dev "N Issues" badge. With cacheComponents, CopilotKitProvider's
  // Date.now() puts it on every page (FINDINGS minor note); real failures still show in the app and logs.
  devIndicators: false,
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
