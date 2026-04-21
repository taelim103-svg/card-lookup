const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  turbopack: {
    // Fix: Turbopack picks wrong workspace root when parent dirs have package-lock.json
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
