const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/cron/warmup': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

module.exports = nextConfig;
