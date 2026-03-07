# PDF 扫描件问题说明

## 问题诊断

您上传的 PDF 文件是**扫描件或图片格式**，不包含可提取的文本内容。

### 测试结果
```
✓ PDF 文件大小: 937027 bytes
✓ PDF 页数: 2 页
✗ 文本元素: 0
✗ 可提取字符: 0
```

## 为什么会这样

PDF 文件有两种类型：

1. **文本型 PDF** ✅
   - 由软件直接生成（如 Word、Excel 导出）
   - 文本可以选择和复制
   - 可以直接提取文本内容

2. **扫描型 PDF** ❌
   - 由扫描仪或相机生成
   - 实际上是图片文件
   - 文本无法选择
   - 需要 OCR（光学字符识别）才能提取文本

您的 PDF 属于第二种类型。

## 解决方案

### 方案 1: 使用文本型 PDF（推荐）
如果您有原始文档，请直接导出为 PDF：
- Word/Excel: 文件 → 导出 → PDF
- Google Docs: 文件 → 下载 → PDF
- 其他软件: 打印 → 另存为 PDF

### 方案 2: OCR 转换
使用 OCR 工具将扫描件转换为文本型 PDF：

**在线工具**:
- Adobe Acrobat Online
- Smallpdf OCR
- iLovePDF OCR
- PDF24 Tools

**桌面软件**:
- Adobe Acrobat Pro DC
- ABBYY FineReader
- Foxit PhantomPDF

**开源工具**:
- Tesseract OCR
- OCRmyPDF

### 方案 3: 重新扫描（如果可能）
使用支持 OCR 的扫描仪或扫描应用：
- 扫描时启用 OCR 功能
- 选择"可搜索 PDF"格式
- 确保扫描质量清晰

## 如何验证 PDF 类型

在 PDF 阅读器中：
1. 尝试选择文本
2. 如果可以选择 → 文本型 PDF ✅
3. 如果无法选择 → 扫描型 PDF ❌

## 技术说明

当前系统使用 `pdf2json` 库解析 PDF：
- 只能提取文本型 PDF 的内容
- 无法识别图片中的文字
- 不支持 OCR 功能

如需支持扫描件，需要集成 OCR 服务（如 Tesseract、Google Vision API、Azure Computer Vision 等）。

## 测试文件

您可以使用以下命令测试 PDF 类型：
```bash
node test-pdf2json-full.mjs "path/to/your.pdf"
```

## 后续改进

可能的功能增强：
1. 集成 OCR 服务自动识别扫描件
2. 前端预检测 PDF 类型
3. 提供 OCR 转换服务推荐
4. 支持图片上传并 OCR
