# PDF 聊天功能优化提案

## Why

当前 PDF 对话功能存在两个主要问题：
1. **无法删除 PDF 文件** - 用户上传错误的文件后无法删除，导致列表混乱
2. **历史对话查看不便** - 历史对话在独立的标签页中，需要在"对话"和"历史"之间切换才能看到之前的对话记录

这两个问题影响了用户体验，需要在开发过程中修复。

## What Changes

### PDF 删除功能
- 在 PDF 列表每项右侧添加删除按钮（垃圾桶图标）
- 点击删除时弹出确认对话框，提示将同时删除所有对话记录
- 确认后级联删除：
  - 对话消息 (`conversation_messages`)
  - 对话记录 (`pdf_conversations`)
  - PDF 文档 (`user_pdfs`)
- 删除成功后刷新列表并显示成功提示

### 对话界面优化
- 移除右侧的"对话"/"历史"标签页切换
- 选择 PDF 文件后，自动在对话框中加载并显示历史对话
- 保留对话输入框，可以继续发送新消息
- 加载历史对话时显示加载状态

### 代码改动
- **AppLayout.tsx**: 简化布局，移除右侧 Tabs 组件，直接显示 ChatInterface
- **ChatContext.tsx**: 添加 `loadMessages` 方法，用于批量加载历史消息
- **ChatInterface.tsx**:
  - 添加历史对话自动加载逻辑
  - 添加加载状态显示
- **PDFList.tsx**: 添加删除按钮和确认对话框
- **PDFContext.tsx**: 更新 `removePDF` 方法调用 DELETE API

## Capabilities

### New Capabilities
- `pdf-delete`: PDF 文档删除功能，包括级联删除相关对话数据
- `chat-history-auto-load`: 对话界面自动加载历史消息

### Modified Capabilities
- `pdf-chat`: 对话界面布局调整，集成历史消息显示

## Impact

### Affected Components
- `src/components/layout/AppLayout.tsx`
- `src/components/chat/ChatInterface.tsx`
- `src/components/chat/PDFList.tsx`
- `src/contexts/ChatContext.tsx`
- `src/contexts/PDFContext.tsx`

### API Endpoints
- `DELETE /api/pdfs/[id]` - 已存在，确保正常工作
- `GET /api/pdfs/[id]/conversations` - 已存在，用于加载历史对话

### Database
- 确保级联删除逻辑正确（已实现在 `src/lib/pdf/delete-pdf.ts`）
