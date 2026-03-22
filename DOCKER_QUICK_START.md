# Docker 自托管部署 - 快速开始指南

这是一个快速开始指南，帮助您在 10 分钟内完成 PDF Chat 应用的 Docker 自托管部署。

## 前置要求

- Docker 和 Docker Compose
- 2GB+ 可用内存
- 10GB+ 可用磁盘空间

## 快速开始（3 步）

### 1️⃣ 克隆代码并配置

```bash
# 克隆项目
git clone https://github.com/yourusername/agent-pdf.git
cd agent-pdf

# 复制环境变量模板
cp .env.docker.example .env

# 编辑配置（必需）
nano .env
```

**最少需要配置的变量：**

```bash
# 数据库密码
DB_PASSWORD=your_secure_password

# Redis 密码
REDIS_PASSWORD=your_redis_password

# NextAuth 密钥（生成：openssl rand -base64 32）
NEXTAUTH_SECRET=your_nextauth_secret

# AI 模型密钥
ALIBABA_API_KEY=your_api_key_here
```

### 2️⃣ 启动服务

```bash
# 进入 docker 目录
cd docker

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3️⃣ 访问应用

打开浏览器访问：http://localhost

## 验证部署

```bash
# 检查服务状态
docker-compose ps

# 测试健康检查
curl http://localhost/health

# 查看应用日志
docker-compose logs -f app1
```

## 服务架构

```
┌─────────────────────────────────────────┐
│         Nginx (端口 80)                  │
│         负载均衡 + 反向代理                │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐    ┌──────▼──────┐
│  App Instance│    │  App Instance│
│    (Next.js) │    │    (Next.js) │
└───────┬──────┘    └──────┬──────┘
        │                   │
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────────────────┐
        │                               │
┌───────▼──────┐  ┌─────────┐  ┌──────▼──────┐
│  PostgreSQL  │  │  Redis  │  │   Qdrant    │
│   (数据库)    │  │  (缓存)   │  │  (向量存储)  │
└──────────────┘  └─────────┘  └─────────────┘
```

## 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f [service_name]

# 执行命令
docker-compose exec app1 sh

# 清理数据（危险！）
docker-compose down -v
rm -rf data/*
```

## 故障排除

**问题：端口被占用**
```bash
# 检查端口占用
sudo netstat -tulpn | grep LISTEN
# 修改 docker-compose.yml 中的端口映射
```

**问题：容器无法启动**
```bash
# 查看详细日志
docker-compose logs -f [service]
# 检查磁盘空间
df -h
```

**问题：无法访问应用**
```bash
# 检查防火墙
sudo ufw allow 80/tcp
# 检查服务状态
docker-compose ps
```

## 下一步

- 📖 阅读完整迁移指南：`MIGRATION_GUIDE.md`
- 🎯 查看演示文稿：`DOCKER_DEPLOYMENT_PRESENTATION.html`
- 🔒 配置 HTTPS（生产环境必须）
- 📊 设置监控和备份

## 获取帮助

- 🐛 问题反馈：GitHub Issues
- 💬 社区讨论：Discord/Slack
- 📧 邮件支持：support@example.com

---

**提示：** 生产环境请使用强密码并启用 HTTPS！
