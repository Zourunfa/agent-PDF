# Docker Self-Hosted 部署迁移指南

本指南将帮助您将 PDF Chat 应用从 Vercel 云端部署迁移到 Docker 自托管部署。

## 目录

- [为什么选择 Docker 自托管？](#为什么选择-docker-自托管)
- [迁移前准备](#迁移前准备)
- [硬件要求](#硬件要求)
- [迁移步骤](#迁移步骤)
- [数据迁移](#数据迁移)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [性能优化](#性能优化)

---

## 为什么选择 Docker 自托管？

### 优势

1. **数据完全控制**：所有数据存储在您自己的服务器上
2. **成本可控**：无平台使用费，只需支付服务器成本
3. **隐私保护**：PDF 文件和对话历史完全私有
4. **可定制性**：可根据需求调整配置和功能
5. **离线运行**：可在内网环境部署使用

### 劣势

1. **需要运维**：需要自己管理服务器和维护
2. **初始配置**：需要一定的 Docker 和 Linux 基础知识
3. **备份责任**：需要自己负责数据备份

---

## 迁移前准备

### 1. 评估当前使用情况

在迁移前，请了解您当前的资源使用情况：

- **PDF 文件数量**：了解有多少 PDF 文件需要迁移
- **数据库大小**：查看 Supabase 中的数据量
- **对话历史**：确认是否需要保留历史对话
- **用户数据**：确认是否需要迁移用户账户

### 2. 选择服务器

根据使用量选择合适的服务器：

**轻度使用（个人/小团队）**
- CPU: 2 核
- 内存: 4GB
- 存储: 40GB SSD
- 带宽: 5Mbps

**中度使用（10-50 用户）**
- CPU: 4 核
- 内存: 8GB
- 存储: 100GB SSD
- 带宽: 10Mbps

**重度使用（50+ 用户）**
- CPU: 8 核
- 内存: 16GB+
- 存储: 200GB+ SSD
- 带宽: 20Mbps+

### 3. 安装必要软件

确保服务器已安装：

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

---

## 硬件要求

### 最低配置

| 组件 | 要求 | 说明 |
|------|------|------|
| CPU | 2 核心 | 建议 4 核心 |
| 内存 | 4 GB | 建议 8 GB |
| 存储 | 40 GB SSD | 取决于 PDF 文件数量 |
| 操作系统 | Linux | 推荐 Ubuntu 22.04 LTS |

### 推荐配置

| 组件 | 要求 | 说明 |
|------|------|------|
| CPU | 4+ 核心 | 支持更多并发请求 |
| 内存 | 8-16 GB | 更好的性能 |
| 存储 | 100+ GB NVMe SSD | 更快的文件访问 |
| 网络 | 10+ Mbps | 支持文件上传下载 |

---

## 迁移步骤

### 步骤 1: 准备代码

```bash
# 克隆或拉取最新代码
git clone https://github.com/yourusername/agent-pdf.git
cd agent-pdf

# 或如果您已经在项目中
git pull origin main
```

### 步骤 2: 配置环境变量

```bash
# 复制 Docker 环境变量模板
cp .env.docker.example .env

# 编辑环境变量
nano .env
```

**必须配置的关键变量：**

```bash
# 数据库密码（请使用强密码）
DB_PASSWORD=your_secure_password_here

# Redis 密码
REDIS_PASSWORD=your_redis_password_here

# NextAuth 密钥（生成方法：openssl rand -base64 32）
NEXTAUTH_SECRET=your_nextauth_secret_here

# AI 模型 API 密钥
ALIBABA_API_KEY=your_api_key_here
QWEN_API_KEY=your_qwen_key_here
```

### 步骤 3: 准备数据目录

```bash
# 创建必要的目录
mkdir -p data/{postgres,redis,qdrant,uploads}

# 设置权限
chmod 755 data/*
```

### 步骤 4: 启动服务

```bash
# 进入 docker 目录
cd docker

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 检查服务状态
docker-compose ps
```

### 步骤 5: 验证部署

```bash
# 检查健康状态
curl http://localhost/health
curl http://localhost/nginx-health

# 访问应用
open http://localhost
```

---

## 数据迁移

### 从 Vercel Blob 迁移 PDF 文件

如果您之前使用 Vercel Blob Storage，需要迁移 PDF 文件：

**方案 1: 使用迁移脚本（推荐）**

```bash
# 创建迁移脚本
cat > migrate-blob-to-local.sh << 'EOF'
#!/bin/bash

# 配置
VERCEL_BLOB_TOKEN="your_blob_token"
TARGET_DIR="./data/uploads"

# 从 Vercel Blob 下载所有文件
# 注意：需要根据实际情况调整
# 这里提供的是一个示例框架

echo "开始迁移 PDF 文件..."

# 您需要实现具体的下载逻辑
# 可以使用 Vercel Blob SDK 或直接调用 API

echo "迁移完成！"
EOF

chmod +x migrate-blob-to-local.sh
./migrate-blob-to-local.sh
```

**方案 2: 重新上传（简单但需要人工操作）**

1. 登录到 Vercel 部署的应用
2. 下载所有重要的 PDF 文件
3. 在新的 Docker 部署中重新上传

### 从 Supabase 迁移数据

**导出 Supabase 数据：**

```bash
# 使用 Supabase CLI 导出数据
supabase db dump -f backup.sql

# 或使用 pg_dump
pg_dump $DATABASE_URL > backup.sql
```

**导入到 Docker PostgreSQL：**

```bash
# 复制备份文件到容器
docker cp backup.sql pdf-chat-postgres:/tmp/

# 导入数据
docker exec -it pdf-chat-postgres psql -U postgres -d pdf_chat -f /tmp/backup.sql
```

**迁移用户数据（可选）：**

如果您使用了 Supabase Auth，需要：

1. 导出 `auth.users` 表
2. 导出 `auth.identities` 表
3. 导出相关的用户元数据
4. 注意：Supabase Auth 的某些功能可能需要调整

### 验证数据迁移

```bash
# 检查 PDF 文件数量
ls -la data/uploads/ | wc -l

# 检查数据库记录
docker exec -it pdf-chat-postgres psql -U postgres -d pdf_chat -c "SELECT COUNT(*) FROM user_pdfs;"

# 检查向量数据
curl http://localhost:6333/collections/pdf-chat
```

---

## 配置说明

### 数据库配置

**PostgreSQL 设置：**

```yaml
# docker/docker-compose.yml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: pdf_chat
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - ./data/postgres:/var/lib/postgresql/data
```

**性能优化建议：**

```sql
-- 在 PostgreSQL 中运行
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

### Redis 配置

**内存优化：**

```yaml
# docker/docker-compose.yml
redis:
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
```

**持久化设置：**

- AOF（Append Only File）：已启用，提供更好的持久性
- RDB（快照）：可选，在 docker-compose.yml 中配置

### Qdrant 配置

**向量数据库优化：**

```yaml
# docker/docker-compose.yml
qdrant:
  environment:
    - QDRANT__SERVICE__GRPC_PORT=6334
    - QDRANT__STORAGE__PERFORMANCE__MAX_SEARCH_THREADS=4
```

**存储优化：**

- 默认配置适合大多数场景
- 大规模部署时考虑分片和复制

### 应用配置

**Next.js 应用优化：**

```yaml
app1:
  environment:
    - NODE_ENV=production
    - PORT=3000
    - NEXT_TELEMETRY_DISABLED=1  # 禁用遥测
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 1G
```

---

## 常见问题

### Q1: 容器无法启动

**问题：** docker-compose up 失败

**解决方案：**

```bash
# 查看详细日志
docker-compose logs -f [service_name]

# 检查端口占用
sudo netstat -tulpn | grep LISTEN

# 清理并重启
docker-compose down
docker-compose up -d --force-recreate
```

### Q2: 数据库连接失败

**问题：** 应用无法连接到 PostgreSQL

**解决方案：**

```bash
# 检查数据库状态
docker exec -it pdf-chat-postgres pg_isready -U postgres

# 检查网络连接
docker network inspect agent-pdf_app-network

# 验证环境变量
docker exec -it pdf-chat-app1 env | grep DATABASE_URL
```

### Q3: PDF 文件无法上传

**问题：** 上传失败或文件损坏

**解决方案：**

```bash
# 检查存储目录权限
ls -la data/uploads/

# 修正权限
sudo chown -R 1001:1001 data/uploads/
sudo chmod -R 755 data/uploads/

# 检查磁盘空间
df -h
```

### Q4: 性能问题

**问题：** 应用响应慢

**解决方案：**

```bash
# 检查资源使用
docker stats

# 查看应用日志
docker-compose logs -f app1

# 增加资源限制（编辑 docker-compose.yml）
# 调整 Redis 缓存配置
# 优化数据库查询
```

### Q5: 忘记密码

**问题：** 数据库或 Redis 密码丢失

**解决方案：**

```bash
# 重置 PostgreSQL 密码
docker exec -it pdf-chat-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'new_password';"

# 重置 Redis 密码（编辑 docker-compose.yml）
# 然后重启：docker-compose restart redis
```

---

## 性能优化

### 应用层优化

**1. 启用缓存**

```typescript
// 在代码中配置 Redis 缓存
const cacheOptions = {
  ttl: 3600, // 1小时
  maxSize: 1000
};
```

**2. 优化图片处理**

```env
# .env
MAX_IMAGE_SIZE=2097152  # 2MB
IMAGE_QUALITY=80
```

**3. 数据库连接池**

```env
# .env
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000
```

### 系统层优化

**1. 文件系统优化**

```bash
# 使用 XFS 或 ext4 文件系统
# 挂载选项：noatime,nodiratime
```

**2. 网络优化**

```bash
# 调整 TCP 参数
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
```

**3. Docker 优化**

```yaml
# docker-compose.yml
services:
  app1:
    networks:
      app-network:
        aliases:
          - app1
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

### 监控和维护

**设置监控：**

```bash
# 使用 cAdvisor 监控容器
docker run -d \
  --name=cadvisor \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  google/cadvisor:latest
```

**定期备份：**

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

# 备份数据库
docker exec pdf-chat-postgres pg_dump -U postgres pdf_chat > $BACKUP_DIR/database.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads.tar.gz data/uploads/

# 备份 Redis
docker exec pdf-chat-redis redis-cli --rdb - > $BACKUP_DIR/redis.rdb

echo "备份完成: $BACKUP_DIR"
EOF

chmod +x backup.sh

# 设置定时任务（每天凌晨 2 点）
crontab -e
# 添加：0 2 * * * /path/to/backup.sh
```

---

## 安全建议

### 1. 网络安全

```yaml
# 只暴露必要的端口
ports:
  - "127.0.0.1:5432:5432"  # PostgreSQL 仅本地访问
  - "127.0.0.1:6379:6379"  # Redis 仅本地访问
```

### 2. 访问控制

```nginx
# 在 nginx.conf 中配置
location /api/ {
    # 添加 IP 白名单
    allow 192.168.1.0/24;
    deny all;
}
```

### 3. 数据加密

```bash
# 使用 SSL/TLS（生产环境必须）
# 获取 Let's Encrypt 证书
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 更新和维护

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose down
docker-compose up -d
```

### 扩展服务

```bash
# 增加应用实例
docker-compose up -d --scale app=4

# 调整 nginx 配置以使用更多实例
```

---

## 获取帮助

如果遇到问题：

1. 查看日志：`docker-compose logs -f [service]`
2. 检查文档：项目 README.md
3. 提交 Issue：GitHub Issues
4. 社区支持：Discord/Slack

---

## 附录

### A. 环境变量参考

完整的环境变量列表请参考 `.env.docker.example` 文件。

### B. Docker Compose 命令参考

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps

# 扩展服务
docker-compose up -d --scale app=3
```

### C. 性能基准

根据硬件配置的预期性能：

| 配置 | 并发用户 | 响应时间 | 吞吐量 |
|------|---------|---------|--------|
| 2C4G | 5-10 | <500ms | ~20 req/s |
| 4C8G | 20-50 | <300ms | ~50 req/s |
| 8C16G | 50-100 | <200ms | ~100 req/s |

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-22
**维护者**: PDF Chat Team
