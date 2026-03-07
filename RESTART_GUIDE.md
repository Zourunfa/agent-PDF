# 重启开发服务器指南

## 当前状态
- ✅ 聊天界面已重构完成
- ✅ PDF 解析代码已修复
- ✅ Next.js 配置已更新
- ⚠️ 需要清理缓存并重启服务器

## 操作步骤

### 步骤 1: 停止当前服务器
在运行开发服务器的终端窗口中：
- 按 `Ctrl + C` 停止服务器
- 等待进程完全停止

### 步骤 2: 清理构建缓存

**方法 A - 使用 PowerShell（推荐）:**
```powershell
# 确保服务器已停止，然后运行
Remove-Item -Recurse -Force .next
```

**方法 B - 使用文件资源管理器:**
1. 打开项目文件夹
2. 找到 `.next` 文件夹
3. 右键删除整个文件夹

**方法 C - 使用 CMD:**
```cmd
rmdir /s /q .next
```

### 步骤 3: 重新启动开发服务器
```bash
npm run dev
```

### 步骤 4: 验证修复
1. 打开浏览器访问 http://localhost:3000
2. 上传一个 PDF 文件
3. 检查是否能正常解析
4. 尝试与 PDF 内容对话

## 如果问题仍然存在

### 完全清理（终极方案）
```bash
# 1. 停止服务器
# 2. 删除所有缓存
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules

# 3. 清理 npm 缓存
npm cache clean --force

# 4. 重新安装依赖
npm install

# 5. 启动服务器
npm run dev
```

## 修复内容总结

### 1. 聊天界面重构
- 统一科幻深色主题
- 优化消息气泡设计
- 添加复制功能和动画效果
- 改进输入框交互
- 添加示例问题

### 2. PDF 解析修复
- 使用 `pdf-parse/node` 专用导出
- 添加动态导入避免 webpack 问题
- 更新 Next.js 配置禁用 canvas

### 3. 配置更新
- `next.config.js`: 添加 webpack 配置
- `src/lib/pdf/parser.ts`: 使用正确的导入方式

## 技术细节

### PDF Parse 导入方式
```typescript
// ✅ 正确 - 使用 Node.js 专用版本
const { default: pdfParse } = await import("pdf-parse/node");

// ❌ 错误 - 默认导出在 Next.js 中有问题
import pdf from "pdf-parse";
```

### Next.js Webpack 配置
```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false, // pdf-parse 依赖但不需要
    };
  }
  return config;
}
```

## 预期结果

重启后应该看到：
- ✅ 服务器正常启动
- ✅ 页面正常加载
- ✅ PDF 上传成功
- ✅ PDF 解析成功
- ✅ 聊天功能正常
- ✅ 新的界面样式生效

## 故障排除

### 如果仍然看到 MODULE_NOT_FOUND 错误
1. 确认 `.next` 文件夹已完全删除
2. 检查是否有多个终端在运行服务器
3. 重启 IDE/编辑器
4. 尝试完全清理方案

### 如果 PDF 解析失败
1. 检查控制台日志
2. 确认 PDF 文件格式正确
3. 尝试不同的 PDF 文件
4. 检查文件大小限制（当前 10MB）

## 联系支持
如果问题持续存在，请提供：
- 错误日志
- Node.js 版本 (`node -v`)
- npm 版本 (`npm -v`)
- 操作系统信息
