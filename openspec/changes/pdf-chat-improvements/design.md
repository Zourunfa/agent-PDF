# PDF 聊天功能优化技术设计

## Context

### 当前状态
- PDF 对话功能已实现，但缺少删除功能
- 历史对话在独立标签页中，用户需要切换才能查看
- 后端删除 API 已存在 (`DELETE /api/pdfs/[id]`)
- 历史对话 API 已存在 (`GET /api/pdfs/[id]/conversations`)

### 约束条件
- 使用现有 Ant Design 组件库
- 保持与现有代码风格一致
- 不破坏现有功能

## Goals / Non-Goals

**Goals:**
- 实现直观的 PDF 删除功能，包含确认对话框和错误处理
- 简化对话界面，在对话框中直接显示历史对话
- 保持代码简洁，复用现有 API 和组件

**Non-Goals:**
- 批量删除功能（单个删除已足够）
- 撤销删除功能（删除前有确认提示）
- 历史对话的分页加载（当前一次性加载 100 条足够）

## Decisions

### 1. 删除按钮位置和样式
**决策**: 删除按钮放在 PDF 列表每项右侧，始终可见

**理由**:
- 始终可见比悬停显示更直观
- 使用红色图标传达危险操作
- 与现有的"手动输入"按钮并排显示

**替代方案**:
- 悬停时显示按钮 - 用户可能发现不了
- 下拉菜单中放置删除 - 增加点击次数

### 2. 删除确认对话框
**决策**: 使用 Ant Design Modal.confirm 组件

**理由**:
- 内置组件，无需额外开发
- 支持自定义内容和危险按钮样式
- 清晰警告将删除所有对话记录

### 3. 历史对话加载时机
**决策**: 在 ChatInterface 组件中监听 `activePdfId` 变化时自动加载

**理由**:
- 用户选择 PDF 后立即看到历史记录
- 无需额外操作，体验更流畅
- 使用 useEffect 确保 PDF 切换时重新加载

### 4. 简化对话界面布局
**决策**: 移除"对话"/"历史"标签页，直接显示 ChatInterface

**理由**:
- 减少界面复杂度
- 历史对话和新对话在同一界面更自然
- 代码更简洁，减少状态管理

### 5. ChatContext 扩展
**决策**: 添加 `loadMessages` 方法用于批量加载历史消息

**理由**:
- 保持与 `addMessage` 方法风格一致
- 支持一次性替换整个消息列表
- 便于后续其他场景使用

## Implementation

### PDF 删除流程

```
用户点击删除按钮
    ↓
Modal.confirm 显示确认对话框
    ↓ (确认)
调用 PDFContext.removePDF(id)
    ↓
发送 DELETE /api/pdfs/[id]
    ↓
后端级联删除:
  - conversation_messages
  - pdf_conversations
  - user_pdfs
    ↓
前端刷新列表并显示成功消息
```

### 历史对话加载流程

```
用户点击 PDF 列表项
    ↓
activePdfId 更新
    ↓
useEffect 检测到 activePdfId 变化
    ↓
调用 GET /api/pdfs/[id]/conversations
    ↓
转换消息格式并调用 loadMessages
    ↓
ChatInterface 显示历史消息
    ↓
用户可以继续发送新消息
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 删除操作不可逆 | 添加明确的确认对话框，提示将删除所有对话记录 |
| 历史消息加载失败 | 添加错误处理，失败时清空对话不影响使用 |
| 大量历史消息影响性能 | 限制加载 100 条消息，足够日常使用 |
| 删除 API 返回错误 | 显示错误提示，本地状态保持一致 |

## Migration Plan

### 部署步骤
1. 更新前端代码（已完成）
2. 测试删除功能和历史对话加载
3. 部署到生产环境

### 回滚策略
- 保留后端 API 不变
- 前端可快速回滚到之前的标签页布局

## Files Changed

- `src/components/layout/AppLayout.tsx` - 移除右侧 Tabs
- `src/components/chat/ChatInterface.tsx` - 添加历史对话加载
- `src/components/chat/PDFList.tsx` - 添加删除按钮
- `src/contexts/ChatContext.tsx` - 添加 loadMessages 方法
- `src/contexts/PDFContext.tsx` - 更新 removePDF 调用 API
