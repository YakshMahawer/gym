/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: "/",
          destination: "https://concept1gym.vercel.app/",
        },
        {
          source: "/:path*",
          destination: "https://concept1gym.vercel.app/:path*",
        },
      ],
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
