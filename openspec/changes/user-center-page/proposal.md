# 用户中心页面

## Why

当前系统缺少用户个人中心，用户无法查看和管理自己的账户信息、修改密码、查看使用统计数据。这影响了用户体验和账户安全性。提供完整的用户中心是提升用户满意度和系统安全性的基础功能。

## What Changes

**新增功能：**
- 创建用户中心页面 `/user-center`，包含多个子页面
- 用户资料展示：显示邮箱、用户名、头像、账户状态、注册时间等信息
- 用户资料编辑：允许用户修改用户名和上传头像
- 密码修改：提供安全的密码修改功能，需要验证当前密码
- 使用统计：显示 PDF 上传次数、聊天次数、最近活动记录、历史趋势数据
- 邮箱验证状态：显示邮箱是否已验证，未验证时提供重新发送验证邮件的功能

**UI/UX 改进：**
- 使用 Ant Design 组件保持与其他页面一致的设计风格
- 采用卡片式布局，清晰区分不同功能模块
- 提供直观的导航菜单，方便用户在不同功能间切换
- 所有操作提供即时反馈和错误提示

## Capabilities

### New Capabilities

- `user-profile`: 用户资料管理，包括资料展示、编辑用户名、上传头像、查看邮箱验证状态
- `password-change`: 密码修改功能，验证当前密码后设置新密码
- `user-stats`: 用户使用统计，展示上传次数、聊天次数、最近活动和历史趋势数据
- `email-verification`: 邮箱验证管理，显示验证状态并支持重新发送验证邮件

### Modified Capabilities

无（这是全新功能，不修改现有规范）

## Impact

**新增代码：**
- `/user-center` 页面及相关子页面（`/user-center/profile`、`/user-center/change-password`、`/user-center/stats`）
- 用户中心布局组件 `src/components/user/UserCenterLayout.tsx`
- 各功能模块组件（`UserProfile.tsx`、`PasswordChange.tsx`、`UserStats.tsx`）

**API 接口：**
- 已存在的 API：`/api/user/profile`（GET/PUT）、`/api/user/change-password`（POST）、`/api/user/stats`（GET）、`/api/auth/resend-verification`（POST）

**依赖：**
- 使用现有的 Ant Design 组件库
- 使用现有的 Supabase 认证和数据库
- 使用现有的表单验证和错误处理机制

**数据库：**
- 使用现有的 `user_profiles` 表（已包含所有必需字段）
- 使用现有的 `quota_usage` 和 `user_pdfs` 表获取统计数据
