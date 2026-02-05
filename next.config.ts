import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move reactCompiler to the top level
  reactCompiler: true,

  experimental: {
    // Keep this empty
  },

  env: {
    DATABASE_URL: process.env.DATABASE_URL || "",
  },
};

export default nextConfig;
