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
  // NOTE: www → non-www redirect is temporarily disabled to avoid a redirect loop
  // caused by old locked EC2 A records on GoDaddy that redirect root → www.
  // Re-enable this once the old A records are removed from GoDaddy DNS and
  // a new A record @ → 69.46.46.13 (Railway) is added.
  // async redirects() {
  //   return [
  //     {
  //       source: "/:path*",
  //       has: [{ type: "host", value: "www.tmsolutionsindia.com" }],
  //       destination: "https://tmsolutionsindia.com/:path*",
  //       permanent: true,
  //     },
  //   ];
  // },

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
      {
        source: "/invoice",
        destination: "https://tm-solutions-website-11032026-production-afe1.up.railway.app/invoice",
      },
      {
        source: "/invoice/:path*",
        destination: "https://tm-solutions-website-11032026-production-afe1.up.railway.app/invoice/:path*",
      },
      // Proxy all /api/v1/* calls to the Express API service
      {
        source: "/api/v1/:path*",
        destination: "https://api.tmsolutionsindia.com/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
