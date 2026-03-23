# Agent-PDF 后端技术文档

## 目录

1. [技术栈概述](#技术栈概述)
2. [项目架构](#项目架构)
3. [Prisma 数据库层](#prisma-数据库层)
4. [API 设计规范](#api-设计规范)
5. [认证与授权](#认证与授权)
6. [业务服务层](#业务服务层)
7. [中间件](#中间件)
8. [错误处理](#错误处理)
9. [日志与监控](#日志与监控)
10. [部署指南](#部署指南)

---

## 技术栈概述

### 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.x | 全栈框架 (App Router) |
| Prisma | 5.x | ORM 数据库工具 |
| PostgreSQL | 15.x | 主数据库 (Supabase) |
| Pinecone | - | 向量数据库 |
| Redis | 7.x | 缓存与会话 |
| TypeScript | 5.x | 类型安全 |

### 为什么选择 Prisma

| 特性 | 优势 |
|------|------|
| 类型安全 | 自动生成 TypeScript 类型 |
| 迁移管理 | 内置数据库迁移工具 |
| 查询构建器 | 直观的链式 API |
| 关系处理 | 自动处理表关联 |
| 开发体验 | Prisma Studio 可视化管理 |

---

## 项目架构

### 目录结构

```
src/
├── app/                          # Next.js App Router
│   └── api/                      # API 路由
│       ├── auth/                 # 认证接口
│       ├── pdfs/                 # PDF 管理
│       ├── chat/                 # 聊天接口
│       └── user/                 # 用户管理
│
├── lib/                          # 核心库
│   ├── prisma/                   # Prisma 客户端
│   │   ├── client.ts             # 客户端实例
│   │   └── seed.ts               # 种子数据
│   │
│   ├── services/                 # 业务服务
│   │   ├── auth.service.ts
│   │   ├── pdf.service.ts
│   │   ├── chat.service.ts
│   │   ├── user.service.ts
│   │   └── quota.service.ts
│   │
│   ├── repositories/             # 数据访问层
│   │   ├── user.repository.ts
│   │   ├── pdf.repository.ts
│   │   └── conversation.repository.ts
│   │
│   ├── middlewares/              # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── error.middleware.ts
│   │
│   └── utils/                    # 工具函数
│       ├── response.ts
│       ├── errors.ts
│       └── validation.ts
│
├── types/                        # 类型定义
│   ├── api.ts
│   └── models.ts
│
└── prisma/                       # Prisma 配置
    ├── schema.prisma             # 数据模型定义
    ├── migrations/               # 迁移文件
    └── seed.ts                   # 种子数据
```

### 分层架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              请求处理流程                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Client     │───>│   API Route   │───>│   Service    │───>│  Repository  │
│  (HTTP请求)   │    │  (控制器层)   │    │  (业务逻辑)   │    │  (数据访问)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                  │
                                                                  ▼
                                                          ┌──────────────┐
                                                          │   Prisma     │
                                                          │   (ORM)      │
                                                          └──────────────┘
                                                                  │
                                                                  ▼
                                                          ┌──────────────┐
                                                          │  PostgreSQL  │
                                                          │  (数据库)     │
                                                          └──────────────┘
```

---

## Prisma 数据库层

### 安装与配置

```bash
# 安装 Prisma
npm install prisma @prisma/client

# 初始化 Prisma
npx prisma init
```

### Schema 定义

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Supabase 连接池
}

// ============================================
// 用户相关模型
// ============================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          Role      @default(USER)
  status        Status    @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联
  profile     UserProfile?
  pdfs        PDF[]
  conversations Conversation[]
  quotaUsages QuotaUsage[]
  sessions    Session[]
  securityLogs SecurityLog[]

  @@map("user_profiles")
}

enum Role {
  USER
  PREMIUM
  ADMIN
}

enum Status {
  ACTIVE
  SUSPENDED
  DELETED
}

model UserProfile {
  id        String   @id
  user      User     @relation(fields: [id], references: [id], onDelete: Cascade)
  avatarUrl String?  @map("avatar_url")
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_profiles_ext")
}

model Session {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token       String   @unique
  userAgent   String?  @map("user_agent")
  ipAddress   String?  @map("ip_address")
  expiresAt   DateTime @map("expires_at")
  createdAt   DateTime @default(now())

  @@index([userId])
  @@map("user_sessions")
}

model SecurityLog {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType   String   @map("event_type")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  success     Boolean
  details     Json?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([eventType])
  @@map("user_security_log")
}

// ============================================
// PDF 相关模型
// ============================================

model PDF {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  filename        String
  fileSize        BigInt      @map("file_size")
  pageCount       Int?        @map("page_count")
  storagePath     String      @map("storage_path")
  parseStatus     ParseStatus @default(PENDING) @map("parse_status")
  textContent     String?     @map("text_content") @db.Text
  textSummary     String?     @map("text_summary") @db.Text
  pineconeIndex   String?     @map("pinecone_index")
  pineconeNamespace String?  @map("pinecone_namespace")
  parsedAt        DateTime?   @map("parsed_at")
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  lastAccessedAt  DateTime    @default(now()) @map("last_accessed_at")

  // 关联
  conversations Conversation[]

  @@index([userId])
  @@index([parseStatus])
  @@map("user_pdfs")
}

enum ParseStatus {
  PENDING
  PARSING
  COMPLETED
  FAILED
}

// ============================================
// 对话相关模型
// ============================================

model Conversation {
  id             String     @id @default(uuid())
  pdfId          String     @map("pdf_id")
  pdf            PDF        @relation(fields: [pdfId], references: [id], onDelete: Cascade)
  userId         String     @map("user_id")
  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  messageCount   Int        @default(0) @map("message_count")
  lastMessageAt  DateTime?  @map("last_message_at")
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  // 关联
  messages Message[]

  @@unique([pdfId, userId])
  @@index([userId])
  @@index([pdfId])
  @@map("pdf_conversations")
}

model Message {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  pdfId          String   @map("pdf_id")
  userId         String   @map("user_id")
  role           Role
  content        String   @db.Text
  tokens         Int?
  processingTime Int?     @map("processing_time")
  createdAt      DateTime @default(now())

  @@index([conversationId])
  @@index([userId])
  @@index([createdAt])
  @@map("conversation_messages")
}

enum Role {
  USER
  ASSISTANT
}

// ============================================
// 配额相关模型
// ============================================

model QuotaDefinition {
  id            String   @id @default(uuid())
  name          String   @unique
  displayName   String   @map("display_name")
  description   String?
  unit          String?
  defaultLimit  Int      @map("default_limit")
  premiumLimit  Int?     @map("premium_limit")
  adminLimit    Int?     @map("admin_limit")
  resetPeriod   String   @map("reset_period")
  createdAt     DateTime @default(now())

  // 关联
  userQuotas  UserQuota[]
  quotaUsages QuotaUsage[]

  @@map("quota_definitions")
}

model UserQuota {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  quotaId     String   @map("quota_id")
  quota       QuotaDefinition @relation(fields: [quotaId], references: [id])
  limitValue  Int?     @map("limit_value")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, quotaId])
  @@index([userId])
  @@map("user_quotas")
}

model QuotaUsage {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  quotaId     String   @map("quota_id")
  quota       QuotaDefinition @relation(fields: [quotaId], references: [id])
  usageDate   DateTime @map("usage_date") @db.Date
  usageCount  Int      @default(0) @map("usage_count")
  usageValue  BigInt?  @map("usage_value")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, quotaId, usageDate])
  @@index([userId, quotaId, usageDate])
  @@map("quota_usage")
}
```

### Prisma 客户端封装

```typescript
// src/lib/prisma/client.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 开发环境防止热重载创建多个实例
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// 类型导出
export * from '@prisma/client';
```

### Repository 层实现

```typescript
// src/lib/repositories/user.repository.ts

import { prisma, User, Role, Status } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';

export class UserRepository {
  /**
   * 根据 ID 查找用户
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  /**
   * 根据 Email 查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 创建用户
   */
  async create(data: {
    id: string;
    email: string;
    name?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
      },
    });
  }

  /**
   * 更新用户
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * 软删除用户
   */
  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        status: Status.DELETED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 检查邮箱是否已存在
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * 获取用户统计
   */
  async getStats(id: string) {
    const [pdfCount, messageCount, conversationCount] = await Promise.all([
      prisma.pDF.count({ where: { userId: id } }),
      prisma.message.count({ where: { userId: id } }),
      prisma.conversation.count({ where: { userId: id } }),
    ]);

    return {
      pdfCount,
      messageCount,
      conversationCount,
    };
  }
}
```

```typescript
// src/lib/repositories/pdf.repository.ts

import { prisma, PDF, ParseStatus } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';

export class PDFRepository {
  /**
   * 创建 PDF 记录
   */
  async create(data: {
    id: string;
    userId: string;
    filename: string;
    fileSize: bigint;
    storagePath: string;
  }): Promise<PDF> {
    return prisma.pDF.create({
      data: {
        id: data.id,
        userId: data.userId,
        filename: data.filename,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
      },
    });
  }

  /**
   * 根据 ID 查找 PDF
   */
  async findById(id: string, userId: string): Promise<PDF | null> {
    return prisma.pDF.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * 获取用户 PDF 列表
   */
  async findByUserId(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'filename';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ pdfs: PDF[]; total: number }> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const [pdfs, total] = await Promise.all([
      prisma.pDF.findMany({
        where: { userId },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.pDF.count({ where: { userId } }),
    ]);

    return { pdfs, total };
  }

  /**
   * 更新解析状态
   */
  async updateParseStatus(
    id: string,
    status: ParseStatus,
    updates?: {
      pageCount?: number;
      textContent?: string;
      textSummary?: string;
    }
  ): Promise<PDF> {
    return prisma.pDF.update({
      where: { id },
      data: {
        parseStatus: status,
        pageCount: updates?.pageCount,
        textContent: updates?.textContent,
        textSummary: updates?.textSummary,
        parsedAt: status === ParseStatus.COMPLETED ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 删除 PDF（级联删除关联数据）
   */
  async delete(id: string, userId: string): Promise<PDF> {
    return prisma.pDF.delete({
      where: {
        id,
        userId, // 确保只能删除自己的 PDF
      },
    });
  }

  /**
   * 获取 PDF 数量
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.pDF.count({
      where: { userId },
    });
  }
}
```

```typescript
// src/lib/repositories/conversation.repository.ts

import { prisma, Conversation, Message, Role } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';

export class ConversationRepository {
  /**
   * 创建或获取对话
   */
  async createOrGet(pdfId: string, userId: string): Promise<Conversation> {
    const existing = await prisma.conversation.findUnique({
      where: {
        pdfId_userId: {
          pdfId,
          userId,
        },
      },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        pdfId,
        userId,
      },
    });
  }

  /**
   * 添加消息
   */
  async addMessage(data: {
    conversationId: string;
    pdfId: string;
    userId: string;
    role: Role;
    content: string;
    tokens?: number;
    processingTime?: number;
  }): Promise<Message> {
    return prisma.message.create({
      data: {
        conversationId: data.conversationId,
        pdfId: data.pdfId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        tokens: data.tokens,
        processingTime: data.processingTime,
      },
    });
  }

  /**
   * 获取对话历史
   */
  async getHistory(
    pdfId: string,
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ messages: Message[]; total: number }> {
    const { limit = 100, offset = 0 } = options;

    const conversation = await prisma.conversation.findUnique({
      where: {
        pdfId_userId: { pdfId, userId },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          skip: offset,
          take: limit,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return {
      messages: conversation?.messages || [],
      total: conversation?._count.messages || 0,
    };
  }

  /**
   * 删除对话（级联删除消息）
   */
  async deleteByPDF(pdfId: string, userId: string): Promise<void> {
    await prisma.conversation.deleteMany({
      where: {
        pdfId,
        userId,
      },
    });
  }
}
```

---

## API 设计规范

### RESTful API 设计

| 资源 | GET | POST | PUT | DELETE |
|------|-----|------|-----|--------|
| `/api/pdfs` | 获取列表 | 上传 PDF | - | - |
| `/api/pdfs/:id` | 获取详情 | - | 更新 | 删除 |
| `/api/pdfs/:id/conversations` | 获取对话历史 | - | - | - |
| `/api/chat` | - | 发起对话 | - | - |
| `/api/user/profile` | 获取资料 | - | 更新 | - |

### 统一响应格式

```typescript
// src/lib/utils/response.ts

import { NextResponse } from 'next/server';

// 成功响应
export function successResponse<T>(data: T, meta?: object): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  });
}

// 错误响应
export function errorResponse(
  error: {
    code: string;
    message: string;
    details?: unknown;
  },
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// 分页响应
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
}
```

### API 路由示例

```typescript
// src/app/api/pdfs/route.ts

import { NextRequest } from 'next/server';
import { PDFService } from '@/lib/services/pdf.service';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { getCurrentUser } from '@/lib/middlewares/auth.middleware';

const pdfService = new PDFService();

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse(
        { code: 'UNAUTHORIZED', message: '请先登录' },
        401
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await pdfService.getPDFList(user.id, { limit, offset });

    return successResponse(result.pdfs, { total: result.total });
  } catch (error) {
    console.error('[API] GET /pdfs error:', error);
    return errorResponse(
      { code: 'INTERNAL_ERROR', message: '服务器错误' },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse(
        { code: 'UNAUTHORIZED', message: '请先登录' },
        401
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse(
        { code: 'INVALID_REQUEST', message: '未找到文件' },
        400
      );
    }

    const pdf = await pdfService.uploadPDF(user.id, file);

    return successResponse({
      pdfId: pdf.id,
      filename: pdf.filename,
      uploadedAt: pdf.createdAt,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return errorResponse(
        { code: 'QUOTA_EXCEEDED', message: error.message },
        403
      );
    }
    console.error('[API] POST /pdfs error:', error);
    return errorResponse(
      { code: 'INTERNAL_ERROR', message: '上传失败' },
      500
    );
  }
}
```

---

## 认证与授权

### 认证中间件

```typescript
// src/lib/middlewares/auth.middleware.ts

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma/client';
import { User } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) return null;

    // 查询会话
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
}

/**
 * 要求用户登录
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError('请先登录');
  }
  return user;
}

/**
 * 要求管理员权限
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('需要管理员权限');
  }
  return user;
}
```

### 权限检查

```typescript
// src/lib/middlewares/permission.middleware.ts

import { prisma } from '@/lib/prisma/client';
import { requireAuth } from './auth.middleware';

/**
 * 检查 PDF 所有权
 */
export async function checkPDFOwnership(pdfId: string): Promise<void> {
  const user = await requireAuth();

  const pdf = await prisma.pDF.findFirst({
    where: {
      id: pdfId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!pdf) {
    throw new NotFoundError('PDF 不存在或无权访问');
  }
}
```

---

## 业务服务层

### PDF 服务

```typescript
// src/lib/services/pdf.service.ts

import { v4 as uuidv4 } from 'uuid';
import { PDFRepository } from '@/lib/repositories/pdf.repository';
import { ConversationRepository } from '@/lib/repositories/conversation.repository';
import { QuotaService } from './quota.service';
import { StorageService } from './storage.service';
import { VectorService } from './vector.service';
import { PDF, ParseStatus } from '@/lib/prisma/client';

export class PDFService {
  private pdfRepo: PDFRepository;
  private convRepo: ConversationRepository;
  private quotaService: QuotaService;
  private storageService: StorageService;
  private vectorService: VectorService;

  constructor() {
    this.pdfRepo = new PDFRepository();
    this.convRepo = new ConversationRepository();
    this.quotaService = new QuotaService();
    this.storageService = new StorageService();
    this.vectorService = new VectorService();
  }

  /**
   * 上传 PDF
   */
  async uploadPDF(userId: string, file: File): Promise<PDF> {
    // 1. 配额检查
    await this.quotaService.checkAndConsume(userId, 'pdf_uploads_daily');

    // 2. 文件验证
    this.validateFile(file);

    // 3. 上传到存储
    const storagePath = await this.storageService.upload(file, userId);

    // 4. 创建数据库记录
    const pdf = await this.pdfRepo.create({
      id: uuidv4(),
      userId,
      filename: file.name,
      fileSize: BigInt(file.size),
      storagePath,
    });

    // 5. 创建对话记录
    await this.convRepo.createOrGet(pdf.id, userId);

    return pdf;
  }

  /**
   * 获取 PDF 列表
   */
  async getPDFList(
    userId: string,
    options: { limit?: number; offset?: number }
  ) {
    return this.pdfRepo.findByUserId(userId, options);
  }

  /**
   * 删除 PDF
   */
  async deletePDF(pdfId: string, userId: string): Promise<void> {
    // 1. 验证所有权
    const pdf = await this.pdfRepo.findById(pdfId, userId);
    if (!pdf) {
      throw new NotFoundError('PDF 不存在');
    }

    // 2. 删除向量数据
    await this.vectorService.deleteByPDF(pdfId, userId);

    // 3. 删除存储文件
    await this.storageService.delete(pdf.storagePath);

    // 4. 删除对话记录
    await this.convRepo.deleteByPDF(pdfId, userId);

    // 5. 删除 PDF 记录
    await this.pdfRepo.delete(pdfId, userId);
  }

  /**
   * 文件验证
   */
  private validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new ValidationError('文件必须是 PDF 格式');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new ValidationError('文件大小不能超过 50MB');
    }
  }
}
```

### 配额服务

```typescript
// src/lib/services/quota.service.ts

import { prisma } from '@/lib/prisma/client';

export interface QuotaCheckResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  reason?: string;
}

export class QuotaService {
  /**
   * 检查并消费配额
   */
  async checkAndConsume(
    userId: string,
    quotaName: string,
    amount: number = 1
  ): Promise<void> {
    const result = await this.check(userId, quotaName);

    if (!result.allowed) {
      throw new QuotaExceededError(result.reason || '配额已用完');
    }

    await this.consume(userId, quotaName, amount);
  }

  /**
   * 检查配额
   */
  async check(userId: string, quotaName: string): Promise<QuotaCheckResult> {
    // 获取配额定义
    const quotaDef = await prisma.quotaDefinition.findUnique({
      where: { name: quotaName },
    });

    if (!quotaDef) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        reason: '配额未配置',
      };
    }

    // 获取今日使用量
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.quotaUsage.findUnique({
      where: {
        userId_quotaId_usageDate: {
          userId,
          quotaId: quotaDef.id,
          usageDate: today,
        },
      },
    });

    const used = usage?.usageCount || 0;
    const limit = quotaDef.defaultLimit;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining > 0,
      limit,
      used,
      remaining,
      reason: remaining === 0 ? '今日配额已用完' : undefined,
    };
  }

  /**
   * 消费配额
   */
  async consume(
    userId: string,
    quotaName: string,
    amount: number = 1
  ): Promise<void> {
    const quotaDef = await prisma.quotaDefinition.findUnique({
      where: { name: quotaName },
    });

    if (!quotaDef) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.quotaUsage.upsert({
      where: {
        userId_quotaId_usageDate: {
          userId,
          quotaId: quotaDef.id,
          usageDate: today,
        },
      },
      update: {
        usageCount: { increment: amount },
      },
      create: {
        userId,
        quotaId: quotaDef.id,
        usageDate: today,
        usageCount: amount,
      },
    });
  }
}
```

---

## 中间件

### 速率限制中间件

```typescript
// src/lib/middlewares/rate-limit.middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis/client';

interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  max: number;       // 最大请求数
  message?: string;
}

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const ip = req.ip || 'unknown';
    const key = `rate-limit:${ip}:${req.nextUrl.pathname}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.pexpire(key, config.windowMs);
      }

      if (current > config.max) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: config.message || '请求过于频繁，请稍后再试',
            },
          },
          { status: 429 }
        );
      }

      return null; // 继续处理请求
    } catch (error) {
      console.error('[RateLimit] Redis error:', error);
      return null; // Redis 出错时放行
    }
  };
}

// 预设配置
export const rateLimiters = {
  strict: rateLimit({ windowMs: 60000, max: 10 }),
  standard: rateLimit({ windowMs: 60000, max: 30 }),
  relaxed: rateLimit({ windowMs: 60000, max: 100 }),
};
```

### 错误处理中间件

```typescript
// src/lib/middlewares/error.middleware.ts

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/utils/errors';

export function handleError(error: unknown): NextResponse {
  console.error('[Error]', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
      },
      { status: error.statusCode }
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      },
    },
    { status: 500 }
  );
}
```

---

## 错误处理

### 自定义错误类

```typescript
// src/lib/utils/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '请先登录') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '无权访问') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super('NOT_FOUND', message, 404);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = '配额已用完') {
    super('QUOTA_EXCEEDED', message, 403);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', message, 500, details);
  }
}
```

---

## 日志与监控

### 结构化日志

```typescript
// src/lib/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatEntry({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        context,
      }));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.log(this.formatEntry({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    }));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(this.formatEntry({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
    }));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    console.error(this.formatEntry({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    }));
  }
}

export const logger = new Logger();
```

---

## 部署指南

### 环境变量

```bash
# .env.example

# 数据库
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Prisma
PRISMA_GENERATE_DATAPROXY="true"

# Redis
REDIS_URL="redis://..."

# Pinecone
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="..."
PINECONE_INDEX="..."

# AI 服务
ALIBABA_API_KEY="..."
QWEN_API_KEY="..."

# 存储
BLOB_READ_WRITE_TOKEN="..."

# 应用
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 数据库迁移

```bash
# 开发环境
npx prisma migrate dev --name init

# 生产环境
npx prisma migrate deploy

# 重置数据库（危险！）
npx prisma migrate reset
```

### 种子数据

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建配额定义
  await prisma.quotaDefinition.createMany({
    data: [
      {
        name: 'pdf_uploads_daily',
        displayName: 'PDF上传（每日）',
        description: '每天可以上传的PDF数量',
        unit: 'count',
        defaultLimit: 10,
        premiumLimit: 100,
        resetPeriod: 'daily',
      },
      {
        name: 'ai_calls_daily',
        displayName: 'AI调用（每日）',
        description: '每天可以发起的AI对话次数',
        unit: 'count',
        defaultLimit: 100,
        premiumLimit: 1000,
        resetPeriod: 'daily',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
# 运行种子
npx prisma db seed
```

### 部署检查清单

- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 种子数据已创建
- [ ] Prisma 客户端已生成
- [ ] Redis 连接正常
- [ ] Pinecone 连接正常
- [ ] 日志系统正常
- [ ] 监控告警配置

---

## 总结

本文档提供了 Agent-PDF 后端的完整技术指南：

| 章节 | 内容 |
|------|------|
| Prisma 数据库层 | Schema 定义、Repository 实现 |
| API 设计规范 | RESTful 设计、统一响应格式 |
| 认证与授权 | 中间件、权限检查 |
| 业务服务层 | PDF、配额等服务实现 |
| 中间件 | 速率限制、错误处理 |
| 错误处理 | 自定义错误类 |
| 日志与监控 | 结构化日志 |
| 部署指南 | 环境变量、迁移、种子 |

建议按照本文档的架构逐步重构项目，提高代码的可维护性和可测试性。
