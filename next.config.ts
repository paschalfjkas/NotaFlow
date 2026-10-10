import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Default is 1MB; screenshot uploads in the report editor go through a
    // server action and need headroom up to the 5MB limit enforced in
    // uploadScreenshotAction.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // Baseline hardening headers applied to every response. Deliberately not
    // including a Content-Security-Policy here — getting one right without
    // breaking Next's own inline bootstrap scripts, Google Fonts, and the
    // Paystack checkout redirect needs real per-page testing, which this
    // pass didn't cover; these four are safe, low-risk wins on their own.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
