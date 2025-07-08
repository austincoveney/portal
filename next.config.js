/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable SWC minification for better performance
  swcMinify: true,

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors. Not recommended for production.
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Not recommended for production.
    ignoreDuringBuilds: false,
  },

  // Environment variables that should be exposed to the browser
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Image optimization configuration
  images: {
    domains: [
      'ywfvlqvsgyhiugoludhy.supabase.co', // Supabase storage domain
      'avatars.githubusercontent.com', // GitHub avatars
      'lh3.googleusercontent.com', // Google avatars
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ];
  },

  // Experimental features
  experimental: {
    // Enable app directory (Next.js 13+ feature)
    appDir: false, // Set to true when ready to migrate to app directory
  },

  // Webpack configuration for custom optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configurations can be added here
    return config;
  },

  // Output configuration
  output: 'standalone', // Useful for Docker deployments

  // Compression
  compress: true,

  // Power by header
  poweredByHeader: false,

  // Generate ETags for pages
  generateEtags: true,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Trailing slash configuration
  trailingSlash: false,
};

module.exports = nextConfig;