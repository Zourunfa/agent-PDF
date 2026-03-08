# Pinecone 向量数据库设置指南

## 为什么使用 Pinecone？

Pinecone 是一个完全托管的向量数据库，专为 AI 应用设计。相比 Redis 存储向量，Pinecone 有以下优势：

### 优势对比

| 特性 | Pinecone | Redis |
|------|----------|-------|
| **向量搜索性能** | ⭐⭐⭐⭐⭐ 专为向量优化 | ⭐⭐⭐ 通用数据库 |
| **持久化** | ✅ 完全持久化 | ✅ 持久化 |
| **跨实例共享** | ✅ 原生支持 | ✅ 支持 |
| **维护成本** | ✅ 零维护 | ⚠️ 需要管理 |
| **免费额度** | 1个索引，100K向量 | 256MB 数据 |
| **相似度搜索** | ⭐⭐⭐⭐⭐ 原生支持 | ⭐⭐ 需要自己实现 |
| **扩展性** | ⭐⭐⭐⭐⭐ 自动扩展 | ⭐⭐⭐ 手动扩展 |

### 新架构

```
┌─────────────────────────────────────────────────────────┐
│  优化后的存储架构                                        │
└─────────────────────────────────────────────────────────┘

PDF 上传
   ↓
┌──────────────────────────────────────────────────────┐
│  1. Redis (Upstash)                                  │
│  ├─ PDF 元数据 (id, fileName, fileSize, etc.)       │
│  ├─ 文本内容 (textContent)                           │
│  └─ 文本 chunks (content only, no vectors)          │
│  💾 存储大小: ~1-5MB per PDF                         │
└──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────┐
│  2. Pinecone                                         │
│  ├─ 向量嵌入 (embeddings)                            │
│  ├─ 向量元数据 (pdfId, chunkIndex, content)         │
│  └─ 相似度索引                                       │
│  💾 存储大小: ~100-500 vectors per PDF              │
└──────────────────────────────────────────────────────┘
   ↓
┌──────────────────────────────────────────────────────┐
│  3. 内存缓存 (MemoryVectorStore)                     │
│  ├─ 单次请求快速访问                                 │
│  └─ 请求结束后清空                                   │
└──────────────────────────────────────────────────────┘

搜索流程：
1. 优先使用 Pinecone 搜索（持久化，跨实例）
2. 如果 Pinecone 未配置，使用内存搜索
3. 如果内存没有，从 Redis 恢复文本并重建
```

---

## 快速开始

### 步骤 1: 注册 Pinecone 账号

1. 访问 [Pinecone 官网](https://www.pinecone.io/)
2. 点击 "Start Free" 注册账号
3. 免费版提供：
   - 1 个索引
   - 100,000 个向量
   - 足够个人项目使用

### 步骤 2: 创建索引

1. 登录 Pinecone 控制台
2. 点击 "Create Index"
3. 配置索引：

```
Index Name: pdf-chat
Dimensions: 1536
Metric: cosine
Cloud: AWS (或其他)
Region: us-east-1 (选择离你最近的)
```

**重要说明：**
- **Dimensions**: 必须是 `1536`（Alibaba Tongyi Embeddings 的维度）
- **Metric**: 使用 `cosine`（余弦相似度）
- **Index Name**: 可以自定义，但要和环境变量一致

### 步骤 3: 获取 API Key

1. 在 Pinecone 控制台，点击 "API Keys"
2. 复制你的 API Key
3. 保存好，后面会用到

### 步骤 4: 配置环境变量

#### 本地开发 (`.env.local`)

```env
# Pinecone 配置
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_INDEX_NAME=pdf-chat

# Alibaba Tongyi (必需)
ALIBABA_API_KEY=sk-your-alibaba-api-key-here

# Upstash Redis (必需)
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token
```

#### Vercel 部署

1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加以下变量：

```
PINECONE_API_KEY = your-pinecone-api-key-here
PINECONE_INDEX_NAME = pdf-chat
```

### 步骤 5: 测试连接

启动开发服务器：

```bash
npm run dev
```

查看日志，应该看到：

```
✓ Pinecone configured for vector storage
✓ Using Qwen (Alibaba Tongyi) for embeddings
```

上传一个 PDF 文件，查看日志：

```
[Pinecone] Storing 15 vectors for PDF: abc-123
[Pinecone] ✓ Generated 15 embeddings
[Pinecone] ✓ Uploaded batch 1/1
[Pinecone] ✓ Successfully stored 15 vectors in 1234ms
```

---

## 使用说明

### 自动工作流程

1. **上传 PDF**
   - PDF 元数据和文本存到 Redis
   - 文本分块后生成向量
   - 向量自动存到 Pinecone

2. **提问**
   - 问题转换为向量
   - Pinecone 搜索相似向量
   - 返回最相关的文档片段
   - AI 基于文档生成回答

3. **删除 PDF**
   - 自动清理 Redis 数据
   - 自动清理 Pinecone 向量

### 降级策略

如果 Pinecone 不可用（未配置或出错），系统会自动降级：

```
Pinecone 搜索失败
   ↓
使用内存向量存储
   ↓
如果内存没有，从 Redis 恢复
   ↓
重新生成向量（会调用 AI API）
```

---

## 成本估算

### 免费版限制

- **索引数量**: 1 个
- **向量数量**: 100,000 个
- **查询次数**: 无限制
- **存储时间**: 永久

### 实际使用

假设每个 PDF：
- 平均 10 页
- 生成 20 个 chunks
- 每个 chunk 1 个向量

```
100,000 向量 ÷ 20 向量/PDF = 5,000 个 PDF
```

**结论**: 免费版足够存储 5,000 个 PDF 文档！

### 付费版（如果需要）

- **Starter**: $70/月
  - 1 个索引
  - 100,000 个向量
  - 更高性能

- **Standard**: 按需付费
  - 多个索引
  - 无限向量
  - 企业级性能

---

## 常见问题

### Q1: 必须使用 Pinecone 吗？

不是必须的。如果不配置 Pinecone，系统会使用内存存储，但有以下限制：
- ❌ 服务器重启后数据丢失
- ❌ 无法跨实例共享（Vercel 多实例部署）
- ❌ 需要重新生成向量（消耗 AI API 配额）

### Q2: Pinecone 和 Redis 的区别？

| 用途 | Pinecone | Redis |
|------|----------|-------|
| **向量存储** | ✅ 推荐 | ⚠️ 可以但不推荐 |
| **元数据存储** | ⚠️ 可以但有限 | ✅ 推荐 |
| **文本存储** | ❌ 不适合 | ✅ 推荐 |
| **相似度搜索** | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**最佳实践**: Pinecone 存向量，Redis 存文本和元数据

### Q3: 如何迁移现有数据？

如果你之前使用 Redis 存储向量，现在想迁移到 Pinecone：

1. 配置 Pinecone 环境变量
2. 重新上传 PDF 文件
3. 系统会自动存到 Pinecone

旧的 Redis 向量数据可以保留（不影响），也可以手动清理。

### Q4: Dimensions 设置错误怎么办？

如果创建索引时 Dimensions 设置错了，需要：

1. 删除旧索引
2. 创建新索引（Dimensions = 1536）
3. 重新上传 PDF

**注意**: 删除索引会丢失所有向量数据！

### Q5: 如何监控使用量？

1. 登录 Pinecone 控制台
2. 查看 "Usage" 页面
3. 可以看到：
   - 向量数量
   - 查询次数
   - 存储大小

---

## 故障排查

### 错误 1: "PINECONE_NOT_CONFIGURED"

**原因**: 未设置 `PINECONE_API_KEY`

**解决**:
```bash
# .env.local
PINECONE_API_KEY=your-api-key-here
```

### 错误 2: "Index not found"

**原因**: 索引名称不匹配

**解决**:
```bash
# .env.local
PINECONE_INDEX_NAME=pdf-chat  # 必须和 Pinecone 控制台的索引名一致
```

### 错误 3: "Dimension mismatch"

**原因**: 索引 Dimensions 不是 1536

**解决**: 删除索引，重新创建（Dimensions = 1536）

### 错误 4: 搜索结果为空

**可能原因**:
1. PDF 向量未上传成功
2. 查询向量生成失败
3. 相似度阈值太高

**排查**:
```bash
# 查看日志
[Pinecone] Storing 15 vectors for PDF: abc-123  # 应该看到这个
[Pinecone] ✓ Successfully stored 15 vectors     # 确认上传成功

[Pinecone] Searching for "..." in PDF: abc-123  # 搜索日志
[Pinecone] ✓ Found 4 results in 234ms           # 确认找到结果
```

---

## 性能优化

### 1. 批量上传

系统已自动实现批量上传（每次 100 个向量），无需手动优化。

### 2. 缓存策略

- 内存缓存：单次请求内复用
- Pinecone：跨请求持久化
- Redis：文本内容备份

### 3. 并行处理

如果需要处理大量 PDF，可以并行上传：

```typescript
const pdfs = ['pdf1', 'pdf2', 'pdf3'];
await Promise.all(pdfs.map(pdf => uploadPDF(pdf)));
```

---

## 下一步

- ✅ 配置 Pinecone
- ✅ 测试上传和搜索
- ⬜ 监控使用量
- ⬜ 优化搜索参数（topK, threshold）
- ⬜ 考虑升级到付费版（如果需要）

---

## 相关资源

- [Pinecone 官方文档](https://docs.pinecone.io/)
- [Pinecone Node.js SDK](https://github.com/pinecone-io/pinecone-ts-client)
- [LangChain Pinecone 集成](https://js.langchain.com/docs/integrations/vectorstores/pinecone)
- [Alibaba Tongyi Embeddings](https://help.aliyun.com/zh/dashscope/developer-reference/text-embedding-api-details)

---

*最后更新: 2025-03-08*
*版本: 1.0.0*
