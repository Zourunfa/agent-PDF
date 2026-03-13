# MailerSend 邮件服务配置指南

## 概述
已将邮件服务切换到 **MailerSend**，一个现代化的邮件服务提供商。

## 优势
✅ **免费 3000 封/月** - 非常慷慨的免费额度
✅ **支持 GitHub OAuth 注册** 🎉 - 无需繁琐的表单填写
✅ **可发送到任意邮箱** - 无收件人限制
✅ **界面友好** - 现代化的 UI，易于使用
✅ **国内访问稳定** - 不像某些服务可能被墙

---

## 快速开始（3 分钟配置）

### 1️⃣ 注册 MailerSend 账户

**方式一：GitHub 快速登录（推荐）**

1. 访问 [MailerSend 官网](https://www.mailersend.com/)
2. 点击 **"Sign up with GitHub"**
3. 授权 GitHub 账户
4. 填写基本信息并完成注册

**方式二：邮箱注册**

1. 访问 [MailerSend 官网](https://www.mailersend.com/)
2. 填写邮箱、密码等信息
3. 验证邮箱

### 2️⃣ 获取 API Token

1. 登录后，点击左侧菜单 **"API Tokens"**
2. 点击 **"+ Add API Token"**
3. 配置 Token：
   - **Name**: 输入名称（如 "PDF AI Chat"）
   - **Scopes**: 勾选 **"Email" > "Send email"** 权限
   - **Domain**: 选择 "All domains" 或特定域名
4. 点击 **"Create API Token"**
5. **重要**: 复制生成的 API Token（只显示一次！）
   - 格式类似：`mlsn.xxxxxxxxxxxxx`

### 3️⃣ 验证发件人邮箱

**测试时，可以使用个人邮箱（如 1804491927@qq.com）：**

1. 点击左侧菜单 **"Sender Domains"**
2. 点击 **"+ Add domain"**
3. 输入你的邮箱域名（如 `qq.com`）或完整的邮箱地址
4. 根据提示验证：
   - 如果是自己的域名：添加 DNS 记录
   - 如果是免费邮箱：通过验证邮件确认

> 💡 **测试时建议**：使用 QQ 邮箱或 Gmail 等常用邮箱作为发件人，验证流程最简单

### 4️⃣ 配置环境变量

编辑 `.env.local` 文件：

```bash
# MailerSend Email Configuration
MAILERSEND_API_KEY=mlsn.your-api-token-here
MAILERSEND_SENDER_EMAIL=1804491927@qq.com  # 你的邮箱
MAILERSEND_SENDER_NAME=PDF AI Chat
```

### 5️⃣ 验证配置

重启开发服务器：

```bash
npm run dev
```

尝试注册一个新用户，检查是否收到验证邮件。

---

## 使用场景

### 用户注册验证
```typescript
import { sendVerificationEmail } from '@/lib/email-mailersend';

await sendVerificationEmail(
  'user@example.com',
  'verification_token_here',
  'User Name'
);
```

### 密码重置
```typescript
import { sendPasswordResetEmail } from '@/lib/email-mailersend';

await sendPasswordResetEmail(
  'user@example.com',
  'reset_token_here',
  'User Name'
);
```

---

## 常见问题

### Q: 邮件没有发送？
**A:** 检查以下几点：
1. API Token 是否正确配置在 `.env.local`
2. API Token 是否有 **"Email send"** 权限
3. 发件人邮箱是否已验证
4. 查看 MailerSend Dashboard 的 **"Logs"** 标签

### Q: 收到错误 "Unauthorized" 或 "401"
**A:** 表示 API Token 无效或权限不足：
1. 检查 API Token 是否正确复制
2. 确认 Token 有 "Email send" 权限

### Q: 收到错误 "Sender domain not verified"
**A:** 发件人域名未验证，请按照步骤 3 验证发件人邮箱。

### Q: 如何测试邮件发送？
**A:** 在 MailerSend Dashboard 的 **"Logs"** 标签中可以看到所有发送的邮件记录。

### Q: 免费额度用完了怎么办？
**A:** 免费版每月 3000 封，用完后：
1. 等待下个月重置
2. 升级到付费计划（$0.77/1000 封）

### Q: 可以用临时邮箱测试吗？
**A:** 不建议。MailerSend 可能会拒绝某些临时邮箱域名。建议使用 QQ、Gmail 等正规邮箱。

---

## 迁移说明

### 从其他邮件服务迁移

**从 Brevo 迁移：**
```bash
# 移除
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=...

# 替换为
MAILERSEND_API_KEY=mlsn.your-key
MAILERSEND_SENDER_EMAIL=your@email.com
MAILERSEND_SENDER_NAME=PDF AI Chat
```

**从 Resend 迁移：**
```bash
# 移除
RESEND_API_KEY=...

# 替换为
MAILERSEND_API_KEY=mlsn.your-key
MAILERSEND_SENDER_EMAIL=your@email.com
MAILERSEND_SENDER_NAME=PDF AI Chat
```

---

## 相关文档
- [MailerSend 官方文档](https://developers.mailersend.com/)
- [MailerSend API 参考](https://developers.mailersend.com/api/v1/email)
- [GitHub 注册教程](https://www.mailersend.com/blog/how-to-sign-up-for-mailersend-with-github)

---

## 支持的第三方登录

MailerSend 支持多种第三方快速注册：
- ✅ **GitHub** - 推荐
- ✅ Google
- ✅ Facebook
- ✅ LinkedIn

---

## 支持
如有问题，请：
1. 查看 MailerSend Dashboard 的错误日志
2. 参考 [MailerSend 文档](https://developers.mailersend.com/)
3. 联系 MailerSend 客服团队（响应很快）
