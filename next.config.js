const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Évite que Next prenne un mauvais dossier racine (/Users/…) et ignore .env.local
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
