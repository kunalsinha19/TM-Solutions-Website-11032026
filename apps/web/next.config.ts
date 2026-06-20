import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@tara-maa/shared-types", "@tara-maa/ui", "@tara-maa/validation"]
};

export default nextConfig;
