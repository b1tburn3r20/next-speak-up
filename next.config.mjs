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

  // The old second bill section. Bills all live under /bills now.
  async redirects() {
    return [
      { source: '/federal/bills', destination: '/bills', permanent: false },
      { source: '/congress', destination: '/legislators', permanent: false },
      { source: '/federal/bills/:slug', destination: '/bills/:slug', permanent: false },
    ];
  },

  output: 'standalone',
};

// Apply both MDX and removeImports configurations
export default withMDX(removeImports()(nextConfig));
