# PDF 文件大小限制更新

## 更新时间
2025-03-08

## 更新内容
将 PDF 文件上传大小限制从 **10MB** 改为 **1MB**

## 修改的文件

### 1. 核心代码文件

#### src/lib/utils/validation.ts
- ✅ 更新 `MAX_FILE_SIZE` 常量：`10 * 1024 * 1024` → `1 * 1024 * 1024`
- ✅ 更新错误提示信息：`"文件大小不能超过 10MB"` → `"文件大小不能超过 1MB"`

#### src/components/pdf/PDFUploaderPro.tsx
- ✅ 更新上传提示文本：`"最大 10MB"` → `"最大 1MB"`

#### src/components/pdf/PDFUploader.tsx
- ✅ 更新上传提示文本：`"最大 10MB"` → `"最大 1MB"`

### 2. 测试文件

#### tests/unit/lib/utils/validation.test.ts
- ✅ 更新测试用例：测试文件从 11MB 改为 2MB
- ✅ 更新测试描述：`"should reject files larger than 10MB"` → `"should reject files larger than 1MB"`
- ✅ 更新断言：`expect(result.error).toContain("10MB")` → `expect(result.error).toContain("1MB")`

### 3. 文档文件

#### README.md
- ✅ 更新功能说明：`"上传 PDF 文件（最大 10MB）"` → `"上传 PDF 文件（最大 1MB）"`

#### docs/ARCHITECTURE_GUIDE.md
- ✅ 更新关键指标表格：`"最大文件大小 | 10 MB"` → `"最大文件大小 | 1 MB"`
- ✅ 更新数据流程说明：`"验证文件大小 (≤10MB)"` → `"验证文件大小 (≤1MB)"`
- ✅ 更新代码示例：`"if (file.size > 10MB)"` → `"if (file.size > 1MB)"`

### 4. 其他需要手动更新的文档（可选）

以下文档也包含 10MB 的引用，但不影响功能运行，可根据需要更新：

- `specs/001-pdf-chat-app/plan.md` - 项目规划文档
- `UPLOADER_UPGRADE.md` - 上传器升级文档
- `RESTART_OCR.md` - OCR 重启指南
- `RESTART_GUIDE.md` - 重启指南
- `OCR_SETUP.md` - OCR 设置文档
- `docs/SPEC_KIT_TUTORIAL.md` - Spec Kit 教程
- `docs/PROGRAMMING_METHODOLOGY.md` - 编程方法论
- `docs/programming-methodology.html` - 编程方法论 HTML
- `docs/architecture-diagram.html` - 架构图 HTML

## 验证步骤

### 1. 代码验证
```bash
# 检查类型错误
npm run type-check

# 运行测试
npm test

# 启动开发服务器
npm run dev
```

### 2. 功能验证
1. 访问 http://localhost:3000
2. 尝试上传一个 < 1MB 的 PDF 文件 → 应该成功
3. 尝试上传一个 > 1MB 的 PDF 文件 → 应该显示错误："文件大小不能超过 1MB"

### 3. UI 验证
- 检查上传组件的提示文本是否显示 "最大 1MB"
- 检查错误提示是否正确显示文件大小限制

## 影响范围

### 用户体验
- ✅ 用户只能上传 1MB 以内的 PDF 文件
- ✅ 超过限制时会看到明确的错误提示
- ✅ 上传界面会显示新的大小限制

### 性能影响
- ✅ 更小的文件大小限制可以：
  - 减少服务器负载
  - 加快上传速度
  - 减少解析时间
  - 降低存储成本

### 潜在问题
- ⚠️ 1MB 限制可能对某些用户来说太小
- ⚠️ 多页 PDF 文件可能超过 1MB
- ⚠️ 高分辨率扫描件可能超过 1MB

## 建议

### 如果需要调整限制
可以通过修改 `src/lib/utils/validation.ts` 中的 `MAX_FILE_SIZE` 常量来调整：

```typescript
// 1MB
const MAX_FILE_SIZE = 1 * 1024 * 1024;

// 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
```

### 环境变量配置（推荐）
考虑将文件大小限制改为环境变量配置：

```typescript
// src/lib/utils/validation.ts
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '1048576'); // 默认 1MB
```

```env
# .env.local
MAX_FILE_SIZE=1048576  # 1MB in bytes
```

这样可以在不修改代码的情况下调整限制。

## 回滚方案

如果需要回滚到 10MB 限制，执行以下操作：

1. 恢复 `src/lib/utils/validation.ts`：
   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   ```

2. 恢复错误提示：
   ```typescript
   error: `文件大小不能超过 10MB（当前: ${(file.size / 1024 / 1024).toFixed(2)}MB）`
   ```

3. 恢复 UI 提示文本（两个上传组件）

4. 恢复测试用例

5. 恢复文档

---

*更新完成时间：2025-03-08*  
*修改文件数：7个*  
*影响范围：文件上传验证、UI 提示、测试、文档*
