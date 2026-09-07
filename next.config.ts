import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    if (!rawBackendUrl) return [];

    const backendUrl = rawBackendUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/notes/:path*',
        destination: `${backendUrl}/api/notes/:path*`,
      },
      {
        source: '/api/notes',
        destination: `${backendUrl}/api/notes`,
      },
      {
        source: '/api/user/:path*',
        destination: `${backendUrl}/api/user/:path*`,
      },
    ];
  },
};

export default nextConfig;
