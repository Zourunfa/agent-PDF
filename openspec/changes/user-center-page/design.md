# 用户中心页面设计

## Context

当前系统已实现用户认证功能（登录、注册、邮箱验证）和基本的 API 接口（用户资料、密码修改、统计数据），但缺少用户中心前端页面。用户无法通过界面查看和管理自己的账户信息。

**当前状态：**
- 后端 API 已完整实现：`/api/user/profile`、`/api/user/change-password`、`/api/user/stats`
- 数据库表已存在：`user_profiles`、`quota_usage`、`user_pdfs`
- UI 框架：Ant Design 已在登录/注册页面中使用
- 认证系统：Supabase Auth 已配置

**约束条件：**
- 必须使用 Ant Design 组件以保持 UI 一致性
- 必须复用现有的 API 接口，不修改后端逻辑
- 必须遵循现有的代码结构和风格

## Goals / Non-Goals

**Goals：**
1. 提供完整的用户中心界面，包含资料展示、编辑、密码修改、统计查看功能
2. 实现直观的导航，让用户轻松访问不同功能模块
3. 提供良好的用户体验，包括加载状态、错误提示、成功反馈
4. 确保数据安全性（密码修改需要验证当前密码）

**Non-Goals：**
- 不修改后端 API 接口
- 不修改数据库表结构
- 不实现用户权限管理（管理员/普通用户）
- 不实现账户删除功能

## Decisions

### 1. 页面结构和路由设计

**决策：** 采用嵌套路由结构，使用 `/user-center` 作为基础路径

**理由：**
- 清晰的 URL 结构，易于理解和维护
- 支持浏览器前进/后退
- 便于未来扩展更多子功能

**路由设计：**
- `/user-center` - 主页面（默认显示资料页）
- `/user-center/profile` - 用户资料（显示当前路由）
- `/user-center/change-password` - 修改密码
- `/user-center/stats` - 使用统计

### 2. 布局方案

**决策：** 使用侧边栏导航 + 内容区域的两栏布局

**理由：**
- 用户中心功能较多，侧边栏导航更清晰
- 符合常见用户中心的设计模式
- 易于扩展新功能

**布局组件：**
- `UserCenterLayout` - 主布局组件，包含侧边栏导航和内容区域
- 侧边栏显示导航菜单（头像、用户名、功能列表）
- 内容区域根据路由动态渲染对应组件

### 3. 组件架构

**决策：** 按功能模块拆分组件，每个组件独立维护

**组件结构：**
```
src/app/user-center/
├── page.tsx                    # 主页面（重定向到 profile）
├── layout.tsx                  # 布局组件
├── profile/
│   └── page.tsx                # 资料页面
├── change-password/
│   └── page.tsx                # 密码修改页面
└── stats/
    └── page.tsx                # 统计页面

src/components/user/
├── UserCenterLayout.tsx        # 侧边栏布局组件
├── UserProfile.tsx             # 用户资料组件
├── PasswordChange.tsx          # 密码修改组件
└── UserStats.tsx               # 统计数据组件
```

### 4. 状态管理

**决策：** 使用 React 本地状态，不引入全局状态管理

**理由：**
- 用户中心功能相对独立，不需要跨组件共享状态
- 减少复杂度和依赖
- 使用 Ant Design Form 组件管理表单状态

**状态管理策略：**
- 使用 `useState` 管理加载状态、错误状态
- 使用 Ant Design `Form` 组件管理表单数据
- 使用 `useEffect` 在组件挂载时获取初始数据

### 5. 数据获取策略

**决策：** 使用客户端 `fetch` 调用 API，结合 React hooks 管理状态

**理由：**
- 与现有登录/注册页面的实现方式一致
- 灵活处理错误和加载状态
- 支持数据重新获取（刷新）

**数据获取流程：**
```typescript
// 示例：获取用户资料
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };
  fetchProfile();
}, []);
```

### 6. UI 设计风格

**决策：** 复用登录/注册页面的设计风格

**设计元素：**
- 渐变背景：`linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)`
- 卡片样式：白色半透明背景，圆角，阴影
- 按钮样式：渐变紫色背景，圆角按钮
- 表单样式：垂直布局，清晰的标签和提示
- 图标使用：Ant Design Icons

### 7. 表单验证

**决策：** 使用 Ant Design Form 的验证规则，前后端双重验证

**理由：**
- 提供即时反馈，改善用户体验
- 减少不必要的 API 请求
- Ant Design Form 内置丰富的验证规则

**验证策略：**
- 前端验证：格式、长度、必填项
- 后端验证：业务逻辑、安全检查
- 显示友好的错误提示

### 8. 头像上传实现

**决策：** 使用 Ant Design Upload 组件，上传到 Supabase Storage

**理由：**
- Supabase Storage 已配置，可直接使用
- Ant Design Upload 提供良好的上传体验
- 支持图片预览和裁剪（可选）

**上传流程：**
1. 用户选择文件
2. 前端验证文件类型和大小
3. 上传到 Supabase Storage (`avatars` bucket)
4. 获取公共 URL
5. 更新 `user_profiles` 表的 `avatar_url` 字段
6. 显示上传成功提示

### 9. 统计图表实现

**决策：** 使用简单的 CSS 条形图，不引入图表库

**理由：**
- 减少依赖和包大小
- 统计数据相对简单（7 天趋势）
- CSS 实现足够满足需求
- 与现有设计风格一致

**图表设计：**
- 使用 Flexbox 布局
- 每天的数据用一个垂直条表示
- 高度根据数值百分比计算
- 鼠标悬停显示具体数值

## Risks / Trade-offs

### Risk 1: 头像上传可能失败
**风险：** Supabase Storage 配置不正确或网络问题导致上传失败
**缓解措施：**
- 提供明确的错误提示
- 实现重试机制
- 保留默认头像作为备选

### Risk 2: 统计数据查询性能
**风险：** 查询 7 天历史数据可能较慢
**缓解措施：**
- 后端已实现数据聚合逻辑
- 使用数据库索引优化查询
- 考虑添加缓存（如需要）

### Risk 3: 并发更新冲突
**风险：** 用户在多个标签页同时修改资料可能导致冲突
**缓解措施：**
- 每次提交前重新获取最新数据
- 使用乐观更新策略
- 后端实现版本控制（可选）

### Risk 4: 密码修改后的登录状态
**风险：** 密码修改后用户仍保持登录状态可能造成混淆
**缓解措施：**
- 修改成功后自动登出用户
- 显示明确的提示信息
- 强制用户使用新密码重新登录

## Migration Plan

### 部署步骤

1. **第一阶段：创建基础组件**
   - 实现 `UserCenterLayout` 布局组件
   - 实现路由结构
   - 实现导航菜单

2. **第二阶段：实现功能页面**
   - 实现用户资料页面
   - 实现密码修改页面
   - 实现统计页面

3. **第三阶段：集成和优化**
   - 集成所有功能模块
   - 添加加载状态和错误处理
   - 优化用户体验

4. **第四阶段：测试**
   - 功能测试
   - UI/UX 测试
   - 兼容性测试

### 回滚策略

- 使用 Git 版本控制，可随时回滚
- 新增功能不影响现有功能
- 如有严重问题，删除新页面即可
- 数据库无变更，无数据迁移风险

## Open Questions

1. **头像裁剪：** 是否需要提供头像裁剪功能？
   - 建议：第一版不支持，后续根据用户反馈决定

2. **统计图表：** 是否需要更复杂的图表类型？
   - 建议：使用简单的条形图，如有需求可引入图表库（如 Recharts）

3. **活动记录详情：** 是否需要查看每条活动的详细信息？
   - 建议：第一版只显示列表，后续可添加详情弹窗

4. **实时数据更新：** 统计数据是否需要实时更新？
   - 建议：第一版使用手动刷新，后续可考虑使用 WebSocket 或轮询
