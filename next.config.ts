import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    backendHost:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_BACKEND_HOST ?? ""
        : process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8001",
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: "/mobile",
          destination: "/mobile/index.html",
        },
        {
          source: "/mobile/:path*",
          destination: "/mobile/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
