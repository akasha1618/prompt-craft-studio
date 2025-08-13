const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
  // Azure App Service configuration
  experimental: {
    // Ensure proper host binding
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig 