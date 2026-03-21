# 前端集成指南 - PDF 对话历史功能

## 📋 概述

已完成前端集成，使应用能够自动调用新的 API 接口来获取和显示 PDF 列表及对话历史。

## ✅ 完成的集成

### 1️⃣ PDFList 组件更新

**文件**: `src/components/pdf/PDFList.tsx`

**变更**:
- 添加了 `useEffect` 钩子，在组件挂载时自动调用 `/api/pdfs/list` 接口
- 从 API 获取 PDF 列表数据，包括对话统计信息
- 优先使用 API 数据，如果没有则回退到本地 Context 数据
- 添加了加载状态和错误处理

**工作流程**:
```
页面加载
    ↓
PDFList 组件挂载
    ↓
useEffect 触发
    ↓
调用 /api/pdfs/list?limit=50&offset=0&sortBy=uploadedAt&sortOrder=desc
    ↓
获取 PDF 列表数据
    ↓
更新组件状态
    ↓
渲染 PDF 列表
```

**API 调用示例**:
```typescript
const response = await fetch('/api/pdfs/list?limit=50&offset=0&sortBy=uploadedAt&sortOrder=desc');
const data = await response.json();
// data.data.pdfs 包含 PDF 列表
// data.data.pagination 包含分页信息
```

### 2️⃣ ConversationHistory 组件（新建）

**文件**: `src/components/chat/ConversationHistory.tsx`

**功能**:
- 显示选中 PDF 的对话历史
- 自动调用 `/api/pdfs/{id}/conversations` 接口
- 显示用户消息和 AI 回复
- 显示消息元数据（时间、tokens、处理时间）
- 显示对话统计信息

**工作流程**:
```
用户选择 PDF
    ↓
activePdfId 变化
    ↓
useEffect 触发
    ↓
调用 /api/pdfs/{id}/conversations?limit=100&offset=0
    ↓
获取对话历史
    ↓
渲染对话消息
```

**显示内容**:
- 用户消息（蓝色背景）
- AI 回复（绿色背景）
- 消息时间戳
- Token 数量
- 处理时间
- 对话统计（总消息数、用户消息数、AI 回复数、总 tokens）

### 3️⃣ AppLayout 组件更新

**文件**: `src/components/layout/AppLayout.tsx`

**变更**:
- 导入 `ConversationHistory` 组件
- 在右侧聊天面板添加标签页
- 标签页 1: "对话" - 显示 ChatInterface
- 标签页 2: "历史" - 显示 ConversationHistory

**UI 结构**:
```
┌─────────────────────────────────────────────────────┐
│                    应用布局                          │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   左侧面板           │      右侧面板                │
│  ┌────────────────┐  │  ┌──────────────────────┐   │
│  │ PDF 上传       │  │  │ [对话] [历史]        │   │
│  ├────────────────┤  │  ├──────────────────────┤   │
│  │ PDF 列表       │  │  │                      │   │
│  │ (从 API 获取)  │  │  │  对话界面 / 历史     │   │
│  ├────────────────┤  │  │  (标签页切换)        │   │
│  │ PDF 预览       │  │  │                      │   │
│  │ 文本内容       │  │  │                      │   │
│  └────────────────┘  │  └──────────────────────┘   │
└──────────────────────┴──────────────────────────────┘
```

## 🔄 数据流程

### 初始加载流程

```
用户打开应用
    ↓
AppLayout 组件挂载
    ↓
PDFList 组件挂载
    ↓
PDFList useEffect 触发
    ↓
调用 GET /api/pdfs/list
    ↓
获取 PDF 列表 (包含对话统计)
    ↓
渲染 PDF 列表
    ↓
用户可以看到所有 PDF 及其对话数量
```

### 查看对话历史流程

```
用户点击 PDF 列表中的某个 PDF
    ↓
activePdfId 更新
    ↓
ConversationHistory 组件的 useEffect 触发
    ↓
调用 GET /api/pdfs/{id}/conversations
    ↓
获取对话历史消息
    ↓
切换到"历史"标签页
    ↓
显示对话消息和统计信息
```

## 📊 API 调用时机

| 事件 | API 端点 | 触发条件 |
|------|---------|---------|
| 页面加载 | GET /api/pdfs/list | PDFList 组件挂载 |
| 选择 PDF | GET /api/pdfs/{id}/conversations | activePdfId 变化 |
| 删除 PDF | DELETE /api/pdfs/{id} | 用户点击删除按钮 |

## 🔍 浏览器控制台日志

打开浏览器开发者工具（F12），在控制台中可以看到：

```
[PDFList] 正在获取 PDF 列表...
[PDFList] 获取到 5 个 PDF
[ConversationHistory] 正在获取对话历史: abc-123
[ConversationHistory] 获取到 10 条消息
```

## 🐛 调试技巧

### 1. 检查 API 调用

打开浏览器开发者工具 → Network 标签页：
- 查看 `/api/pdfs/list` 请求
- 查看 `/api/pdfs/{id}/conversations` 请求
- 检查响应状态码和数据

### 2. 检查控制台日志

打开浏览器开发者工具 → Console 标签页：
- 查看 `[PDFList]` 日志
- 查看 `[ConversationHistory]` 日志
- 查看任何错误信息

### 3. 检查网络错误

如果 API 调用失败：
- 检查认证令牌是否有效
- 检查 API 服务器是否运行
- 检查数据库迁移是否完成
- 查看浏览器控制台的错误信息

## 📝 代码示例

### PDFList 组件中的 API 调用

```typescript
useEffect(() => {
  const fetchPDFList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[PDFList] 正在获取 PDF 列表...');
      
      const response = await fetch('/api/pdfs/list?limit=50&offset=0&sortBy=uploadedAt&sortOrder=desc');
      
      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data.pdfs) {
        console.log('[PDFList] 获取到', data.data.pdfs.length, '个 PDF');
        setApiPdfs(data.data.pdfs);
      }
    } catch (err) {
      console.error('[PDFList] 获取 PDF 列表出错:', err);
      setError(err instanceof Error ? err.message : '获取 PDF 列表失败');
    } finally {
      setLoading(false);
    }
  };

  fetchPDFList();
}, []);
```

### ConversationHistory 组件中的 API 调用

```typescript
useEffect(() => {
  if (!activePdfId) {
    setHistory(null);
    return;
  }

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ConversationHistory] 正在获取对话历史:', activePdfId);

      const response = await fetch(
        `/api/pdfs/${activePdfId}/conversations?limit=100&offset=0`
      );

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        console.log('[ConversationHistory] 获取到', data.data.messages.length, '条消息');
        setHistory(data.data);
      }
    } catch (err) {
      console.error('[ConversationHistory] 获取对话历史出错:', err);
      setError(err instanceof Error ? err.message : '获取对话历史失败');
    } finally {
      setLoading(false);
    }
  };

  fetchHistory();
}, [activePdfId]);
```

## 🎯 测试步骤

### 1. 测试 PDF 列表加载

1. 打开应用
2. 打开浏览器开发者工具 (F12)
3. 切换到 Network 标签页
4. 刷新页面
5. 查看是否有 `/api/pdfs/list` 请求
6. 检查响应状态码是否为 200
7. 检查响应数据中是否包含 PDF 列表

### 2. 测试对话历史加载

1. 在 PDF 列表中点击一个 PDF
2. 打开浏览器开发者工具 (F12)
3. 切换到 Network 标签页
4. 点击右侧面板的"历史"标签页
5. 查看是否有 `/api/pdfs/{id}/conversations` 请求
6. 检查响应状态码是否为 200
7. 检查响应数据中是否包含对话消息

### 3. 测试错误处理

1. 断开网络连接
2. 刷新页面
3. 检查是否显示错误信息
4. 恢复网络连接
5. 点击刷新按钮
6. 检查是否重新加载数据

## 📈 性能优化建议

1. **缓存 PDF 列表** - 可以在本地缓存 PDF 列表，减少 API 调用
2. **分页加载** - 对于大量 PDF，使用分页加载
3. **虚拟滚动** - 对于长列表，使用虚拟滚动提高性能
4. **防抖** - 对于频繁的 API 调用，使用防抖减少请求

## 🔒 安全考虑

- ✅ 所有 API 调用都需要认证令牌
- ✅ 用户只能访问自己的 PDF 和对话
- ✅ 服务器端验证用户权限
- ✅ 敏感数据不会在客户端存储

## 📞 常见问题

### Q: 为什么没有看到 PDF 列表？
A: 
1. 检查是否已登录
2. 检查浏览器控制台是否有错误
3. 检查 API 服务器是否运行
4. 检查数据库迁移是否完成

### Q: 为什么对话历史为空？
A:
1. 检查是否选择了 PDF
2. 检查该 PDF 是否有对话记录
3. 检查浏览器控制台是否有错误

### Q: 如何刷新数据？
A:
1. 刷新整个页面 (Ctrl+R 或 Cmd+R)
2. 或点击对话历史中的刷新按钮

## 📚 相关文件

- `src/components/pdf/PDFList.tsx` - PDF 列表组件（已更新）
- `src/components/chat/ConversationHistory.tsx` - 对话历史组件（新建）
- `src/components/layout/AppLayout.tsx` - 应用布局（已更新）
- `src/app/page.tsx` - 主页面（已更新）

## 🚀 下一步

1. **测试所有功能** - 确保 API 调用正常
2. **优化 UI/UX** - 改进用户界面
3. **添加更多功能** - 如搜索、过滤、排序
4. **性能优化** - 缓存、分页、虚拟滚动
5. **错误处理** - 更好的错误提示和恢复机制

---

**最后更新**: 2026 年 3 月 10 日
**状态**: ✅ 前端集成完成，可以测试
