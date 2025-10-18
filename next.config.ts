/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
    // ✅ Don't fail the build on ESLint errors
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
    ],
  },
};

export default nextConfig;
