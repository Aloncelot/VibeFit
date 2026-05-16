/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Fuera de "experimental" y directo en la raíz
  // 2. Solo las IPs/hostnames puros, sin los puertos
  allowedDevOrigins: ['192.168.0.5', 'localhost'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
};

module.exports = nextConfig;