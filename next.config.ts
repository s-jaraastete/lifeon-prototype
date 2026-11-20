import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las rutas de PDF leen las fuentes con fs en tiempo de ejecución: hay que empaquetarlas en la función.
  outputFileTracingIncludes: {
    "/api/artp-versions/[versionId]/pdf": ["./lib/server/fonts/*.woff"],
    "/api/document-deliveries/[id]/pdf": ["./lib/server/fonts/*.woff"],
    "/api/document-deliveries/irl-pdf-preview": ["./lib/server/fonts/*.woff"],
  },
  env: {
    backendHost:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_BACKEND_HOST ?? ""
        : process.env.NEXT_PUBLIC_BACKEND_HOST ?? "http://localhost:8001",
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/mobile",
          destination: "/mobile/index.html",
        },
      ],
      fallback: [
        {
          source: "/mobile/:path*",
          destination: "/mobile/index.html",
        },
      ],
    };
  },
};

export default nextConfig;
