import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    backendHost:
      process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8001",
  },
  /* images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8001",
        pathname: "/**",
      },
      { protocol: 'https', hostname: '*.lms.safetyacademy.cl', pathname: '/**' }
    ],
    dangerouslyAllowLocalIP: true,
  }, */
};

export default nextConfig;
