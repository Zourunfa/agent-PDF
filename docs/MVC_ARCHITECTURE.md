# MVC 架构重构文档

## 概述

本项目已从传统的 Next.js App Router API 路由重构为分层 MVC 架构，实现更清晰的关注点分离和更好的代码可维护性。

## 架构设计

### 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      API Routes (/api/v1/*)                 │
│                    处理 HTTP 请求/响应                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controller 层                           │
│              解析请求、验证参数、调用 Service                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service 层                             │
│                业务逻辑处理、事务协调                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Repository 层                           │
│                  数据库 CRUD 操作                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database (Supabase)                      │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
src/
├── app/api/v1/              # API v1 路由
│   ├── auth/                # 认证相关
│   ├── admin/               # 管理相关
│   ├── user/                # 用户相关
│   ├── pdfs/                # PDF 相关
│   ├── chat/                # 聊天相关
│   ├── guest/               # 游客相关
│   └── quota/               # 配额相关
│
├── controllers/             # 控制器层
│   ├── auth.controller.ts
│   ├── pdf.controller.ts
│   ├── chat.controller.ts
│   ├── user.controller.ts
│   ├── admin.controller.ts
│   └── quota.controller.ts
│
├── services/                # 服务层
│   ├── auth.service.ts
│   ├── pdf.service.ts
│   ├── chat.service.ts
│   ├── user.service.ts
│   ├── quota.service.ts
│   ├── storage.service.ts
│   └── vector.service.ts
│
├── repositories/            # 数据访问层
│   ├── user.repository.ts
│   ├── pdf.repository.ts
│   ├── conversation.repository.ts
│   ├── quota.repository.ts
│   └── auth.repository.ts
│
├── models/                  # 数据模型
│   ├── user.model.ts
│   ├── pdf.model.ts
│   ├── conversation.model.ts
│   └── quota.model.ts
│
├── dtos/                    # 数据传输对象
│   ├── common.dto.ts
│   ├── auth.dto.ts
│   ├── pdf.dto.ts
│   ├── chat.dto.ts
│   └── user.dto.ts
│
├── middlewares/             # 中间件
│   └── error-handler.middleware.ts
│
└── lib/utils/               # 工具函数
    ├── response.ts          # 统一响应格式
    └── errors.ts            # 自定义错误类型
```

## 各层职责

### 1. Controller 层

**职责：** 处理 HTTP 请求，解析参数，调用 Service，返回响应

```typescript
// 示例：auth.controller.ts
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const validated = LoginSchema.parse(body);  // Zod 验证

      const result = await this.authService.login(validated);

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }
}
```

### 2. Service 层

**职责：** 业务逻辑处理，协调多个 Repository

```typescript
// 示例：auth.service.ts
export class AuthService {
  private authRepo: AuthRepository;
  private userRepo: UserRepository;

  constructor() {
    this.authRepo = new AuthRepository();
    this.userRepo = new UserRepository();
  }

  async login(data: LoginDTO) {
    // 1. 验证凭证
    const user = await this.authRepo.authenticate(data.email, data.password);

    // 2. 检查用户状态
    if (user.status === 'suspended') {
      throw new ForbiddenError('账户已被封禁');
    }

    // 3. 生成 Token
    const token = this.generateToken(user);

    return { user, token };
  }
}
```

### 3. Repository 层

**职责：** 数据库 CRUD 操作

```typescript
// 示例：user.repository.ts
export class UserRepository {
  async findById(userId: string): Promise<User | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;

    return mapDbToUser(data);
  }
}
```

## API 路由

### v1 路由列表

| 模块 | 方法 | 路由 | 描述 |
|------|------|------|------|
| **Auth** | POST | `/api/v1/auth/login` | 用户登录 |
| | POST | `/api/v1/auth/register` | 用户注册 |
| | POST | `/api/v1/auth/logout` | 用户登出 |
| | GET | `/api/v1/auth/me` | 获取当前用户 |
| | POST | `/api/v1/auth/forgot-password` | 忘记密码 |
| | POST | `/api/v1/auth/reset-password` | 重置密码 |
| | POST | `/api/v1/auth/verify-email` | 验证邮箱 |
| **User** | GET | `/api/v1/user/profile` | 获取用户资料 |
| | PATCH | `/api/v1/user/profile` | 更新用户资料 |
| | GET | `/api/v1/user/stats` | 获取用户统计 |
| | POST | `/api/v1/user/avatar` | 上传头像 |
| | POST | `/api/v1/user/change-password` | 修改密码 |
| **PDF** | GET | `/api/v1/pdfs` | 获取 PDF 列表 |
| | POST | `/api/v1/pdfs` | 上传 PDF |
| | GET | `/api/v1/pdfs/[id]` | 获取 PDF 详情 |
| | DELETE | `/api/v1/pdfs/[id]` | 删除 PDF |
| **Chat** | POST | `/api/v1/chat` | 发送消息 |
| | GET | `/api/v1/pdfs/[id]/conversations` | 获取对话历史 |
| **Guest** | GET | `/api/v1/guest/quota` | 获取游客配额 |
| | POST | `/api/v1/guest/track` | 追踪游客使用 |
| | POST | `/api/v1/guest/migrate` | 迁移游客数据 |
| **Quota** | GET | `/api/v1/quota/stats` | 获取配额统计 |
| **Admin** | POST | `/api/v1/admin/login` | 管理员登录 |
| | GET | `/api/v1/admin/users` | 获取用户列表 |
| | GET/DELETE | `/api/v1/admin/users/[id]` | 用户管理 |

## 统一响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 分页响应

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [...]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 错误处理

### 自定义错误类型

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'QUOTA_EXCEEDED', 403);
  }
}
```

## 请求处理流程示例

### 用户登录流程

```
1. POST /api/v1/auth/login
   │
   ▼
2. AuthController.login()
   │ - 解析请求体
   │ - Zod 验证参数
   │
   ▼
3. AuthService.login()
   │ - 调用 AuthRepository.authenticate()
   │ - 验证用户状态
   │ - 生成 JWT Token
   │
   ▼
4. AuthRepository.authenticate()
   │ - 查询 Supabase auth.users
   │ - 验证密码
   │ - 返回用户数据
   │
   ▼
5. 返回响应
   {
     success: true,
     data: { user, token }
   }
```

## 迁移指南

### 前端调用方式

**旧方式（仍然可用）：**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

**新方式（推荐）：**
```typescript
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

### 响应格式变化

新 v1 API 使用统一响应格式：

```typescript
// 旧格式（各接口不一致）
{ user: {...} }
{ success: true, user: {...} }

// 新格式（统一）
{ success: true, data: { user: {...} }, timestamp: "..." }
```

## 测试

### 单元测试结构

```
__tests__/
├── unit/
│   ├── repositories/
│   ├── services/
│   └── controllers/
├── integration/
└── e2e/
```

### 测试示例

```typescript
// __tests__/services/auth.service.test.ts
describe('AuthService', () => {
  it('should login successfully with valid credentials', async () => {
    const service = new AuthService();
    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
```

## 最佳实践

1. **单一职责** - 每个类/函数只做一件事
2. **依赖注入** - 通过构造函数注入依赖
3. **错误处理** - 使用自定义错误类型
4. **参数验证** - 使用 Zod 进行运行时验证
5. **统一响应** - 使用 successResponse/errorResponse
6. **类型安全** - 使用 TypeScript 严格模式

## 后续优化

- [ ] 添加请求日志中间件
- [ ] 实现请求限流
- [ ] 添加 API 文档 (Swagger/OpenAPI)
- [ ] 实现 Repository 层缓存
- [ ] 添加更多单元测试
