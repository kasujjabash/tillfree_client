import type { NextConfig } from "next";

/**
 * Unified OS web client.
 *
 * `cacheComponents` is intentionally off: every workspace screen is rendered
 * in the browser with an in-memory access token, and tenant (including
 * clinical) data must never be cached or prerendered on the Next.js server.
 * See docs/ARCHITECTURE.md §2.
 */
const djangoOrigin = process.env.DJANGO_API_ORIGIN;

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Proxy the Django API through the same origin so the refresh-token cookie
  // (HttpOnly, SameSite=Strict, path /api/v1/auth/) works without CORS.
  async rewrites() {
    if (!djangoOrigin) return [];
    return [{ source: "/api/v1/:path*", destination: `${djangoOrigin}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
