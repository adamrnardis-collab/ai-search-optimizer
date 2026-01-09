/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
    // External packages for server components
    serverComponentsExternalPackages: ['jsdom'],
  },
}

module.exports = nextConfig
