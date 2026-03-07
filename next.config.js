/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 在构建时忽略 ESLint 错误（开发时仍会检查）
    ignoreDuringBuilds: false,
  },
  typescript: {
    // 确保类型检查通过
    ignoreBuildErrors: false,
  },
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
