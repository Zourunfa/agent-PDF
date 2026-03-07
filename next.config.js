/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize OCR dependencies to avoid webpack bundling
      config.externals = [
        ...config.externals,
        'tesseract.js',
        'pdf-to-png-converter',
        '@napi-rs/canvas',
        'canvas',
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
