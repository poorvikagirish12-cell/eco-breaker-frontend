import type { NextConfig } from "next";

// Backend URL comes from environment — change .env.local to switch backends
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // All /api/* requests → proxied to the backend (no CORS issues)
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
