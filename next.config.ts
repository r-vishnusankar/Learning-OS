import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare quick tunnels (`*.trycloudflare.com`) hit the Next.js
  // cross-origin guard in dev unless explicitly allowlisted.
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
};

export default nextConfig;
