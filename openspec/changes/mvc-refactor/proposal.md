# MVC 架构重构提案

## Why

当前项目采用 Next.js App Router 架构，API 路由直接在 `app/api/` 目录下，业务逻辑分散在 `lib/` 目录中。随着项目规模增长，出现了以下问题：

1. **API 路由臃肿**：每个 route.ts 包含过多业务逻辑，难以维护和测试
2. **服务层分散**：服务函数分散在多个文件中，代码重复，职责不清
3. **缺乏分层**：控制器、服务、数据访问层混杂，耦合度高，可测试性差
4. **难以单元测试**：无法 mock 数据库依赖，测试困难

**为什么现在实现**：
- 项目已完成核心功能开发，需要提升代码质量和可维护性
- 用户认证系统已上线，需要更清晰的架构支持后续功能扩展
- 前端工程师需要学习全栈开发，MVC 是经典的后端架构模式

## What Changes

### 核心变化

1. **新增分层架构**：Controller → Service → Repository 清晰分层
2. **数据模型定义**：统一的 Models 和 DTOs 定义
3. **Repository 层**：封装所有数据库操作，提供清晰的数据访问接口
4. **Service 层**：实现核心业务逻辑，协调多个 Repository
5. **Controller 层**：处理 HTTP 请求，参数验证，调用 Service
6. **API 版本控制**：引入 `/api/v1/` 版本化路由
7. **中间件系统**：统一的认证、错误处理、参数验证中间件

### 技术架构变化

- 新增 `src/controllers/` 目录 - 控制器层
- 新增 `src/services/` 目录 - 服务层（业务逻辑）
- 新增 `src/repositories/` 目录 - 数据访问层
- 新增 `src/models/` 目录 - 数据模型/实体
- 新增 `src/dtos/` 目录 - 数据传输对象
- 新增 `src/middlewares/` 目录 - 中间件
- 新增 `src/validators/` 目录 - 验证器
- 新增 `src/app/api/v1/` - API 版本化路由

## Capabilities

### New Capabilities

- `mvc-architecture`: MVC 分层架构基础设施（Controller、Service、Repository 层）
- `api-versioning`: API 版本控制系统（/api/v1/）
- `repository-pattern`: Repository 模式数据访问层（封装 Supabase 操作）
- `dto-validation`: DTO 数据传输对象和 Zod 验证系统
- `error-handling`: 统一错误处理中间件

### Modified Capabilities

- `auth-api`: 认证 API 重构为 MVC 架构（行为不变，实现改变）
- `pdf-api`: PDF API 重构为 MVC 架构（行为不变，实现改变）
- `chat-api`: 聊天 API 重构为 MVC 架构（行为不变，实现改变）
- `user-api`: 用户 API 重构为 MVC 架构（行为不变，实现改变）
- `admin-api`: 管理员 API 重构为 MVC 架构（行为不变，实现改变）

## Impact

### 受影响的系统

1. **API 路由**
   - 新增：`/api/v1/*` 版本化路由
   - 保留：`/api/*` 旧路由作为代理（过渡期）
   - 影响：48 个 API 路由文件

2. **核心模块**
   - 新增：controllers/ (5+ 文件)
   - 新增：services/ (6+ 文件)
   - 新增：repositories/ (5+ 文件)
   - 新增：models/ (4+ 文件)
   - 新增：dtos/ (4+ 文件)
   - 新增：middlewares/ (4+ 文件)

3. **依赖项**
   - 新增：zod（参数验证，可能已有）
   - 复用：@supabase/supabase-js（数据库）

4. **测试**
   - 新增：Repository 层单元测试
   - 新增：Service 层单元测试
   - 新增：Controller 层单元测试
   - 新增：集成测试

### 兼容性

- **向后兼容**：旧路由 `/api/*` 保持可用，转发到新路由
- **前端无影响**：API 响应格式保持不变
- **渐进式迁移**：按模块逐步迁移，不影响其他模块

## 实施阶段

本项目将分 6 个阶段实施，每个阶段都是独立可交付的里程碑：

### 阶段 1: 基础架构 (1-2 天)
- 创建新目录结构
- 定义数据模型 (Models)
- 定义 DTO 和验证器
- 创建基础工具类（响应、错误处理）

### 阶段 2: 数据访问层 (2-3 天)
- 实现 UserRepository
- 实现 PDFRepository
- 实现 ConversationRepository
- 实现 QuotaRepository
- 实现 AuthRepository
- 编写 Repository 单元测试

### 阶段 3: 服务层 (3-4 天)
- 实现 AuthService
- 实现 PDFService
- 实现 ChatService
- 实现 UserService
- 实现 QuotaService
- 编写 Service 单元测试

### 阶段 4: 控制器层 (2-3 天)
- 实现 AuthController
- 实现 PDFController
- 实现 ChatController
- 实现 UserController
- 实现 AdminController
- 编写 Controller 单元测试

### 阶段 5: 迁移 API 路由 (2-3 天)
- 创建 /api/v1/ 路由
- 逐模块迁移 API
- 配置旧路由代理
- 更新前端 API 调用（可选）

### 阶段 6: 测试与清理 (2-3 天)
- 集成测试
- E2E 测试
- 删除旧代码（可选）
- 更新文档

## 成功指标

- [ ] 所有 API 功能正常，响应格式不变
- [ ] 单元测试覆盖率 > 80%
- [ ] 所有集成测试通过
- [ ] 代码分层清晰，职责明确
- [ ] 新功能开发效率提升（可独立测试各层）
- [ ] 前端调用无需修改即可正常工作
