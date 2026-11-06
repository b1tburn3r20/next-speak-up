import mdx from '@next/mdx';
import removeImports from 'next-remove-imports';

const withMDX = mdx({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "www.congress.gov",
        pathname: "/img/member/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },

  allowedDevOrigins: ['127.0.0.1'],

  // Each government lives under its own prefix. See "Federal and state" in docs/ui-guidelines.md.
  async redirects() {
    return [
      { source: '/bills/upcoming', destination: '/federal/upcoming', permanent: true },
      { source: '/bills/:path*', destination: '/federal/bills/:path*', permanent: true },
      { source: '/legislators/federal/:id', destination: '/federal/legislators/:id', permanent: true },
      { source: '/legislators', destination: '/federal/legislators', permanent: true },
      { source: '/topics/:path*', destination: '/federal/topics/:path*', permanent: true },
      { source: '/congress', destination: '/federal/legislators', permanent: true },
    ];
  },

  output: 'standalone',
};

// Apply both MDX and removeImports configurations
export default withMDX(removeImports()(nextConfig));
