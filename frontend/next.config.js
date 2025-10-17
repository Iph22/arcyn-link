/** @type {import('next').NextConfig} */
const nextConfig = {
  /** experimental: {
    appDir: true,
  }, */
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  env: {
     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
