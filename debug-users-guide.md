# 用户数据获取问题排查指南

## 快速诊断

访问调试接口：
```bash
curl -X GET "http://localhost:3000/api/admin/debug-users" \
  -H "X-Admin-Token: YOUR_ADMIN_TOKEN"
```

或在浏览器控制台：
```javascript
fetch('/api/admin/debug-users', {
  headers: { 'X-Admin-Token': localStorage.getItem('adminToken') }
}).then(r => r.json()).then(console.log)
```

## 可能的原因和解决方案

### 1. Supabase 项目确实没有用户

**症状**: 
- 所有方法都成功，但 `userCount` 为 0
- `user_profiles` 表也为空

**解决方案**: 
1. 访问 Supabase Dashboard → Authentication → Users
2. 检查是否有用户
3. 如果没有，先注册一个测试用户

### 2. Service Role Key 无效

**症状**:
- `method2_directClient` 返回 401/403 错误
- 错误信息包含 "Invalid API key" 或 "Unauthorized"

**解决方案**:
```bash
# 1. 访问 Supabase Dashboard
# Settings → API → service_role (secret)

# 2. 更新 .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 环境变量未正确加载

**症状**:
- `config.hasServiceKey` 为 false
- `config.supabaseUrl` 为 undefined

**解决方案**:
```bash
# 检查环境变量
grep SUPABASE .env.local

# 重启开发服务器
npm run dev
```

### 4. 错误的项目 URL

**症状**:
- 连接到错误的 Supabase 项目
- 其他项目的数据

**解决方案**:
确认 `NEXT_PUBLIC_SUPABASE_URL` 指向正确的项目

### 5. Auth API 权限问题

**症状**:
- `method3_userProfiles` 有数据
- 但 `method1` 和 `method2` 的 auth.users 为空

**解决方案**:
1. 检查 Service Role Key 是否有 admin 权限
2. 确认使用的是 `service_role` 不是 `anon` key

## 验证配置正确性

```bash
# 在项目根目录执行
grep -E "SUPABASE|NEXT_PUBLIC_SUPABASE" .env.local
```

应该看到类似：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 直接检查 Supabase

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 进入 Authentication → Users
4. 查看是否有用户数据

如果 Dashboard 显示有用户，但 API 返回空，则是配置问题。
