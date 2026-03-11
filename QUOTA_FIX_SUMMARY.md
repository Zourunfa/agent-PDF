# 配额系统修复总结

## 问题描述
配额系统出现了无限递归错误和列名不匹配的问题：
- `infinite recursion detected in policy for relation "user_profiles"`
- `column quota_definitions.quota_type does not exist`

## 根本原因
1. **RLS 无限递归**：管理员策略中直接查询 `user_profiles` 表导致循环依赖
2. **列名不匹配**：代码使用的列名与数据库实际列名不一致
   - 代码期望：`quota_type`, `is_default`, `quota_limit`, `amount`
   - 实际列名：`name`, `default_limit`, `premium_limit`, `admin_limit`, `usage_count`, `usage_date`

## 修复内容

### 1. 修复 RLS 无限递归 (`supabase/migrations/0005_fix_rls_infinite_recursion.sql`)
- 创建 `is_admin()` SECURITY DEFINER 函数来检查管理员角色
- 使用函数替代直接的 RLS 策略查询，避免循环依赖
- 重新创建所有管理员相关的 RLS 策略

### 2. 更新配额检查逻辑 (`src/lib/quota/check.ts`)
**修改的函数：**
- `getUserQuotaDefinition()`: 使用 `name` 列而不是 `quota_type`
- `getUserUsageToday()`: 使用 `usage_count` 和 `usage_date` 列
- `canUploadPDF()`: 使用 `default_limit` 而不是 `quota_limit`
- `canChat()`: 使用 `default_limit` 而不是 `quota_limit`
- `recordQuotaUsage()`: 使用 `usage_count` 和 `usage_date` 列

**参数名称变更：**
- `quotaType` → `quotaName` (使用配额定义的 `name` 字段)
- `'pdf_upload_daily'` → `'pdf_uploads_daily'`
- `'pdf_chat_daily'` → `'ai_calls_daily'`

### 3. 更新 API 调用 (`src/app/api/upload/route.ts`, `src/app/api/chat/route.ts`)
- 更新 `recordQuotaUsage()` 调用使用新的参数名称
- `'pdf_upload_daily'` → `'pdf_uploads_daily'`
- `'pdf_chat_daily'` → `'ai_calls_daily'`

### 4. 更新用户统计 API (`src/app/api/user/stats/route.ts`)
- 修改聊天次数计算逻辑，使用 `quota_id` 而不是 `quota_type`
- 获取 `ai_calls_daily` 配额定义的 ID 进行比较
- 使用 `usage_count` 而不是 `amount`

### 5. 更新测试文件
**单元测试** (`__tests__/unit/quota-check.test.ts`):
- 更新 `recordQuotaUsage` 测试的 mock 数据
- 更新配额类型测试

**E2E 测试** (`__tests__/e2e/quota-enforcement.test.ts`):
- 更新配额定义查询使用 `name` 字段
- 更新 `quota_usage` 查询使用 `usage_count` 和 `usage_date`

**集成测试** (`__tests__/integration/quota-system.test.ts`):
- 更新所有配额查询和插入操作
- 使用 `usage_count` 而不是 `amount`
- 使用 `usage_date` 而不是 `created_at` 进行日期过滤

## 数据库表结构对应关系

### quota_definitions 表
| 代码期望 | 实际列名 | 说明 |
|---------|---------|------|
| quota_type | name | 配额类型标识符 |
| is_default | (无) | 所有定义都是默认的 |
| quota_limit | default_limit | 免费用户默认限制 |
| - | premium_limit | 高级用户限制 |
| - | admin_limit | 管理员限制 |

### quota_usage 表
| 代码期望 | 实际列名 | 说明 |
|---------|---------|------|
| quota_type | quota_id | 关联到 quota_definitions.id |
| amount | usage_count | 使用次数 |
| created_at | usage_date | 使用日期 (DATE 类型) |
| resource_id | (无) | 不存在此列 |

## 配额定义名称映射
| 旧名称 | 新名称 | 说明 |
|--------|--------|------|
| pdf_upload_daily | pdf_uploads_daily | PDF 上传每日限制 |
| pdf_chat_daily | ai_calls_daily | AI 调用每日限制 |

## 验证步骤
1. 执行迁移文件 `0005_fix_rls_infinite_recursion.sql`
2. 测试用户登录和个人中心访问
3. 测试 PDF 上传功能
4. 测试聊天功能
5. 检查配额统计 API 响应

## 相关文件列表
- `src/lib/quota/check.ts` - 配额检查逻辑
- `src/app/api/quota/stats/route.ts` - 配额统计 API
- `src/app/api/user/stats/route.ts` - 用户统计 API
- `src/app/api/upload/route.ts` - PDF 上传 API
- `src/app/api/chat/route.ts` - 聊天 API
- `supabase/migrations/0005_fix_rls_infinite_recursion.sql` - RLS 修复迁移
- `__tests__/unit/quota-check.test.ts` - 单元测试
- `__tests__/e2e/quota-enforcement.test.ts` - E2E 测试
- `__tests__/integration/quota-system.test.ts` - 集成测试
