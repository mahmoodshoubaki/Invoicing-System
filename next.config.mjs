/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Image remote patterns (replaces deprecated domains)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'cdn.devoteam.com' },
    ],
  },

  // Environment variables exposed to browser
  env: {
    APP_NAME: 'Enterprise Invoicing & Tracking System',
    APP_VERSION: '1.0.0',
    COMPANY_NAME: 'Devoteam Middle East',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_CURRENCY: 'SAR',
    DEFAULT_VAT_PERCENT: '15',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
