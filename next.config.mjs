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
    DEFAULT_CURRENCY: 'USD', // SAR
    DEFAULT_CURRENCY_Symbol: '\u{0024}', //\u{20C1} for SAR, \u{0024} for USD
    DEFAULT_VAT_PERCENT: '15',
  },

  // Old addresses, still in links people have saved. The query (?id=, filters) is carried over.
  async redirects() {
    return [
      // Admin › Monitoring (2026-10-08) gathered workflow runs, the delivery
      // monitor, the trace and both audits into one place.
      { source: '/workflow/runs', destination: '/admin/monitoring/runs', permanent: false },
      { source: '/workflow/runs/:instanceId', destination: '/admin/monitoring/runs/:instanceId', permanent: false },
      { source: '/admin/notifications/monitor', destination: '/admin/monitoring/deliveries', permanent: false },
      { source: '/admin/notifications/monitor/:notificationId', destination: '/admin/monitoring/deliveries/:notificationId', permanent: false },
      { source: '/trace', destination: '/admin/monitoring/trace', permanent: false },
      { source: '/workflow/trace', destination: '/admin/monitoring/trace', permanent: false },
      { source: '/admin/notifications/trace', destination: '/admin/monitoring/trace', permanent: false },
      { source: '/admin/notifications/audit', destination: '/admin/monitoring/audit', permanent: false },
      { source: '/admin/workflow/changes', destination: '/admin/monitoring/audit?view=workflow', permanent: false },
      // Admin › Workflow (2026-10-13) gathered the workflows, their builder, the
      // fields and the engine. The builder's ?code= is carried over.
      { source: '/workflow', destination: '/admin/workflow/workflows', permanent: false },
      { source: '/workflow/builder', destination: '/admin/workflow/builder', permanent: false },
      // The engine page was split into its limits and its approved domains.
      { source: '/admin/workflow/engine', destination: '/admin/workflow/limits', permanent: false },
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
    ];
  },
};

export default nextConfig;
