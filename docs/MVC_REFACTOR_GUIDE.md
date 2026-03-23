# Agent-PDF MVC 重构技术文档

## 目录

1. [概述](#概述)
2. [当前架构分析](#当前架构分析)
3. [目标 MVC 架构](#目标-mvc-架构)
4. [重构步骤](#重构步骤)
5. [详细实现指南](#详细实现指南)
6. [迁移计划](#迁移计划)
7. [测试策略](#测试策略)
8. [风险与回滚方案](#风险与回滚方案)

---

## 概述

### 背景

当前项目采用 Next.js App Router 架构，API 路由直接在 `app/api/` 目录下，服务逻辑分散在 `lib/` 目录中。随着项目规模增长，出现了以下问题：

| 问题 | 描述 | 影响 |
|------|------|------|
| API 路由臃肿 | 每个 route.ts 包含过多业务逻辑 | 难以维护和测试 |
| 服务层分散 | 服务函数分散在多个文件中 | 代码重复，职责不清 |
| 缺乏分层 | 控制器、服务、数据访问层混杂 | 耦合度高，可测试性差 |

### 重构目标

1. **关注点分离**: 每层只负责自己的职责
2. **可测试性**: 每层可以独立单元测试
3. **可维护性**: 修改一处不影响其他层
4. **可扩展性**: 易于添加新功能和修改现有功能

---

## 当前架构分析

### 现有目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由 (39 个文件)
│   │   ├── auth/                 # 认证 API (7 个)
│   │   ├── admin/                # 管理员 API (13 个)
│   │   ├── chat/                 # 聊天 API (1 个)
│   │   ├── pdfs/                 # PDF API (4 个)
│   │   ├── user/                 # 用户 API (4 个)
│   │   └── ...
│   ├── login/                    # 登录页面
│   ├── register/                 # 注册页面
│   └── user-center/              # 用户中心页面
├── components/                   # React 组件
├── contexts/                     # React Context
├── hooks/                        # 自定义 Hooks
└── lib/                          # 核心库 (服务逻辑分散)
    ├── auth/                      # 认证逻辑
    ├── chat/                      # 聊天逻辑
    ├── pdf/                       # PDF 处理
    ├── storage/                   # 存储服务
    ├── langchain/                 # LangChain 配置
    ├── pinecone/                  # Pinecone 向量存储
    ├── quota/                     # 配额检查
    ├── supabase/                  # 数据库客户端
    └── utils/                     # 工具函数
```

### 当前代码示例（问题代码）

```typescript
// ❌ 问题：API 路由直接包含数据库操作
// src/app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // 直接在控制器中操作数据库 - 违反单一职责原则
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 业务逻辑混在控制器中
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json({ user: data.user, profile });
}
```

**问题分析**:
- Controller 直接操作数据库
- 业务逻辑和 HTTP 处理混合
- 难以进行单元测试（无法 mock 数据库）

---

## 目标 MVC 架构

### 新目录结构

```
src/
├── app/                          # Next.js App Router (视图层 + 路由入口)
│   ├── (auth)/                   # 认证相关页面
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                   # 主要功能页面
│   │   ├── page.tsx
│   │   └── user-center/page.tsx
│   └── api/                      # API 路由 (仅作为入口)
│       └── v1/                    # API 版本控制
│           ├── auth/
│           │   ├── login/route.ts
│           │   └── register/route.ts
│           ├── pdfs/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── chat/
│           │   └── route.ts
│           └── user/
│               └── profile/route.ts
│
├── controllers/                  # 控制器层
│   ├── auth.controller.ts        # 认证控制器
│   ├── pdf.controller.ts         # PDF 控制器
│   ├── chat.controller.ts        # 聊天控制器
│   ├── user.controller.ts        # 用户控制器
│   └── admin.controller.ts       # 管理员控制器
│
├── services/                     # 服务层 (业务逻辑)
│   ├── auth.service.ts           # 认证服务
│   ├── pdf.service.ts            # PDF 服务
│   ├── chat.service.ts           # 聊天服务
│   ├── user.service.ts           # 用户服务
│   ├── quota.service.ts          # 配额服务
│   ├── email.service.ts          # 邮件服务
│   └── storage.service.ts        # 存储服务
│
├── repositories/                 # 数据访问层
│   ├── auth.repository.ts        # 认证数据访问
│   ├── pdf.repository.ts         # PDF 数据访问
│   ├── conversation.repository.ts # 对话数据访问
│   ├── user.repository.ts        # 用户数据访问
│   └── quota.repository.ts       # 配额数据访问
│
├── models/                       # 数据模型/实体
│   ├── user.model.ts
│   ├── pdf.model.ts
│   ├── conversation.model.ts
│   └── quota.model.ts
│
├── dtos/                         # 数据传输对象
│   ├── auth.dto.ts               # 认证相关 DTO
│   ├── pdf.dto.ts                # PDF 相关 DTO
│   ├── chat.dto.ts               # 聊天相关 DTO
│   └── common.dto.ts             # 通用 DTO
│
├── middlewares/                  # 中间件
│   ├── auth.middleware.ts        # 认证中间件
│   ├── rate-limit.middleware.ts  # 速率限制
│   ├── error-handler.middleware.ts # 错误处理
│   └── validator.middleware.ts   # 参数验证
│
├── validators/                   # 验证器
│   ├── auth.validator.ts
│   ├── pdf.validator.ts
│   └── common.validator.ts
│
└── lib/                          # 基础库
    ├── database/                 # 数据库连接
    │   ├── supabase.client.ts
    │   ├── pinecone.client.ts
    │   └── redis.client.ts
    ├── storage/                   # 存储服务
    │   ├── blob-storage.ts
    │   └── file-storage.ts
    ├── ai/                        # AI 服务
    │   ├── langchain.config.ts
    │   └── qwen.config.ts
    └── utils/                     # 工具函数
        ├── response.ts
        ├── errors.ts
        └── validation.ts
```

### 各层职责

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              请求处理流程                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Client     │───>│   API Route   │───>│  Controller  │───>│   Service    │
│  (前端请求)   │    │   (入口)      │    │  (参数验证)   │    │  (业务逻辑)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                      │
                                                                      ▼
                                                              ┌──────────────┐
                                                              │  Repository  │
                                                              │  (数据访问)   │
                                                              └──────────────┘
                                                                      │
                                                                      ▼
                                                              ┌──────────────┐
                                                              │  Database    │
                                                              │ (Supabase/   │
                                                              │  Pinecone)   │
                                                              └──────────────┘
```

#### 1. API Route (路由入口)

**职责**: 接收 HTTP 请求，调用对应的 Controller

```typescript
// src/app/api/v1/auth/login/route.ts
import { AuthController } from '@/controllers/auth.controller';

const authController = new AuthController();

export async function POST(req: NextRequest) {
  return authController.login(req);  // 只做转发，不包含逻辑
}
```

#### 2. Controller (控制器)

**职责**:
- 解析请求参数
- 调用 Validator 验证参数
- 调用 Service 执行业务逻辑
- 格式化并返回响应

```typescript
// src/controllers/auth.controller.ts
export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: NextRequest): Promise<NextResponse> {
    try {
      // 1. 解析请求体
      const body = await req.json();

      // 2. 验证参数
      const validated = LoginSchema.parse(body);

      // 3. 调用服务层
      const result = await this.authService.login(validated);

      // 4. 返回响应
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(error);
    }
  }
}
```

#### 3. Service (服务层)

**职责**:
- 实现核心业务逻辑
- 调用多个 Repository 协调数据操作
- 处理事务
- 不包含 HTTP 相关代码

```typescript
// src/services/auth.service.ts
export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async login(dto: LoginDTO): Promise<LoginResult> {
    // 1. 验证用户凭证
    const session = await this.authRepo.authenticate(
      dto.email,
      dto.password
    );

    if (!session) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 2. 获取用户资料
    const profile = await this.userRepo.getProfile(session.user.id);

    // 3. 记录登录日志
    await this.authRepo.createLoginLog(session.user.id, dto.ipAddress);

    return {
      user: session.user,
      profile,
      token: session.access_token
    };
  }
}
```

#### 4. Repository (数据访问层)

**职责**:
- 封装所有数据库操作
- 提供清晰的数据访问接口
- 不包含业务逻辑

```typescript
// src/repositories/auth.repository.ts
export class AuthRepository {
  constructor(private supabase: SupabaseClient) {}

  async authenticate(email: string, password: string): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return null;
    return data;
  }

  async createLoginLog(userId: string, ipAddress: string): Promise<void> {
    await this.supabase.from('user_security_log').insert({
      user_id: userId,
      event_type: 'login',
      ip_address: ipAddress,
      success: true,
    });
  }
}
```

---

## 详细实现指南

### 1. 定义数据模型 (Models)

```typescript
// src/models/user.model.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'user' | 'premium' | 'admin';
  emailVerified: boolean;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  quota: UserQuota;
  stats: UserStats;
}

export interface UserQuota {
  pdfUploadsDaily: number;
  aiCallsDaily: number;
  storageTotal: number;
}

export interface UserStats {
  totalPdfs: number;
  totalConversations: number;
  totalMessages: number;
}
```

```typescript
// src/models/pdf.model.ts
export interface PDF {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  pageCount: number | null;
  storagePath: string;
  parseStatus: 'pending' | 'parsing' | 'completed' | 'failed';
  textContent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PDFWithStats extends PDF {
  conversationCount: number;
  lastConversationAt: Date | null;
}
```

### 2. 定义 DTO (数据传输对象)

```typescript
// src/dtos/auth.dto.ts
import { z } from 'zod';

// 登录 DTO
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

export interface LoginResult {
  user: User;
  profile: UserProfile;
  token: string;
}

// 注册 DTO
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

export interface RegisterResult {
  userId: string;
  email: string;
  message: string;
}
```

```typescript
// src/dtos/pdf.dto.ts
import { z } from 'zod';

export const UploadPDFSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.type === 'application/pdf', 'File must be a PDF')
    .refine(file => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB'),
});

export const GetPDFListSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['uploadedAt', 'conversationCount', 'lastConversationAt']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetPDFListDTO = z.infer<typeof GetPDFListSchema>;
```

### 3. 实现 Repository 层

```typescript
// src/repositories/user.repository.ts
import { createClient } from '@/lib/database/supabase.client';
import type { User, UserProfile, UserQuota, UserStats } from '@/models/user.model';

export class UserRepository {
  private supabase = createClient();

  /**
   * 根据 ID 获取用户
   */
  async findById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return this.mapToUser(data);
  }

  /**
   * 根据 Email 获取用户
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return this.mapToUser(data);
  }

  /**
   * 创建用户
   */
  async create(userId: string, email: string, name?: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        name: name || email.split('@')[0],
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return this.mapToUser(data);
  }

  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({
        name: updates.name,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return this.mapToUser(data);
  }

  /**
   * 获取用户统计
   */
  async getStats(userId: string): Promise<UserStats> {
    const [pdfCount, messageCount] = await Promise.all([
      this.supabase
        .from('user_pdfs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      this.supabase
        .from('conversation_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      totalPdfs: pdfCount.count || 0,
      totalConversations: 0, // 需要单独查询
      totalMessages: messageCount.count || 0,
    };
  }

  /**
   * 数据映射
   */
  private mapToUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
      role: data.role,
      emailVerified: data.email_verified,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

```typescript
// src/repositories/pdf.repository.ts
import { createClient } from '@/lib/database/supabase.client';
import type { PDF, PDFWithStats } from '@/models/pdf.model';

export class PDFRepository {
  private supabase = createClient();

  /**
   * 创建 PDF 记录
   */
  async create(data: CreatePDFData): Promise<PDF> {
    const { data: pdf, error } = await this.supabase
      .from('user_pdfs')
      .insert({
        id: data.id,
        user_id: data.userId,
        filename: data.filename,
        file_size: data.fileSize,
        storage_path: data.storagePath,
        page_count: data.pageCount,
        parse_status: 'pending',
        pinecone_namespace: data.userId,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return this.mapToPDF(pdf);
  }

  /**
   * 根据 ID 获取 PDF
   */
  async findById(pdfId: string, userId: string): Promise<PDF | null> {
    const { data, error } = await this.supabase
      .from('user_pdfs')
      .select('*')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return this.mapToPDF(data);
  }

  /**
   * 获取用户 PDF 列表
   */
  async findByUserId(
    userId: string,
    options: { limit: number; offset: number; sortBy: string; sortOrder: 'asc' | 'desc' }
  ): Promise<{ pdfs: PDF[]; total: number }> {
    let query = this.supabase
      .from('user_pdfs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // 排序
    query = query.order(options.sortBy, { ascending: options.sortOrder === 'asc' });

    // 分页
    query = query.range(options.offset, options.offset + options.limit - 1);

    const { data, error, count } = await query;

    if (error) throw new DatabaseError(error.message);

    return {
      pdfs: data.map(this.mapToPDF),
      total: count || 0,
    };
  }

  /**
   * 更新解析状态
   */
  async updateParseStatus(
    pdfId: string,
    status: 'pending' | 'parsing' | 'completed' | 'failed',
    updates?: { pageCount?: number; textContent?: string }
  ): Promise<void> {
    const updateData: any = {
      parse_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.parsed_at = new Date().toISOString();
      if (updates?.pageCount) updateData.page_count = updates.pageCount;
      if (updates?.textContent) updateData.text_content = updates.textContent;
    }

    const { error } = await this.supabase
      .from('user_pdfs')
      .update(updateData)
      .eq('id', pdfId);

    if (error) throw new DatabaseError(error.message);
  }

  /**
   * 删除 PDF
   */
  async delete(pdfId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_pdfs')
      .delete()
      .eq('id', pdfId)
      .eq('user_id', userId);

    if (error) throw new DatabaseError(error.message);
  }

  /**
   * 数据映射
   */
  private mapToPDF(data: any): PDF {
    return {
      id: data.id,
      userId: data.user_id,
      filename: data.filename,
      fileSize: data.file_size,
      pageCount: data.page_count,
      storagePath: data.storage_path,
      parseStatus: data.parse_status,
      textContent: data.text_content,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

### 4. 实现 Service 层

```typescript
// src/services/pdf.service.ts
import { PDFRepository } from '@/repositories/pdf.repository';
import { ConversationRepository } from '@/repositories/conversation.repository';
import { QuotaService } from '@/services/quota.service';
import { StorageService } from '@/services/storage.service';
import { VectorService } from '@/services/vector.service';
import type { PDF, PDFWithStats } from '@/models/pdf.model';

export class PDFService {
  constructor(
    private pdfRepo: PDFRepository,
    private convRepo: ConversationRepository,
    private quotaService: QuotaService,
    private storageService: StorageService,
    private vectorService: VectorService
  ) {}

  /**
   * 上传 PDF
   */
  async uploadPDF(
    userId: string,
    file: File,
    options?: { skipQuotaCheck?: boolean }
  ): Promise<PDF> {
    // 1. 配额检查
    if (!options?.skipQuotaCheck) {
      const quotaResult = await this.quotaService.checkAndConsume(
        userId,
        'pdf_uploads_daily'
      );

      if (!quotaResult.allowed) {
        throw new QuotaExceededError(quotaResult.reason || 'Daily upload limit exceeded');
      }
    }

    // 2. 文件验证
    this.validatePDFFile(file);

    // 3. 上传到存储服务
    const storagePath = await this.storageService.uploadPDF(
      file.name,
      file,
      userId
    );

    // 4. 创建数据库记录
    const pdfId = uuidv4();
    const pdf = await this.pdfRepo.create({
      id: pdfId,
      userId,
      filename: file.name,
      fileSize: file.size,
      storagePath,
    });

    // 5. 创建对话记录
    await this.convRepo.createOrGet(pdfId, userId);

    return pdf;
  }

  /**
   * 获取 PDF 列表
   */
  async getPDFList(
    userId: string,
    options: { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ pdfs: PDFWithStats[]; total: number }> {
    const { pdfs, total } = await this.pdfRepo.findByUserId(userId, {
      limit: options.limit || 50,
      offset: options.offset || 0,
      sortBy: options.sortBy || 'created_at',
      sortOrder: options.sortOrder || 'desc',
    });

    // 获取每个 PDF 的对话统计
    const pdfsWithStats = await Promise.all(
      pdfs.map(async (pdf) => {
        const stats = await this.convRepo.getStats(pdf.id, userId);
        return {
          ...pdf,
          conversationCount: stats.messageCount,
          lastConversationAt: stats.lastMessageAt,
        };
      })
    );

    return { pdfs: pdfsWithStats, total };
  }

  /**
   * 删除 PDF
   */
  async deletePDF(pdfId: string, userId: string): Promise<void> {
    // 1. 验证所有权
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF not found or access denied');
    }

    // 2. 删除向量数据
    await this.vectorService.deleteByPDF(pdfId, userId);

    // 3. 删除存储文件
    await this.storageService.deletePDF(pdf.storagePath);

    // 4. 删除对话记录（级联删除消息）
    await this.convRepo.deleteByPDF(pdfId, userId);

    // 5. 删除 PDF 记录
    await this.pdfRepo.delete(pdfId, userId);
  }

  /**
   * 文件验证
   */
  private validatePDFFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new ValidationError('File must be a PDF');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new ValidationError('File size must be less than 50MB');
    }
  }
}
```

### 5. 实现 Controller 层

```typescript
// src/controllers/pdf.controller.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/services/pdf.service';
import { PDFRepository } from '@/repositories/pdf.repository';
import { ConversationRepository } from '@/repositories/conversation.repository';
import { QuotaService } from '@/services/quota.service';
import { StorageService } from '@/services/storage.service';
import { VectorService } from '@/services/vector.service';
import { getCurrentUser } from '@/middlewares/auth.middleware';
import { handleError } from '@/lib/utils/errors';

export class PDFController {
  private pdfService: PDFService;

  constructor() {
    // 依赖注入
    const pdfRepo = new PDFRepository();
    const convRepo = new ConversationRepository();
    const quotaService = new QuotaService();
    const storageService = new StorageService();
    const vectorService = new VectorService();

    this.pdfService = new PDFService(
      pdfRepo,
      convRepo,
      quotaService,
      storageService,
      vectorService
    );
  }

  /**
   * POST /api/v1/pdfs - 上传 PDF
   */
  async upload(req: NextRequest): Promise<NextResponse> {
    try {
      // 1. 认证检查
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 2. 获取文件
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      // 3. 调用服务层
      const pdf = await this.pdfService.uploadPDF(user.id, file);

      // 4. 返回响应
      return NextResponse.json({
        success: true,
        data: {
          pdfId: pdf.id,
          filename: pdf.filename,
          uploadedAt: pdf.createdAt,
        },
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * GET /api/v1/pdfs - 获取 PDF 列表
   */
  async getList(req: NextRequest): Promise<NextResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 解析查询参数
      const searchParams = req.nextUrl.searchParams;
      const options = {
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
        sortBy: searchParams.get('sortBy') || 'created_at',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      };

      const result = await this.pdfService.getPDFList(user.id, options);

      return NextResponse.json({
        success: true,
        data: result.pdfs,
        meta: { total: result.total },
      });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * DELETE /api/v1/pdfs/:id - 删除 PDF
   */
  async delete(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { id } = await params;

      await this.pdfService.deletePDF(id, user.id);

      return NextResponse.json({
        success: true,
        data: { pdfId: id, deleted: true },
      });
    } catch (error) {
      return handleError(error);
    }
  }
}
```

### 6. 简化 API 路由

```typescript
// src/app/api/v1/pdfs/route.ts
import { PDFController } from '@/controllers/pdf.controller';

const pdfController = new PDFController();

export async function POST(req: NextRequest) {
  return pdfController.upload(req);
}

export async function GET(req: NextRequest) {
  return pdfController.getList(req);
}
```

```typescript
// src/app/api/v1/pdfs/[id]/route.ts
import { PDFController } from '@/controllers/pdf.controller';

const pdfController = new PDFController();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return pdfController.delete(req, { params });
}
```

---

## 重构步骤

### 阶段 1: 准备工作 (1-2 天)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 1.1 | 创建新目录结构 | 空目录框架 |
| 1.2 | 定义数据模型 (Models) | models/*.model.ts |
| 1.3 | 定义 DTO 和验证器 | dtos/*.dto.ts, validators/*.ts |
| 1.4 | 创建基础工具类 | lib/utils/response.ts, errors.ts |

### 阶段 2: 数据访问层 (2-3 天)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 2.1 | 实现 UserRepository | repositories/user.repository.ts |
| 2.2 | 实现 PDFRepository | repositories/pdf.repository.ts |
| 2.3 | 实现 ConversationRepository | repositories/conversation.repository.ts |
| 2.4 | 实现 QuotaRepository | repositories/quota.repository.ts |
| 2.5 | 实现 AuthRepository | repositories/auth.repository.ts |
| 2.6 | 编写 Repository 单元测试 | __tests__/repositories/*.test.ts |

### 阶段 3: 服务层 (3-4 天)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 3.1 | 实现 AuthService | services/auth.service.ts |
| 3.2 | 实现 PDFService | services/pdf.service.ts |
| 3.3 | 实现 ChatService | services/chat.service.ts |
| 3.4 | 实现 UserService | services/user.service.ts |
| 3.5 | 实现 QuotaService | services/quota.service.ts |
| 3.6 | 实现 StorageService | services/storage.service.ts |
| 3.7 | 编写 Service 单元测试 | __tests__/services/*.test.ts |

### 阶段 4: 控制器层 (2-3 天)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 4.1 | 实现 AuthController | controllers/auth.controller.ts |
| 4.2 | 实现 PDFController | controllers/pdf.controller.ts |
| 4.3 | 实现 ChatController | controllers/chat.controller.ts |
| 4.4 | 实现 UserController | controllers/user.controller.ts |
| 4.5 | 实现 AdminController | controllers/admin.controller.ts |
| 4.6 | 编写 Controller 单元测试 | __tests__/controllers/*.test.ts |

### 阶段 5: 迁移 API 路由 (2-3 天)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 5.1 | 创建 /api/v1/ 路由 | app/api/v1/* |
| 5.2 | 迁移认证 API | v1/auth/* |
| 5.3 | 迁移 PDF API | v1/pdfs/* |
| 5.4 | 迁移聊天 API | v1/chat/* |
| 5.5 | 迁移用户 API | v1/user/* |
| 5.6 | 迁移管理员 API | v1/admin/* |
| 5.7 | 更新前端 API 调用 | 修改 fetch 路径 |

### 阶段 6: 测试与清理 (2-3 天)

| 步骤 | 任务 | 产出 |
|------|------|------|
| 6.1 | 集成测试 | __tests__/integration/*.test.ts |
| 6.2 | E2E 测试 | __tests__/e2e/*.test.ts |
| 6.3 | 删除旧代码 | 移除 app/api/ 下的旧路由 |
| 6.4 | 更新文档 | README.md, ARCHITECTURE.md |
| 6.5 | Code Review | 团队审查 |

---

## 迁移计划

### 逐模块迁移策略

```
┌─────────────────────────────────────────────────────────────────────┐
│                        迁移顺序（按风险排序）                         │
└─────────────────────────────────────────────────────────────────────┘

1. Admin API (最低风险)
   └── 管理员功能，使用频率低，易于回滚

2. User API (低风险)
   └── 用户资料，独立模块，依赖少

3. Auth API (中等风险)
   └── 认证核心，需要仔细测试

4. PDF API (高风险)
   └── 核心业务，逻辑复杂

5. Chat API (最高风险)
   └── 核心功能，涉及 AI 和向量检索
```

### 迁移检查清单

每个模块迁移完成后需要检查：

- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 手动功能测试通过
- [ ] API 响应格式与旧版本一致
- [ ] 错误处理正确
- [ ] 日志记录完整
- [ ] 文档已更新

---

## 测试策略

### 1. 单元测试

```typescript
// __tests__/repositories/pdf.repository.test.ts
import { PDFRepository } from '@/repositories/pdf.repository';
import { createClient } from '@/lib/database/supabase.client';

jest.mock('@/lib/database/supabase.client');

describe('PDFRepository', () => {
  let repo: PDFRepository;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    repo = new PDFRepository();
  });

  describe('findById', () => {
    it('should return PDF when found', async () => {
      const mockData = {
        id: 'pdf-123',
        user_id: 'user-456',
        filename: 'test.pdf',
        file_size: 1024,
        page_count: 10,
        storage_path: '/path/to/file',
        parse_status: 'completed',
        text_content: 'content',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repo.findById('pdf-123', 'user-456');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('pdf-123');
      expect(result?.filename).toBe('test.pdf');
    });

    it('should return null when not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await repo.findById('non-existent', 'user-456');

      expect(result).toBeNull();
    });
  });
});
```

### 2. 服务层测试

```typescript
// __tests__/services/pdf.service.test.ts
import { PDFService } from '@/services/pdf.service';
import { PDFRepository } from '@/repositories/pdf.repository';
import { QuotaService } from '@/services/quota.service';

jest.mock('@/repositories/pdf.repository');
jest.mock('@/services/quota.service');

describe('PDFService', () => {
  let service: PDFService;
  let mockPDFRepo: jest.Mocked<PDFRepository>;
  let mockQuotaService: jest.Mocked<QuotaService>;

  beforeEach(() => {
    mockPDFRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateParseStatus: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockQuotaService = {
      checkAndConsume: jest.fn(),
    } as any;

    service = new PDFService(
      mockPDFRepo,
      {} as any,
      mockQuotaService,
      {} as any,
      {} as any
    );
  });

  describe('uploadPDF', () => {
    it('should throw QuotaExceededError when quota exceeded', async () => {
      mockQuotaService.checkAndConsume.mockResolvedValue({
        allowed: false,
        reason: 'Daily limit exceeded',
      });

      const file = new File([''], 'test.pdf', { type: 'application/pdf' });

      await expect(service.uploadPDF('user-123', file))
        .rejects.toThrow('Daily limit exceeded');
    });

    it('should create PDF when quota is available', async () => {
      mockQuotaService.checkAndConsume.mockResolvedValue({
        allowed: true,
      });

      mockPDFRepo.create.mockResolvedValue({
        id: 'pdf-123',
        userId: 'user-123',
        filename: 'test.pdf',
        // ...
      });

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = await service.uploadPDF('user-123', file);

      expect(result.id).toBe('pdf-123');
      expect(mockPDFRepo.create).toHaveBeenCalled();
    });
  });
});
```

### 3. 集成测试

```typescript
// __tests__/integration/pdf-flow.test.ts
import { POST } from '@/app/api/v1/pdfs/route';

describe('PDF API Integration', () => {
  it('should upload and list PDFs', async () => {
    // 1. 上传 PDF
    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.pdf', { type: 'application/pdf' }));

    const uploadReq = new NextRequest('http://localhost/api/v1/pdfs', {
      method: 'POST',
      body: formData,
    });

    const uploadRes = await POST(uploadReq);
    const uploadData = await uploadRes.json();

    expect(uploadData.success).toBe(true);
    expect(uploadData.data.pdfId).toBeDefined();

    // 2. 获取 PDF 列表
    const listReq = new NextRequest('http://localhost/api/v1/pdfs');
    const listRes = await GET(listReq);
    const listData = await listRes.json();

    expect(listData.success).toBe(true);
    expect(listData.data.length).toBeGreaterThan(0);
  });
});
```

---

## 风险与回滚方案

### 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| API 路由变更导致前端不兼容 | 高 | 保留旧路由作为代理，逐步迁移 |
| 数据库操作错误 | 高 | Repository 层事务处理，回滚机制 |
| 性能下降 | 中 | 性能测试，缓存策略 |
| 测试覆盖不足 | 中 | 80%+ 覆盖率要求 |

### 回滚方案

1. **保留旧路由**: 在迁移期间，旧路由 (`/api/*`) 作为代理转发到新路由 (`/api/v1/*`)
2. **Feature Flag**: 使用环境变量控制新旧版本切换
3. **数据库回滚**: 保留数据库迁移的回滚脚本
4. **快速回滚**: 如发现严重问题，立即切换回旧路由

```typescript
// 回滚示例：保留旧路由作为代理
// src/app/api/pdfs/route.ts (旧路由)
import { GET as v1GET, POST as v1POST } from '@/app/api/v1/pdfs/route';

// 如果需要回滚，直接导出旧实现
export const GET = process.env.USE_LEGACY_API
  ? legacyGET
  : v1GET;

export const POST = process.env.USE_LEGACY_API
  ? legacyPOST
  : v1POST;
```

---

## 总结

本 MVC 重构方案将带来以下改进：

| 方面 | 改进 |
|------|------|
| 可维护性 | 代码职责清晰，易于理解和修改 |
| 可测试性 | 每层可独立测试，mock 更容易 |
| 可扩展性 | 添加新功能只需扩展对应层 |
| 团队协作 | 不同开发者可并行工作在不同层 |
| 代码复用 | Service 和 Repository 可在多处复用 |

**预计总工时**: 12-18 个工作日

**建议开始时间**: 在完成当前功能迭代后，选择相对空闲的迭代周期进行重构。
