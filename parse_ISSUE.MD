问题总结
核心问题： 你上传的这些 PDF 文件让 pdf2json 库完全挂起 - parseBuffer 被调用后既不触发 dataReady 事件也不触发 dataError 事件，导致解析永远卡住。

已尝试的解决方案：

✗ pdf-parse - webpack 兼容性问题
✗ pdfjs-dist - 需要 worker 文件，在 Vercel 上找不到
✗ pdf-lib - 无法从这些 PDF 提取文本内容
✗ pdf2json - 会挂起不响应
当前状态：

添加了多层超时保护（3.5秒 + 4秒）
超时后会标记 PDF 为 FAILED 状态
前端布局问题已修复（横向滚动条、上传组件）
建议的解决方案
由于所有 PDF 解析库都无法处理你的这些特定 PDF 文件，我建议以下方案：

方案 1：使用外部 PDF 解析服务

使用 Adobe PDF Services API
使用 Google Cloud Document AI
使用 AWS Textract
方案 2：让用户手动复制粘贴文本

添加一个"手动输入文本"功能
用户从 PDF 复制文本后粘贴到输入框
跳过自动解析步骤
方案 3：接受解析失败，只做预览

PDF 解析失败时，只显示 PDF 预览（iframe）
用户可以查看 PDF，但无法进行 AI 对话
提示用户尝试其他 PDF 文件
你想采用哪个方案？我可以帮你实现。