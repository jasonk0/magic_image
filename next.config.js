/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  images: {
    unoptimized: true,
  },
  // 支持Docker部署
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
