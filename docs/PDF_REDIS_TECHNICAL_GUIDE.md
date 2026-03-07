# PDF 解析与 Redis 持久化技术方案

> 本文档详细记录了在 Vercel 无服务器环境中实现 PDF 解析、向量存储和 Redis 持久化的完整技术方案，重点阐述遇到的核心挑战及解决方案。

## 目录

- [项目背景](#项目背景)
- [技术栈](#技术栈)
- [核心挑战](#核心挑战)
- [架构设计](#架构设计)
- [技术难点与解决方案](#技术难点与解决方案)
- [实现细节](#实现细节)
- [性能优化](#性能优化)
- [监控与调试](#监控与调试)

---

## 项目背景

本项目是一个基于 AI 的 PDF 文档对话系统，用户上传 PDF 后可以向文档提问。系统需要：

1. 解析 PDF 文件并提取文本内容
2. 将文本切分为语义块并生成向量嵌入
3. 存储数据以便在无服务器环境中跨请求共享
4. 支持实时对话和向量检索

**部署环境**：Vercel Serverless Functions
**核心限制**：
- 函数执行时间限制（10秒超时）
- 无状态执行环境
- 内存变量不持久
- `/tmp` 目录不共享

---

## 技术栈

| 组件 | 技术选型 | 说明 |
|------|---------|------|
| **运行时** | Node.js (Vercel Serverless) | 无服务器计算环境 |
| **Redis** | @upstash/redis | HTTP API 方式访问 Redis |
| **PDF 解析** | pdf2json | 快速、轻量级解析库 |
| **OCR** | tesseract.js | 扫描文档文字识别 |
| **向量嵌入** | Alibaba Tongyi (Qwen) | 文本向量化 |
| **向量存储** | LangChain MemoryVectorStore | 内存向量存储 |
| **框架** | Next.js 14 | React 服务端框架 |

---

## 核心挑战

### 挑战 1：Vercel 无服务器环境的数据持久化

**问题描述**：
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Serverless                         │
├─────────────────────────────────────────────────────────────┤
│  Request 1 ──→  Instance A (Memory: {pdf: "data"})          │
│       │                                                       │
│       └───→  Response returned                              │
│                    │                                         │
│                    └───→  Instance A terminated ❌          │
│                                                             │
│  Request 2 ──→  Instance B (Memory: {})  ← 空的！        │
└─────────────────────────────────────────────────────────────┘
```

每个请求可能在不同的实例上执行，内存变量每次重置，`/tmp` 目录不会共享。

**影响**：
- 解析后的 PDF 文本在下次请求时丢失
- 向量存储无法跨请求使用
- 用户需要重新上传文档才能对话

### 挑战 2：异步任务在无服务器环境中无法执行

**问题描述**：
```javascript
// ❌ 这种模式在 Vercel 中无效
app.post('/api/upload', async (req, res) => {
  // 保存文件
  await saveFile(req.file);

  // 触发后台解析
  parsePDFAsync(pdfId);  // ← 响应返回后立即终止！

  res.json({ success: true });
});

async function parsePDFAsync(pdfId) {
  // 这个函数永远不会执行完成
  await extractText();
  await createEmbeddings();
  await saveToRedis();
}
```

**根本原因**：Vercel 函数在响应返回后立即冻结执行，任何未完成的 Promise 都会被丢弃。

### 挑战 3：函数执行时间限制

**限制**：
- Vercel Hobby 计划：10秒
- Vercel Pro 计划：60秒

**影响**：
- 大型 PDF 解析可能超时
- 向量嵌入计算耗时
- 需要优化整个流程

### 挑战 4：@vercel/kv 被弃用

**问题**：
- Vercel KV 已被弃用
- 需要迁移到 @upstash/redis
- API 差异需要适配

### 挑战 5：JSON 序列化问题

**问题**：
```javascript
// @upstash/redis 自动序列化对象
await redis.set('key', { data: 'value' });

// 但获取时可能返回对象而非字符串
const data = await redis.get('key');  // 可能是对象或字符串

// ❌ 错误处理
const parsed = JSON.parse(data);  // 如果 data 是对象会报错

// ✅ 正确处理
const parsed = typeof data === 'string' ? JSON.parse(data) : data;
```

---

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户上传流程                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: /api/upload                                           │
│  ├─ 接收文件                                                    │
│  ├─ 保存到 /tmp (临时)                                          │
│  ├─ 创建 PDF 记录 (parseStatus: PENDING)                        │
│  └─ 返回 pdfId                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 前端调用 /api/parse                                   │
│  ├─ 同步执行解析流程                                            │
│  ├─ 更新 parseStatus                                            │
│  └─ 返回解析结果                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 同步解析流程（在单次请求中完成）                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  3.1 读取 PDF 文件                                      │   │
│  │  ├─ 从 /tmp 读取文件                                    │   │
│  │  └─ pdf2json 解析                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  3.2 文本提取                                           │   │
│  │  ├─ 提取纯文本                                          │   │
│  │  ├─ 失败则 OCR 识别（tesseract.js）                     │   │
│  │  └─ 8秒超时控制                                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  3.3 文本切分                                           │   │
│  │  └─ 按语义切分为 chunks (token 限制)                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  3.4 向量嵌入                                           │   │
│  │  └─ Alibaba Tongyi API 调用                            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  3.5 持久化到 Redis                                      │   │
│  │  ├─ PDF 元数据 (pdf:{id})                               │   │
│  │  ├─ 文本 chunks (vector:{id})                           │   │
│  │  └─ 向量 embeddings (vector:{id}:embeddings)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: 聊天请求 /api/chat                                    │
│  ├─ 从 Redis 恢复 PDF 数据                                     │
│  ├─ 从 Redis 恢复向量 embeddings (避免重新计算)               │
│  ├─ 向量相似度搜索                                            │
│  └─ AI 对话响应                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Redis 数据结构

```
Redis Keyspace:
├── pdf:{pdfId}
│   └── PDF 元数据 (fileName, textContent, pageCount, etc.)
│       TTL: 7天
│
├── vector:{pdfId}
│   └── 文本 chunks 数组
│       TTL: 7天
│
├── vector:{pdfId}:embeddings
│   └── 向量 embeddings 二维数组
│       TTL: 7天
│
└── pdf:list
    └── 所有 PDF ID 的 Set
```

---

## 技术难点与解决方案

### 难点 1：无服务器环境的数据持久化

**解决方案：三层存储架构**

```typescript
// 存储优先级和读取顺序
async function getPDFData(pdfId: string) {
  // 1. 首先检查内存缓存（最快）
  if (memoryCache.has(pdfId)) {
    return memoryCache.get(pdfId);
  }

  // 2. 检查 Redis（跨请求共享）
  const redisData = await redis.get(`pdf:${pdfId}`);
  if (redisData) {
    memoryCache.set(pdfId, redisData);  // 回填内存
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

**关键点**：
- Redis 作为主要持久化存储
- 内存缓存提高响应速度
- 文件系统作为开发环境回退

### 难点 2：异步任务执行问题

**解决方案：同步执行 + 状态轮询**

```typescript
// ❌ 错误：后台异步（Vercel 中无效）
app.post('/parse', async (req, res) => {
  parsePDFAsync(req.body.pdfId);  // 不会执行完成
  res.json({ status: 'parsing' });
});

// ✅ 正确：同步执行
app.post('/parse', async (req, res) => {
  const result = await parsePDFSync(req.body.pdfId);
  res.json({
    status: 'completed',
    data: result
  });
});
```

**前端轮询机制**：
```typescript
// 前端实现
async function parseWithPolling(pdfId: string) {
  // 1. 触发解析
  await fetch('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ pdfId })
  });

  // 2. 轮询状态（虽然现在是同步的，但保留接口兼容）
  let attempts = 0;
  while (attempts < 30) {
    await sleep(1000);
    const result = await fetch(`/api/parse?pdfId=${pdfId}`);
    const data = await result.json();

    if (data.parseStatus === 'completed') {
      return data;
    }
    attempts++;
  }
}
```

### 难点 3：函数执行时间优化

**优化策略**：

1. **多级超时控制**
```typescript
async function parseWithTimeout(pdfId: string) {
  const PDF_TIMEOUT = 7000;  // 7秒（留3秒给其他处理）

  return Promise.race([
    parsePDF(pdfId),
    timeout(PDF_TIMEOUT, 'PDF 解析超时')
  ]);
}
```

2. **快速失败机制**
```typescript
// pdf2json 超时控制
const parseWithTimeout = Promise.race([
  pdf2json(buffer),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('PDF_SCANNED')), 7000)
  )
]);
```

3. **并发限制**
```typescript
// 限制同时处理的 PDF 数量
const semaphore = new Semaphore(3);  // 最多3个并发

await semaphore.acquire();
try {
  await parsePDF(pdfId);
} finally {
  semaphore.release();
}
```

### 难点 4：@vercel/kv 到 @upstash/redis 迁移

**API 对比**：

| 功能 | @vercel/kv | @upstash/redis |
|------|-----------|----------------|
| 初始化 | `import { kv } from '@vercel/kv'` | `new Redis({ url, token })` |
| 设置 | `await kv.set(key, value)` | `await redis.set(key, value)` |
| 获取 | `await kv.get(key)` | `await redis.get(key)` |
| JSON 处理 | 需要手动 JSON.stringify | 自动序列化/反序列化 |

**迁移代码**：
```typescript
// 旧代码
import { kv } from '@vercel/kv';
await kv.set('pdf:123', JSON.stringify(pdfData));
const data = JSON.parse(await kv.get('pdf:123'));

// 新代码
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
await redis.set('pdf:123', pdfData);  // 自动序列化
const data = await redis.get('pdf:123');  // 自动反序列化

// 兼容性处理（防御性编程）
const parsed = typeof data === 'string' ? JSON.parse(data) : data;
```

### 难点 5：向量 embeddings 存储

**问题**：向量 embeddings 计算成本高，不应每次都重新计算。

**解决方案**：存储和复用 embeddings

```typescript
// 创建时存储
export async function createVectorStore(pdfId: string, chunks: Chunk[]) {
  // 1. 创建向量存储
  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

  // 2. 计算 embeddings 并存储到 Redis
  const embeddingVectors = await embeddings.embedDocuments(
    chunks.map(c => c.content)
  );
  await redis.set(`vector:${pdfId}:embeddings`, embeddingVectors);

  return vectorStore;
}

// 恢复时复用
export async function restoreVectorStore(pdfId: string) {
  // 1. 从 Redis 获取数据
  const chunks = await redis.get(`vector:${pdfId}`);
  const embeddings = await redis.get(`vector:${pdfId}:embeddings`);

  // 2. 如果有 embeddings，直接使用（避免重新计算）
  if (embeddings && embeddings.length === chunks.length) {
    const vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addVectors(embeddings, chunks);
    return vectorStore;
  }

  // 3. 否则重新计算
  return await MemoryVectorStore.fromDocuments(chunks, embeddings);
}
```

---

## 实现细节

### PDF 解析流程

```typescript
async function parsePDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // 1. 使用 pdf2json 解析
  const { text, pages } = await new Promise((resolve, reject) => {
    pdf2json(buffer, (error, pdf) => {
      if (error) reject(error);
      else resolve({
        text: extractTextFromPDF(pdf),
        pages: pdf.formImage?.Pages || 0
      });
    });
  });

  // 2. 验证文本质量
  if (!isValidPDFText(text)) {
    // 文本提取失败，尝试 OCR
    return await ocrPDF(buffer);
  }

  return { text, pages };
}
```

### Redis 存储实现

```typescript
// redis-cache.ts 核心实现
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function setPDF(pdfId: string, pdf: PDFFile): Promise<void> {
  const data = {
    id: pdf.id,
    fileName: pdf.fileName,
    textContent: pdf.textContent,
    pageCount: pdf.pageCount,
    parseStatus: pdf.parseStatus,
    uploadedAt: pdf.uploadedAt.toISOString(),
  };

  // 存储到 Redis，7天过期
  await redis.set(`pdf:${pdfId}`, data, { ex: 60 * 60 * 24 * 7 });
  await redis.sadd('pdf:list', pdfId);
}

export async function getPDF(pdfId: string): Promise<PDFFile | null> {
  const data = await redis.get(`pdf:${pdfId}`);
  if (!data) return null;

  // 兼容性处理
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  return {
    ...parsed,
    uploadedAt: new Date(parsed.uploadedAt),
  };
}
```

### 向量存储实现

```typescript
export async function createVectorStoreFromChunks(
  pdfId: string,
  chunks: Array<{ content: string; metadata: Record<string, unknown> }>
): Promise<MemoryVectorStore> {
  // 1. 存储 chunks 到 Redis
  await redis.set(`vector:${pdfId}`, chunks, { ex: 60 * 60 * 24 * 7 });

  // 2. 创建文档
  const documents = chunks.map(chunk =>
    new Document({ pageContent: chunk.content, metadata: chunk.metadata })
  );

  // 3. 创建向量存储
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

  // 4. 计算并存储 embeddings
  const embeddingVectors = await embeddings.embedDocuments(
    chunks.map(c => c.content)
  );
  await redis.set(`vector:${pdfId}:embeddings`, embeddingVectors, { ex: 60 * 60 * 24 * 7 });

  return vectorStore;
}
```

---

## 性能优化

### 1. 嵌入向量缓存

**优化前**：每次恢复向量存储都重新计算 embeddings
```
恢复时间: ~5-10秒（每个 PDF）
API 调用: chunks.length 次
```

**优化后**：从 Redis 读取预计算的 embeddings
```
恢复时间: ~100-200ms
API 调用: 0 次
```

### 2. 连接池复用

```typescript
// Redis 客户端单例
const redis = new Redis({ url, token });  // 全局复用

// 而非每次创建
function getData() {
  const client = new Redis({ url, token });  // ❌ 每次创建新连接
  return client.get('key');
}
```

### 3. 批量操作

```typescript
// ❌ 逐个设置
for (const chunk of chunks) {
  await redis.set(`chunk:${i}`, chunk);
}

// ✅ 批量操作（如果支持）
await Promise.all(chunks.map((chunk, i) =>
  redis.set(`chunk:${i}`, chunk)
));
```

---

## 监控与调试

### 日志系统

```typescript
// 结构化日志
console.log(`[Redis] ✓ Stored PDF ${pdfId}`, {
  size: data.text.length,
  chunks: data.chunks.length,
  duration: Date.now() - startTime,
});

// 错误日志
console.error(`[Redis] ✗ Failed to store PDF ${pdfId}`, {
  error: error.message,
  stack: error.stack,
  pdfId,
});
```

### 调试端点

**`/api/redis-check`** - 检查 Redis 配置
```json
{
  "configured": true,
  "config": {
    "hasUrl": true,
    "hasToken": true,
    "urlPreview": "https://xxx.upstash.io"
  }
}
```

**`/api/redis-debug`** - 查看 Redis 数据
```json
{
  "success": true,
  "connected": true,
  "pdfCount": 5,
  "pdfs": [
    {
      "id": "pdf-123",
      "fileName": "document.pdf",
      "textLength": 15000,
      "chunkCount": 15
    }
  ]
}
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **同步执行关键任务**：在 Vercel 中，确保解析等关键任务在请求中同步完成
2. **Redis 作为主要存储**：跨请求持久化的唯一可靠方式
3. **多级缓存策略**：内存 → Redis → 文件系统
4. **防御性编程**：处理各种数据格式和错误情况
5. **详细日志**：便于调试和问题排查

### ❌ 避免的做法

1. **依赖后台任务**：Vercel 中不会执行
2. **仅存储在内存**：下次请求会丢失
3. **忽略超时控制**：可能导致函数超时
4. **假设数据格式**：@upstash/redis 可能返回对象或字符串

---

## 附录

### 环境变量配置

```env
# Upstash Redis (Vercel 集成自动提供)
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=AxXxX...

# 手动配置（备选）
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxXxX...

# AI 服务
ALIBABA_API_KEY=sk-xxx
QWEN_MODEL=qwen-turbo
```

### 相关文件

| 文件 | 说明 |
|------|------|
| `src/lib/storage/redis-cache.ts` | Redis 存储实现 |
| `src/lib/storage/pdf-files.ts` | PDF 文件存储 |
| `src/lib/langchain/vector-store.ts` | 向量存储管理 |
| `src/app/api/parse/route.ts` | PDF 解析 API |
| `src/app/api/chat/route.ts` | 聊天 API |

---

*文档版本: 1.0.0*
*最后更新: 2025-03-07*
*作者: AI 开发团队*
