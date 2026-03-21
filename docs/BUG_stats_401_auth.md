# Bug 修复记录：用户登录后 Stats 接口返回 401

## 问题描述

用户登录成功后（浏览器 UI 显示用户名、邮箱、验证状态），访问个人中心页面时，`/api/quota/stats` 和 `/api/user/stats` 接口仍返回 `401 Unauthorized`，提示"请先登录"。

## 环境信息

| 项目 | 值 |
|------|-----|
| 框架 | Next.js 14 (App Router) |
| Supabase JS | ^2.98.0 |
| @supabase/ssr | ^0.9.0 |
| 运行环境 | localhost:3000 (开发模式) |

## 现象描述

1. 用户在 `/login` 页面使用邮箱密码登录成功
2. 浏览器 UI 正确显示用户信息（阿锋, 1804491927@qq.com, 邮箱已验证）
3. 浏览器 Cookie 中存在 `sb-jgsxmiojijjjpvbfndvn-auth-token`
4. 但调用 `/api/quota/stats` 返回 `{"success":false,"error":{"code":"UNAUTHORIZED","message":"请先登录"}}`
5. 使用 curl 携带该 Cookie 直接请求 API 也返回 401

## 排查过程

### 第一轮：确认 API 和认证中间件

**检查文件：**
- `src/app/api/quota/stats/route.ts` → 使用 `getCurrentUser()` 验证
- `src/lib/auth/middleware.ts` → `getCurrentUser()` 调用 `createClient()` + `getUser()`
- `src/lib/supabase/server.ts` → 使用 `createServerClient` + Next.js `cookies()`

**结论：** API 路由和认证逻辑本身没有问题，问题出在 Cookie 的读取/解析上。

---

### 第二轮：分析 Cookie 格式

**发现：** 浏览器 Cookie 值格式为：
```
sb-jgsxmiojijjjpvbfndvn-auth-token = base64-eyJhY2Nlc3NfdG9rZW4i...
```

Cookie 值以 `base64-` 前缀开头，后面是 base64url 编码的 JSON 字符串。

解码后的 JSON 包含：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1773135141,
  "refresh_token": "sjevtzovffj",
  "user": {
    "id": "b969a004-032c-4486-b695-dd68d725b593",
    "email": "1804491927@qq.com",
    "user_metadata": { "email_verified": true, "name": "阿锋" }
  },
  "weak_password": null
}
```

**注意：** JSON 中包含中文字符 `"阿锋"`，这是关键信息。

---

### 第三轮：尝试修复（全部失败）

#### 尝试 1：在 server.ts 中移除 `base64-` 前缀

```typescript
// server.ts getAll() 中
if (cookie.value.startsWith('base64-')) {
  return { ...cookie, value: cookie.value.substring(7) };
}
```

**结果：** 失败
```
TypeError: Cannot create property 'user' on string 'eyJhY2Nlc3NfdG9rZW4i...'
```
**原因：** 去掉前缀后，Supabase 不再尝试 base64 解码，而是把字符串当成原始值使用，字符串不能设置属性。

#### 尝试 2：在 server.ts 中用 `atob()` 解码 base64

```typescript
if (cookie.value.startsWith('base64-')) {
  const decoded = atob(cookie.value.substring(7));
  return { ...cookie, value: decoded };
}
```

**结果：** 失败
```
DOMException [InvalidCharacterError]: Invalid character
```
**原因：** `atob()` 不支持 base64url 中的 `-` 和 `_` 字符（URL-safe base64）。

#### 尝试 3：在 server.ts 中用 `Buffer.from()` 解码

```typescript
const decoded = Buffer.from(base64Value, 'base64').toString('utf-8');
```

**结果：** 失败
```
Error: Invalid UTF-8 sequence
```
**原因：** 解码后的字节序列无法通过 `TextDecoder({fatal: true})` 的 UTF-8 验证。

#### 尝试 4：自定义浏览器客户端 Cookie 存储

```typescript
// client.ts 中自定义 cookies 配置
cookies: {
  set(name, value, options) {
    const cookieValue = JSON.stringify(value);
    document.cookie = `${name}=${encodeURIComponent(cookieValue)}; path=/; SameSite=Lax`;
  }
}
```

**结果：** 失败，Cookie 格式更混乱。

---

### 第四轮：根本原因分析

**核心问题定位在 `@supabase/ssr` 的 `stringFromBase64URL` 函数：**

```
@supabase/ssr/dist/module/utils/base64url.js:98  →  stringFromBase64URL()
@supabase/ssr/dist/module/utils/base64url.js:195 →  stringFromUTF8()  ← 这里报错
```

**调用链：**
1. `createServerClient` → `cookies.getAll()` → 返回带 `base64-` 前缀的 Cookie
2. Supabase 内部 `getItem()` → 检测到 `base64-` 前缀 → 调用 `stringFromBase64URL()`
3. `stringFromBase64URL()` → 替换 URL-safe 字符 → `atob()` 解码 → `stringFromUTF8()` 转换
4. `stringFromUTF8()` 使用 `TextDecoder('utf-8', { fatal: true })` → **中文"阿锋"导致解码失败**

**根本原因：** `@supabase/ssr` 服务端的 base64url 解码实现（`atob` + `TextDecoder`）对包含非 ASCII 字符（如中文）的 Cookie 值处理存在兼容性问题。浏览器端的 `stringToBase64URL` 使用 `TextEncoder` 编码正确生成了 UTF-8 字节，但服务端的解码路径未能正确还原。

---

### 第五轮：采用 Supabase 官方 Middleware 方案

**参考：** [Supabase SSR Auth Guide - Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

**方案：** 在 Next.js middleware 中处理 session 刷新，避免 API 路由直接读取浏览器设置的 Cookie。

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();  // 直接从 request 读取
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();  // 自动刷新 session
  return supabaseResponse;
}
```

**预期效果：**
1. Middleware 在每个请求前通过 `request.cookies` 读取 Cookie
2. Supabase 客户端调用 `getUser()` 尝试解析 session
3. 如果 session 有效，将刷新后的 cookies 写入 response
4. 后续的 API 路由通过 `cookies()` 读取 middleware 写入的新 cookies

---

## 验证结果

**关键发现**：`@supabase/ssr` 的 `stringFromBase64URL` 函数本身**没有 bug**。

通过直接复制该函数的实现进行测试，确认能够正确解码包含中文（"阿锋"）的 base64url cookie 值。

**真正原因**：浏览器中残留了之前的旧格式 cookies。在排查过程中，多次修改了浏览器客户端（client.ts）的 cookie 存储方式，导致浏览器中存在格式不一致的旧 cookies。

## 解决步骤

需要执行以下操作才能验证修复：

1. **删除 `.next` 目录**（清除编译缓存）
2. **清除浏览器所有 cookies**（特别是 `sb-jgsxmiojijjjpvbfndvn-` 开头的）
3. **重启开发服务器**
4. **重新登录**
5. **测试个人中心页面**

| 修改文件 | 说明 |
|---------|------|
| `src/middleware.ts` | 添加 Supabase session 刷新 + 集成 rate limiting |
| `src/lib/supabase/server.ts` | 简化为标准配置，移除自定义 cookie 处理 |
| `src/lib/supabase/client.ts` | 恢复为标准配置 |
| `src/lib/utils/api-fetch.ts` | 新增统一 API 错误处理 |
| `src/lib/storage/redis-cache.ts` | Redis 延迟初始化 |
| `supabase/migrations/0005_fix_rls_infinite_recursion.sql` | RLS 无限递归修复 |
| `src/components/user/*.tsx` | 个人中心组件 |
| `src/app/user-center/**` | 个人中心页面 |

**测试结果：** ❌ 仍未完全解决，stats 接口仍返回 401

---

## 待尝试的下一步方案

### 方案 A：降级 @supabase/ssr 版本
检查是否存在版本兼容性问题，尝试使用不同版本的 `@supabase/ssr`。

### 方案 B：API 路由直接从请求头解析 Token
绕过 Supabase 的 cookie 读取机制，手动从 Cookie 中提取 access_token：

```typescript
// 在 API route 中
const cookieHeader = req.headers.get('cookie');
const authToken = cookieHeader
  ?.match(/sb-[^-]+-auth-token=base64-([^;]+)/)?.[1];
if (authToken) {
  const session = JSON.parse(Buffer.from(authToken, 'base64url').toString('utf-8'));
  const accessToken = session.access_token;
  // 直接用 access_token 调用 supabase.auth.getUser(jwt)
}
```

### 方案 C：使用 Authorization Header 传递 Token
在客户端请求时将 access_token 放到 `Authorization: Bearer <token>` 头中，服务端从 header 获取。

### 方案 D：检查 @supabase/ssr 源码中的 base64url 实现
直接查看并修复 `@supabase/ssr` 包中 `stringFromBase64URL` 的 UTF-8 解码问题。

---

## 相关文件索引

| 文件 | 作用 |
|------|------|
| `src/lib/supabase/client.ts` | 浏览器端 Supabase 客户端 |
| `src/lib/supabase/server.ts` | 服务端 Supabase 客户端 |
| `src/middleware.ts` | Next.js 中间件（rate limiting + session refresh） |
| `src/lib/auth/middleware.ts` | 认证辅助函数（getCurrentUser, requireAuth） |
| `src/app/api/quota/stats/route.ts` | 配额统计 API |
| `src/app/api/user/stats/route.ts` | 用户统计 API |
| `src/lib/utils/api-fetch.ts` | 统一 API 请求工具 |
| `src/contexts/AuthContext.tsx` | 客户端认证上下文 |

## 时间线

| 时间 | 事件 |
|------|------|
| 2026-03-10 15:00 | 发现 stats 页面显示"请求过于频繁"（rate limit 问题） |
| 2026-03-10 15:30 | 修复 rate limiting，发现 stats 接口返回 401 |
| 2026-03-10 16:00 | 开始排查 Cookie 格式问题 |
| 2026-03-10 16:30 | 定位到 `base64-` 前缀 + UTF-8 解码问题 |
| 2026-03-10 17:00 | 尝试多种 cookie 转换方案，均失败 |
| 2026-03-10 17:30 | 发现 `Cannot create property 'user' on string` 和 `Invalid UTF-8 sequence` 两个错误 |
| 2026-03-10 18:00 | 采用 Supabase 官方 middleware 方案 |
| 2026-03-10 18:30 | 提交 commit 503bc44，测试仍未通过 |
| 2026-03-10 19:00 | 生成修复记录文档 |
