/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Phaser needs special handling for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

module.exports = nextConfig;
