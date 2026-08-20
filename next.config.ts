import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cloudinary CDN for seller product images and store media
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        // Clerk avatar images
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },

  // Silence Clerk's peer dependency warnings on the server bundle
  // serverExternalPackages: ["@clerk/nextjs"],
};

export default nextConfig;
