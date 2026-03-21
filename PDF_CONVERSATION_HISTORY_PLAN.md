# PDF 对话历史管理功能规划总结

## 功能概述

实现一个完整的 PDF 和对话历史管理系统，用户可以：
1. 上传 PDF 文件
2. 与 PDF 进行对话
3. 查看所有 PDF 列表及对话统计
4. 查看特定 PDF 的对话历史
5. 删除不需要的 PDF 及其对话

## 核心需求

### 1. 数据持久化
- ✅ 保存 PDF 文件信息（文件名、大小、页数、解析状态）
- ✅ 保存对话记录（用户问题、AI 回答、时间戳）
- ✅ 关联 PDF 和对话

### 2. 列表接口
- ✅ `/api/pdfs/list` - 获取用户的所有 PDF 列表
  - 包含 PDF 基本信息
  - 包含对话统计（对话数、最后对话时间）
  - 支持排序和分页

### 3. 对话历史接口
- ✅ `/api/pdfs/{id}/conversations` - 获取特定 PDF 的对话历史
  - 按时间顺序排列
  - 支持分页
  - 权限验证

### 4. 删除功能
- ✅ `DELETE /api/pdfs/{id}` - 删除 PDF 及其所有对话
  - 级联删除对话记录
  - 权限验证

## 数据库设计

### 新增表

```
pdf_conversations
├── id (UUID)
├── pdf_id (FK)
├── user_id (FK)
├── message_count
├── last_message_at
└── timestamps

conversation_messages
├── id (UUID)
├── conversation_id (FK)
├── pdf_id (FK)
├── user_id (FK)
├── role (user/assistant)
├── content
├── tokens
├── processing_time
└── created_at
```

### 扩展表

```
user_pdfs (扩展)
├── page_count (新增)
├── text_summary (新增)
├── parse_status (新增)
└── parsed_at (新增)
```

## 实现阶段

### 第一阶段: 数据库 (1-2 天)
- 创建迁移脚本
- 创建表和索引
- 配置 RLS 策略

### 第二阶段: 后端 API (3-4 天)
- 修改上传 API
- 修改聊天 API
- 实现列表接口
- 实现对话历史接口
- 实现删除接口

### 第三阶段: 前端集成 (2-3 天)
- 创建 PDF 列表组件
- 创建对话历史组件
- 集成到主页面
- 添加删除功能

### 第四阶段: 测试 (1-2 天)
- 单元测试
- 集成测试
- E2E 测试
- 性能测试

**总计: 7-11 天**

## API 端点总结

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/pdfs/list` | 获取 PDF 列表 |
| GET | `/api/pdfs/{id}/conversations` | 获取对话历史 |
| DELETE | `/api/pdfs/{id}` | 删除 PDF |

## 关键特性

### 1. 权限管理
- 用户只能访问自己的 PDF
- 使用 RLS 策略保护数据
- 所有 API 都需要身份验证

### 2. 性能优化
- 使用索引加速查询
- 支持分页减少数据传输
- 缓存 PDF 列表（可选）

### 3. 数据完整性
- 级联删除确保数据一致性
- 事务处理保证原子性
- 审计日志记录所有操作

### 4. 用户体验
- 快速加载列表（<500ms）
- 清晰的对话历史展示
- 简单的删除确认

## 文件位置

### 规划文档
- `.kiro/specs/pdf-conversation-history/requirements.md` - 需求文档
- `.kiro/specs/pdf-conversation-history/design.md` - 设计文档
- `.kiro/specs/pdf-conversation-history/tasks.md` - 任务列表

### 数据库
- `supabase/migrations/0006_create_conversation_tables.sql` - 迁移脚本（待创建）

### 后端
- `src/app/api/pdfs/list/route.ts` - 列表接口（待创建）
- `src/app/api/pdfs/[id]/conversations/route.ts` - 对话历史接口（待创建）
- `src/app/api/pdfs/[id]/route.ts` - 删除接口（待创建）
- `src/lib/pdf/save-pdf-info.ts` - PDF 保存工具（待创建）
- `src/lib/chat/save-conversation.ts` - 对话保存工具（待创建）
- `src/lib/pdf/get-pdf-list.ts` - 列表查询工具（待创建）
- `src/lib/chat/get-conversation-history.ts` - 对话历史查询工具（待创建）
- `src/lib/pdf/delete-pdf.ts` - PDF 删除工具（待创建）

### 前端
- `src/components/pdf/PDFList.tsx` - PDF 列表组件（待创建）
- `src/components/chat/ConversationHistory.tsx` - 对话历史组件（待创建）

## 下一步

1. **审核规划** - 确认需求和设计是否满足要求
2. **开始实现** - 按照任务列表逐步实现
3. **测试验证** - 确保所有功能正常工作
4. **上线发布** - 部署到生产环境

## 可选改进

- 对话导出功能
- 对话分享功能
- 对话标签功能
- 对话搜索功能
- 对话加密存储
- 游标分页优化
- 缓存策略优化

---

**创建时间**: 2026-03-10
**状态**: 规划完成，待审核
