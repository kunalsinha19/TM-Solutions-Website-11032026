import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@tara-maa/shared-types", "@tara-maa/ui", "@tara-maa/validation"],
  images: {
    // Allow optimized images from any remote host (backend CDN URL unknown at build time)
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/admin",
        destination: "https://tm-solutions-website-11032026-production-afe1.up.railway.app/admin",
      },
      {
        source: "/admin/:path*",
        destination: "https://tm-solutions-website-11032026-production-afe1.up.railway.app/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
