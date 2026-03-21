# 用户删除和邮件发送故障排查完整记录

## 对话时间
2026-03-21

## 问题概述

### 问题 1：删除用户后数据库不一致
- **现象**：后台管理界面删除用户后，`auth.users` 仍有数据，但 `user_profiles` 表为空
- **影响**：登录接口返回"用户不存在"，但后台用户列表仍显示用户

### 问题 2：Next.js 缓存导致用户列表为空
- **现象**：注册成功，数据库有用户，但后台 API 返回空数组
- **影响**：管理后台无法显示用户列表

### 问题 3：邮件发送失败（IPv6 连接错误）
- **错误信息**：`connect EHOSTUNREACH 2404:6800:4008:c1b::6c:587`
- **原因**：Nodemailer 尝试通过 IPv6 连接 Gmail SMTP，但网络不支持

### 问题 4：邮件发送失败提示不明显
- **现象**：邮件发送失败时，用户没有明显的错误提示
- **影响**：用户不知道需要重试或检查网络

---

## 问题 1：删除用户数据不一致

### 根本原因

**删除顺序错误**：
1. 先删除了 `user_profiles` 表的数据
2. 然后用已删除的 `user.email` 去查找 `auth.users` 中的用户
3. 导致无法找到和删除 `auth.users` 的记录

**代码问题**：
```typescript
// 错误的删除顺序
await supabase.from('user_profiles').delete().eq('id', userId);

// 然后用 user.email 查找（但 user 已经不存在了）
const targetUser = allUsers?.users.find((u) => u.email === user.email);
```

### 解决方案

**1. 修复删除逻辑**：

```typescript
// 正确的删除顺序
// 步骤1：使用 RPC 函数清理所有关联数据
const { data: deleteResult, error: deleteError } = await supabase
  .rpc('admin_delete_user_profile', {
    target_user_id: userId
  });

// 步骤2：删除 auth.users
const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
```

**2. 使用正确的参数**：
```typescript
// 错误
.rpc('admin_delete_user_profile', {
  user_id: userId  // ❌ 参数名错误
})

// 正确
.rpc('admin_delete_user_profile', {
  target_user_id: userId  // ✅ 正确的参数名
})
```

**3. 添加错误处理**：
```typescript
if (!authDeleteSuccess) {
  return NextResponse.json({
    success: false,
    error: {
      code: 'DELETE_AUTH_FAILED',
      message: '删除 auth.users 失败，可能存在依赖数据',
      details: authDeleteError?.message,
    },
  }, { status: 500 });
}
```

### 关键文件修改

**文件**：`/src/app/api/admin/users/[id]/route.ts`

**修改内容**：
- 修改了删除顺序，先清理关联数据再删除 auth.users
- 修正了 RPC 函数的参数名
- 添加了详细的错误处理和日志

---

## 问题 2：Next.js 缓存导致用户列表为空

### 根本原因

**Next.js 在构建时缓存了环境变量**：
- 注册时使用的 Service Role Key（正确的）
- 后台 API 使用的 Service Role Key（缓存的旧的 key）
- 两者可能指向不同的 Supabase 项目或已过期的 key

### 解决方案

**清理缓存命令**：

```bash
# 方法1：基础清理
pkill -9 -f "next"
rm -rf .next
npm run dev

# 方法2：深度清理
pkill -9 -f "next"
rm -rf .next .turbo node_modules/.cache
rm -rf ~/.next-cache
npm run dev

# 方法3：使用清理脚本
./deep-clean.sh
```

**创建的清理脚本**：

`/deep-clean.sh`：
```bash
#!/bin/bash
# 停止所有相关进程
pkill -9 -f "node"
lsof -ti:3000 | xargs kill -9

# 删除所有缓存
rm -rf .next .turbo node_modules/.cache ~/.next-cache

# 验证环境变量
grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local

# 验证清理结果
lsof -ti:3000 >/dev/null 2>&1 || echo "✅ 端口已释放"
```

### 预防措施

**每次修改 `.env.local` 后，必须：**
1. 停止开发服务器
2. 清理 `.next` 缓存
3. 重新启动

### 验证脚本

创建调试接口 `/api/admin/debug-list-users`：
```typescript
export async function GET() {
  const supabase = createAdminClient();
  
  // 检查环境变量
  debug.envVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  };
  
  // 测试 listUsers API
  const { data: authUsersData } = await supabase.auth.admin.listUsers();
  
  return NextResponse.json({ debug, envVars, listUsersResult });
}
```

---

## 问题 3：邮件发送 IPv6 错误

### 错误信息

```
Error sending verification email: 
connect EHOSTUNREACH 2404:6800:4008:c1b::6c:587
```

### 根本原因

**Nodemailer 尝试通过 IPv6 连接**：
- DNS 返回了 Gmail 的 IPv6 地址
- 用户网络不支持 IPv6
- 导致连接失败（EHOSTUNREACH）

### 解决方案

**1. 添加 `family: 4` 配置**：

```typescript
import nodemailer from 'nodemailer';
import dns from 'dns';

// 强制使用 IPv4
dns.setDefaultResultOrder('ipv4first');

transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,  // 使用 SSL 端口
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  // 强制使用 IPv4
  family: 4,
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});
```

**2. 改用端口 465（SSL）**：
- 原来：端口 587（TLS/STARTTLS）
- 现在：端口 465（SSL）
- 更稳定，兼容性更好

**3. 增加超时时间**：
```typescript
connectionTimeout: 15000,  // 15秒
greetingTimeout: 10000,    // 10秒
socketTimeout: 15000,      // 15秒
```

### 备选方案：使用国内邮件服务

如果 Gmail 仍然无法连接，可以使用国内邮件服务：

**QQ 邮箱配置**：
```bash
EMAIL_SERVICE=qq
EMAIL_USER=your@qq.com
EMAIL_PASSWORD=授权码（不是登录密码）
```

**163 邮箱配置**：
```bash
EMAIL_SERVICE=163
EMAIL_USER=your@163.com
EMAIL_PASSWORD=授权码
```

### 支持的邮件服务

| 服务商 | EMAIL_SERVICE | SMTP Host | 端口 |
|---|---|---|---|
| Gmail | `gmail` | smtp.gmail.com | 465 |
| QQ 邮箱 | `qq` | smtp.qq.com | 465 |
| 163 邮箱 | `163` | smtp.163.com | 465 |
| 126 邮箱 | `126` | smtp.126.com | 465 |
| SendGrid | `sendgrid` | smtp.sendgrid.net | 465 |
| Mailgun | `mailgun` | smtp.mailgun.org | 465 |

---

## 问题 4：邮件发送失败提示不明显

### 原始问题

- 邮件发送失败时，只有控制台日志
- 前端页面没有明显的错误提示
- 用户不知道可以重试

### 解决方案

**1. 添加顶部警告横幅**：

```tsx
{!emailSent && !devMode && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: 'white',
      padding: '16px 24px',
      textAlign: 'center',
      fontSize: '15px',
      fontWeight: 600,
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      zIndex: 1000,
      animation: 'slideDown 0.3s ease-out',
    }}
  >
    ⚠️ 邮件发送失败！请检查网络连接后点击下方按钮重新发送验证邮件
  </div>
)}
```

**2. 优化发送按钮样式**：

```tsx
<Button
  style={{
    height: !emailSent ? 54 : 46,  // 失败时更大
    background: !emailSent 
      ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'  // 红色
      : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',  // 紫色
    fontSize: !emailSent ? 16 : 15,
    boxShadow: !emailSent 
      ? '0 8px 20px rgba(239, 68, 68, 0.4)'  // 增强阴影
      : '0 4px 12px rgba(99, 102, 241, 0.3)',
    animation: !emailSent ? 'pulse 2s ease-in-out infinite' : 'none',  // 脉冲动画
  }}
>
  {resending ? '发送中...' : '📧 发送验证邮件'}
</Button>
```

**3. 页面加载时自动提示**：

```tsx
useEffect(() => {
  const emailSentParam = searchParams.get('emailSent');
  
  // 邮件发送失败，显示错误提示
  if (emailSentParam === 'false') {
    message.error({
      content: '邮件发送失败！请检查网络连接或稍后重新发送验证邮件',
      duration: 8,
      key: 'email-send-failed',
    });
  }
}, [searchParams]);
```

**4. 改进重试功能**：

```typescript
const handleResendEmail = async () => {
  setResending(true);
  
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (data.success) {
    message.success({
      content: '✅ 验证邮件已重新发送！请检查您的邮箱',
      duration: 5,
    });
    setEmailSent(true);  // 更新状态
  } else {
    message.error({
      content: `❌ ${data.message || '发送失败，请稍后重试'}`,
      duration: 6,
    });
  }
  
  setResending(false);
};
```

---

## 修改的文件清单

### 1. `/src/app/api/admin/users/[id]/route.ts`
**修改内容**：
- 修复删除用户逻辑顺序
- 修正 RPC 函数参数名
- 添加完整的错误处理

### 2. `/src/lib/email.ts`
**修改内容**：
- 添加 `family: 4` 强制使用 IPv4
- 改用端口 465（SSL）
- 增加超时时间

### 3. `/src/app/register/success/page.tsx`
**修改内容**：
- 添加顶部警告横幅
- 优化按钮样式和动画
- 添加页面加载提示
- 改进重试功能

### 4. `/src/app/api/auth/me/route.ts`
**修改内容**：
- 添加 `USER_DELETED` 错误处理
- 自动清除无效的 cookie

### 5. `/src/lib/auth/hooks.ts`
**修改内容**：
- 添加被删除用户的自动处理
- 显示友好提示并跳转

---

## 创建的辅助工具

### 1. 清理脚本

**`/clean-all.sh`**：基础清理
```bash
pkill -9 -f "next"
rm -rf .next .turbo node_modules/.cache
```

**`/deep-clean.sh`**：深度清理
```bash
pkill -9 -f "node"
lsof -ti:3000 | xargs kill -9
rm -rf .next .turbo node_modules/.cache ~/.next-cache
```

**`/fix-chunk-error.sh`**：修复 ChunkLoadError
```bash
lsof -ti:3000 | xargs kill -9
rm -rf .next .turbo node_modules/.cache
```

### 2. 调试接口

**`/api/admin/debug-list-users`**：调试用户列表
```typescript
GET /api/admin/debug-list-users
```
返回：
- 环境变量配置
- `listUsers` 结果
- `user_profiles` 结果

**`/api/admin/cleanup-auth-users`**：清理孤立的 auth.users
```typescript
POST /api/admin/cleanup-auth-users
```
功能：删除没有 `user_profiles` 记录的 `auth.users`

### 3. 测试脚本

**`/check-user-in-db.js`**：检查数据库用户
```bash
node check-user-in-db.js
```

**`/check-user-deps.js`**：检查用户依赖数据
```bash
node check-user-deps.js
```

**`/force-delete-clean.js`**：强制删除用户数据
```bash
node force-delete-clean.js
```

**`/test-email-ipv4.js`**：测试邮件发送
```bash
node test-email-ipv4.js
```

---

## 终止端口命令

```bash
# 终止 3000 端口
lsof -ti:3000 | xargs kill -9

# 终止所有 Next.js 进程
pkill -9 -f "next"

# 终止并清理
lsof -ti:3000 | xargs kill -9 && rm -rf .next
```

---

## Next.js 缓存清理命令大全

### 基本清理
```bash
npx next clean
```

### 手动删除
```bash
rm -rf .next .turbo node_modules/.cache
```

### 一键清理脚本
```bash
lsof -ti:3000 | xargs kill -9
rm -rf .next .turbo node_modules/.cache
npm run dev
```

### 快速参考表

| 命令 | 作用 | 推荐场景 |
|---|---|---|
| `npx next clean` | Next.js 官方清理 | 一般缓存问题 |
| `rm -rf .next` | 删除构建缓存 | 环境变量问题 |
| `pkill -f "next"` | 停止 Next.js 进程 | 热重载失效 |
| `lsof -ti:3000 \| xargs kill -9` | 停止 3000 端口进程 | 端口被占用 |

---

## 关键经验总结

### 1. Supabase 删除用户的限制

**不能直接删除有依赖关系的用户**：
- `supabase.auth.admin.deleteUser()` 有外键约束
- 即使依赖数据在 `public` schema，也会阻止删除
- **必须先清理所有依赖数据**

**正确的删除顺序**：
1. 清理 `user_security_log`
2. 清理 `quota_usage`, `quota_operations`, `user_quotas`
3. 清理 `conversation_messages`, `pdf_conversations`, `user_pdfs`
4. 清理 `user_sessions`
5. 清理 `user_profiles`
6. 最后删除 `auth.users`

### 2. Next.js 环境变量缓存

**问题**：
- Next.js 在构建时缓存环境变量
- 修改 `.env.local` 后不会自动更新
- 导致运行时使用过期的配置

**解决**：
- 每次修改 `.env.local` 后必须：
  1. 停止服务器
  2. 删除 `.next` 缓存
  3. 重新启动

### 3. 邮件发送 IPv6 问题

**原因**：
- Nodemailer 默认尝试 IPv6
- 很多网络不支持 IPv6
- 导致 `EHOSTUNREACH` 错误

**解决**：
```typescript
dns.setDefaultResultOrder('ipv4first');  // DNS 优先 IPv4
family: 4,  // 强制 IPv4
port: 465,  // 使用 SSL 端口
secure: true,
```

### 4. 用户体验优化

**邮件发送失败时**：
- ✅ 顶部红色警告横幅（固定定位）
- ✅ 大型红色按钮（54px 高度）
- ✅ 脉冲动画吸引注意
- ✅ 页面加载时自动提示
- ✅ 详细的操作指引

---

## 验证和测试

### 验证数据库用户
```bash
node check-user-in-db.js
```

### 检查依赖数据
```bash
node check-user-deps.js
```

### 测试邮件发送
```bash
node test-email-ipv4.js
```

### 调试用户列表 API
```bash
curl http://localhost:3000/api/admin/debug-list-users \
  -H "X-Admin-Token: YOUR_TOKEN" | jq '.'
```

---

## 快速故障排除

### 用户列表为空
```bash
lsof -ti:3000 | xargs kill -9
rm -rf .next
npm run dev
```

### 邮件发送失败
1. 检查网络连接
2. 验证 SMTP 配置
3. 尝试使用 QQ/163 邮箱
4. 检查防火墙设置

### ChunkLoadError
```bash
lsof -ti:3000 | xargs kill -9
rm -rf .next .turbo
# 浏览器硬刷新：Cmd+Shift+R
```

### 用户删除失败
```bash
# 检查依赖数据
node check-user-deps.js

# 强制删除
node force-delete-clean.js
```

---

## 文档版本

- 创建时间：2026-03-21
- 最后更新：2026-03-21
- 版本：1.0
