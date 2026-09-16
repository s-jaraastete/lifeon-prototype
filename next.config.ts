import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    backendHost:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_BACKEND_HOST ?? ""
        : process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8001",
  },
};

export default nextConfig;
