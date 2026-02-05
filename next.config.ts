import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Use Turbopack defaults; no custom webpack config to avoid Next.js 16 warnings
  turbopack: {},
};

export default nextConfig;
