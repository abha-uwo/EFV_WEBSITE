import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/js/api-config.js', destination: '/api/config.js' },
      { source: '/', destination: '/index.html' },
      { source: '/marketplace', destination: '/pages/marketplace.html' },
      { source: '/offers', destination: '/pages/offers.html' },
      { source: '/offers.html', destination: '/pages/offers.html' },
      { source: '/profile', destination: '/pages/profile.html' },
      { source: '/profile.html', destination: '/pages/profile.html' },
      { source: '/checkout', destination: '/pages/checkout.html' },
      { source: '/admin', destination: '/pages/admin-dashboard.html' },
      { source: '/admin-dashboard.html', destination: '/pages/admin-dashboard.html' },
      { source: '/tracking', destination: '/pages/tracking.html' },
      { source: '/about', destination: '/pages/about.html' },
      { source: '/contact', destination: '/pages/contact.html' },
      { source: '/privacy-policy', destination: '/pages/privacy-policy.html' },
      { source: '/privacy-policy.html', destination: '/pages/privacy-policy.html' },
      { source: '/terms', destination: '/pages/terms.html' },
      { source: '/terms.html', destination: '/pages/terms.html' },
      { source: '/links', destination: '/pages/links.html' },
      { source: '/links.html', destination: '/pages/links.html' },
      { source: '/linktree', destination: '/pages/links.html' },
      { source: '/linktree.html', destination: '/pages/links.html' }
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
