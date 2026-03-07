# PDF AI 聊天应用 - 技术架构讲解

> 本文档与 `architecture-tutorial.html` 页面内容同步，详细说明项目的前后端技术架构。

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [数据流程](#数据流程)
- [Redis 数据结构](#redis-数据结构)
- [Vercel 无服务器架构](#vercel-无服务器架构)
- [核心代码实现](#核心代码实现)
- [挑战与解决方案](#挑战与解决方案)
- [开发时间线](#开发时间线)

---

## 项目概述

**PDF AI 聊天应用** 是一个基于 Next.js 和 LangChain 构建的智能文档对话系统，用户可以上传 PDF 文件并通过自然语言与文档进行交互。

### 核心特性

- 📤 PDF 文件上传和解析
- 🔍 文本提取和 OCR 识别
- 🧠 AI 智能问答
- 💬 多轮对话支持
- ⚡ Vercel 无服务器部署

### 关键指标

| 指标 | 数值 |
|------|------|
| Vercel 超时限制 | 10 秒 |
| Redis 数据保留 | 7 天 |
| TypeScript 严格模式 | 100% |
| 扩展性 | 无服务器自动伸缩 |

---

## 技术栈

### 前端技术

```
⚛️ Next.js 14
├── App Router (服务端组件)
├── API Routes (服务端 API)
└── Server Actions (服务端操作)

🎨 UI 框架
├── Ant Design (企业级组件)
├── Radix UI (无样式基础组件)
└── Lucide Icons (图标库)

🎭 状态管理
└── React Context API
```

### 后端技术

```
📡 API 层
└── Next.js API Routes (/app/api/*)

📄 PDF 处理
├── pdf2json (快速解析)
├── pdf-parse (文本提取)
├── tesseract.js (OCR 识别)
└── pdf-lib (PDF 操作)

🤖 AI 集成
├── LangChain (AI 框架)
├── Alibaba Tongyi (通义千问)
├── MemoryVectorStore (向量存储)
└── Text Splitter (文本分块)

💾 存储
├── Upstash Redis (主存储)
├── /tmp 目录 (临时文件)
└── 内存缓存 (快速访问)
```

### 部署与基础设施

```
⚡ 部署平台
└── Vercel Serverless Functions

🔴 数据库
└── Upstash Redis (HTTP API 访问)

🔒 开发规范
├── TypeScript 严格模式
├── ESLint 代码检查
└── Prettier 代码格式化
```

---

## 系统架构

### 整体架构图

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  用户浏览器  │ ───→ │ Vercel Edge │ ───→ │ API Routes  │
│             │      │   CDN 网络   │      │ Serverless   │
│  React UI   │      │   边缘计算   │      │    函数      │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  Upstash Redis  │
                                         │   跨实例存储    │
                                         └─────────────────┘
```

### 组件说明

| 组件 | 技术 | 职责 |
|------|------|------|
| **用户浏览器** | React | 用户界面和交互 |
| **Vercel Edge** | CDN | 内容分发和边缘计算 |
| **API Routes** | Next.js | 服务端 API 处理 |
| **Upstash Redis** | Redis | 跨实例数据共享 |

---

## 数据流程

### 完整数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF AI 聊天应用数据流程                        │
└─────────────────────────────────────────────────────────────────┘

用户上传 PDF
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 文件上传                                          │
│  ├─ 接收文件 (FormData)                                     │
│  ├─ 验证格式和大小                                         │
│  ├─ 保存到 /tmp/{pdfId}.pdf                                 │
│  ├─ 创建 PDF 记录 (parseStatus: PENDING)                  │
│  └─ 返回 pdfId                                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: PDF 解析                                          │
│  ├─ pdf2json 提取文本                                       │
│  ├─ 失败则 OCR 识别 (tesseract.js)                         │
│  ├─ 7秒超时控制                                            │
│  └─ 提取文本和页数                                         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 文本分块 & 向量化                                  │
│  ├─ 按语义切分文本 (500-1000 字符/chunk)                   │
│  ├─ 调用 Alibaba Tongyi API 生成 embeddings                 │
│  ├─ 创建 MemoryVectorStore                                  │
│  └─ 存储 chunks 和 embeddings                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 存储到 Redis                                      │
│  ├─ pdf:{id} → PDF 元数据                                  │
│  ├─ vector:{id} → 文本 chunks                             │
│  ├─ vector:{id}:embeddings → 向量数据                      │
│  └─ 全部设置 7天过期时间                                   │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 用户提问                                          │
│  ├─ 从 Redis 恢复 PDF 数据                                │
│  ├─ 从 Redis 恢复 embeddings (避免重算)                    │
│  ├─ 向量相似度搜索                                        │
│  ├─ 构建对话上下文                                        │
│  └─ 调用 AI 生成回答                                       │
└─────────────────────────────────────────────────────────────┘
```

### 关键流程说明

#### 1. 文件上传流程

```typescript
// API: /api/upload
POST /api/upload
Content-Type: multipart/form-data

├─ 验证文件类型 (application/pdf)
├─ 限制文件大小 (10MB)
├─ 生成唯一 ID (UUID)
├─ 保存到 /tmp/pdf-chat/{pdfId}.pdf
├─ 创建 PDF 记录 (parseStatus: PENDING)
└─ 返回: { pdfId, uploadTaskId, base64Data }
```

#### 2. PDF 解析流程

```typescript
// API: /api/parse
POST /api/parse
Content-Type: application/json

Request: { pdfId }

├─ 从 /tmp 读取 PDF 文件
├─ pdf2json 解析 (7秒超时)
│  ├─ 成功 → 提取文本
│  └─ 失败 → OCR 识别 (tesseract.js)
├─ 文本质量验证
├─ 语义分块 (Text Splitter)
├─ 生成向量嵌入
├─ 存储到 Redis
└─ 返回: { parseStatus: 'completed', textContent, pageCount }
```

#### 3. AI 对话流程

```typescript
// API: /api/chat
POST /api/chat
Content-Type: application/json

Request: { pdfId, question, conversationId, history }

├─ 从 Redis 恢复向量存储
│  ├─ 获取 vector:{id} (chunks)
│  ├─ 获取 vector:{id}:embeddings
│  └─ 直接使用存储的 embeddings (避免重新计算)
├─ 向量相似度搜索
├─ 构建对话上下文
├─ 调用 Alibaba Tongyi API
└─ SSE 流式返回回答
```

---

## Redis 数据结构

### 数据键设计

```
Redis Keyspace:
│
├── pdf:{pdfId}
│   └── PDF 元数据对象
│       ├── id: string
│       ├── fileName: string
│       ├── textContent: string
│       ├── pageCount: number
│       ├── parseStatus: 'pending' | 'parsing' | 'completed' | 'failed'
│       └── uploadedAt: string (ISO 8601)
│       TTL: 7天 (604800 秒)
│
├── vector:{pdfId}
│   └── 文本 chunks 数组
│       ├── content: string
│       └── metadata: { pdfId, source, pageCount }
│       TTL: 7天
│
├── vector:{pdfId}:embeddings
│   └── 向量 embeddings 二维数组 (number[][])
│       └── [[0.123, 0.456, ...], [...], ...]
│       TTL: 7天
│
└── pdf:list
    └── 所有 PDF ID 的 Set (SMEMBERS)
        └── ['pdfId1', 'pdfId2', ...]
```

### 数据示例

```json
// pdf:abc-123
{
  "id": "abc-123",
  "fileName": "技术文档.pdf",
  "textContent": "这是 PDF 的文本内容...",
  "pageCount": 15,
  "parseStatus": "completed",
  "uploadedAt": "2025-03-07T10:30:00Z"
}

// vector:abc-123
[
  {
    "content": "第一段文本内容...",
    "metadata": {
      "pdfId": "abc-123",
      "source": "pdf",
      "pageCount": 15
    }
  },
  ...
]

// vector:abc-123:embeddings
[
  [0.123, 0.456, 0.789, ...],  // chunk 1 的向量
  [0.234, 0.567, 0.890, ...],  // chunk 2 的向量
  ...
]
```

---

## Vercel 无服务器架构

### 无服务器执行模型

```
传统架构 vs 无服务器架构

传统架构:
┌─────────────┐
│   用户请求  │ ──→ ┌──────────────┐
└─────────────┘      │  单一服务器  │
                      │  (持久状态)  │
                      └──────────────┘
                      │
                      ├─ 内存状态保持
                      ├─ 本地文件持久
                      └─ 需要手动扩容

无服务器架构:
┌─────────────┐
│   用户请求  │ ──→ ┌──────────────┐
└─────────────┘      │  负载均衡器  │
                      └──────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │实例 A ⚡ │    │实例 B ⚡ │    │实例 C ⚡ │
    │无状态   │    │无状态   │    │无状态   │
    └─────────┘    └─────────┘    └─────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
                  ┌──────────────┐
                  │ Upstash Redis │
                  │  (外部存储)   │
                  └──────────────┘
```

### 关键差异

| 特性 | 传统架构 | 无服务器架构 |
|------|---------|-------------|
| **状态管理** | 服务器内存持久化 | 每次请求无状态 |
| **数据共享** | 内存直接访问 | 需要 Redis 等外部存储 |
| **扩展性** | 手动添加服务器 | 自动伸缩 |
| **成本** | 固定成本 | 按使用量付费 |
| **维护** | 需要运维 | 无需运维 |

### 本项目的无服务器适配

```typescript
// ❌ 错误：依赖内存状态
const pdfCache = new Map();  // 每次请求都会清空

// ✅ 正确：使用 Redis 持久化
const redis = new Redis({ url, token });
await redis.set(`pdf:${id}`, data);  // 跨请求共享

// ❌ 错误：后台任务
app.post('/parse', (req, res) => {
  parsePDFAsync();  // 响应返回后终止
  res.json({ status: 'parsing' });
});

// ✅ 正确：同步执行
app.post('/parse', async (req, res) => {
  await parsePDF();  // 在请求中完成
  res.json({ status: 'completed', data });
});
```

---

## 核心代码实现

### Redis 存储实现

```typescript
// src/lib/storage/redis-cache.ts
import { Redis } from "@upstash/redis";

// 初始化 Redis 客户端
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = new Redis({
  url: REDIS_URL,
  token: REDIS_TOKEN,
});

// 存储 PDF 数据
export async function setPDF(pdfId: string, pdf: PDFFile): Promise<void> {
  const data = {
    id: pdf.id,
    fileName: pdf.fileName,
    textContent: pdf.textContent,
    pageCount: pdf.pageCount,
    parseStatus: pdf.parseStatus,
    uploadedAt: pdf.uploadedAt.toISOString(),
  };

  // @upstash/redis 自动序列化，无需 JSON.stringify
  await redis.set(`pdf:${pdfId}`, data, { ex: 60 * 60 * 24 * 7 }); // 7天
  await redis.sadd('pdf:list', pdfId);
}

// 获取 PDF 数据（兼容性处理）
export async function getPDF(pdfId: string): Promise<PDFFile | null> {
  const data = await redis.get(`pdf:${pdfId}`);
  if (!data) return null;

  // @upstash/redis 自动反序列化，但需要兼容处理
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  return {
    ...parsed,
    uploadedAt: new Date(parsed.uploadedAt),
  };
}
```

### 向量存储实现

```typescript
// src/lib/langchain/vector-store.ts
export async function createVectorStoreFromChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<MemoryVectorStore> {
  // 1. 存储 chunks 到 Redis
  await redis.set(`vector:${pdfId}`, chunks, { ex: 60 * 60 * 24 * 7 });

  // 2. 创建向量存储
  const documents = chunks.map(chunk =>
    new Document({
      pageContent: chunk.content,
      metadata: chunk.metadata,
    })
  );
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

  // 3. 计算并存储 embeddings（避免下次重新计算）
  const embeddingVectors = await embeddings.embedDocuments(
    chunks.map(c => c.content)
  );
  await redis.set(`vector:${pdfId}:embeddings`, embeddingVectors, { ex: 60 * 60 * 24 * 7 });

  return vectorStore;
}

// 恢复向量存储时复用 embeddings
export async function restoreVectorStore(pdfId: string) {
  const chunks = await redis.get(`vector:${pdfId}`);
  const embeddings = await redis.get(`vector:${pdfId}:embeddings`);

  // 如果有存储的 embeddings，直接使用（避免重新计算 AI API 调用）
  if (embeddings && embeddings.length === chunks.length) {
    const vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addVectors(embeddings, chunks);
    return vectorStore;
  }

  // 否则重新计算
  return await createVectorStoreFromChunks(pdfId, chunks);
}
```

### PDF 解析实现

```typescript
// src/lib/pdf/parser.ts
export async function parsePDF(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  const PDF_TIMEOUT = 7000; // 7秒超时

  // 使用 Promise.race 实现超时控制
  const parseWithTimeout = Promise.race([
    pdf2json(buffer),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF_SCANNED')), PDF_TIMEOUT)
    )
  ]);

  try {
    const pdfData = await parseWithTimeout;
    const text = extractTextFromPDF(pdfData);
    const pages = pdfData.formImage?.Pages || 0;

    // 验证文本质量
    if (!isValidPDFText(text)) {
      throw new Error('PDF_SCANNED');
    }

    return { text, pages };
  } catch (error) {
    if (error.message === 'PDF_SCANNED') {
      // 尝试 OCR 识别
      return await ocrPDF(buffer);
    }
    throw error;
  }
}
```

---

## 挑战与解决方案

### 挑战 1: 无服务器环境数据持久化

**问题**: 每个请求可能在不同的实例上执行，内存变量不持久

```
请求 1 → 实例 A (内存: {pdf: "data"})
         → 响应返回
         → 实例 A 终止 ❌

请求 2 → 实例 B (内存: {}) ← 空的！
```

**解决方案**: 三层存储架构

```typescript
async function getPDFData(pdfId: string) {
  // 1. 内存缓存（最快）
  if (memoryCache.has(pdfId)) {
    return memoryCache.get(pdfId);
  }

  // 2. Redis（跨请求共享）
  const redisData = await redis.get(`pdf:${pdfId}`);
  if (redisData) {
    memoryCache.set(pdfId, redisData);
    return redisData;
  }

  // 3. 文件系统回退（本地开发）
  const fsData = await fs.readFile(`/tmp/${pdfId}.json`);
  if (fsData) {
    memoryCache.set(pdfId, fsData);
    return fsData;
  }

  return null;
}
```

### 挑战 2: 后台任务无法执行

**问题**: Vercel 无服务器环境中，异步任务会被终止

```typescript
// ❌ 这种模式无效
app.post('/parse', (req, res) => {
  parsePDFAsync();  // 响应返回后终止
  res.json({ status: 'parsing' });
});
```

**解决方案**: 同步执行

```typescript
// ✅ 同步执行
app.post('/parse', async (req, res) => {
  const result = await parsePDF(req.body.pdfId);
  res.json({
    status: 'completed',
    data: result
  });
});
```

### 挑战 3: 函数执行时间限制

**问题**: Vercel Hobby 计划 10 秒超时

**解决方案**: 多级超时控制

```typescript
const PDF_TIMEOUT = 7000;  // 7秒（留3秒给其他处理）
const OCR_TIMEOUT = 5000;   // 5秒

const parseWithTimeout = Promise.race([
  pdf2json(buffer),
  timeout(PDF_TIMEOUT, 'PDF 解析超时')
]);
```

### 挑战 4: 向量重新计算成本高

**问题**: AI embeddings API 调用耗时且消耗配额

**解决方案**: 缓存 embeddings

```typescript
// 存储时
const embeddings = await ai.embedDocuments(texts);
await redis.set(`vector:${id}:embeddings`, embeddings);

// 恢复时
const cached = await redis.get(`vector:${id}:embeddings`);
if (cached) {
  // 直接使用，避免重新计算
  return cached;
}
```

### 挑战 5: @vercel/kv 被弃用

**问题**: 需要迁移到 @upstash/redis

**解决方案**: 统一接口

```typescript
// 兼容多种环境变量
const redis = new Redis({
  url: process.env.KV_REST_API_URL     // Vercel 集成
      || process.env.UPSTASH_REDIS_REST_URL,  // 手动配置
  token: process.env.KV_REST_API_TOKEN
      || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 兼容 JSON 序列化差异
const data = await redis.get(key);
const parsed = typeof data === 'string' ? JSON.parse(data) : data;
```

---

## 开发时间线

### 第 1 天: 项目初始化

```
✓ 使用 Spec Kit 创建项目原则
✓ 初始化 Next.js 项目
✓ 配置 TypeScript 严格模式
✓ 安装核心依赖
```

### 第 2 天: 核心功能开发

```
✓ 实现 PDF 上传 API
✓ 实现 pdf2json 解析
✓ 实现 OCR 识别
✓ 创建前端上传组件
```

### 第 3 天: AI 对话集成

```
✓ 集成 LangChain
✓ 配置 Alibaba Tongyi
✓ 实现向量存储
✓ 创建聊天界面
```

### 第 4 天: Redis 持久化

```
✓ 配置 Upstash Redis
✓ 实现 PDF 数据存储
✓ 实现向量数据存储
✓ 解决无服务器适配问题
```

### 第 5 天: 优化与部署

```
✓ 性能优化（embeddings 缓存）
✓ 错误处理完善
✓ Vercel 部署配置
✓ 文档编写
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/lib/storage/redis-cache.ts` | Redis 存储实现 |
| `src/lib/storage/pdf-files.ts` | PDF 文件存储 |
| `src/lib/langchain/vector-store.ts` | 向量存储管理 |
| `src/app/api/upload/route.ts` | 上传 API |
| `src/app/api/parse/route.ts` | 解析 API |
| `src/app/api/chat/route.ts` | 聊天 API |

---

*文档版本: 1.0.0*
*最后更新: 2025-03-07*
*配套页面: architecture-tutorial.html*
