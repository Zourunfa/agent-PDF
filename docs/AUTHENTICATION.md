# 认证安全功能文档

本文档详细说明了 PDF AI Chat 项目的密码重置和邮箱验证功能。

## 目录

- [功能概述](#功能概述)
- [安全特性](#安全特性)
- [API 端点](#api-端点)
- [前端页面](#前端页面)
- [数据库结构](#数据库结构)
- [邮件服务配置](#邮件服务配置)
- [使用流程](#使用流程)
- [测试](#测试)

## 功能概述

### 密码重置功能

用户可以通过以下步骤重置密码：

1. 访问忘记密码页面 (`/forgot-password`)
2. 输入注册时的邮箱地址
3. 接收密码重置邮件（包含重置链接）
4. 点击链接进入重置密码页面 (`/reset-password`)
5. 设置新密码
6. 使用新密码登录

### 邮箱验证功能

新用户注册后需要验证邮箱：

1. 注册时自动发送验证邮件
2. 点击邮件中的验证链接 (`/verify-email`)
3. 邮箱验证成功
4. 可正常使用所有功能

已登录用户可以重新发送验证邮件（如果之前的邮件过期或未收到）。

## 安全特性

### Token 安全

- **UUID Token**: 使用随机 UUID 作为验证令牌，防止猜测
- **过期时间**:
  - 密码重置令牌：1小时过期
  - 邮箱验证令牌：24小时过期
- **一次性使用**: 验证后令牌立即失效
- **自动清理**: 使用后自动清除数据库中的令牌

### 防护措施

1. **防暴力破解**:
   - 忘记密码 API：15分钟内最多3次请求
   - 重发验证邮件 API：1小时内最多5次请求

2. **防邮箱枚举**:
   - 无论邮箱是否存在，都返回相同的成功消息
   - 错误消息保持一致，不泄露用户信息

3. **IP 地址记录**:
   - 所有验证操作都记录 IP 地址和 User-Agent
   - 便于安全审计和异常检测

4. **安全日志**:
   - 记录所有认证相关事件
   - 包括成功和失败的尝试
   - 存储在 `user_security_log` 表中

### 密码强度要求

- 最少8个字符
- 必须包含字母
- 必须包含数字
- 前端和后端双重验证

## API 端点

### 1. 忘记密码

**端点**: `POST /api/auth/forgot-password`

**请求体**:
```json
{
  "email": "user@example.com"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "如果该邮箱已注册，您将收到密码重置邮件"
}
```

**错误响应**:
- 400 - 邮箱格式不正确
- 429 - 请求过于频繁

### 2. 重置密码

**端点**: `POST /api/auth/reset-password`

**请求体**:
```json
{
  "token": "uuid-token-here",
  "newPassword": "NewPassword123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "密码已成功重置，请使用新密码登录"
}
```

**错误响应**:
- 400 - 令牌无效或过期
- 400 - 密码不符合强度要求

### 3. 验证邮箱

**端点**: `POST /api/auth/verify-email`

**请求体**:
```json
{
  "token": "uuid-token-here"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "邮箱验证成功"
}
```

**错误响应**:
- 400 - 令牌无效或过期

**GET 方式**: 也可以通过 GET 请求访问（用于邮件链接）
```
GET /api/auth/verify-email?token=uuid-token-here
```

### 4. 重发验证邮件

**端点**: `POST /api/auth/resend-verification`

**要求**: 需要用户登录（Bearer Token）

**成功响应** (200):
```json
{
  "success": true,
  "message": "验证邮件已发送，请检查您的邮箱"
}
```

**错误响应**:
- 401 - 未登录
- 400 - 邮箱已验证
- 429 - 发送过于频繁

### 5. 注册（已更新）

**端点**: `POST /api/auth/register`

**更新内容**:
- 自动生成邮箱验证令牌
- 发送验证邮件
- 用户需要验证邮箱后才能完全使用功能

**成功响应** (200):
```json
{
  "success": true,
  "message": "注册成功！请检查您的邮箱并点击验证链接完成注册",
  "requireVerification": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": false
  }
}
```

## 前端页面

### 1. 忘记密码页面

**路径**: `/forgot-password`

**功能**:
- 输入邮箱地址
- 提交后显示成功消息
- 提示检查邮箱（包括垃圾邮件文件夹）
- 提供返回登录和首页的链接

**特点**:
- 响应式设计
- 实时表单验证
- 清晰的成功/错误提示
- 密码重置链接有效期提示

### 2. 重置密码页面

**路径**: `/reset-password?token=xxx`

**功能**:
- 验证令牌有效性
- 输入新密码
- 确认新密码
- 密码强度实时检查
- 显示/隐藏密码功能

**密码要求可视化**:
- 至少8个字符
- 包含数字
- 包含字母
- 两次输入一致

**状态处理**:
- 无效令牌：提示重新申请
- 过期令牌：提示重新申请
- 成功重置：显示成功消息并引导登录

### 3. 邮箱验证页面

**路径**: `/verify-email?token=xxx`

**功能**:
- 自动验证令牌
- 显示验证结果
- 提供重新发送验证邮件的选项

**状态处理**:
- 验证中：显示加载动画
- 验证成功：显示成功消息
- 验证失败：显示错误原因和解决方案

## 数据库结构

### user_profiles 表新增字段

```sql
ALTER TABLE public.user_profiles
ADD COLUMN password_reset_token UUID,
ADD COLUMN reset_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN email_verification_token UUID,
ADD COLUMN verification_expires_at TIMESTAMP WITH TIME ZONE;
```

### user_security_log 表

记录所有安全相关事件：

```sql
CREATE TABLE public.user_security_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**事件类型**:
- `password_reset_requested` - 请求密码重置
- `password_reset` - 成功重置密码
- `password_reset_failed` - 密码重置失败
- `email_verification_requested` - 请求邮箱验证
- `email_verification_resend` - 重发验证邮件
- `email_verified` - 邮箱验证成功
- `email_verification_failed` - 邮箱验证失败
- `user_registered` - 用户注册

## 邮件服务配置

### Resend 配置

1. **注册 Resend 账户**:
   - 访问 https://resend.com/
   - 创建 API 密钥

2. **配置环境变量**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # 或你的生产域名
   ```

3. **配置发件域名**:
   - 在 Resend 控制台添加并验证你的域名
   - 更新邮件模板中的发件地址

### 邮件模板

#### 验证邮件模板

- 专业的 HTML 设计
- 响应式布局
- 清晰的操作按钮
- 安全提示和过期说明

#### 密码重置邮件模板

- 警示性配色（红色/粉色渐变）
- 安全提示
- 有效期提醒
- 防钓鱼警告

### 邮件发送失败处理

- 邮件发送失败不会阻止用户注册
- 用户可以稍后重新发送验证邮件
- 错误日志记录在服务器端

## 使用流程

### 用户注册流程

```
1. 访问注册页面
   ↓
2. 填写注册信息（邮箱、密码、姓名）
   ↓
3. 提交注册
   ↓
4. 系统创建用户账户
   ↓
5. 系统生成验证令牌
   ↓
6. 系统发送验证邮件
   ↓
7. 显示"请检查邮箱"消息
   ↓
8. 用户点击邮件中的验证链接
   ↓
9. 验证成功，引导用户登录
```

### 密码重置流程

```
1. 用户访问登录页面
   ↓
2. 点击"忘记密码"链接
   ↓
3. 输入注册邮箱
   ↓
4. 系统生成重置令牌
   ↓
5. 系统发送重置邮件
   ↓
6. 显示"邮件已发送"消息
   ↓
7. 用户点击邮件中的重置链接
   ↓
8. 输入新密码
   ↓
9. 密码重置成功
   ↓
10. 引导用户使用新密码登录
```

### 重发验证邮件流程

```
1. 用户登录
   ↓
2. 系统检测到邮箱未验证
   ↓
3. 显示提示信息和"重发验证邮件"按钮
   ↓
4. 用户点击按钮
   ↓
5. 系统生成新令牌
   ↓
6. 系统发送新的验证邮件
   ↓
7. 显示"邮件已发送"消息
```

## 测试

### 运行测试

```bash
# 运行所有认证测试
npm test -- auth-password-reset
npm test -- auth-email-verification

# 运行特定测试套件
npm test -- --testPathPattern=auth-password-reset
```

### 测试覆盖

#### 密码重置测试
- ✅ 发送密码重置邮件
- ✅ 邮箱枚举防护
- ✅ 无效邮箱格式处理
- ✅ 限流功能
- ✅ 令牌生成和存储
- ✅ 密码重置功能
- ✅ 令牌验证
- ✅ 弱密码拒绝
- ✅ 令牌清除
- ✅ 安全日志记录

#### 邮箱验证测试
- ✅ 邮箱验证功能
- ✅ 无效令牌处理
- ✅ 重发验证邮件
- ✅ 认证检查
- ✅ 已验证状态检查
- ✅ 令牌更新
- ✅ 限流功能
- ✅ GET 请求处理
- ✅ 安全日志记录

## 常见问题

### 1. 邮件未收到

**可能原因**:
- 邮件被标记为垃圾邮件
- Resend API 密钥未配置
- 发件域名未验证
- 邮箱地址输入错误

**解决方案**:
- 检查垃圾邮件文件夹
- 验证环境变量配置
- 在 Resend 控制台验证域名
- 使用"重发验证邮件"功能

### 2. 验证链接过期

**可能原因**:
- 密码重置链接：1小时有效期
- 邮箱验证链接：24小时有效期

**解决方案**:
- 重新申请密码重置
- 重新发送验证邮件

### 3. 令牌无效

**可能原因**:
- 令牌已被使用
- 令牌已过期
- 令牌被篡改

**解决方案**:
- 重新申请密码重置
- 重新发送验证邮件

## 安全建议

1. **生产环境配置**:
   - 使用 HTTPS
   - 配置正确的 APP_URL
   - 使用真实的 Resend API 密钥
   - 验证发件域名

2. **监控和日志**:
   - 定期检查 `user_security_log` 表
   - 监控异常的认证活动
   - 设置告警规则

3. **限流调整**:
   - 根据实际需求调整限流参数
   - 考虑使用 Redis 实现分布式限流
   - 对于高流量场景，考虑专业的限流服务

4. **密码策略**:
   - 根据安全需求调整密码强度要求
   - 考虑添加密码历史记录
   - 考虑添加账户锁定机制

## 维护

### 数据库迁移

所有必要的数据库迁移已包含在：
- `supabase/migrations/0004_add_password_reset_and_email_verification.sql`

### 更新邮件模板

邮件模板位于：
- `/src/lib/email.ts`

如需自定义，请编辑相应的模板函数。

## 技术栈

- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **邮件服务**: Resend
- **前端**: React + Tailwind CSS
- **UI 组件**: shadcn/ui

## 支持

如有问题或建议，请通过以下方式联系：

- GitHub Issues
- 邮件: support@example.com

---

**最后更新**: 2025-01-09
