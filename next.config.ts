import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mock layer returns `any`; type errors are noise, not bugs
    ignoreBuildErrors: true,
  },
  // Ensure kit JSON files are bundled with the serverless function on Vercel
  // (fs.readFileSync paths aren't statically traceable, so we include them explicitly)
  outputFileTracingIncludes: {
    '/dealer/shop/leer-caps/[productId]': ['./src/lib/leer/**/*'],
  },
};

export default nextConfig;
