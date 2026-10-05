/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "https://concept1gym.vercel.app/",
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: "/:path*",
          destination: "https://concept1gym.vercel.app/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
