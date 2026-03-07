# 修复步骤

## 问题
Next.js 构建缓存损坏，导致 middleware-manifest.json 缺失。

## 解决方案

### 1. 停止开发服务器
在运行 `npm run dev` 的终端中按 `Ctrl+C` 停止服务器

### 2. 清理构建缓存
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next

# 或者使用 CMD
rmdir /s /q .next

# 或者手动删除 .next 文件夹
```

### 3. 清理 node_modules 缓存（可选，如果问题仍存在）
```bash
npm cache clean --force
```

### 4. 重新启动开发服务器
```bash
npm run dev
```

## 为什么需要这样做

修改 `next.config.js` 后，Next.js 会尝试重新构建，但有时缓存会导致问题。完全清理 `.next` 目录可以确保干净的构建。

## PDF Parse 修复总结

已更新的文件：
1. `src/lib/pdf/parser.ts` - 使用 `pdf-parse/node` 导出
2. `next.config.js` - 添加 canvas 别名禁用

关键改动：
```typescript
// 使用 Node.js 专用导出
const { default: pdfParse } = await import("pdf-parse/node");
```

这个版本专门为 Node.js 环境优化，避免了浏览器相关的依赖问题。
