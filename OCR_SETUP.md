# OCR 功能设置指南

## 功能说明

系统现在支持**自动 OCR 识别**扫描型 PDF！

### 工作流程

1. **首次尝试**: 使用 pdf2json 快速提取文本
2. **自动检测**: 如果检测到扫描件（无文本）
3. **OCR 回退**: 自动切换到 Tesseract OCR 识别
4. **文本提取**: 识别图片中的文字并提取

## 已安装的依赖

✅ `tesseract.js` - OCR 引擎（支持中英文）
✅ `pdf-to-png-converter` - PDF 转图片工具

## 使用方法

### 自动模式（推荐）

直接上传任何 PDF，系统会自动判断：
- 文本型 PDF → 快速提取（秒级）
- 扫描型 PDF → 自动 OCR（分钟级）

### 手动 OCR 模式

如果需要强制使用 OCR：
```typescript
import { parsePDF } from '@/lib/pdf/parser';

const result = await parsePDF(buffer, true); // 第二个参数为 true
```

## OCR 特性

### 支持的语言
- ✅ 中文简体 (chi_sim)
- ✅ 英文 (eng)
- 可扩展其他语言

### 处理参数
- **分辨率**: 2.0x（高清晰度，更好的识别率）
- **引擎**: Tesseract.js v5
- **模式**: 自动页面分割

### 性能指标
- **速度**: 约 10-30 秒/页（取决于内容复杂度）
- **准确率**: 清晰扫描件 >95%
- **内存**: 约 100-200MB/页

## 识别质量优化

### 最佳实践

1. **扫描质量**
   - 分辨率: ≥300 DPI
   - 格式: 黑白或彩色均可
   - 对比度: 清晰可读

2. **文档类型**
   - ✅ 打印文档扫描件
   - ✅ 书籍扫描
   - ✅ 表格和表单
   - ⚠️  手写文字（识别率较低）
   - ❌ 模糊或倾斜严重的图片

3. **文件大小**
   - 建议: <10MB
   - 页数: <20 页（处理时间考虑）

## 故障排除

### OCR 识别失败

**可能原因**:
1. 图片质量太差
2. 文字太小或模糊
3. 背景干扰严重
4. 文字倾斜角度大

**解决方案**:
1. 使用更高分辨率扫描
2. 调整扫描对比度
3. 使用专业 OCR 工具预处理
4. 旋转图片到正确方向

### 内存不足

如果处理大文件时内存不足：
```javascript
// 在 next.config.js 中增加内存限制
module.exports = {
  // ...
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Node.js 启动参数
  // node --max-old-space-size=4096 server.js
};
```

### 处理时间过长

优化建议：
1. 减少 PDF 页数
2. 降低图片分辨率（在 ocr-parser.ts 中调整 viewportScale）
3. 使用后台任务队列（生产环境）

## 技术细节

### OCR 流程

```
PDF Buffer
    ↓
PDF → PNG 转换 (pdf-to-png-converter)
    ↓
图片预处理 (分辨率提升)
    ↓
OCR 识别 (Tesseract.js)
    ↓
文本提取和清理
    ↓
返回结果
```

### 代码位置

- `src/lib/pdf/parser.ts` - 主解析器（自动回退）
- `src/lib/pdf/ocr-parser.ts` - OCR 专用解析器
- `src/app/api/parse/route.ts` - API 路由

### 日志示例

```
[Parser] Parsing PDF with pdf2json...
[Parser] ✓ PDF parsed: 2 pages, 0 text elements
[Parser] ⚠️  PDF appears to be scanned/image-based, attempting OCR...
[Parser] → Switching to OCR mode...
[OCR Parser] Starting OCR processing for scanned PDF...
[OCR Parser] Converting PDF to images...
[OCR Parser] ✓ Converted to 2 images
[OCR Parser] Initializing OCR engine...
[OCR Parser] Processing page 1/2...
[OCR Parser] Progress: 50%
[OCR Parser] ✓ Page 1: 1234 characters
[OCR Parser] Processing page 2/2...
[OCR Parser] Progress: 100%
[OCR Parser] ✓ Page 2: 1567 characters
[OCR Parser] ✓ OCR completed: 2 pages, 2801 characters
```

## 扩展语言支持

添加其他语言（如繁体中文、日文等）：

```typescript
// 在 ocr-parser.ts 中修改
const worker = await createWorker('chi_tra+jpn+eng', 1, {
  // chi_tra: 繁体中文
  // jpn: 日文
  // kor: 韩文
  // fra: 法文
  // deu: 德文
  // 等等...
});
```

## 生产环境建议

1. **使用任务队列**
   - Bull、BullMQ 或 Agenda
   - 避免阻塞主线程

2. **进度反馈**
   - WebSocket 或 SSE 实时更新
   - 显示处理进度

3. **缓存结果**
   - Redis 或数据库存储
   - 避免重复处理

4. **云 OCR 服务**
   - Google Cloud Vision API
   - Azure Computer Vision
   - AWS Textract
   - 更快、更准确（但需付费）

## 测试

上传一个扫描型 PDF，观察控制台日志：
1. 检测到扫描件
2. 自动切换 OCR
3. 逐页处理进度
4. 最终提取文本

## 性能对比

| PDF 类型 | 方法 | 速度 | 准确率 |
|---------|------|------|--------|
| 文本型 | pdf2json | <1秒 | 100% |
| 扫描件 | OCR | 10-30秒/页 | 90-98% |

## 限制

- OCR 处理较慢（CPU 密集）
- 手写文字识别率低
- 复杂排版可能乱序
- 表格识别需要额外处理

## 未来改进

- [ ] 并行处理多页
- [ ] GPU 加速
- [ ] 表格结构识别
- [ ] 手写文字优化
- [ ] 多语言自动检测
- [ ] 图片预处理（去噪、增强）
