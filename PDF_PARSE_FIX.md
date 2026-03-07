# PDF Parse 修复说明

## 问题描述

`pdf-parse` 库在 Next.js 的 webpack 环境中存在兼容性问题：
- `Object.defineProperty called on non-object` 错误
- 默认导出不存在的警告
- pdfjs-dist 在服务端渲染中的问题

## 解决方案

### 1. 更新 Next.js 配置 (next.config.js)

添加 webpack 配置来处理 pdf-parse：

```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    // 禁用 canvas（pdf-parse 依赖但在 Node.js 中不需要）
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // 将 pdf-parse 外部化，避免 webpack 打包问题
    config.externals = config.externals || [];
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
      'pdfjs-dist': 'commonjs pdfjs-dist',
    });
  }
  return config;
}
```

### 2. 修改导入方式 (src/lib/pdf/parser.ts)

使用动态导入替代静态导入：

```typescript
// 之前（有问题）
import pdf from "pdf-parse";

// 之后（修复）
let pdfParse: any = null;

async function getPdfParse() {
  if (!pdfParse) {
    const module = await import("pdf-parse/lib/pdf-parse.js");
    pdfParse = module.default || module;
  }
  return pdfParse;
}

// 在 parsePDF 函数中使用
const pdf = await getPdfParse();
const data = await pdf(buffer);
```

## 为什么这样做

1. **外部化依赖**: 让 Next.js 直接使用 node_modules 中的包，而不是通过 webpack 打包
2. **动态导入**: 避免在构建时解析模块，推迟到运行时
3. **禁用 canvas**: pdf-parse 依赖 canvas，但在 Node.js 环境中不需要

## 应用修复

修复已自动应用到代码中。需要重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 验证修复

1. 重启开发服务器
2. 上传一个 PDF 文件
3. 检查控制台是否有解析成功的日志
4. 确认没有 webpack 错误

## 备选方案

如果问题仍然存在，可以考虑：

1. 使用 `pdf.js` 的官方包
2. 使用 `@pdf-lib/fontkit` 和 `pdf-lib`
3. 使用云服务 API（如 AWS Textract）

## 相关文件

- `next.config.js`: Next.js 配置
- `src/lib/pdf/parser.ts`: PDF 解析工具
- `src/app/api/parse/route.ts`: PDF 解析 API 路由
