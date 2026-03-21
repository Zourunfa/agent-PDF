# PDF Parse API 修复

## 问题描述
Parse API 返回 `NOT_FOUND` 错误，原因是 PDF 文件在临时目录中不存在。这在以下情况下会发生：
1. 服务器重启后，临时文件被清除
2. 在 Vercel 等无服务器环境中，临时文件不持久化
3. 多个请求之间的时间间隔较长

## 根本原因
Parse API 只在临时目录中查找 PDF 文件，如果文件不存在就直接返回失败。没有从数据库或其他存储位置检索 PDF 的备用方案。

## 修复方案
更新 `src/app/api/parse/route.ts` 中的 `parsePDFAsyncInternal` 函数，添加以下逻辑：

1. **首先检查临时目录** - 如果 PDF 文件在临时目录中，直接使用
2. **从数据库检索** - 如果文件不在临时目录，从 `user_pdfs` 表查询 `storage_path`
3. **复制到临时目录** - 将 PDF 从存储路径复制到临时目录以供处理
4. **解析 PDF** - 使用复制的文件进行解析

## 修改的代码流程

```typescript
// 原流程：
检查临时目录 → 不存在 → 返回失败 ❌

// 新流程：
检查临时目录 
  → 存在 → 使用文件 ✓
  → 不存在 → 从数据库查询存储路径
    → 找到 → 复制到临时目录 → 使用文件 ✓
    → 未找到 → 返回失败 ❌
```

## 关键改进

1. **数据库查询**：
   ```typescript
   const { data: pdfRecord } = await supabase
     .from('user_pdfs')
     .select('storage_path')
     .eq('id', pdfId)
     .single();
   ```

2. **文件复制**：
   ```typescript
   const buffer = await fs.readFile(storagePath);
   await fs.mkdir(tempDir, { recursive: true });
   await fs.writeFile(filePath, buffer);
   ```

3. **错误处理**：
   - 数据库查询失败时返回 FAILED 状态
   - 存储路径不可访问时返回 FAILED 状态
   - 提供详细的日志信息用于调试

## 测试步骤

1. 上传一个 PDF 文件
2. 等待一段时间（让临时文件可能被清除）
3. 尝试解析 PDF
4. 验证 Parse API 能够成功检索并解析 PDF

## 相关文件
- `src/app/api/parse/route.ts` - Parse API 路由
- `src/lib/storage/temp-files.ts` - 临时文件管理
- `src/lib/storage/pdf-files.ts` - PDF 文件存储

## 注意事项
- 此修复仅适用于已登录用户上传的 PDF（因为游客上传的 PDF 不保存到数据库）
- 游客上传的 PDF 仍然依赖于临时文件的可用性
- 在生产环境中，建议使用持久化存储（如 S3）而不是临时目录
