/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Don't fail the build on ESLint errors
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/images/**",
      },
    ],
  },
};

export default nextConfig;
