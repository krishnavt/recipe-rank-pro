/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for faster development builds
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Improve development server performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Faster refresh in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig
