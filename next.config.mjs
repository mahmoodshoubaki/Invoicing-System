const REQUIRED_ENV = [
  'NEXT_PUBLIC_APP_NAME', 'NEXT_PUBLIC_APP_SHORT_NAME', 'NEXT_PUBLIC_APP_VERSION',
  'NEXT_PUBLIC_COMPANY_NAME', 'NEXT_PUBLIC_COMPANY_SHORT_NAME',
  'NEXT_PUBLIC_DEFAULT_LANGUAGE', 'NEXT_PUBLIC_DEFAULT_CURRENCY', 'NEXT_PUBLIC_DEFAULT_VAT_PERCENT',
];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length) throw new Error(`Missing settings in .env: ${missingEnv.join(', ')}`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Image remote patterns (replaces deprecated domains)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'cdn.devoteam.com' },
    ],
  },

  async redirects() {
    return [
      { source: '/workflow/runs', destination: '/admin/monitoring/runs', permanent: false },
      { source: '/workflow/runs/:instanceId', destination: '/admin/monitoring/runs/:instanceId', permanent: false },
      { source: '/admin/notifications/monitor', destination: '/admin/monitoring/deliveries', permanent: false },
      { source: '/admin/notifications/monitor/:notificationId', destination: '/admin/monitoring/deliveries/:notificationId', permanent: false },
      { source: '/trace', destination: '/admin/monitoring/trace', permanent: false },
      { source: '/workflow/trace', destination: '/admin/monitoring/trace', permanent: false },
      { source: '/admin/notifications/trace', destination: '/admin/monitoring/trace', permanent: false },
      { source: '/admin/notifications/audit', destination: '/admin/monitoring/audit', permanent: false },
      { source: '/admin/workflow/changes', destination: '/admin/monitoring/audit?view=workflow', permanent: false },
      { source: '/workflow', destination: '/admin/workflow/workflows', permanent: false },
      { source: '/workflow/builder', destination: '/admin/workflow/builder', permanent: false },
      { source: '/admin/workflow/engine', destination: '/admin/workflow/limits', permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: '/hangfire/:path*', destination: '/api/backend/hangfire/:path*' },
    ];
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
      {
        source: '/hangfire/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
};

export default nextConfig;
