# Next.js API 路由 MVC 重构详解

> 面向前端工程师的后端架构学习指南

## 目录

1. [为什么要重构？](#1-为什么要重构)
2. [什么是 MVC 架构？](#2-什么是-mvc-架构)
3. [重构前后对比](#3-重构前后对比)
4. [各层详解](#4-各层详解)
5. [完整请求流程](#5-完整请求流程)
6. [代码示例解析](#6-代码示例解析)
7. [最佳实践总结](#7-最佳实践总结)

---

## 1. 为什么要重构？

### 1.1 重构前的问题

原来的 Next.js API 路由长这样：

```typescript
// src/app/api/auth/login/route.ts (旧代码)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证逻辑混在路由里
    if (!email || !password) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // 数据库操作直接在路由里
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 业务逻辑也在路由里
    if (error) {
      return NextResponse.json({ error: '登录失败' }, { status: 401 });
    }

    // 响应格式不统一
    return NextResponse.json({
      user: data.user,
      message: '登录成功',
    });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

**问题：**
- ❌ 一个文件干了太多事（验证、数据库、业务逻辑、响应）
- ❌ 代码难以复用（登录逻辑可能在其他地方也需要）
- ❌ 难以测试（要测试业务逻辑，必须模拟整个 HTTP 请求）
- ❌ 响应格式不统一（有的返回 `{ user }`，有的返回 `{ data: user }`）
- ❌ 修改一处可能影响其他功能

### 1.2 重构后的好处

- ✅ **单一职责**：每个文件只做一件事
- ✅ **易于测试**：可以单独测试 Service 层，不需要模拟 HTTP
- ✅ **代码复用**：Service 可以被多个 Controller 调用
- ✅ **统一响应**：所有 API 返回相同格式
- ✅ **易于维护**：修改数据库不影响业务逻辑

---

## 2. 什么是 MVC 架构？

### 2.1 传统 MVC

```
Model（模型）- View（视图）- Controller（控制器）
```

### 2.2 我们的三层架构

在后端 API 中，我们使用的是变体：

```
┌─────────────────────────────────────────────────────────┐
│                    Controller 层                         │
│         处理 HTTP 请求，解析参数，返回响应                  │
│                   （相当于 MVC 的 Controller）            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Service 层                           │
│              业务逻辑处理，事务协调                        │
│                   （相当于 MVC 的 Model）                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Repository 层                         │
│               数据库 CRUD 操作                            │
│              （数据访问层，DAO 模式）                      │
└─────────────────────────────────────────────────────────┘
```

### 2.3 类比理解

| 层级 | 类比 | 职责 |
|------|------|------|
| **Controller** | 餐厅服务员 | 接待客人（请求），传递订单，端菜上桌（响应）|
| **Service** | 餐厅厨师 | 根据订单做菜（业务逻辑），协调各个岗位 |
| **Repository** | 仓库管理员 | 管理食材（数据），负责存取 |

---

## 3. 重构前后对比

### 3.1 目录结构对比

**重构前：**
```
src/app/api/
├── auth/
│   ├── login/route.ts      # 所有逻辑都在这里
│   ├── register/route.ts
│   └── logout/route.ts
└── user/
    └── profile/route.ts
```

**重构后：**
```
src/
├── app/api/v1/             # API 路由（版本化）
│   ├── auth/login/route.ts # 只负责调用 Controller
│   └── user/profile/route.ts
│
├── controllers/            # 控制器层
│   ├── auth.controller.ts
│   └── user.controller.ts
│
├── services/               # 服务层
│   ├── auth.service.ts
│   └── user.service.ts
│
├── repositories/           # 数据访问层
│   ├── auth.repository.ts
│   └── user.repository.ts
│
├── models/                 # 数据模型
│   └── user.model.ts
│
├── dtos/                   # 数据传输对象（验证）
│   └── auth.dto.ts
│
└── lib/utils/              # 工具函数
    ├── response.ts         # 统一响应格式
    └── errors.ts           # 自定义错误
```

### 3.2 代码量对比

| 文件 | 重构前 | 重构后 |
|------|--------|--------|
| 路由文件 | 200 行 | 10 行 |
| Controller | 无 | 50 行 |
| Service | 无 | 80 行 |
| Repository | 无 | 60 行 |
| **总计** | 200 行 | 200 行 |

代码量差不多，但**可维护性**和**可测试性**大大提升！

---

## 4. 各层详解

### 4.1 Controller 层 - 处理请求

**职责：**
1. 解析 HTTP 请求
2. 验证请求参数（使用 DTO）
3. 调用 Service 处理业务
4. 返回统一格式的响应

**代码示例：**

```typescript
// src/controllers/auth.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { handleError } from '@/middlewares/error-handler.middleware';
import { successResponse } from '@/lib/utils/response';
import { LoginSchema } from '@/dtos/auth.dto';

export class AuthController {
  // 依赖注入：通过构造函数传入 Service
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 用户登录
   * POST /api/v1/auth/login
   */
  async login(req: NextRequest): Promise<NextResponse> {
    try {
      // 1. 解析请求体
      const body = await req.json();

      // 2. 使用 Zod 验证参数
      const validated = LoginSchema.parse(body);
      // validated 类型: { email: string, password: string }

      // 3. 调用 Service 处理业务逻辑
      const result = await this.authService.login(validated);

      // 4. 返回统一格式的成功响应
      return successResponse(result);
    } catch (error) {
      // 5. 统一错误处理
      return handleError(error);
    }
  }
}
```

**关键点：**
- Controller **不包含**业务逻辑
- Controller **不直接**操作数据库
- Controller 只负责「搬运」数据

### 4.2 Service 层 - 业务逻辑

**职责：**
1. 实现业务规则
2. 协调多个 Repository
3. 处理事务
4. 抛出业务异常

**代码示例：**

```typescript
// src/services/auth.service.ts
import { AuthRepository } from '@/repositories/auth.repository';
import { UserRepository } from '@/repositories/user.repository';
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors';
import type { LoginDTO } from '@/dtos/auth.dto';

export class AuthService {
  private authRepo: AuthRepository;
  private userRepo: UserRepository;

  constructor() {
    this.authRepo = new AuthRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * 用户登录业务逻辑
   */
  async login(data: LoginDTO) {
    // 1. 调用 Repository 验证凭证
    const user = await this.authRepo.authenticate(data.email, data.password);

    // 2. 业务规则：用户不存在
    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 3. 业务规则：检查用户状态
    if (user.status === 'suspended') {
      throw new ForbiddenError('账户已被封禁');
    }

    // 4. 业务规则：检查邮箱验证
    if (!user.emailVerified) {
      throw new ForbiddenError('请先验证邮箱');
    }

    // 5. 生成 Token（另一个业务逻辑）
    const token = this.generateToken(user);

    // 6. 返回结果
    return { user, token };
  }

  private generateToken(user: User): string {
    // JWT 生成逻辑...
    return 'jwt-token';
  }
}
```

**关键点：**
- Service 包含**所有**业务逻辑
- Service 可以调用**多个** Repository
- Service 抛出**业务异常**（不是 HTTP 错误）

### 4.3 Repository 层 - 数据访问

**职责：**
1. 执行数据库操作（CRUD）
2. 将数据库结果映射为模型
3. 不包含业务逻辑

**代码示例：**

```typescript
// src/repositories/auth.repository.ts
import { createClient } from '@/lib/supabase/server';
import { mapDbToUser } from '@/models/user.model';
import type { User } from '@/models/user.model';

export class AuthRepository {
  /**
   * 验证用户凭证
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    const supabase = createClient();

    // 1. 调用 Supabase 认证
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 2. 认证失败返回 null
    if (error || !data.user) {
      return null;
    }

    // 3. 查询用户详情
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // 4. 将数据库结果映射为模型
    return mapDbToUser(profile);
  }
}
```

**关键点：**
- Repository **只负责**数据库操作
- Repository **不知道**业务规则
- Repository 返回**模型对象**或 null

### 4.4 Model 层 - 数据模型

**职责：**
1. 定义数据结构（TypeScript 接口）
2. 提供数据库映射函数

**代码示例：**

```typescript
// src/models/user.model.ts

/**
 * 用户模型 - 前端/业务层使用的格式
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
}

/**
 * 将数据库记录映射为 User 模型
 * 数据库字段: snake_case → 模型字段: camelCase
 */
export function mapDbToUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    email: data.email as string,
    name: data.name as string,
    role: data.role as 'user' | 'admin',
    status: data.status as 'active' | 'suspended',
    emailVerified: data.email_verified as boolean,
    avatarUrl: data.avatar_url as string | undefined,
    createdAt: new Date(data.created_at as string),
  };
}
```

### 4.5 DTO 层 - 数据验证

**职责：**
1. 定义 API 请求参数结构
2. 使用 Zod 进行运行时验证

**代码示例：**

```typescript
// src/dtos/auth.dto.ts
import { z } from 'zod';

/**
 * 登录请求参数
 */
export const LoginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 位'),
  rememberMe: z.boolean().optional().default(false),
});

// 自动推断 TypeScript 类型
export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * 注册请求参数
 */
export const RegisterSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[A-Z]/, '密码需要包含大写字母')
    .regex(/[0-9]/, '密码需要包含数字'),
  name: z.string().min(2, '姓名至少 2 个字符'),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
```

**使用方式：**

```typescript
// 在 Controller 中使用
const validated = LoginSchema.parse(body);  // 验证失败会抛出 ZodError
// validated 类型自动推断为 LoginDTO
```

---

## 5. 完整请求流程

### 5.1 登录请求流程图

```
用户输入邮箱密码，点击「登录」
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/v1/auth/login                                    │
│  Body: { email: "test@example.com", password: "123456" }    │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Route: src/app/api/v1/auth/login/route.ts                  │
│                                                              │
│  export async function POST(req: NextRequest) {              │
│    return controller.login(req);  // 调用 Controller         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Controller: AuthController.login()                         │
│                                                              │
│  1. const body = await req.json();                          │
│  2. const validated = LoginSchema.parse(body);  // Zod 验证  │
│  3. const result = await authService.login(validated);      │
│  4. return successResponse(result);                         │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Service: AuthService.login()                               │
│                                                              │
│  1. const user = await authRepo.authenticate(email, pwd);   │
│  2. if (!user) throw new UnauthorizedError();               │
│  3. if (user.status === 'suspended') throw new Error();     │
│  4. const token = generateToken(user);                      │
│  5. return { user, token };                                 │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Repository: AuthRepository.authenticate()                  │
│                                                              │
│  1. const { data } = await supabase.auth.signInWithPassword │
│  2. const { data: profile } = await supabase                │
│        .from('user_profiles').select('*').eq('id', ...)     │
│  3. return mapDbToUser(profile);                            │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  响应返回给前端                                               │
│                                                              │
│  {                                                          │
│    "success": true,                                         │
│    "data": {                                                │
│      "user": { "id": "...", "email": "...", ... },          │
│      "token": "jwt-token"                                   │
│    },                                                       │
│    "timestamp": "2024-01-01T00:00:00.000Z"                  │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 错误处理流程

```
用户密码错误
      │
      ▼
┌─────────────────────────────────────┐
│  Repository 返回 null                │
│  (表示认证失败)                       │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Service 抛出业务异常                 │
│  throw new UnauthorizedError()      │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  Controller 捕获异常                  │
│  catch (error) {                     │
│    return handleError(error);       │
│  }                                  │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  handleError 统一处理                 │
│  - 转换为 HTTP 状态码                 │
│  - 格式化错误响应                     │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  返回错误响应                         │
│  {                                   │
│    "success": false,                │
│    "error": {                       │
│      "code": "UNAUTHORIZED",        │
│      "message": "邮箱或密码错误"      │
│    },                               │
│    "timestamp": "..."               │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 6. 代码示例解析

### 6.1 统一响应格式

```typescript
// src/lib/utils/response.ts

/**
 * 成功响应
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
    timestamp: new Date().toISOString(),
  });
}
```

### 6.2 自定义错误类

```typescript
// src/lib/utils/errors.ts

/**
 * 基础应用错误
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 验证错误 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * 未授权错误 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '请先登录') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * 禁止访问错误 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * 资源不存在错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * 配额超限错误 (403)
 */
export class QuotaExceededError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 'QUOTA_EXCEEDED', 403);
  }
}
```

### 6.3 错误处理中间件

```typescript
// src/middlewares/error-handler.middleware.ts

import { NextResponse } from 'next/server';
import { AppError, ValidationError } from '@/lib/utils/errors';
import { ZodError } from 'zod';

/**
 * 统一错误处理
 */
export function handleError(error: unknown): NextResponse {
  console.error('[Error]', error);

  // Zod 验证错误
  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: error.errors,
      },
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: (error as ValidationError).details,
      },
      timestamp: new Date().toISOString(),
    }, { status: error.statusCode });
  }

  // 未知错误
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
    timestamp: new Date().toISOString(),
  }, { status: 500 });
}
```

---

## 7. 最佳实践总结

### 7.1 目录组织

```
按功能模块组织，而不是按文件类型

✅ 推荐：
src/
├── controllers/
│   ├── auth.controller.ts
│   └── user.controller.ts
├── services/
│   ├── auth.service.ts
│   └── user.service.ts

❌ 不推荐：
src/
├── auth/
│   ├── controller.ts
│   ├── service.ts
│   └── repository.ts
```

### 7.2 依赖注入

```typescript
// ✅ 推荐：通过构造函数注入
class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
  }
}

// 好处：测试时可以注入 Mock 对象
const mockService = { login: jest.fn() };
const controller = new AuthController(mockService as any);
```

### 7.3 错误处理

```typescript
// ✅ 推荐：抛出业务异常
if (!user) {
  throw new UnauthorizedError('邮箱或密码错误');
}

// ❌ 不推荐：直接返回 HTTP 响应
if (!user) {
  return NextResponse.json({ error: '...' }, { status: 401 });
}
```

### 7.4 类型安全

```typescript
// ✅ 推荐：使用 DTO 和 Model
async login(data: LoginDTO): Promise<{ user: User; token: string }> {
  // ...
}

// ❌ 不推荐：使用 any
async login(data: any): Promise<any> {
  // ...
}
```

### 7.5 API 版本化

```typescript
// ✅ 推荐：使用版本前缀
/api/v1/auth/login
/api/v2/auth/login  // 未来版本

// ❌ 不推荐：无版本
/api/auth/login
```

---

## 总结

### 重构的核心思想

1. **单一职责** - 每个类/函数只做一件事
2. **依赖注入** - 通过构造函数传入依赖
3. **分层架构** - Controller → Service → Repository
4. **统一响应** - successResponse / errorResponse
5. **类型安全** - TypeScript + Zod

### 学习路径建议

1. 先理解 **数据流向**：请求 → Controller → Service → Repository → 数据库
2. 再理解 **职责分离**：每层只做自己该做的事
3. 最后理解 **设计模式**：依赖注入、Repository 模式、DTO 模式

### 下一步

- 尝试为新功能编写完整的 MVC 层
- 为 Service 层编写单元测试
- 学习更多设计模式（工厂模式、策略模式等）

---

> 📝 作者：Claude
> 📅 日期：2024
> 🏷️ 标签：#Next.js #MVC #架构设计 #前端进阶
