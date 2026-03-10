# 用户认证系统 - 设计文档

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户认证系统架构                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  登录/注册   │  │  用户中心    │  │  管理员后台  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  认证中间件  │  │  配额检查    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API 层 (Next.js API Routes)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  /api/auth/*     │  │  /api/user/*     │                   │
│  │  - 注册          │  │  - 资料管理      │                   │
│  │  - 登录          │  │  - 密码修改      │                   │
│  │  - 登出          │  │  - 使用统计      │                   │
│  │  - 验证邮箱      │  │  - PDF管理       │                   │
│  └──────────────────┘  └──────────────────┘                   │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  /api/quota/*    │  │  /api/admin/*    │                   │
│  │  - 配额检查      │  │  - 用户管理      │                   │
│  │  - 配额查询      │  │  - 配额管理      │                   │
│  │  - 使用统计      │  │  - 系统配置      │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      认证层 (Supabase Auth)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  Session管理     │  │  JWT验证         │                   │
│  │  - 创建session   │  │  - Token验证     │                   │
│  │  - 刷新token     │  │  - 权限检查      │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    数据层 (Supabase PostgreSQL)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  用户数据        │  │  配额数据        │                   │
│  │  - user_profiles │  │  - user_quotas   │                   │
│  │  - user_sessions │  │  - quota_usage   │                   │
│  └──────────────────┘  └──────────────────┘                   │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  系统数据        │  │  日志数据        │                   │
│  │  - system_config │  │  - email_logs    │                   │
│  │                  │  │  - audit_logs    │                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Redis      │  │  Pinecone    │  │  Vercel Blob │
│  (游客计数)  │  │  (向量数据)  │  │  (文件存储)  │
└──────────────┘  └──────────────┘  └──────────────┘

        ┌──────────────────┐
        │  邮件服务        │
        │  (Resend)        │
        └──────────────────┘
```

## 技术选型

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14+ | 框架 |
| React | 18+ | UI库 |
| TypeScript | 5+ | 类型系统 |
| Supabase JS Client | latest | 认证客户端 |
| shadcn/ui | latest | UI组件 |
| Tailwind CSS | latest | 样式 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 14+ | API层 |
| Supabase Auth Helpers | latest | 服务端认证 |
| Supabase Client | latest | 数据库客户端 |
| Resend | latest | 邮件发送 |
| bcrypt | 5+ | 密码加密（如需要） |

### 数据库

| 技术 | 用途 |
|------|------|
| Supabase PostgreSQL | 用户数据、配额数据、系统配置 |
| Supabase Auth | 认证和会话管理 |
| Redis (Upstash) | 游客计数、缓存 |
| Pinecone | 向量数据（添加用户ID过滤） |

## 数据库设计

### 核心表结构

#### 1. user_profiles（用户资料）

```sql
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
  email_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### 2. quota_definitions（配额定义）

```sql
CREATE TABLE public.quota_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  unit TEXT, -- 'count', 'bytes', 'vectors'
  default_limit INTEGER,
  premium_limit INTEGER,
  admin_limit INTEGER,
  reset_period TEXT, -- 'daily', 'monthly', 'never'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.quota_definitions (name, display_name, unit, default_limit, premium_limit, admin_limit, reset_period) VALUES
('pdf_uploads_daily', 'PDF上传（每日）', 'count', 10, 100, NULL, 'daily'),
('ai_calls_daily', 'AI调用（每日）', 'count', 100, 1000, NULL, 'daily'),
('storage_total', '存储空间（总计）', 'bytes', 1073741824, 10737418240, NULL, 'never'),
('vector_storage', '向量存储', 'vectors', 10000, 1000000, NULL, 'never'),
('pdf_retention_days', 'PDF保留时长', 'days', 30, -1, -1, 'never'); -- -1表示永久
```

#### 3. user_quotas（用户配额）

```sql
CREATE TABLE public.user_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quota_id UUID REFERENCES quota_definitions(id) NOT NULL,
  limit_value INTEGER, -- 覆盖默认值，NULL则使用角色默认值
  expires_at TIMESTAMP WITH TIME ZONE, -- 临时配额过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quota_id)
);

CREATE INDEX idx_user_quotas_user_id ON public.user_quotas(user_id);
```

#### 4. quota_usage（配额使用记录）

```sql
CREATE TABLE public.quota_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quota_id UUID REFERENCES quota_definitions(id) NOT NULL,
  usage_date DATE NOT NULL, -- 用于每日重置的配额
  usage_count INTEGER DEFAULT 0,
  usage_value BIGINT, -- 使用值（如字节数）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quota_id, usage_date)
);

CREATE INDEX idx_quota_usage_user_date ON public.quota_usage(user_id, usage_date);
CREATE INDEX idx_quota_usage_date ON public.quota_usage(usage_date);
```

#### 5. user_pdfs（用户PDF）

```sql
CREATE TABLE public.user_pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  page_count INTEGER,
  storage_path TEXT NOT NULL, -- Vercel Blob path
  pinecone_index TEXT,
  pinecone_namespace TEXT, -- 使用user_id
  upload_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_pdfs_user_id ON public.user_pdfs(user_id);
CREATE INDEX idx_user_pdfs_created_at ON public.user_pdfs(created_at);

ALTER TABLE public.user_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PDFs"
  ON public.user_pdfs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDFs"
  ON public.user_pdfs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDFs"
  ON public.user_pdfs FOR DELETE
  USING (auth.uid() = user_id);
```

#### 6. user_sessions（用户会话）

```sql
CREATE TABLE public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  device_name TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions(last_active);
```

#### 7. system_config（系统配置）

```sql
CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.system_config (key, value, description) VALUES
('default_role', 'user', '新注册用户的默认角色'),
('registration_enabled', 'true', '是否允许用户注册'),
('maintenance_mode', 'false', '维护模式开关'),
('email_notifications_enabled', 'true', '邮件通知开关'),
('quota_reset_time', '00:00', '配额重置时间（UTC）');
```

#### 8. admin_audit_logs（审计日志）

```sql
CREATE TABLE public.admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);
```

#### 9. email_logs（邮件日志）

```sql
CREATE TABLE public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  message_id TEXT,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at);
```

#### 10. email_templates（邮件模板）

```sql
CREATE TABLE public.email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB,
  language TEXT DEFAULT 'zh-CN',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 认证流程设计

### 1. 注册流程

```
用户          前端          API          Supabase         邮件服务
 │             │             │               │                │
 ├─填写表单───▶│             │               │                │
 │             ├─POST /register            │                │
 │             │             ├─创建用户    │                │
 │             │             │  ├─调用supabase.auth.signUp  │
 │             │             │  └─返回user  │                │
 │             │             ├─发送验证邮件 ────────────────▶│
 │             │             │               │                ├─邮件─▶用户
 │             │◀─201 created│               │                │
 │◀─显示检查邮箱│             │               │                │
 │             │             │               │                │
 ├─点击邮件链接───────────────────────────────────────────────▶│
 │             │             │               │                │
 │             ├─GET /verify?token=xxx     │                │
 │             │             ├─验证token   │                │
 │             │             │  ├─调用supabase.auth.verifyOtp
 │             │             │  └─更新user  │                │
 │             │◀─200 ok     │               │                │
 │◀─跳转登录  │             │               │                │
```

### 2. 登录流程

```
用户          前端          API          Supabase         Pinecone
 │             │             │               │                │
 ├─填写凭据───▶│             │               │                │
 │             ├─POST /login              │                │
 │             │             ├─验证凭据     │                │
 │             │             │  ├─调用supabase.auth.signInWithPassword
 │             │             │  └─返回session                │
 │             │             ├─创建session  │                │
 │             │             ├─设置HttpOnly Cookie           │
 │             │             ├─记录登录日志 │                │
 │             │             ├─从Pinecone加载用户数据────────▶│
 │             │             │  └─设置namespace: user_id     │
 │             │◀─200 + user│               │                │
 │◀─跳转首页  │             │               │                │
 │             │             │               │                │
 │        后续请求带session Cookie                          │
 │             ├─GET /api/xxx              │                │
 │             │             ├─验证session  │                │
 │             │             │  ├─调用supabase.auth.getUser  │
 │             │             │  └─返回user   │                │
 │             │             ├─检查配额     │                │
 │             │◀─200 ok     │               │                │
```

### 3. 配额检查流程

```
用户请求        API中间件        配额服务         数据库
   │               │                │               │
   ├─上传PDF──────▶│                │               │
   │               ├─检查配额───────▶│               │
   │               │                ├─查询quota_usage
   │               │                │◀─返回使用量    │
   │               │                ├─查询user_quotas
   │               │                │◀─返回配额限制  │
   │               │                ├─计算剩余配额  │
   │               │◀─允许/拒绝──────┤               │
   │◀─继续/拒绝    │                │               │
   │               │                │               │
   │ (如果允许)     │                │               │
   ├─执行操作──────▶│                │               │
   │               │                ├─记录使用─────▶│
   │               │                │               │
   │◀─操作成功─────│                │               │
```

## 数据隔离设计

### Pinecone 向量数据隔离

使用 namespace 隔离用户数据：

```typescript
// 创建用户专属namespace
const namespace = `user_${userId}`;

// 存储向量
await index.upsert([{
  id: vectorId,
  values: embedding,
  metadata: { content: '...' }
}], { namespace });

// 搜索向量（只搜索用户自己的数据）
const results = await index.query({
  vector: queryEmbedding,
  topK: 4,
  namespace: `user_${userId}`
});
```

### Redis 数据隔离

使用用户ID前缀：

```typescript
// 游客数据
const guestKey = `guest:${fingerprint}:usage_count`;

// 用户数据
const userKey = `user:${userId}:usage_count`;
const userSessionKey = `session:${userId}`;

// 配置
const userConfigKey = `config:${user}`;
```

### Vercel Blob 文件隔离

使用用户ID文件夹：

```typescript
// 上传文件
const path = `users/${userId}/pdfs/${pdfId}.pdf`;

// 删除用户所有文件
const files = await list(`users/${userId}/`);
await Promise.all(files.map(f => del(f.key)));
```

## 安全设计

### 1. 密码安全

- 使用 Supabase Auth 的内置密码加密（bcrypt）
- 密码强度要求：至少8位，包含字母和数字
- 密码不在日志中记录
- 密码重置链接有效期：1小时

### 2. Session安全

- 使用 HttpOnly Cookie 存储 session token
- 使用 Secure Cookie（仅HTTPS）
- Session 有效期：7天
- "记住我"选项：30天
- 修改密码后所有 session 失效

### 3. API安全

- 所有需要认证的 API 验证 session
- 使用 CSRF 保护
- Rate limiting（每个IP每分钟最多60次请求）
- 输入验证和清理

### 4. 数据安全

- 使用 Supabase Row Level Security (RLS)
- 用户只能访问自己的数据
- 管理员可以访问所有数据
- 敏感信息（如密码）不可查询

### 5. 邮件安全

- 验证链接包含签名
- 链接有效期限制
- 一次性使用链接
- 防止钓鱼攻击

## 性能优化

### 1. 缓存策略

```typescript
// 用户信息缓存（Redis）
const cacheKey = `user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const user = await getUserFromDB(userId);
await redis.setex(cacheKey, 3600, JSON.stringify(user)); // 1小时
```

### 2. 配额检查优化

```typescript
// 批量查询配额
const quotas = await Promise.all([
  getQuotaUsage(userId, 'pdf_uploads_daily'),
  getQuotaUsage(userId, 'ai_calls_daily'),
  getQuotaUsage(userId, 'storage_total')
]);

// 使用单个SQL查询获取所有配额
const userQuotas = await supabase
  .from('quota_usage')
  .select('*')
  .eq('user_id', userId)
  .in('quota_id', quotaIds);
```

### 3. 数据库索引

```sql
-- 常用查询的索引
CREATE INDEX idx_user_pdfs_user_id ON user_pdfs(user_id);
CREATE INDEX idx_quota_usage_user_date ON quota_usage(user_id, usage_date);
CREATE INDEX idx_user_sessions_last_active ON user_sessions(last_active);
```

### 4. 连接池

```typescript
// Supabase 客户端复用
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## 错误处理

### 1. 统一错误响应

```typescript
interface APIError {
  success: false;
  error: string;
  message: string;
  details?: any;
}

// 错误类型
const ErrorTypes = {
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
```

### 2. 错误日志

```typescript
// 记录错误到数据库
await supabase.from('error_logs').insert({
  user_id: userId,
  error_type: errorType,
  error_message: message,
  stack_trace: stack,
  request_path: path,
  created_at: new Date()
});
```

### 3. 用户友好的错误提示

```typescript
const errorMessages = {
  'AUTHENTICATION_FAILED': '邮箱或密码不正确',
  'QUOTA_EXCEEDED': '您已达到配额限制，请升级账户',
  'EMAIL_ALREADY_EXISTS': '该邮箱已被注册',
  'WEAK_PASSWORD': '密码强度不足，至少8位，包含字母和数字'
};
```

## 监控和日志

### 1. 关键指标监控

- 注册成功率
- 登录成功率
- API响应时间
- 邮件发送成功率
- 配额超限次数

### 2. 审计日志

- 所有管理员操作
- 用户关键操作（登录、修改密码、删除数据）
- 安全相关事件（可疑登录、密码重置）

### 3. 性能监控

- API响应时间（P50, P95, P99）
- 数据库查询时间
- 缓存命中率
- 错误率

## 部署架构

### 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Resend (邮件服务)
RESEND_API_KEY=re_xxx...

# 应用配置
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key

# Redis (Upstash)
REDIS_URL=redis://xxx
REDIS_TOKEN=xxx

# Pinecone
PINECONE_API_KEY=xxx
PINECONE_INDEX_NAME=pdf-chat

# Vercel Blob
BLOB_READ_WRITE_TOKEN=xxx
```

### 数据库迁移

```sql
-- 使用 Supabase Migrations
-- 文件位置: supabase/migrations/
-- 运行: supabase db push
```

## 测试策略

### 1. 单元测试

- 认证逻辑测试
- 配额计算测试
- 权限检查测试

### 2. 集成测试

- 注册流程测试
- 登录流程测试
- 配额限制测试

### 3. E2E测试

- 用户注册到使用完整流程
- 管理员操作流程
- 跨设备会话管理

## 未来扩展

### 1. OAuth第三方登录

```typescript
// Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${location.origin}/auth/callback`
  }
});
```

### 2. 多因素认证（MFA）

```typescript
// TOTP
await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Google Authenticator'
});
```

### 3. 订阅和支付

```typescript
// Stripe集成
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### 4. 高级分析

```typescript
// 用户行为分析
// 使用统计报表
// 趋势预测
```
