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
      // Iowa's legislators, from their pages on the Legislature's site, which robots.txt allows.
      {
        protocol: "https",
        hostname: "www.legis.iowa.gov",
        pathname: "/photo",
      },
      // Each city we cover serves its officials' photos. Add its host here with its entry in lib/civic/states.ts.
      {
        protocol: "https",
        hostname: "www.dsm.city",
        pathname: "/Images/**",
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

  // The service worker must always be fetched fresh, or a fix to it could take a day to reach anyone.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },

  output: 'standalone',
  // The dev-only badge sits on top of the phone's tabs or logo wherever it goes. Errors still show.
  devIndicators: false,
  // Lets browser tests run a second dev server beside `npm run dev`.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

// Apply both MDX and removeImports configurations
export default withMDX(removeImports()(nextConfig));
