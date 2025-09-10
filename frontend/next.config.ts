import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ['192.168.1.58:3000', 'localhost:3000']
  },
  // Remove development indicators
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Disable React strict mode warnings in development
  reactStrictMode: false,
  // Remove powered by header
  poweredByHeader: false,
};

export default nextConfig;
