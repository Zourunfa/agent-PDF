# OCR 功能重启指南

## 已完成的修复

✅ 安装 OCR 依赖（tesseract.js, pdf-to-png-converter）
✅ 创建 OCR 解析器
✅ 配置 Next.js webpack 外部化
✅ 清理构建缓存

## 现在需要做的

### 重启开发服务器

在终端运行：
```bash
npm run dev
```

服务器会重新构建，这次会正确处理 OCR 依赖。

## 验证 OCR 功能

### 1. 检查启动日志

服务器启动后应该看到：
```
✓ Ready in X.Xs
- Local:        http://localhost:3000
```

### 2. 上传扫描型 PDF

上传您的扫描件 PDF，观察控制台日志：

**预期日志流程**:
```
[Parse API] Received parse request for PDF: xxx
[Parser] Parsing PDF with pdf2json...
[Parser] ✓ PDF parsed: 2 pages, 0 text elements
[Parser] ⚠️  PDF appears to be scanned/image-based, attempting OCR...
[Parser] → Switching to OCR mode...
[OCR Parser] Starting OCR processing for scanned PDF...
[OCR Parser] Converting PDF to images...
[OCR Parser] ✓ Converted to 2 images
[OCR Parser] Initializing OCR engine...
[OCR Parser] Processing page 1/2...
[OCR Parser] Progress: 25%
[OCR Parser] Progress: 50%
[OCR Parser] Progress: 75%
[OCR Parser] Progress: 100%
[OCR Parser] ✓ Page 1: 1234 characters
[OCR Parser] Processing page 2/2...
[OCR Parser] Progress: 100%
[OCR Parser] ✓ Page 2: 1567 characters
[OCR Parser] ✓ OCR completed: 2 pages, 2801 characters
[Parse API] ✓ Created 4 chunks
[Parse API] Creating vector store...
[Parse API] ✓ Vector store created successfully
```

### 3. 测试对话

OCR 完成后：
1. 在聊天界面输入问题
2. 系统应该能基于识别的文本回答
3. 检查回答是否准确

## 如果出现问题

### Webpack 错误仍然存在

如果仍然看到 `.node` 文件错误：

1. **完全清理**:
```bash
# 停止服务器
# 删除所有缓存
Remove-Item -Recurse -Force .next, node_modules
npm cache clean --force
npm install --legacy-peer-deps
```

2. **检查配置**:
确认 `next.config.js` 包含：
```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = [
      ...config.externals,
      'tesseract.js',
      'pdf-to-png-converter',
      '@napi-rs/canvas',
      'canvas',
    ];
  }
  return config;
}
```

### OCR 初始化失败

如果看到 "OCR 功能未安装" 错误：

```bash
npm install tesseract.js pdf-to-png-converter --legacy-peer-deps
```

### 内存不足

如果处理大文件时崩溃：

```bash
# 增加 Node.js 内存限制
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### 语言包下载失败

首次使用 OCR 会下载中英文语言包（~10MB）。

如果下载失败：
1. 检查网络连接
2. 可能需要配置代理
3. 或手动下载语言包到缓存目录

## 性能优化

### 处理速度

- 文本型 PDF: <1 秒
- 扫描型 PDF: 10-30 秒/页

### 内存使用

- 文本型 PDF: ~50MB
- OCR 处理: ~200MB/页

### 建议限制

- 文件大小: <10MB
- 页数: <20 页
- 分辨率: 300 DPI

## 生产环境部署

### 环境变量

```env
# 可选：OCR 配置
OCR_MAX_PAGES=20
OCR_TIMEOUT=300000
OCR_LANGUAGE=chi_sim+eng
```

### 服务器要求

- CPU: 2+ 核心（OCR 是 CPU 密集型）
- 内存: 2GB+
- 磁盘: 500MB+（语言包）

### Docker 部署

如果使用 Docker，确保安装必要的系统依赖：

```dockerfile
FROM node:20-alpine

# 安装 OCR 依赖
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## 测试命令

### 快速测试 OCR

```bash
node test-ocr.mjs "path/to/scanned.pdf"
```

### 检查依赖

```bash
npm list tesseract.js pdf-to-png-converter
```

### 验证配置

```bash
node -e "console.log(require('./next.config.js'))"
```

## 功能特性

✅ 自动检测扫描件
✅ 无缝 OCR 回退
✅ 中英文混合识别
✅ 进度日志输出
✅ 错误处理和重试
✅ 向量存储集成
✅ 智能问答支持

## 下一步

重启服务器后，直接上传扫描型 PDF 测试！

系统会自动：
1. 检测文件类型
2. 启动 OCR 处理
3. 提取文字内容
4. 创建向量索引
5. 支持智能对话

享受 OCR 功能吧！🎉
