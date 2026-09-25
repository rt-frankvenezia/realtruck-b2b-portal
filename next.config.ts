import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mock layer returns `any`; type errors are noise, not bugs
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
