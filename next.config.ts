import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/campaigns/create",
        destination: "/campaigns/new",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
