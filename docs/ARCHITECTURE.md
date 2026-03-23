# Agent-PDF 项目架构文档

## 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [目录结构](#目录结构)
4. [API 接口服务](#api-接口服务)
5. [数据库设计](#数据库设计)
6. [服务层架构](#服务层架构)
7. [数据流向图](#数据流向图)
8. [核心业务流程](#核心业务流程)
9. [代码结构优化建议](#代码结构优化建议)
10. [前端工程师学习全栈指南](#前端工程师学习全栈指南)

---

## 项目概述

Agent-PDF 是一个基于 AI 的 PDF 文档智能对话平台，用户可以上传 PDF 文档并与文档内容进行智能对话。系统支持游客体验和注册用户两种模式，实现了完整的用户认证、配额管理、向量检索和 AI 对话功能。

### 核心功能

- PDF 文档上传与解析
- 基于向量数据库的语义检索
- AI 智能对话（支持流式响应）
- 用户认证与权限管理
- 配额管理系统
- 游客体验与用户转化

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) |
| UI 组件 | React 18 + Ant Design + Tailwind CSS |
| 后端服务 | Next.js API Routes |
| 数据库 | PostgreSQL (Supabase) |
| 向量数据库 | Pinecone |
| AI 模型 | 通义千问 (Qwen) via LangChain |
| 认证 | Supabase Auth |
| 存储 | Vercel Blob Storage |
| 缓存 | Redis (可选) |

---

## 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证相关 API
│   │   ├── chat/                 # 聊天 API
│   │   ├── pdfs/                 # PDF 管理 API
│   │   ├── upload/               # 文件上传 API
│   │   ├── parse/                # PDF 解析 API
│   │   ├── quota/                # 配额管理 API
│   │   ├── guest/                # 游客管理 API
│   │   ├── user/                 # 用户中心 API
│   │   └── admin/                # 管理员 API
│   ├── login/                    # 登录页面
│   ├── register/                 # 注册页面
│   ├── user-center/              # 用户中心页面
│   └── page.tsx                  # 首页
├── components/                   # React 组件
│   ├── auth/                     # 认证组件
│   ├── chat/                     # 聊天组件
│   ├── pdf/                      # PDF 组件
│   ├── user/                     # 用户组件
│   ├── layout/                   # 布局组件
│   └── ui/                       # UI 基础组件
├── contexts/                     # React Context
│   ├── AuthContext.tsx           # 认证上下文
│   ├── ChatContext.tsx           # 聊天上下文
│   └── PDFContext.tsx            # PDF 上下文
├── hooks/                        # 自定义 Hooks
├── lib/                          # 核心库
│   ├── auth/                     # 认证逻辑
│   ├── chat/                     # 聊天逻辑
│   ├── pdf/                      # PDF 处理
│   ├── storage/                  # 存储服务
│   ├── langchain/                # LangChain 配置
│   ├── pinecone/                 # Pinecone 向量存储
│   ├── quota/                    # 配额检查
│   ├── supabase/                 # 数据库客户端
│   └── utils/                    # 工具函数
└── types/                        # TypeScript 类型定义

supabase/
└── migrations/                   # 数据库迁移文件
    ├── 0001_create_user_tables.sql
    ├── 0002_create_quota_tables.sql
    ├── 0003_create_user_pdfs_table.sql
    └── 0006_create_conversation_tables.sql
```

---

## API 接口服务

### 1. 认证服务 (`/api/auth/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/auth/register` | POST | 用户注册 | Supabase Auth, Email Service |
| `/api/auth/login` | POST | 用户登录 | Supabase Auth |
| `/api/auth/logout` | POST | 用户登出 | Supabase Auth |
| `/api/auth/me` | GET | 获取当前用户 | Supabase Auth |
| `/api/auth/verify-email` | POST | 验证邮箱 | Supabase Auth |
| `/api/auth/forgot-password` | POST | 忘记密码 | Email Service |
| `/api/auth/reset-password` | POST | 重置密码 | Supabase Auth |

### 2. PDF 服务 (`/api/pdfs/`, `/api/pdf/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/upload` | POST | 上传 PDF | Quota, Blob Storage, Supabase |
| `/api/parse` | POST | 解析 PDF | PDF Parser, Pinecone |
| `/api/pdfs/list` | GET | 获取 PDF 列表 | Supabase |
| `/api/pdfs/[id]` | GET/DELETE | PDF 详情/删除 | Supabase, Pinecone, Blob Storage |
| `/api/pdf/[id]` | GET | PDF 操作 | Supabase |

### 3. 聊天服务 (`/api/chat/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/chat` | POST | AI 对话 (SSE) | Quota, LangChain, Pinecone, Qwen AI |

### 4. 配额服务 (`/api/quota/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/quota/stats` | GET | 配额统计 | Supabase |

### 5. 游客服务 (`/api/guest/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/guest/quota` | GET | 游客配额 | Redis/Guest Storage |
| `/api/guest/track` | POST | 游客追踪 | Fingerprint |
| `/api/guest/migrate` | POST | 游客转注册 | Supabase |

### 6. 用户服务 (`/api/user/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/user/profile` | GET/PUT | 用户资料 | Supabase |
| `/api/user/avatar` | POST | 头像上传 | Blob Storage, Supabase |
| `/api/user/change-password` | POST | 修改密码 | Supabase Auth |
| `/api/user/stats` | GET | 用户统计 | Supabase |

### 7. 管理员服务 (`/api/admin/`)

| 端点 | 方法 | 描述 | 依赖服务 |
|------|------|------|----------|
| `/api/admin/users` | GET | 用户列表 | Supabase |
| `/api/admin/users/[id]` | GET/DELETE | 用户详情/删除 | Supabase |

---

## 数据库设计

### ER 图

```
┌─────────────────┐     ┌─────────────────┐
│   auth.users    │────<│  user_profiles  │
│   (Supabase)    │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  user_sessions  │     │   user_quotas   │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
                                │
         ┌──────────────────────┤
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│quota_definitions│     │  quota_usage    │
│                 │     │                 │
└─────────────────┘     └─────────────────┘

┌─────────────────┐
│   user_pdfs     │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│pdf_conversations│────<│conversation_msgs│
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```
🧩 ER 图核心结构解析
这是一个典型的用户服务 + PDF 对话应用的数据库 ER 图，我们可以按模块拆解分析：
1. 核心用户模块
auth.users (Supabase)
这是 Supabase 内置的用户认证表，存储用户的核心身份信息（邮箱、密码哈希、创建时间等），是整个系统的用户根节点。
user_profiles
与 auth.users 是一对一关系（一个用户对应一个资料），存储用户的扩展信息（昵称、头像、偏好设置等）。
user_sessions
与 auth.users 是一对多关系（一个用户可有多条会话记录），存储用户登录会话（会话 ID、过期时间、设备信息等），用于状态管理。
2. 配额与计费模块
user_quotas
与 user_profiles 是一对一关系，记录每个用户的配额配置（关联到具体的配额定义）。
quota_definitions
与 user_quotas 是一对多关系（一个配额定义可被多个用户使用），存储配额的元数据（如 “每日 AI 对话次数”“PDF 上传大小限制”、配额类型、上限值）。
quota_usage
与 user_quotas 是一对多关系，记录用户的配额消耗明细（每次操作的时间、消耗数量、关联操作类型），用于统计和限制。
3. PDF 对话模块
user_pdfs
与 auth.users 是一对多关系（一个用户可上传多个 PDF），存储 PDF 文件信息（文件名、存储路径、上传时间、页数等）。
pdf_conversations
与 user_pdfs 是一对多关系（一个 PDF 可开启多次对话），存储针对某个 PDF 的对话会话（标题、创建时间）。
conversation_msgs
与 pdf_conversations 是一对多关系（一次对话包含多条消息），存储单条对话内容（用户提问、AI 回答、时间戳、消息类型）。
🔗 关系总结
表格
表关系	关系类型	业务含义
auth.users ↔ user_profiles	一对一	一个用户只有一份个人资料
auth.users → user_sessions	一对多	一个用户可有多条登录会话
user_profiles → user_quotas	一对一	一个用户对应一套配额配置
user_quotas → quota_definitions	多对一	多个用户可共享同一种配额规则
user_quotas → quota_usage	一对多	记录用户每次配额消耗
auth.users → user_pdfs	一对多	一个用户可上传多个 PDF
user_pdfs → pdf_conversations	一对多	一个 PDF 可开启多次对话
pdf_conversations → conversation_msgs	一对多	一次对话包含多条消息
💡 设计意图与优化点
设计意图：
解耦认证与业务数据：auth.users 只做身份认证，业务信息存在 user_profiles，便于维护。
配额灵活可配置：通过 quota_definitions 抽象配额规则，方便后续新增 / 修改配额类型（如免费版、专业版）。
功能模块化：PDF 对话与用户 / 配额模块独立，便于后续扩展其他功能（如图片对话）。
潜在优化点：
可增加 user_roles 表，实现角色权限管理（如管理员、普通用户）。
conversation_msgs 可增加 token_count 字段，用于精确统计 AI 调用成本。
✅ 总结
这是一个高内聚、低耦合的典型 SaaS 应用数据库设计：
以用户为核心，延伸出会话、配额、文件等业务线。
每个模块职责清晰，表之间通过外键关联，保证数据一致性。
便于后续迭代新功能（如新增付费套餐、扩展文件类型）。
要不要我帮你把这个 ER 图转换成 PostgreSQL 建表 SQL 脚本，直接可以在 Supabase 里执行？
1对1 还是 1对多 是从图形上的那个信息节点或标志看出来的
🎯 从 ER 图符号看关系类型
你这张图用的是简化版 ER 符号（没有传统 crow's foot 符号），主要靠箭头方向 + 表的业务语义来判断关系类型，我给你拆解一下：
1. 一对一关系（1:1）
判断依据：
两个表之间是双向箭头 / 双向线（或一条线连接，且业务上是 “一个对一个”）
两个表的主键通常共享同一个值（比如都用 user_id 做主键）
例子：auth.users ↔ user_profiles
一个用户只能有一个个人资料
一个个人资料只能属于一个用户
所以是 1:1 关系
2. 一对多关系（1:N）
判断依据：
箭头从 “一” 的一方指向 “多” 的一方
或者一条线从 “父表” 指向 “子表”，表示 “一个父记录可以对应多个子记录”
例子：
auth.users → user_sessions
一个用户可以有多个登录会话
一个会话只能属于一个用户
所以是 1:N 关系
user_profiles → user_quotas
一个用户只能有一套配额配置
（这里设计为 1:1，也可以理解为 1:N 的特殊情况）
user_quotas → quota_usage
一个用户配额可以有多条使用记录
一条使用记录只能属于一个用户配额
所以是 1:N 关系
user_pdfs → pdf_conversations
一个 PDF 可以开启多次对话
一次对话只能属于一个 PDF
所以是 1:N 关系
pdf_conversations → conversation_msgs
一次对话可以有多条消息
一条消息只能属于一次对话
所以是 1:N 关系
3. 多对一关系（N:1）
判断依据：
箭头从 “多” 的一方指向 “一” 的一方
本质是一对多的反向视角
例子：user_quotas → quota_definitions
多个用户配额可以共享同一个配额定义（比如 “免费版” 配额规则）
一个配额定义可以被多个用户使用
所以是 N:1 关系（也可以看成 1:N，只是方向不同）
📌 快速判断口诀
双向线 / 无方向线 + 业务互斥 → 1:1
箭头从 A 指向 B → A 是 “一”，B 是 “多”（1:N）
箭头从 B 指向 A → B 是 “多”，A 是 “一”（N:1）
没有箭头但业务上是 “一个对多个” → 按语义判断 1:N
✅ 总结
在你这张图里：
1:1：auth.users ↔ user_profiles、user_profiles → user_quotas
1:N：auth.users → user_sessions、user_quotas → quota_usage、user_pdfs → pdf_conversations、pdf_conversations → conversation_msgs
N:1：user_quotas → quota_definitions
要不要我用传统 crow's foot 符号（最标准的 ER 画法）给你画一个对照版，让你一眼就能分清 1 和 多？

### 表结构详解

#### 1. user_profiles（用户资料表）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键，关联 auth.users |
| email | TEXT | 邮箱 |
| name | TEXT | 昵称 |
| avatar_url | TEXT | 头像 URL |
| role | TEXT | 角色 (user/premium/admin) |
| email_verified | BOOLEAN | 邮箱验证状态 |
| status | TEXT | 状态 (active/suspended) |

#### 2. user_pdfs（用户 PDF 表）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | PDF ID |
| user_id | UUID | 用户 ID |
| filename | TEXT | 文件名 |
| file_size | BIGINT | 文件大小 |
| page_count | INTEGER | 页数 |
| storage_path | TEXT | Blob 存储路径 |
| pinecone_namespace | TEXT | 向量命名空间 |
| parse_status | TEXT | 解析状态 |
| text_content | TEXT | 解析后的文本 |
| created_at | TIMESTAMP | 创建时间 |

#### 3. pdf_conversations（对话表）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 对话 ID |
| pdf_id | UUID | PDF ID |
| user_id | UUID | 用户 ID |
| message_count | INTEGER | 消息数量 |
| last_message_at | TIMESTAMP | 最后消息时间 |

#### 4. conversation_messages（消息表）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 消息 ID |
| conversation_id | UUID | 对话 ID |
| role | TEXT | 角色 (user/assistant) |
| content | TEXT | 消息内容 |
| tokens | INTEGER | Token 数量 |
| processing_time | INTEGER | 处理时间 (ms) |

#### 5. quota_definitions（配额定义表）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 配额 ID |
| name | TEXT | 配额名称 |
| default_limit | INTEGER | 免费用户限制 |
| premium_limit | INTEGER | 高级用户限制 |
| reset_period | TEXT | 重置周期 (daily/monthly/never) |

#### 6. quota_usage（配额使用表）

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 记录 ID |
| user_id | UUID | 用户 ID |
| quota_id | UUID | 配额 ID |
| usage_date | DATE | 使用日期 |
| usage_count | INTEGER | 使用次数 |

---

## 服务层架构

### 服务依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                        API Routes                            │
│  (upload, parse, chat, auth, quota, user, admin)            │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  Auth Layer   │ │ Quota Layer   │ │ Storage Layer │
    │ (middleware)  │ │ (check.ts)    │ │ (blob, redis) │
    └───────────────┘ └───────────────┘ └───────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │   Supabase    │ │   Pinecone    │ │  Vercel Blob  │
    │  (PostgreSQL) │ │ (Vector DB)   │ │  (Storage)    │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### 核心服务模块

#### 1. 认证服务 (`src/lib/auth/`)

- **middleware.ts**: 服务端认证中间件，获取当前用户
- **fingerprint.ts**: 设备指纹生成，用于游客识别
- **admin.ts**: 管理员认证逻辑

#### 2. PDF 处理服务 (`src/lib/pdf/`)

- **parser.ts**: PDF 解析主逻辑
- **text-splitter.ts**: 文本分割，支持元数据
- **save-pdf-info.ts**: 保存 PDF 信息到数据库
- **delete-pdf.ts**: 删除 PDF 及关联数据

#### 3. 向量存储服务 (`src/lib/langchain/`, `src/lib/pinecone/`)

- **vector-store.ts**: 向量存储管理
- **config.ts**: LangChain 配置
- **chain.ts**: 聊天链配置

#### 4. 存储服务 (`src/lib/storage/`)

- **blob-storage.ts**: Vercel Blob 存储
- **redis-cache.ts**: Redis 缓存
- **guest-storage.ts**: 游客存储
- **pdf-files.ts**: PDF 文件内存管理

#### 5. 配额服务 (`src/lib/quota/`)

- **check.ts**: 配额检查与记录

#### 6. 聊天服务 (`src/lib/chat/`)

- **save-conversation.ts**: 保存对话
- **get-conversation-history.ts**: 获取对话历史

---

## 数据流向图

### PDF 上传流程

```
┌──────────┐    POST /api/upload    ┌──────────────┐
│  Client  │ ─────────────────────> │ Upload Route │
└──────────┘                        └──────┬───────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
            │ Quota Check   │      │ Validate File │      │ Gen Fingerprint│
            │ (Guest/User)  │      │ (PDF/Size)    │      │ (Guest only)  │
            └───────────────┘      └───────────────┘      └───────────────┘
                    │                      │                      │
                    └──────────────────────┼──────────────────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Save to Temp  │
                                    │ & Blob Storage│
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Save to DB    │
                                    │ (user_pdfs)   │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Record Usage  │
                                    │ (quota_usage) │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Return PDF ID │
                                    └───────────────┘
```

### PDF 解析流程

```
┌──────────┐    POST /api/parse     ┌──────────────┐
│  Client  │ ─────────────────────> │ Parse Route  │
└──────────┘                        └──────┬───────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Load PDF File │
                                    │ (Temp/Blob)   │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Parse PDF     │
                                    │ (pdf.js/ocr)  │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Split Text    │
                                    │ (Chunks)      │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Store Vectors │
                                    │ (Pinecone)    │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Update DB     │
                                    │ (parse_status)│
                                    └───────────────┘
```

### 聊天流程

```
┌──────────┐    POST /api/chat      ┌──────────────┐
│  Client  │ ─────────────────────> │ Chat Route   │
└──────────┘   (SSE Stream)         └──────┬───────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Quota Check   │
                                    │ (ai_calls)    │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Vector Search │
                                    │ (Pinecone)    │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Build Prompt  │
                                    │ (Context+Q)   │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌───────────────┐
                                    │ Stream AI     │
                                    │ (Qwen)        │
                                    └──────┬────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
            │ Send Tokens   │      │ Record Usage  │      │ Save Message  │
            │ (SSE Stream)  │      │ (quota_usage) │      │ (conversations)│
            └───────────────┘      └───────────────┘      └───────────────┘
```

---

## 核心业务流程

### 1. 用户注册流程

```typescript
// 1. 前端调用注册 API
POST /api/auth/register
{
  email: "user@example.com",
  password: "xxx",
  name: "User"
}

// 2. 后端处理流程
// a. 验证输入
// b. 调用 Supabase Auth 创建用户
// c. 触发数据库触发器自动创建 user_profiles
// d. 发送验证邮件
// e. 返回成功响应

// 3. 数据库触发器自动执行
INSERT INTO user_profiles (id, email, name)
VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
```

### 2. 配额检查流程

```typescript
// 配额检查核心逻辑 (src/lib/quota/check.ts)

export async function canUploadPDF(userId: string): Promise<QuotaCheckResult> {
  // 1. 获取配额定义
  const quotaDef = await getUserQuotaDefinition(userId, 'pdf_uploads_daily');

  // 2. 获取今日使用量
  const used = await getUserUsageToday(userId, 'pdf_uploads_daily');

  // 3. 计算剩余配额
  const remaining = Math.max(0, quotaDef.default_limit - used);

  // 4. 返回检查结果
  return {
    allowed: remaining > 0,
    quotaLimit: quotaDef.default_limit,
    used,
    remaining,
    quotaType: 'daily',
  };
}
```

### 3. 向量检索流程

```typescript
// 聊天时的向量检索

// 1. 获取用户专属命名空间
const namespace = userId; // 使用 user_id 作为命名空间

// 2. 在 Pinecone 中搜索相似文档
const relevantDocs = await searchSimilarDocuments(pdfId, question, 4, userId);

// 3. 构建上下文
const context = relevantDocs.map((doc, i) => {
  return `[文档片段 ${i + 1}]:\n${doc.pageContent}`;
}).join('\n\n');

// 4. 发送给 AI 模型
const systemMessage = new SystemMessage(
  `你是一个智能文档助手。请根据以下文档内容回答用户的问题。\n\n文档内容：\n${context}`
);
```

---

## 代码结构优化建议

### 当前架构分析

当前项目采用的是 Next.js App Router 架构，API 路由直接在 `app/api/` 目录下，服务逻辑分散在 `lib/` 目录中。这种结构适合小型项目，但随着项目规模增长，可能会出现以下问题：

1. **API 路由臃肿**: 每个 route.ts 文件包含过多业务逻辑
2. **服务层不统一**: 服务函数分散在多个文件中
3. **缺乏分层**: 控制器、服务、数据访问层混杂

### 推荐 MVC 架构重构

```
src/
├── app/                          # Next.js App Router (视图层)
│   ├── (auth)/                   # 认证相关页面
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                   # 主要功能页面
│   │   ├── page.tsx
│   │   └── user-center/page.tsx
│   └── api/                      # API 路由 (控制器层)
│       └── v1/                   # API 版本控制
│           ├── auth/
│           ├── pdfs/
│           └── chat/
│
├── controllers/                  # 控制器层 (处理请求/响应)
│   ├── auth.controller.ts
│   ├── pdf.controller.ts
│   ├── chat.controller.ts
│   └── quota.controller.ts
│
├── services/                     # 服务层 (业务逻辑)
│   ├── auth.service.ts
│   ├── pdf.service.ts
│   ├── chat.service.ts
│   ├── quota.service.ts
│   └── email.service.ts
│
├── repositories/                 # 数据访问层
│   ├── user.repository.ts
│   ├── pdf.repository.ts
│   ├── conversation.repository.ts
│   └── quota.repository.ts
│
├── models/                       # 数据模型/实体
│   ├── user.model.ts
│   ├── pdf.model.ts
│   └── conversation.model.ts
│
├── dtos/                         # 数据传输对象
│   ├── auth.dto.ts
│   ├── pdf.dto.ts
│   └── chat.dto.ts
│
├── middlewares/                  # 中间件
│   ├── auth.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── error-handler.middleware.ts
│
├── utils/                        # 工具函数
│   ├── validation.ts
│   ├── errors.ts
│   └── response.ts
│
└── config/                       # 配置
    ├── database.ts
    ├── pinecone.ts
    └── email.ts
```

### 各层职责

#### 1. 控制器层 (Controllers)

```typescript
// src/controllers/pdf.controller.ts
export class PDFController {
  constructor(private pdfService: PDFService) {}

  async upload(req: NextRequest): Promise<NextResponse> {
    const userId = await getCurrentUserId(req);
    const file = await extractFileFromRequest(req);

    const result = await this.pdfService.uploadPDF(userId, file);

    return NextResponse.json({ success: true, data: result });
  }

  async getList(req: NextRequest): Promise<NextResponse> {
    const userId = await getCurrentUserId(req);
    const query = parseQueryParams(req);

    const result = await this.pdfService.getPDFList(userId, query);

    return NextResponse.json({ success: true, data: result });
  }
}
```

#### 2. 服务层 (Services)

```typescript
// src/services/pdf.service.ts
export class PDFService {
  constructor(
    private pdfRepo: PDFRepository,
    private quotaService: QuotaService,
    private storageService: StorageService,
    private vectorService: VectorService
  ) {}

  async uploadPDF(userId: string, file: File): Promise<PDFUploadResult> {
    // 1. 配额检查
    await this.quotaService.checkAndConsume(userId, 'pdf_uploads_daily');

    // 2. 文件验证
    this.validatePDFFile(file);

    // 3. 存储文件
    const storagePath = await this.storageService.upload(file);

    // 4. 保存数据库记录
    const pdf = await this.pdfRepo.create({
      userId,
      filename: file.name,
      fileSize: file.size,
      storagePath,
    });

    return pdf;
  }
}
```

#### 3. 数据访问层 (Repositories)

```typescript
// src/repositories/pdf.repository.ts
export class PDFRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreatePDFDTO): Promise<PDF> {
    const { data: pdf, error } = await this.supabase
      .from('user_pdfs')
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error);
    return pdf;
  }

  async findByUserId(userId: string, options?: QueryOptions): Promise<PDF[]> {
    let query = this.supabase
      .from('user_pdfs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw new DatabaseError(error);
    return data;
  }
}
```

#### 4. API 路由 (简化版)

```typescript
// src/app/api/v1/pdfs/route.ts
import { PDFController } from '@/controllers/pdf.controller';
import { PDFService } from '@/services/pdf.service';
import { PDFRepository } from '@/repositories/pdf.repository';

// 依赖注入
const pdfRepo = new PDFRepository();
const pdfService = new PDFService(pdfRepo);
const pdfController = new PDFController(pdfService);

export async function POST(req: NextRequest) {
  return pdfController.upload(req);
}

export async function GET(req: NextRequest) {
  return pdfController.getList(req);
}
```

### 重构优势

1. **关注点分离**: 每层只负责自己的职责
2. **可测试性**: 每层可以独立单元测试
3. **可维护性**: 修改一处不影响其他层
4. **可扩展性**: 易于添加新功能和修改现有功能
5. **依赖注入**: 方便 mock 和测试

---

## 前端工程师学习全栈指南

### 从前端到全栈的学习路径

```
前端工程师
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  第一阶段: 掌握 Node.js 基础                                  │
│  - JavaScript 运行时机制                                      │
│  - 模块系统 (CommonJS/ESM)                                    │
│  - 异步编程 (Promise/async-await)                             │
│  - 文件系统操作                                                │
│  - HTTP 模块                                                  │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  第二阶段: 学习后端框架                                        │
│  - Next.js API Routes (本项目使用)                            │
│  - Express.js (传统后端)                                      │
│  - RESTful API 设计                                           │
│  - 请求/响应处理                                               │
│  - 中间件概念                                                  │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  第三阶段: 数据库技能                                          │
│  - SQL 基础 (SELECT/INSERT/UPDATE/DELETE)                     │
│  - 表设计与关系                                                │
│  - 索引与性能优化                                              │
│  - PostgreSQL (本项目使用)                                     │
│  - ORM 概念 (Prisma/Drizzle)                                  │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  第四阶段: 认证与安全                                          │
│  - 认证方式 (Session/JWT/OAuth)                               │
│  - 密码加密 (bcrypt)                                          │
│  - XSS/CSRF/SQL注入 防护                                       │
│  - HTTPS 与安全头                                              │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  第五阶段: 部署与运维                                          │
│  - Docker 容器化                                               │
│  - CI/CD 流程                                                  │
│  - 日志与监控                                                  │
│  - 性能优化                                                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
全栈工程师
```

### 本项目涉及的全栈知识点

#### 1. Next.js 全栈开发

```typescript
// API Route 基本结构
// src/app/api/example/route.ts

import { NextRequest, NextResponse } from 'next/server';

// GET 请求处理
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');

  // 数据库操作
  const data = await fetchData(id);

  return NextResponse.json({ success: true, data });
}

// POST 请求处理
export async function POST(req: NextRequest) {
  const body = await req.json();

  // 验证输入
  if (!body.name) {
    return NextResponse.json(
      { success: false, error: 'Name is required' },
      { status: 400 }
    );
  }

  // 业务逻辑
  const result = await createItem(body);

  return NextResponse.json({ success: true, data: result });
}
```

#### 2. 数据库操作 (Supabase)

```typescript
// 基本查询
const { data, error } = await supabase
  .from('user_pdfs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// 插入数据
const { data, error } = await supabase
  .from('user_pdfs')
  .insert({
    user_id: userId,
    filename: file.name,
    file_size: file.size,
  })
  .select()
  .single();

// 更新数据
const { error } = await supabase
  .from('user_pdfs')
  .update({ parse_status: 'completed' })
  .eq('id', pdfId);

// 删除数据
const { error } = await supabase
  .from('user_pdfs')
  .delete()
  .eq('id', pdfId);
```

#### 3. 认证实现

```typescript
// 用户注册
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name },
    emailRedirectTo: `${origin}/auth/callback`,
  },
});

// 用户登录
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser();

// 登出
await supabase.auth.signOut();
```

#### 4. 流式响应 (SSE)

```typescript
// 服务端发送事件
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    // 发送开始事件
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
    );

    // 发送数据
    for await (const chunk of aiResponse) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`)
      );
    }

    // 发送结束事件
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: 'end' })}\n\n`)
    );

    controller.close();
  },
});

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

### 推荐学习资源

#### 书籍

1. **《Node.js 设计模式》** - 深入理解 Node.js
2. **《数据密集型应用系统设计》** - 系统架构
3. **《SQL 反模式》** - 数据库设计最佳实践

#### 在线课程

1. **Next.js 官方文档** - https://nextjs.org/docs
2. **Supabase 文档** - https://supabase.com/docs
3. **LangChain 文档** - https://js.langchain.com/docs

#### 实践项目建议

1. **入门级**: Todo List API (CRUD 操作)
2. **进阶级**: 博客系统 (认证、评论、搜索)
3. **高级**: 实时聊天应用 (WebSocket、消息队列)
4. **专家级**: 类似本项目的 AI 应用 (向量检索、流式响应)

### 从本项目学习的要点

1. **项目结构**: 学习如何组织全栈项目代码
2. **API 设计**: RESTful API 的最佳实践
3. **数据库设计**: 用户系统、配额系统的表设计
4. **认证流程**: 完整的注册、登录、验证流程
5. **业务逻辑**: 配额管理、向量检索等复杂逻辑
6. **错误处理**: 统一的错误处理和响应格式
7. **类型安全**: TypeScript 在全栈项目中的应用

---

## Next.js 动态路由详解

### 什么是动态路由

动态路由允许你创建**带有参数的路由**，这些参数在请求时确定。例如：
- `/api/pdfs/123` - 其中 `123` 是动态的 PDF ID
- `/api/users/abc/profile` - 其中 `abc` 是动态的用户 ID

### 动态路由的文件结构

在 Next.js App Router 中，动态路由使用**方括号** `[]` 表示：

```
src/app/api/
├── pdfs/
│   ├── route.ts              # /api/pdfs (静态路由)
│   ├── list/
│   │   └── route.ts          # /api/pdfs/list (静态路由)
│   └── [id]/                 # ⬅️ 动态路由段
│       ├── route.ts          # /api/pdfs/:id
│       └── conversations/
│           └── route.ts      # /api/pdfs/:id/conversations
│
├── admin/
│   └── users/
│       ├── route.ts          # /api/admin/users (静态路由)
│       └── [id]/             # ⬅️ 动态路由段
│           └── route.ts      # /api/admin/users/:id
│
└── pdf/
    └── [id]/                 # ⬅️ 动态路由段
        └── route.ts          # /api/pdf/:id
```

### 路由类型对照表

| 文件路径 | URL 匹配 | 路由类型 |
|---------|---------|---------|
| `api/pdfs/route.ts` | `/api/pdfs` | 静态路由 |
| `api/pdfs/list/route.ts` | `/api/pdfs/list` | 静态路由 |
| `api/pdfs/[id]/route.ts` | `/api/pdfs/123`, `/api/pdfs/abc` | 动态路由 |
| `api/admin/users/[id]/route.ts` | `/api/admin/users/456` | 动态路由 |

---

### 基本用法：获取动态参数

#### 方法一：使用 `params`（推荐）

```typescript
// src/app/api/pdfs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// params 是一个 Promise，需要 await
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ 正确用法：await params
  const { id } = await params;

  console.log('PDF ID:', id);  // 例如: "123e4567-e89b-12d3-a456-426614174000"

  // 使用 id 查询数据库
  const pdf = await getPDFById(id);

  return NextResponse.json({ success: true, data: pdf });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 删除 PDF
  await deletePDFById(id);

  return NextResponse.json({ success: true });
}
```

#### 方法二：从 URL 中解析（旧方法，不推荐）

```typescript
// ⚠️ 不推荐的方法
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;  // "/api/pdfs/123"
  const id = pathname.split('/').pop();  // "123"

  // 这种方法容易出错，不推荐
}
```

---

### 本项目中的实际应用

#### 1. PDF 详情/删除 API

**文件**: `src/app/api/pdfs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPDFWithStats } from '@/lib/pdf/get-pdf-list';
import { deletePDF } from '@/lib/pdf/delete-pdf';
import { getCurrentUser } from '@/lib/auth/middleware';

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * GET /api/pdfs/:id
 * 获取单个 PDF 的详细信息
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 获取动态路由参数
    const { id } = await params;

    // 2. 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. 使用 id 查询 PDF
    const pdf = await getPDFWithStats(id, user.id);

    if (!pdf) {
      return NextResponse.json(
        { success: false, error: 'PDF not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: pdf });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pdfs/:id
 * 删除指定的 PDF
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 获取动态路由参数
    const { id } = await params;

    // 2. 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. 删除 PDF（会验证用户权限）
    const result = await deletePDF(id, user.id);

    return NextResponse.json({
      success: true,
      data: {
        pdfId: id,
        deleted: result.success,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete PDF' },
      { status: 500 }
    );
  }
}
```

#### 2. 获取 PDF 对话历史 API

**文件**: `src/app/api/pdfs/[id]/conversations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory } from '@/lib/chat/get-conversation-history';
import { getCurrentUser } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pdfs/:id/conversations
 * 获取指定 PDF 的对话历史
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 获取 PDF ID（从动态路由）
    const { id: pdfId } = await params;

    // 2. 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. 获取分页参数（从查询字符串）
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 4. 查询对话历史
    const result = await getConversationHistory({
      pdfId,      // 来自动态路由
      userId: user.id,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
```

#### 3. 管理员用户管理 API

**文件**: `src/app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/:id
 * 获取用户详情（管理员权限）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 获取用户 ID（从动态路由）
    const { id: userId } = await params;

    // 2. 验证管理员权限
    const supabase = createClient();
    const { data: admin } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. 查询用户信息
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id
 * 删除用户（管理员权限）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // ... 删除用户逻辑

    return NextResponse.json({
      success: true,
      message: `User ${userId} deleted`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
```

---

### 动态路由 vs 查询参数

很多开发者会混淆这两种方式，它们有不同的使用场景：

#### 动态路由 `/api/pdfs/[id]`

```typescript
// URL: /api/pdfs/123
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // "123"
}
```

**适用场景**:
- 资源的**唯一标识符**（如 ID、UUID）
- RESTful 风格的资源操作
- 必需的参数

#### 查询参数 `/api/pdfs?status=completed`

```typescript
// URL: /api/pdfs?status=completed&limit=10
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');  // "completed"
  const limit = searchParams.get('limit');    // "10"
}
```

**适用场景**:
- **可选的**过滤/筛选条件
- 分页参数（limit, offset）
- 排序参数
- 搜索关键词

#### 组合使用

```typescript
// URL: /api/pdfs/123/conversations?limit=20&offset=0
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 动态路由参数 - 标识资源
  const { id: pdfId } = await params;

  // 查询参数 - 可选的筛选条件
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  console.log(`获取 PDF ${pdfId} 的对话，limit=${limit}, offset=${offset}`);
}
```

---

### 嵌套动态路由

Next.js 支持多层嵌套的动态路由：

```
src/app/api/
└── orgs/
    └── [orgId]/                 # 第一层动态
        └── teams/
            └── [teamId]/        # 第二层动态
                └── members/
                    └── [memberId]/  # 第三层动态
                        └── route.ts
```

```typescript
// src/app/api/orgs/[orgId]/teams/[teamId]/members/[memberId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; teamId: string; memberId: string }> }
) {
  const { orgId, teamId, memberId } = await params;

  // URL: /api/orgs/org-123/teams/team-456/members/member-789
  // orgId = "org-123"
  // teamId = "team-456"
  // memberId = "member-789"

  return NextResponse.json({ orgId, teamId, memberId });
}
```

---

### Catch-all 路由（可选和必需）

#### 可选 Catch-all: `[[...slug]]`

匹配零个或多个路径段：

```
src/app/api/
└── docs/
    └── [[...slug]]/
        └── route.ts
```

| URL | slug 值 |
|-----|---------|
| `/api/docs` | `[]` (空数组) |
| `/api/docs/guide` | `["guide"]` |
| `/api/docs/guide/getting-started` | `["guide", "getting-started"]` |

#### 必需 Catch-all: `[...slug]`

匹配一个或多个路径段（至少需要一个）：

```
src/app/api/
└── files/
    └── [...path]/
        └── route.ts
```

| URL | path 值 |
|-----|---------|
| `/api/files/docs` | `["docs"]` |
| `/api/files/docs/readme.md` | `["docs", "readme.md"]` |
| `/api/files` | ❌ 不匹配 |

---

### 前端调用动态路由 API

#### 使用 fetch

```typescript
// 删除 PDF
async function deletePDF(pdfId: string) {
  const response = await fetch(`/api/pdfs/${pdfId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete PDF');
  }

  return response.json();
}

// 使用
await deletePDF('123e4567-e89b-12d3-a456-426614174000');
```

#### 使用动态值构建 URL

```typescript
// 获取 PDF 详情
async function getPDFDetail(pdfId: string) {
  const response = await fetch(`/api/pdfs/${pdfId}`);
  return response.json();
}

// 获取对话历史（带查询参数）
async function getConversations(pdfId: string, limit = 100, offset = 0) {
  const url = new URL(`/api/pdfs/${pdfId}/conversations`, window.location.origin);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetch(url.toString());
  return response.json();
}
```

---

### 常见错误和解决方案

#### 错误 1: 忘记 await params

```typescript
// ❌ 错误：params 是 Promise
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = params;  // 错误！params 是 Promise
}

// ✅ 正确：await params
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // 正确！
}
```

#### 错误 2: 类型定义错误

```typescript
// ❌ 错误：旧版本类型
{ params: { id: string } }

// ✅ 正确：Next.js 15+ 类型
{ params: Promise<{ id: string }> }
```

#### 错误 3: 动态路由和静态路由冲突

```
❌ 错误的文件结构：
src/app/api/pdfs/
├── route.ts              # /api/pdfs
├── [id]/
│   └── route.ts          # /api/pdfs/:id
└── popular/
    └── route.ts          # ⚠️ 这个永远不会被匹配到！
                           # 因为 [id] 会先匹配 "popular"
```

```
✅ 正确的文件结构：
src/app/api/pdfs/
├── route.ts              # /api/pdfs
├── popular/
│   └── route.ts          # /api/pdfs/popular (静态路由优先)
└── [id]/
    └── route.ts          # /api/pdfs/:id
```

---

### 动态路由最佳实践

1. **使用有意义的参数名**
   ```typescript
   // ✅ 好
   { params: Promise<{ pdfId: string; userId: string }> }

   // ❌ 不好
   { params: Promise<{ id: string; id2: string }> }
   ```

2. **验证动态参数**
   ```typescript
   export async function GET(
     req: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params;

     // 验证 UUID 格式
     if (!isValidUUID(id)) {
       return NextResponse.json(
         { success: false, error: 'Invalid ID format' },
         { status: 400 }
       );
     }

     // ...
   }
   ```

3. **统一错误处理**
   ```typescript
   export async function GET(
     req: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     try {
       const { id } = await params;
       // 业务逻辑
     } catch (error) {
       console.error('API Error:', error);
       return NextResponse.json(
         { success: false, error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

---

## 总结

Agent-PDF 是一个功能完整的 AI PDF 对话平台，涵盖了现代 Web 应用开发的核心技术：

- **前端**: React + Next.js App Router + Ant Design
- **后端**: Next.js API Routes + LangChain
- **数据库**: PostgreSQL (Supabase) + Pinecone
- **认证**: Supabase Auth + RLS
- **存储**: Vercel Blob Storage

通过学习本项目，前端工程师可以掌握：

1. API 路由设计与实现
2. 数据库设计与操作
3. 用户认证与授权
4. 流式响应处理
5. 向量数据库集成
6. 配额管理系统设计

建议按照 MVC 架构进行重构，提高代码的可维护性和可测试性。
