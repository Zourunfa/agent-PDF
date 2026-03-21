# 用户删除功能问题分析与解决方案

## 问题描述

管理员在后台删除用户后，用户仍然出现在用户列表中，看起来删除操作没有生效。

## 问题表象

```javascript
// 删除操作日志
[Admin Delete User] ✓ 用户数据清理完成
[Admin Delete User] 尝试从 auth.users 删除用户...
[Admin Delete User] auth.users 中未找到用户，可能已被删除

// 刷新列表后
[Admin Users] 从 user_profiles 获取到用户: [
  {
    id: 'b969a004-032c-4486-b695-dd68d725b593',
    email: '1804491927@qq.com',
    name: '阿锋'
  }
]
```

## 根本原因

### 主要原因：浏览器缓存

**核心问题**：浏览器缓存了旧的 API 响应数据，导致即使服务器端删除成功，前端仍然显示缓存中的旧数据。

**缓存机制**：
- Next.js 默认会缓存 API 响应
- 浏览器也会缓存 HTTP 响应
- 即使数据库中的数据已被删除，前端仍显示缓存中的用户列表

### 次要问题

在排查过程中发现的代码问题：

1. **RPC 函数参数名不匹配**
   ```javascript
   // 代码调用
   await supabase.rpc('admin_delete_user_profile', {
     user_id: userId  // ← 使用 user_id
   });

   // 函数定义
   CREATE FUNCTION admin_delete_user_profile(target_user_id UUID)
   // ← 参数名是 target_user_id
   ```

2. **删除逻辑不完整**
   - 当 `user_profiles` 中找不到用户时，跳过了删除 `auth.users` 的步骤
   - 导致 `auth.users` 中的用户残留

## 解决方案

### 1. 解决缓存问题（主要方案）

#### 方案 A：配置 API 不使用缓存

在所有管理员 API 路由中添加：

```typescript
// src/app/api/admin/users/[id]/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

#### 方案 B：前端添加缓存破坏参数

```typescript
// 在 API 请求中添加时间戳
const cacheBuster = Date.now();
const response = await fetch(`/api/admin/users?t=${cacheBuster}`, {
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  }
});
```

#### 方案 C：删除成功后强制刷新

```typescript
const handleDeleteUser = async (userId: string) => {
  // 删除用户
  await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });

  // 清除本地缓存
  window.location.reload(); // 或者使用更优雅的刷新方式
};
```

### 2. 修复 RPC 函数参数问题

```sql
-- 删除旧函数
DROP FUNCTION IF EXISTS admin_delete_user_profile(UUID);

-- 创建新函数（参数名改为 user_id）
CREATE OR REPLACE FUNCTION admin_delete_user_profile(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
    result JSONB;
BEGIN
    DELETE FROM public.quota_operations WHERE user_id = user_id;
    DELETE FROM public.quota_usage WHERE user_id = user_id;
    DELETE FROM public.user_quotas WHERE user_id = user_id;
    DELETE FROM public.user_sessions WHERE user_id = user_id;
    DELETE FROM public.user_security_log WHERE user_id = user_id;
    DELETE FROM public.conversation_messages WHERE user_id = user_id;
    DELETE FROM public.pdf_conversations WHERE user_id = user_id;
    DELETE FROM public.user_pdfs WHERE user_id = user_id;
    DELETE FROM public.user_profiles WHERE id = user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    result := jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'user_id', user_id
    );

    RETURN result;
END;
$$;
```

或者修改代码调用：

```typescript
const { data: deleteResult, error: deleteError } = await supabase
  .rpc('admin_delete_user_profile', {
    target_user_id: userId  // 改为 target_user_id
  });
```

### 3. 完善删除逻辑

```typescript
// 即使 user_profiles 中找不到用户，也要尝试删除 auth.users
if (!user) {
  // 清理所有可能残留的数据
  await cleanupUserData(userId, supabase);

  // 重要：尝试删除 auth.users 中的用户
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const targetUser = allUsers?.users.find((u) => u.id === userId);

  if (targetUser) {
    await supabase.auth.admin.deleteUser(targetUser.id);
  }

  return NextResponse.json({ success: true });
}
```

## 完整解决流程

### 步骤 1：应用数据库 Migration

```sql
-- 1. 禁用触发器（如果有）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 创建删除函数
DROP FUNCTION IF EXISTS admin_delete_user_profile(UUID);

CREATE OR REPLACE FUNCTION admin_delete_user_profile(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
    result JSONB;
BEGIN
    DELETE FROM public.quota_operations WHERE user_id = target_user_id;
    DELETE FROM public.quota_usage WHERE user_id = target_user_id;
    DELETE FROM public.user_quotas WHERE user_id = target_user_id;
    DELETE FROM public.user_sessions WHERE user_id = target_user_id;
    DELETE FROM public.user_security_log WHERE user_id = target_user_id;
    DELETE FROM public.conversation_messages WHERE user_id = target_user_id;
    DELETE FROM public.pdf_conversations WHERE user_id = target_user_id;
    DELETE FROM public.user_pdfs WHERE user_id = target_user_id;
    DELETE FROM public.user_profiles WHERE id = target_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    result := jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'user_id', target_user_id
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_profile(UUID) TO service_role;
```

### 步骤 2：修改 API 代码

确保 API 路由配置正确：

```typescript
// src/app/api/admin/users/[id]/route.ts
export const dynamic = 'force-dynamic';  // ✅ 禁用缓存
export const revalidate = 0;              // ✅ 不重新验证缓存
```

### 步骤 3：前端优化删除流程

```typescript
const handleDeleteUser = async (userId: string, username: string) => {
  // 乐观删除：立即从列表中移除
  const previousUsers = [...users];
  setUsers(users.filter((u) => u.id !== userId));

  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Token': token || '',
        'Cache-Control': 'no-cache',  // ✅ 禁用缓存
      },
      cache: 'no-store',  // ✅ 禁用浏览器缓存
    });

    if (response.ok) {
      message.success(`用户 "${username}" 已删除`);
      // ✅ 刷新列表以确保数据同步
      await fetchUsers();
    } else {
      // 删除失败，恢复列表
      setUsers(previousUsers);
      message.error('删除失败');
    }
  } catch (error) {
    setUsers(previousUsers);
    message.error('删除失败');
  }
};
```

### 步骤 4：验证修复

1. 打开浏览器开发者工具
2. 进入 Network 标签
3. 勾选 "Disable cache"
4. 删除用户
5. 刷新列表，确认用户不再出现

## 经验总结

### 问题排查技巧

1. **检查缓存**：首先怀疑缓存问题，禁用缓存后重试
2. **查看网络请求**：检查 API 请求的响应头，确认缓存策略
3. **直接查询数据库**：在 Supabase Dashboard 中直接查询，确认数据是否真的被删除
4. **使用无痕模式**：在无痕模式下测试，排除本地缓存干扰

### 最佳实践

1. **管理员 API 应该禁用缓存**
   ```typescript
   export const dynamic = 'force-dynamic';
   export const revalidate = 0;
   ```

2. **删除操作后应该刷新数据**
   ```typescript
   await fetchUsers();  // 重新获取最新数据
   ```

3. **使用乐观删除 + 错误回滚**
   ```typescript
   const previousUsers = [...users];
   setUsers(users.filter((u) => u.id !== userId));
   // 如果失败，恢复：setUsers(previousUsers);
   ```

4. **RPC 函数参数名要与调用代码保持一致**

5. **删除操作要彻底**
   - 删除 `user_profiles`
   - 删除 `auth.users`
   - 删除所有关联数据

## 相关文件

- `/src/app/api/admin/users/[id]/route.ts` - 删除用户 API
- `/src/app/api/admin/users/route.ts` - 获取用户列表 API
- `/src/app/admin/users/page.tsx` - 管理员用户管理页面
- `/supabase/migrations/0009_admin_delete_user_function.sql` - 删除函数 Migration
- `/supabase/migrations/0010_disable_user_sync_triggers.sql` - 禁用触发器 Migration

## 更新日志

- 2026-03-20: 发现并修复缓存问题
- 2026-03-20: 修复 RPC 函数参数名不匹配问题
- 2026-03-20: 完善删除逻辑，确保删除 auth.users
