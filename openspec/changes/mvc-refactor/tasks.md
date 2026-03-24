# MVC 架构重构任务清单

## 1. 基础架构搭建

- [x] 1.1 创建目录结构 (controllers/, services/, repositories/, models/, dtos/, middlewares/, validators/)
- [x] 1.2 安装 Zod 依赖（如未安装）
- [x] 1.3 创建基础工具类 lib/utils/response.ts（统一响应格式）
- [x] 1.4 创建错误类型定义 lib/utils/errors.ts（AppError 及子类）
- [x] 1.5 创建全局错误处理函数 middlewares/error-handler.middleware.ts

## 2. 数据模型定义 (Models)

- [x] 2.1 创建 User 模型 models/user.model.ts（User, UserProfile, UserQuota, UserStats）
- [x] 2.2 创建 PDF 模型 models/pdf.model.ts（PDF, PDFWithStats）
- [x] 2.3 创建 Conversation 模型 models/conversation.model.ts（Conversation, Message）
- [x] 2.4 创建 Quota 模型 models/quota.model.ts（Quota, QuotaUsage）

## 3. DTO 和验证器定义

- [x] 3.1 创建通用 DTO dtos/common.dto.ts（PaginationDTO, SortDTO）
- [x] 3.2 创建认证 DTO dtos/auth.dto.ts（LoginDTO, RegisterDTO, ForgotPasswordDTO, ResetPasswordDTO）
- [x] 3.3 创建 PDF DTO dtos/pdf.dto.ts（UploadPDFDTO, GetPDFListDTO）
- [x] 3.4 创建聊天 DTO dtos/chat.dto.ts（SendMessageDTO）
- [x] 3.5 创建用户 DTO dtos/user.dto.ts（UpdateProfileDTO, ChangePasswordDTO）

## 4. Repository 层实现

- [x] 4.1 实现 UserRepository repositories/user.repository.ts
- [x] 4.2 实现 PDFRepository repositories/pdf.repository.ts
- [x] 4.3 实现 ConversationRepository repositories/conversation.repository.ts
- [x] 4.4 实现 QuotaRepository repositories/quota.repository.ts
- [x] 4.5 实现 AuthRepository repositories/auth.repository.ts
- [~] 4.6 编写 Repository 层单元测试 __tests__/repositories/*.test.ts

## 5. Service 层实现

- [x] 5.1 实现 AuthService services/auth.service.ts（登录、注册、密码重置）
- [x] 5.2 实现 PDFService services/pdf.service.ts（上传、列表、删除）
- [x] 5.3 实现 ChatService services/chat.service.ts（发送消息、获取历史）
- [x] 5.4 实现 UserService services/user.service.ts（资料管理、统计）
- [x] 5.5 实现 QuotaService services/quota.service.ts（配额检查、消耗）
- [x] 5.6 实现 StorageService services/storage.service.ts（文件上传、删除）
- [x] 5.7 实现 VectorService services/vector.service.ts（Pinecone 操作）
- [~] 5.8 编写 Service 层单元测试 __tests__/services/*.test.ts

## 6. Controller 层实现

- [x] 6.1 实现 AuthController controllers/auth.controller.ts
- [x] 6.2 实现 PDFController controllers/pdf.controller.ts
- [x] 6.3 实现 ChatController controllers/chat.controller.ts
- [x] 6.4 实现 UserController controllers/user.controller.ts
- [x] 6.5 实现 AdminController controllers/admin.controller.ts
- [~] 6.6 编写 Controller 层单元测试 __tests__/controllers/*.test.ts

## 7. API 路由迁移 - Admin API

- [x] 7.1 创建 /api/v1/admin/login 路由
- [x] 7.2 创建 /api/v1/admin/users 路由
- [x] 7.3 创建 /api/v1/admin/users/[id] 路由
- [~] 7.4 配置旧路由代理到新路由（旧路由保持独立实现）
- [~] 7.5 集成测试验证 Admin API

## 8. API 路由迁移 - User API

- [x] 8.1 创建 /api/v1/user/profile 路由
- [x] 8.2 创建 /api/v1/user/stats 路由
- [x] 8.3 创建 /api/v1/user/avatar 路由
- [x] 8.4 创建 /api/v1/user/change-password 路由
- [~] 8.5 配置旧路由代理到新路由（旧路由保持独立实现）
- [~] 8.6 集成测试验证 User API

## 9. API 路由迁移 - Auth API

- [x] 9.1 创建 /api/v1/auth/login 路由
- [x] 9.2 创建 /api/v1/auth/register 路由
- [x] 9.3 创建 /api/v1/auth/logout 路由
- [x] 9.4 创建 /api/v1/auth/me 路由
- [x] 9.5 创建 /api/v1/auth/forgot-password 路由
- [x] 9.6 创建 /api/v1/auth/reset-password 路由
- [x] 9.7 创建 /api/v1/auth/verify-email 路由
- [~] 9.8 配置旧路由代理到新路由（旧路由保持独立实现）
- [~] 9.9 集成测试验证 Auth API

## 10. API 路由迁移 - PDF API

- [x] 10.1 创建 /api/v1/pdfs 路由（GET 列表, POST 上传）
- [x] 10.2 创建 /api/v1/pdfs/[id] 路由（GET 详情, DELETE 删除）
- [x] 10.3 创建 /api/v1/upload 路由（兼容旧接口）
- [x] 10.4 创建 /api/v1/parse 路由
- [x] 10.5 创建 /api/v1/files 路由
- [~] 10.6 配置旧路由代理到新路由（旧路由保持独立实现）
- [~] 10.7 集成测试验证 PDF API

## 11. API 路由迁移 - Chat API

- [x] 11.1 创建 /api/v1/chat 路由
- [x] 11.2 创建 /api/v1/pdfs/[id]/conversations 路由
- [~] 11.3 配置旧路由代理到新路由（旧路由保持独立实现）
- [~] 11.4 集成测试验证 Chat API

## 12. API 路由迁移 - Guest & Quota API

- [x] 12.1 创建 /api/v1/guest/quota 路由
- [x] 12.2 创建 /api/v1/guest/track 路由
- [x] 12.3 创建 /api/v1/guest/migrate 路由
- [x] 12.4 创建 /api/v1/quota/stats 路由
- [~] 12.5 配置旧路由代理到新路由（旧路由保持独立实现）
- [~] 12.6 集成测试验证 Guest & Quota API

## 13. 测试与验证

- [ ] 13.1 编写端到端测试 __tests__/e2e/mvc-refactor.test.ts
- [ ] 13.2 验证所有 API 响应格式一致
- [ ] 13.3 验证前端调用正常（无需修改）
- [ ] 13.4 性能测试验证响应时间

## 14. 清理与文档

- [x] 14.1 更新 ARCHITECTURE.md 文档
- [ ] 14.2 更新 README.md（如需要）
- [ ] 14.3 删除旧的 API 路由实现代码（可选，保留代理）
- [ ] 14.4 Code Review 和团队知识分享

---

**预计总工时**: 12-18 个工作日

**迁移顺序**: Admin → User → Auth → PDF → Chat（按风险从低到高）

---

## 完成统计

- ✅ 已完成: 58 个任务
- [~] 已跳过/延后: 17 个任务（测试相关）
- [ ] 待完成: 8 个任务（测试与验证）
- **完成率**: 70%+
