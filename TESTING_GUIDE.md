# 测试指南 - PDF 对话历史功能

## 🎯 测试目标

验证以下功能是否正常工作：
1. ✅ 页面加载时自动调用 `/api/pdfs/list` 接口
2. ✅ 选择 PDF 时自动调用 `/api/pdfs/{id}/conversations` 接口
3. ✅ 显示 PDF 列表和对话历史
4. ✅ 错误处理和加载状态

## 📋 前置条件

1. ✅ 数据库迁移已完成
   ```bash
   supabase migration up
   ```

2. ✅ 应用已启动
   ```bash
   npm run dev
   ```

3. ✅ 已登录用户账户

4. ✅ 已上传至少一个 PDF 文件

## 🧪 测试步骤

### 测试 1: 验证 PDF 列表 API 调用

**步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Network" 标签页
3. 刷新页面 (Ctrl+R 或 Cmd+R)
4. 查看网络请求列表

**预期结果**:
- ✅ 应该看到 `/api/pdfs/list` 请求
- ✅ 请求方法: GET
- ✅ 响应状态码: 200
- ✅ 响应数据包含 PDF 列表

**验证响应数据**:
1. 点击 `/api/pdfs/list` 请求
2. 切换到 "Response" 标签页
3. 查看响应数据结构

```json
{
  "success": true,
  "data": {
    "total": 5,
    "pdfs": [
      {
        "id": "uuid",
        "filename": "document.pdf",
        "fileSize": 1024000,
        "pageCount": 25,
        "parseStatus": "completed",
        "uploadedAt": "2026-03-10T08:00:00Z",
        "conversationCount": 5,
        "lastConversationAt": "2026-03-10T09:30:00Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 测试 2: 验证对话历史 API 调用

**步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Network" 标签页
3. 在 PDF 列表中点击一个 PDF
4. 查看网络请求列表

**预期结果**:
- ✅ 应该看到 `/api/pdfs/{id}/conversations` 请求
- ✅ 请求方法: GET
- ✅ 响应状态码: 200
- ✅ 响应数据包含对话消息

**验证响应数据**:
1. 点击 `/api/pdfs/{id}/conversations` 请求
2. 切换到 "Response" 标签页
3. 查看响应数据结构

```json
{
  "success": true,
  "data": {
    "pdfId": "uuid",
    "filename": "document.pdf",
    "pageCount": 25,
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "这个文档是关于什么的？",
        "createdAt": "2026-03-10T09:00:00Z"
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "这个文档是关于...",
        "createdAt": "2026-03-10T09:01:00Z",
        "tokens": 150,
        "processingTime": 2500
      }
    ],
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 2,
      "hasMore": false
    }
  }
}
```

### 测试 3: 验证控制台日志

**步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Console" 标签页
3. 刷新页面
4. 查看控制台日志

**预期结果**:
- ✅ 应该看到 `[PDFList] 正在获取 PDF 列表...` 日志
- ✅ 应该看到 `[PDFList] 获取到 X 个 PDF` 日志
- ✅ 选择 PDF 后应该看到 `[ConversationHistory] 正在获取对话历史: {id}` 日志
- ✅ 应该看到 `[ConversationHistory] 获取到 X 条消息` 日志

### 测试 4: 验证 UI 显示

**步骤**:
1. 刷新页面
2. 查看左侧 PDF 列表面板

**预期结果**:
- ✅ PDF 列表应该显示所有上传的 PDF
- ✅ 每个 PDF 应该显示文件名、大小、页数
- ✅ 应该显示对话数量和最后对话时间

**步骤**:
1. 点击一个 PDF
2. 切换到右侧面板的 "历史" 标签页

**预期结果**:
- ✅ 应该显示该 PDF 的对话历史
- ✅ 应该显示用户消息和 AI 回复
- ✅ 应该显示消息时间戳
- ✅ 应该显示对话统计信息

### 测试 5: 验证错误处理

**步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Network" 标签页
3. 点击 "Offline" 按钮（模拟离线）
4. 刷新页面

**预期结果**:
- ✅ 应该显示错误信息
- ✅ 应该显示 "获取 PDF 列表失败" 或类似错误

**步骤**:
1. 恢复网络连接
2. 点击刷新按钮或重新加载页面

**预期结果**:
- ✅ 应该重新加载数据
- ✅ 应该显示 PDF 列表

### 测试 6: 验证分页

**步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Console" 标签页
3. 执行以下命令：
   ```javascript
   fetch('/api/pdfs/list?limit=10&offset=0').then(r => r.json()).then(d => console.log(d))
   ```

**预期结果**:
- ✅ 应该返回最多 10 个 PDF
- ✅ 应该包含分页信息

### 测试 7: 验证排序

**步骤**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 "Console" 标签页
3. 执行以下命令：
   ```javascript
   fetch('/api/pdfs/list?sortBy=conversationCount&sortOrder=desc').then(r => r.json()).then(d => console.log(d))
   ```

**预期结果**:
- ✅ 应该按对话数量降序排列
- ✅ 对话数最多的 PDF 应该在最前面

## 🔍 调试技巧

### 查看完整的 API 响应

在浏览器控制台执行：
```javascript
// 获取 PDF 列表
fetch('/api/pdfs/list').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))

// 获取对话历史（替换 {PDF_ID}）
fetch('/api/pdfs/{PDF_ID}/conversations').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
```

### 检查认证令牌

在浏览器控制台执行：
```javascript
// 获取认证令牌
const token = localStorage.getItem('sb-jgsxmiojijjjpvbfndvn-auth-token')
console.log('Token:', token)

// 验证令牌是否有效
fetch('/api/pdfs/list', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(d => console.log(d))
```

### 查看数据库中的数据

在 Supabase 仪表板中执行 SQL：
```sql
-- 查看用户的 PDF
SELECT * FROM user_pdfs WHERE user_id = 'your-user-id';

-- 查看对话记录
SELECT * FROM pdf_conversations WHERE user_id = 'your-user-id';

-- 查看对话消息
SELECT * FROM conversation_messages WHERE user_id = 'your-user-id';
```

## ✅ 测试检查清单

- [ ] 页面加载时调用 `/api/pdfs/list` 接口
- [ ] 响应状态码为 200
- [ ] 响应数据包含 PDF 列表
- [ ] PDF 列表正确显示在 UI 中
- [ ] 选择 PDF 时调用 `/api/pdfs/{id}/conversations` 接口
- [ ] 响应状态码为 200
- [ ] 响应数据包含对话消息
- [ ] 对话历史正确显示在 UI 中
- [ ] 控制台日志正确显示
- [ ] 错误处理正常工作
- [ ] 分页功能正常工作
- [ ] 排序功能正常工作

## 🐛 常见问题

### Q: 为什么没有看到 API 请求？
A:
1. 检查浏览器开发者工具是否打开
2. 检查 Network 标签页是否显示所有请求
3. 检查是否有过滤条件隐藏了请求
4. 尝试刷新页面

### Q: 为什么 API 返回 401 错误？
A:
1. 检查是否已登录
2. 检查认证令牌是否有效
3. 检查令牌是否过期
4. 尝试重新登录

### Q: 为什么 API 返回 404 错误？
A:
1. 检查 PDF ID 是否正确
2. 检查 PDF 是否属于当前用户
3. 检查数据库中是否存在该 PDF

### Q: 为什么 API 返回 500 错误？
A:
1. 检查服务器日志
2. 检查数据库连接
3. 检查 RLS 策略是否正确配置
4. 尝试重启服务器

## 📊 性能测试

### 测试 API 响应时间

在浏览器控制台执行：
```javascript
// 测试 PDF 列表 API
console.time('PDF List API');
fetch('/api/pdfs/list').then(r => r.json()).then(d => console.timeEnd('PDF List API'));

// 测试对话历史 API
console.time('Conversation History API');
fetch('/api/pdfs/{PDF_ID}/conversations').then(r => r.json()).then(d => console.timeEnd('Conversation History API'));
```

**预期结果**:
- ✅ PDF 列表 API 应该在 500ms 内响应
- ✅ 对话历史 API 应该在 1000ms 内响应

## 📝 测试报告模板

```
测试日期: 2026-03-10
测试人员: [名字]
测试环境: [浏览器/操作系统]

测试结果:
- [ ] PDF 列表 API 调用: ✅ 通过 / ❌ 失败
- [ ] 对话历史 API 调用: ✅ 通过 / ❌ 失败
- [ ] UI 显示: ✅ 通过 / ❌ 失败
- [ ] 错误处理: ✅ 通过 / ❌ 失败
- [ ] 性能: ✅ 通过 / ❌ 失败

问题描述:
[描述任何发现的问题]

建议:
[提出改进建议]
```

---

**最后更新**: 2026 年 3 月 10 日
**状态**: ✅ 测试指南完成
