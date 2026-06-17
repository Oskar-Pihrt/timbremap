import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Deezer cover-art CDNs
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net", pathname: "/**" },
      { protocol: "https", hostname: "cdns-images.dzcdn.net", pathname: "/**" },
      { protocol: "https", hostname: "e-cdn-images.dzcdn.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
