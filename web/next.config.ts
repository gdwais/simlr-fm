import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next from incorrectly picking a parent directory as the project root
    root: __dirname,
  },
};

export default nextConfig;
