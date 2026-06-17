import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Item images come from Deezer CDNs and arbitrary user-pasted links, so any
    // host is allowed. A single unconfigured host would otherwise 500 every page
    // that lists it (sidebar, recommendations). The optimizer still validates the
    // response is an image.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
