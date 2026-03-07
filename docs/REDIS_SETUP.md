# Redis 缓存配置指南

本项目使用 **Vercel KV** (基于 Redis) 来缓存 PDF 数据，确保在 Vercel 无服务器环境中数据能够跨实例共享。

## 为什么需要 Redis？

Vercel 的无服务器函数每次请求可能在不同的实例上运行，导致：
- 内存变量每次重置
- `/tmp` 目录不会共享

Redis 提供了持久化存储，解决了这个问题。

## 配置步骤

### 1. 创建 Vercel KV 数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Storage** 标签
4. 点击 **Create Database**
5. 选择 **KV** (Redis)
6. 点击 **Continue** → **Create**

### 2. 环境变量自动配置

Vercel 会自动为你创建以下环境变量：

```
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

这些变量会自动注入到你的部署环境中，**无需手动配置**。

### 3. 本地开发配置（可选）

如果想在本地使用 Redis，有两种方式：

#### 方式 A：连接到 Vercel KV（推荐）

Vercel CLI 会自动拉取环境变量：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 拉取环境变量到 .env.local
vercel env pull .env.local
```

#### 方式 B：使用本地 Redis

```bash
# 安装 Redis
# macOS
brew install redis
brew start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis

# Windows
# 使用 Docker
docker run -d -p 6379:6379 redis
```

然后配置 `.env.local`：

```env
# 使用 Upstash Redis（免费额度）
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

## 缓存策略

### 数据存储

| 数据类型 | Redis Key | TTL | 说明 |
|---------|-----------|-----|------|
| PDF 元数据 | `pdf:meta:{pdfId}` | 24小时 | 文件名、大小等 |
| PDF 文本内容 | `pdf:text:{pdfId}` | 24小时 | 提取的文本 |
| Vector Chunks | `vector:{pdfId}` | 24小时 | 向量搜索片段 |

### 读取顺序

1. **内存** (最快) - 当前请求的缓存
2. **Redis** (快) - 跨请求共享
3. **文件系统** (慢) - 本地开发回退

## 成本估算

Vercel KV 定价（截至 2024年）：

| 计划 | 价格 | 存储 | 命令/天 |
|-----|------|------|---------|
| Hobby | 免费 | 256 MB | 10,000 |
| Pro | $0.50/GB | 1 GB | 30,000 |
| Pro Max | $2.00/GB | 10 GB | 300,000 |

对于大多数 PDF 聊天应用，Hobby 计划（免费）已足够。

## 故障排查

### Redis 连接失败

检查日志中的错误信息：

```
[PDF Storage] Redis not available, using filesystem fallback
```

这表示 Redis 未配置或连接失败。系统会自动回退到文件系统存储。

### 本地开发提示

在本地开发时，如果没有配置 Redis，系统会使用：
- 内存缓存
- `/tmp` 目录

这不会影响功能，但每次重启服务器后数据会丢失。

## 生产环境清单

- [ ] 创建 Vercel KV 数据库
- [ ] 确认环境变量已自动注入
- [ ] 部署后测试上传和聊天功能
- [ ] 检查 Vercel 日志确认 Redis 连接成功

## 相关文件

- `src/lib/storage/redis-cache.ts` - Redis 缓存实现
- `src/lib/storage/pdf-files.ts` - PDF 存储集成
- `src/lib/langchain/vector-store.ts` - Vector Store 集成
