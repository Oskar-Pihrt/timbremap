import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Item images come from Deezer CDNs and arbitrary user-pasted links, so any
    // host is allowed. A single unconfigured host would otherwise 500 every page
    // that lists it (sidebar, recommendations). The optimizer still validates the
    // response is an image. HTTPS only — `http` is dropped to avoid mixed-content
    // and plaintext fetches. Residual risk: a pasted https URL can still point at
    // an arbitrary host (images render via `unoptimized`, so no server-side fetch).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
