# PDF AI Agent

> 本文档详细说明项目的技术架构、实现方式和核心概念

## 目录

- [项目概述](#项目概述)
- [specCoding](#coding-方式)
- [什么是 RAG 和数据向量](#什么是-rag-和数据向量)
- [什么是 AI Agent 应用](#什么是-ai-agent-应用)
- [TODO List](#todo-list)

---

## 项目概述

**PDF AI 聊天应用** 是一个基于 Next.js 14 和 LangChain 构建的智能文档对话系统。用户可以上传 PDF 文件，支持ocr 系统自动提取文本内容并生成向量索引，然后通过自然语言与文档进行智能对话。

### 核心特性

- 📤 **PDF 上传与解析**：支持 PDF 文件上传，自动提取文本内容
- 🔍 **智能文本提取**：pdf2json 快速解析 + OCR 识别扫描件
- 🧠 **AI 智能问答**：基于 RAG（检索增强生成）的精准问答
- 💬 **多轮对话支持**：保持上下文的连续对话
- ⚡ **Serverless 部署**：Vercel 无服务器架构，自动伸缩
- 💾 **数据持久化**：Upstash Redis 跨实例数据共享

### 应用场景

- 📚 **学术研究**：快速检索论文内容，提取关键信息
- 📄 **合同审查**：分析合同条款，识别风险点
- 📊 **报告分析**：提取财报数据，生成摘要
- 📖 **文档问答**：技术文档快速查询，提升效率

### 关键指标

| 指标 | 数值 | 说明 |
|------|------|------|
| Vercel 超时限制 | 10 秒 | Hobby 计划单次请求最大执行时间 |
| PDF 解析超时 | 7 秒 | 留 3 秒给其他处理 |
| Redis 数据保留 | 7 天 | 自动过期清理 |
| 最大文件大小 | 1 MB | 可配置 |
| TypeScript 严格模式 | 100% | 类型安全 |
| 扩展性 | 自动伸缩 | 无服务器架构 |

---

## 技术栈

### 前端技术栈

```
⚛️ Next.js 14
├── App Router          # 服务端组件，提升性能
├── API Routes          # 服务端 API 处理
├── Server Actions      # 服务端操作
└── React 18            # 最新 React 特性

🎨 UI 框架
├── Tailwind CSS        # 原子化 CSS 框架
├── shadcn/ui           # 高质量 React 组件
├── Ant Design          # 企业级组件库
├── Radix UI            # 无样式基础组件
└── Lucide Icons        # 现代图标库

🎭 状态管理
├── React Context API   # 全局状态管理
├── PDFContext          # PDF 文件状态
└── ChatContext         # 对话状态

� 构建工具
├── TypeScript 5.x      # 类型安全
├── ESLint              # 代码检查
├── Prettier            # 代码格式化
└── Turbopack           # 快速构建（开发模式）
```

### 后端技术栈

```
📡 API 层
├── Next.js API Routes  # RESTful API
├── /api/upload         # 文件上传
├── /api/parse          # PDF 解析
├── /api/chat           # AI 对话
└── /api/pdf/[id]       # PDF 预览

📄 PDF 处理
├── pdf2json            # 快速解析（主要方式）
├── pdf-parse           # 文本提取（备用）
├── tesseract.js        # OCR 识别（扫描件）
└── pdf-lib             # PDF 操作

🤖 AI 集成
├── LangChain.js        # AI 应用框架
├── Alibaba Tongyi      # 通义千问大模型
├── MemoryVectorStore   # 内存向量存储
├── RecursiveCharacterTextSplitter  # 文本分块
└── DashScope Embeddings # 向量嵌入模型

💾 存储方案
├── Upstash Redis       # 主存储（跨实例共享）
│   ├── PDF 元数据
│   ├── 文本内容
│   ├── 向量 chunks
│   └── 向量 embeddings
├── /tmp 目录           # 临时文件（PDF 二进制）
└── 内存缓存            # 快速访问（单次请求）
```

### 部署与基础设施

```
⚡ 部署平台
├── Vercel              # Serverless 部署
├── Edge Network        # 全球 CDN
└── Automatic Scaling   # 自动伸缩

🔴 数据库
├── Upstash Redis       # HTTP API 访问
├── @upstash/redis      # 官方 SDK
└── 7 天数据保留        # 自动过期

🔒 开发规范
├── TypeScript 严格模式 # 类型安全
├── ESLint 规则         # 代码质量
├── Prettier 格式化     # 统一风格
└── Git Hooks           # 提交检查
```

### 技术选型理由

| 技术 | 选择理由 |
|------|---------|
| **Next.js 14** | App Router 提供更好的性能，内置 API Routes 简化后端开发 |
| **Alibaba Tongyi** | 中文支持优秀，免费额度充足，响应速度快 |
| **Upstash Redis** | Serverless 友好，HTTP API 访问，免费版足够使用 |
| **pdf2json** | 解析速度快（<1秒），适合 Serverless 环境 |
| **LangChain** | 成熟的 AI 应用框架，丰富的工具链 |
| **Vercel** | 零配置部署，自动 HTTPS，全球 CDN |

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF AI 聊天应用系统架构                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  用户浏览器  │ ───→ │ Vercel Edge │ ───→ │ API Routes  │
│             │      │   CDN 网络   │      │ Serverless   │
│  React UI   │ ←─── │   边缘计算   │ ←─── │    函数      │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                     ┌────────────────────────────┼────────────────┐
                     │                            │                │
                     ▼                            ▼                ▼
            ┌─────────────────┐        ┌──────────────┐  ┌─────────────┐
            │  Upstash Redis  │        │ Alibaba AI   │  │  /tmp 目录  │
            │   跨实例存储    │        │  通义千问    │  │  临时文件   │
            │                 │        │              │  │             │
            │ • PDF 元数据    │        │ • 对话生成   │  │ • PDF 二进制│
            │ • 文本内容      │        │ • 向量嵌入   │  │ • 临时缓存  │
            │ • 向量 chunks   │        │ • 语义理解   │  │             │
            │ • embeddings    │        │              │  │             │
            └─────────────────┘        └──────────────┘  └─────────────┘
```

### 架构层次说明

#### 1. 表现层（Presentation Layer）

```typescript
// 用户界面组件
src/components/
├── layout/
│   └── AppLayout.tsx          # 主布局（侧边栏 + 内容区）
├── pdf/
│   ├── PDFUploaderPro.tsx     # 文件上传组件
│   ├── PDFList.tsx            # 文件列表
│   └── PDFPreview.tsx         # PDF 预览
└── chat/
    ├── ChatInterface.tsx      # 对话界面
    ├── ChatMessage.tsx        # 消息组件
    └── MarkdownRenderer.tsx   # Markdown 渲染
```

**职责**：
- 用户交互界面
- 状态管理（Context API）
- 事件处理
- 数据展示

#### 2. API 层（API Layer）

```typescript
// 服务端 API 路由
src/app/api/
├── upload/route.ts            # POST /api/upload - 文件上传
├── parse/route.ts             # POST /api/parse - PDF 解析
├── chat/route.ts              # POST /api/chat - AI 对话
├── pdf/[id]/route.ts          # GET /api/pdf/:id - PDF 预览
├── files/route.ts             # GET /api/files - 文件列表
├── redis-test/route.ts        # GET /api/redis-test - Redis 测试
└── redis-debug/route.ts       # GET /api/redis-debug - Redis 调试
```

**职责**：
- 请求验证
- 业务逻辑调度
- 错误处理
- 响应格式化

#### 3. 业务逻辑层（Business Logic Layer）

```typescript
// 核心业务逻辑
src/lib/
├── pdf/
│   ├── parser.ts              # PDF 解析逻辑
│   └── text-splitter.ts       # 文本分块
├── langchain/
│   ├── config.ts              # LangChain 配置
│   ├── vector-store.ts        # 向量存储管理
│   └── chat.ts                # 对话逻辑
└── storage/
    ├── redis-cache.ts         # Redis 存储
    ├── pdf-files.ts           # PDF 文件管理
    └── temp-files.ts          # 临时文件管理
```

**职责**：
- PDF 解析和文本提取
- 向量化和相似度搜索
- AI 对话生成
- 数据持久化

#### 4. 数据层（Data Layer）

```typescript
// 数据存储
┌─────────────────────────────────────────────────────────┐
│  三层存储架构                                            │
├─────────────────────────────────────────────────────────┤
│  1. 内存缓存（Memory Cache）                             │
│     • 单次请求内快速访问                                 │
│     • Map<pdfId, PDFFile>                               │
│     • 请求结束后清空                                     │
├─────────────────────────────────────────────────────────┤
│  2. Redis 存储（Primary Storage）                       │
│     • 跨请求/跨实例共享                                  │
│     • PDF 元数据、文本、向量                             │
│     • 7 天自动过期                                       │
├─────────────────────────────────────────────────────────┤
│  3. 文件系统（Filesystem Fallback）                      │
│     • /tmp 目录临时存储                                  │
│     • PDF 二进制文件                                     │
│     • 本地开发回退                                       │
└─────────────────────────────────────────────────────────┘
```

### 组件交互流程

```
用户操作 → React 组件 → API Route → 业务逻辑 → 数据存储
   ↑                                              ↓
   └──────────────── 响应返回 ←───────────────────┘
```

### 关键设计模式

| 模式 | 应用场景 | 示例 |
|------|---------|------|
| **单例模式** | Redis 客户端 | `global.vectorStoreCache` |
| **工厂模式** | 向量存储创建 | `createVectorStore()` |
| **策略模式** | PDF 解析策略 | pdf2json → OCR 回退 |
| **观察者模式** | SSE 流式响应 | AI 对话流式输出 |
| **缓存模式** | 三层存储 | Memory → Redis → Filesystem |

---

## 数据流程

### 完整数据流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF AI 聊天应用数据流程                        │
└─────────────────────────────────────────────────────────────────┘

用户上传 PDF
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 文件上传 (POST /api/upload)                       │
│  ├─ 接收 FormData (multipart/form-data)                     │
│  ├─ 验证文件类型 (application/pdf)                          │
│  ├─ 验证文件大小 (≤1MB)                                     │
│  ├─ 生成唯一 ID (UUID v4)                                   │
│  ├─ 保存到 /tmp/pdf-chat/{pdfId}.pdf                        │
│  ├─ 转换为 base64 (前端预览)                                │
│  ├─ 创建 PDF 记录 (parseStatus: PENDING)                   │
│  ├─ 存储到 Redis (pdf:{id})                                │
│  └─ 返回: { pdfId, uploadTaskId, base64Data }              │
│  ⏱️ 耗时: ~500ms                                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: PDF 解析 (POST /api/parse)                        │
│  ├─ 从 /tmp 读取 PDF 文件                                   │
│  ├─ 尝试 pdf2json 解析 (7秒超时)                           │
│  │  ├─ 成功 → 提取文本和页数                               │
│  │  └─ 失败/超时 → 触发 OCR 识别                           │
│  ├─ OCR 识别 (tesseract.js)                                │
│  │  ├─ 支持中文 + 英文                                     │
│  │  └─ 5秒超时                                             │
│  ├─ 文本质量验证                                           │
│  │  ├─ 最小长度检查 (>50 字符)                             │
│  │  └─ 有效字符比例 (>30%)                                 │
│  ├─ 更新 PDF 状态 (parseStatus: COMPLETED)                 │
│  └─ 返回: { textContent, pageCount, parseStatus }          │
│  ⏱️ 耗时: 1-7秒                                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 文本分块 & 向量化 (自动触发)                       │
│  ├─ 语义分块 (RecursiveCharacterTextSplitter)              │
│  │  ├─ chunkSize: 500-1000 字符                            │
│  │  ├─ chunkOverlap: 100 字符 (保持上下文)                 │
│  │  └─ 按段落、句子分割                                    │
│  ├─ 生成向量嵌入 (Alibaba Tongyi Embeddings)               │
│  │  ├─ 模型: text-embedding-v1                             │
│  │  ├─ 维度: 1536                                          │
│  │  └─ 批量处理 (减少 API 调用)                            │
│  ├─ 创建向量存储 (MemoryVectorStore)                       │
│  │  ├─ 存储 documents                                      │
│  │  └─ 存储 embeddings                                     │
│  └─ 持久化到 Redis                                         │
│     ├─ vector:{id} → chunks                                │
│     └─ vector:{id}:embeddings → embeddings                 │
│  ⏱️ 耗时: 2-5秒                                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 存储到 Redis (持久化)                             │
│  ├─ pdf:{id} → PDF 元数据                                  │
│  │  ├─ id, fileName, fileSize                             │
│  │  ├─ textContent, pageCount                             │
│  │  ├─ parseStatus, uploadedAt                            │
│  │  └─ TTL: 7天 (604800 秒)                               │
│  ├─ vector:{id} → 文本 chunks                             │
│  │  ├─ content: string                                    │
│  │  ├─ metadata: { pdfId, source, pageCount }            │
│  │  └─ TTL: 7天                                           │
│  ├─ vector:{id}:embeddings → 向量数据                      │
│  │  ├─ number[][] (二维数组)                              │
│  │  └─ TTL: 7天                                           │
│  └─ pdf:list → 所有 PDF ID 集合 (SADD)                    │
│  ⏱️ 耗时: ~200ms                                           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 用户提问 (POST /api/chat)                         │
│  ├─ 接收问题: { pdfId, question, history }                 │
│  ├─ 从 Redis 恢复数据                                      │
│  │  ├─ 获取 PDF 元数据 (pdf:{id})                         │
│  │  ├─ 获取 vector chunks (vector:{id})                   │
│  │  └─ 获取 embeddings (vector:{id}:embeddings)           │
│  ├─ 恢复向量存储                                           │
│  │  ├─ 如果有 embeddings → 直接使用 (避免重算)            │
│  │  └─ 否则 → 重新计算 embeddings                         │
│  ├─ 向量相似度搜索                                         │
│  │  ├─ 将问题转换为向量                                   │
│  │  ├─ 余弦相似度计算                                     │
│  │  ├─ 返回 Top-K 相关文档 (k=4)                          │
│  │  └─ 过滤低分结果 (threshold: 0.3)                      │
│  ├─ 构建对话上下文                                         │
│  │  ├─ 系统提示词 (角色定义)                              │
│  │  ├─ 相关文档内容                                       │
│  │  ├─ 历史对话 (最近 5 轮)                               │
│  │  └─ 当前问题                                           │
│  ├─ 调用 AI 生成回答 (Alibaba Tongyi)                     │
│  │  ├─ 模型: qwen-turbo                                   │
│  │  ├─ 流式输出 (SSE)                                     │
│  │  └─ 温度: 0.7                                          │
│  └─ SSE 流式返回回答                                       │
│  ⏱️ 耗时: 3-8秒                                            │
└─────────────────────────────────────────────────────────────┘
```

### 关键流程详解

#### 1. 文件上传流程

```typescript
// API: POST /api/upload
// Content-Type: multipart/form-data

Request:
├─ file: File (PDF 二进制)
└─ fileName: string

Process:
1. 验证文件类型
   if (file.type !== 'application/pdf') throw Error

2. 验证文件大小
   if (file.size > 1MB) throw Error

3. 生成唯一 ID
   const pdfId = crypto.randomUUID()

4. 保存文件
   await fs.writeFile(`/tmp/pdf-chat/${pdfId}.pdf`, buffer)

5. 转换 base64
   const base64 = buffer.toString('base64')

6. 创建记录
   const pdf: PDFFile = {
     id: pdfId,
     fileName,
     parseStatus: 'pending',
     uploadedAt: new Date()
   }

7. 存储到 Redis
   await redis.set(`pdf:${pdfId}`, pdf, { ex: 604800 })

Response:
{
  "pdfId": "abc-123",
  "uploadTaskId": "task-456",
  "base64Data": "data:application/pdf;base64,..."
}
```

#### 2. PDF 解析流程

```typescript
// API: POST /api/parse
// Content-Type: application/json

Request:
{ "pdfId": "abc-123" }

Process:
1. 读取 PDF 文件
   const buffer = await fs.readFile(`/tmp/pdf-chat/${pdfId}.pdf`)

2. 尝试 pdf2json 解析 (7秒超时)
   try {
     const data = await Promise.race([
       pdf2json(buffer),
       timeout(7000)
     ])
     text = extractText(data)
   } catch (error) {
     // 超时或失败 → OCR
   }

3. OCR 识别 (如果需要)
   if (!text || text.length < 50) {
     text = await tesseract.recognize(buffer, {
       lang: 'chi_sim+eng',
       timeout: 5000
     })
   }

4. 文本质量验证
   if (text.length < 50) throw Error('文本太短')
   if (validCharRatio < 0.3) throw Error('无效字符过多')

5. 更新 PDF 记录
   pdf.textContent = text
   pdf.parseStatus = 'completed'
   await redis.set(`pdf:${pdfId}`, pdf)

Response:
{
  "parseStatus": "completed",
  "textContent": "提取的文本内容...",
  "pageCount": 15
}
```

#### 3. 向量化流程

```typescript
// 自动在解析完成后触发

Process:
1. 文本分块
   const splitter = new RecursiveCharacterTextSplitter({
     chunkSize: 1000,
     chunkOverlap: 100,
     separators: ['\n\n', '\n', '。', '！', '？', ' ']
   })
   const chunks = await splitter.splitText(text)

2. 生成向量嵌入
   const embeddings = await tongyi.embedDocuments(
     chunks.map(c => c.content)
   )
   // 返回: number[][] (每个 chunk 一个 1536 维向量)

3. 创建向量存储
   const vectorStore = await MemoryVectorStore.fromDocuments(
     documents,
     embeddingsModel
   )

4. 持久化到 Redis
   await redis.set(`vector:${pdfId}`, chunks, { ex: 604800 })
   await redis.set(`vector:${pdfId}:embeddings`, embeddings, { ex: 604800 })
```

#### 4. AI 对话流程

```typescript
// API: POST /api/chat
// Content-Type: application/json

Request:
{
  "pdfId": "abc-123",
  "question": "这份文档的主要内容是什么？",
  "conversationId": "conv-456",
  "history": [
    { role: "user", content: "..." },
    { role: "assistant", content: "..." }
  ]
}

Process:
1. 恢复向量存储
   const chunks = await redis.get(`vector:${pdfId}`)
   const embeddings = await redis.get(`vector:${pdfId}:embeddings`)
   
   if (embeddings) {
     // 直接使用存储的 embeddings (避免重新计算)
     vectorStore = new MemoryVectorStore(embeddingsModel)
     await vectorStore.addVectors(embeddings, chunks)
   } else {
     // 重新计算
     vectorStore = await createVectorStore(pdfId, chunks)
   }

2. 向量相似度搜索
   const queryEmbedding = await embeddingsModel.embedQuery(question)
   const results = await vectorStore.similaritySearchWithScore(
     question,
     k = 4
   )
   // 返回: [{ document, score }, ...]

3. 过滤低分结果
   const filtered = results.filter(([doc, score]) => score > 0.3)

4. 构建对话上下文
   const context = `
   相关文档内容：
   ${filtered.map(([doc]) => doc.pageContent).join('\n\n')}
   
   历史对话：
   ${history.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
   
   当前问题：${question}
   `

5. 调用 AI 生成回答
   const stream = await tongyi.stream({
     model: 'qwen-turbo',
     messages: [
       { role: 'system', content: '你是一个专业的文档分析助手...' },
       { role: 'user', content: context }
     ],
     temperature: 0.7
   })

6. SSE 流式返回
   for await (const chunk of stream) {
     res.write(`data: ${JSON.stringify(chunk)}\n\n`)
   }

Response: (SSE Stream)
data: {"content":"这份"}
data: {"content":"文档"}
data: {"content":"主要"}
data: {"content":"讲述"}
...
data: [DONE]
```

### 数据流时序图

```
用户      前端        API         Redis       AI
 │         │          │           │          │
 │ 上传PDF │          │           │          │
 ├────────>│          │           │          │
 │         │ POST     │           │          │
 │         ├─────────>│           │          │
 │         │          │ 保存文件  │          │
 │         │          ├──────────>│          │
 │         │          │<──────────┤          │
 │         │<─────────┤           │          │
 │<────────┤          │           │          │
 │         │          │           │          │
 │ 解析PDF │          │           │          │
 ├────────>│          │           │          │
 │         │ POST     │           │          │
 │         ├─────────>│           │          │
 │         │          │ 读取文件  │          │
 │         │          │ 提取文本  │          │
 │         │          │ 生成向量  │          │
 │         │          ├──────────────────────>│
 │         │          │<──────────────────────┤
 │         │          │ 存储向量  │          │
 │         │          ├──────────>│          │
 │         │<─────────┤           │          │
 │<────────┤          │           │          │
 │         │          │           │          │
 │ 提问    │          │           │          │
 ├────────>│          │           │          │
 │         │ POST     │           │          │
 │         ├─────────>│           │          │
 │         │          │ 获取向量  │          │
 │         │          ├──────────>│          │
 │         │          │<──────────┤          │
 │         │          │ 相似度搜索│          │
 │         │          │ 生成回答  │          │
 │         │          ├──────────────────────>│
 │         │          │<──────────────────────┤
 │         │<─────────┤ (SSE流)   │          │
 │<────────┤          │           │          │
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
