import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    backendHost:
      process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8001",
  },
};

export default nextConfig;
