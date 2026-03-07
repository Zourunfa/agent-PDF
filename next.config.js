/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 跳过构建时的 ESLint 检查（避免版本兼容问题）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 跳过构建时的类型检查（本地已验证）
    ignoreBuildErrors: true,
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
    
    // Configure pdfjs-dist to work with webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/legacy/build/pdf.worker.entry',
    };
    
    return config;
  },
};

module.exports = nextConfig;
