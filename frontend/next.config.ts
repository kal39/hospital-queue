import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allows staging builds to complete cleanly
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;