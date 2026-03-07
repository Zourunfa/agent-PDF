/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 跳过构建时的 ESLint 检查（避免版本兼容问题）
    ignoreDuringBuilds: true,
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
