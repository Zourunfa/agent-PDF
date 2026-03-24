# MVC 架构重构技术设计

## Context

### 当前状态

项目采用 Next.js App Router 架构，当前存在以下技术问题：

```
src/
├── app/api/          # 48+ API 路由，每个包含完整业务逻辑
├── lib/              # 服务逻辑分散，缺乏统一组织
│   ├── auth/         # 认证逻辑
│   ├── pdf/          # PDF 处理
│   ├── chat/         # 聊天逻辑
│   ├── storage/      # 存储服务
│   └── supabase/     # 数据库客户端
```

**问题分析**：
- API 路由直接操作数据库，违反单一职责原则
- 业务逻辑重复，多个 API 共享相似代码
- 难以进行单元测试（无法 mock 数据库）
- 代码耦合度高，修改一处影响多处

### 约束条件

- 保持 API 向后兼容，前端无需修改
- 使用现有的 Supabase 数据库，不更换 ORM
- 渐进式迁移，不影响生产环境
- 保持 Next.js App Router 架构不变

### 利益相关者

- 前端工程师：需要学习全栈开发，理解后端架构
- 开发团队：需要维护和扩展代码

## Goals / Non-Goals

**Goals:**
- 实现清晰的分层架构：Controller → Service → Repository
- 提高代码可测试性，每层可独立单元测试
- 提高代码可维护性，职责明确，易于修改
- 引入 API 版本控制，支持平滑升级
- 统一错误处理和参数验证

**Non-Goals:**
- 不更换数据库（继续使用 Supabase）
- 不修改前端代码（API 响应格式不变）
- 不引入 Prisma ORM（当前阶段使用 Supabase 客户端）
- 不修改现有数据库表结构

## Decisions

### 1. 分层架构设计

**决定**：采用三层架构（Controller → Service → Repository）

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   API Route   │───>│  Controller  │───>│   Service    │───>│  Repository  │
│   (入口)      │    │  (参数验证)   │    │  (业务逻辑)   │    │  (数据访问)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**理由**：
- Controller 层处理 HTTP 相关逻辑，与业务逻辑分离
- Service 层实现核心业务，可被多个 Controller 复用
- Repository 层封装数据库操作，易于 mock 和测试

**替代方案考虑**：
- 两层架构（Controller + Repository）：业务逻辑会分散到 Controller 和 Repository，不推荐
- 四层架构（增加 Domain 层）：当前规模不需要，过度设计

### 2. 目录结构

**决定**：在 `src/` 下创建新的分层目录

```
src/
├── controllers/          # 控制器层
│   ├── auth.controller.ts
│   ├── pdf.controller.ts
│   ├── chat.controller.ts
│   ├── user.controller.ts
│   └── admin.controller.ts
├── services/             # 服务层
│   ├── auth.service.ts
│   ├── pdf.service.ts
│   ├── chat.service.ts
│   ├── user.service.ts
│   ├── quota.service.ts
│   └── storage.service.ts
├── repositories/         # 数据访问层
│   ├── user.repository.ts
│   ├── pdf.repository.ts
│   ├── conversation.repository.ts
│   └── quota.repository.ts
├── models/               # 数据模型
│   ├── user.model.ts
│   ├── pdf.model.ts
│   └── conversation.model.ts
├── dtos/                 # 数据传输对象
│   ├── auth.dto.ts
│   ├── pdf.dto.ts
│   └── common.dto.ts
├── middlewares/          # 中间件
│   ├── auth.middleware.ts
│   └── error-handler.middleware.ts
└── validators/           # 验证器
    ├── auth.validator.ts
    └── pdf.validator.ts
```

**理由**：
- 扁平化结构，避免过深的嵌套
- 按功能模块组织，易于查找
- 与 Next.js 约定兼容

### 3. 依赖注入策略

**决定**：采用构造函数注入，手动管理依赖

```typescript
// Controller 依赖 Service
export class PDFController {
  constructor(private pdfService: PDFService) {}

  async upload(req: NextRequest) {
    return this.pdfService.uploadPDF(/* ... */);
  }
}

// Service 依赖 Repository
export class PDFService {
  constructor(
    private pdfRepo: PDFRepository,
    private quotaService: QuotaService
  ) {}
}
```

**理由**：
- 简单直接，无需引入 DI 框架
- 易于理解和调试
- 方便测试时 mock 依赖

**替代方案考虑**：
- Inversify 等 DI 框架：增加复杂度，当前规模不需要
- 单例模式：测试困难，状态管理复杂

### 4. API 版本控制

**决定**：引入 `/api/v1/` 路由，旧路由作为代理

```typescript
// 新路由：/api/v1/pdfs/route.ts
import { PDFController } from '@/controllers/pdf.controller';
const controller = new PDFController();
export const POST = (req) => controller.upload(req);

// 旧路由：/api/pdfs/route.ts（过渡期）
export { POST } from '@/app/api/v1/pdfs/route';
```

**理由**：
- 向后兼容，前端无需修改
- 支持新旧版本并存
- 便于灰度发布和回滚

### 5. 错误处理策略

**决定**：统一错误类型和响应格式

```typescript
// 错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// 统一响应格式
{
  "success": boolean,
  "data": any,
  "error": { "code": string, "message": string } | null
}
```

**理由**：
- 统一的错误处理，前端易于处理
- 错误信息标准化，便于调试
- HTTP 状态码语义正确

### 6. 参数验证策略

**决定**：使用 Zod 进行运行时验证

```typescript
// DTO 定义
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// Controller 中使用
const validated = LoginSchema.parse(await req.json());
```

**理由**：
- 运行时类型验证，安全可靠
- 与 TypeScript 类型自动同步
- 错误信息清晰，易于调试

## Risks / Trade-offs

### 风险 1: API 兼容性问题

**风险**：重构后 API 响应格式可能与旧版本不一致

**缓解措施**：
- 编写集成测试验证响应格式
- 保留旧路由作为代理
- 灰度发布，逐步切换

### 风险 2: 性能下降

**风险**：增加分层可能引入额外开销

**缓解措施**：
- 分层是逻辑分离，不增加网络调用
- 性能测试验证响应时间
- 监控关键 API 性能指标

### 风险 3: 迁移不完整

**风险**：部分 API 迁移后，新旧代码并存导致混乱

**缓解措施**：
- 按模块迁移，每个模块完成后清理旧代码
- 迁移清单跟踪进度
- Code Review 确保代码质量

### 风险 4: 测试覆盖不足

**风险**：新代码缺乏足够的测试覆盖

**缓解措施**：
- 要求每个 Repository/Service 有单元测试
- 集成测试覆盖关键流程
- 测试覆盖率 > 80%

## Migration Plan

### 迁移顺序（按风险排序）

1. **Admin API**（最低风险）- 管理员功能，使用频率低
2. **User API**（低风险）- 用户资料，独立模块
3. **Auth API**（中等风险）- 认证核心，需要仔细测试
4. **PDF API**（高风险）- 核心业务，逻辑复杂
5. **Chat API**（最高风险）- 核心功能，涉及 AI 和向量检索

### 迁移步骤（每个模块）

1. 创建 Model 和 DTO
2. 实现 Repository 层 + 单元测试
3. 实现 Service 层 + 单元测试
4. 实现 Controller 层 + 单元测试
5. 创建 `/api/v1/` 路由
6. 配置旧路由代理到新路由
7. 集成测试验证
8. 清理旧代码（可选）

### 回滚策略

```typescript
// 使用环境变量控制版本切换
export const GET = process.env.USE_LEGACY_API
  ? legacyGET
  : v1GET;
```

- 每个模块迁移后保留旧代码 1 周
- 发现问题可立即回滚到旧版本
- 监控错误率，异常时自动告警

## Open Questions

1. **是否引入 API 文档生成工具？**
   - 建议：后续可考虑 Swagger/OpenAPI，当前不在范围内

2. **是否需要实现请求日志中间件？**
   - 建议：是，作为独立任务在中间件阶段实现

3. **测试策略是否需要 E2E 测试？**
   - 建议：关键流程（登录、上传 PDF、聊天）需要 E2E 测试
