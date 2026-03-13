# Resend 邮件服务配置指南

## 概述
已将邮件服务从 Gmail + Nodemailer 迁移到 **Resend**，一个专为开发者设计的现代邮件服务。

## 优势
✅ 无需配置复杂的 Gmail 应用密码  
✅ 免费额度：100 emails/day  
✅ 开箱即用，无需域名配置  
✅ 更好的可靠性和送达率  
✅ 完整的 API 文档和支持  

---

## 快速开始

### 1️⃣ 获取 Resend API Key

1. 访问 [Resend 官网](https://resend.com)
2. 点击 **Sign Up** 注册账户
3. 验证邮箱后，进入 Dashboard
4. 左侧菜单 → **API Keys**
5. 点击 **Create API Key**
6. 复制生成的 API Key

### 2️⃣ 配置环境变量

编辑 `.env.local` 文件：

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
```

替换 `re_your_api_key_here` 为你的实际 API Key。

### 3️⃣ 验证配置

重启开发服务器后，邮件服务会自动启用：

```bash
npm run dev
```

---

## 使用场景

### 用户注册验证
```typescript
import { sendVerificationEmail } from '@/lib/email';

await sendVerificationEmail(
  'user@example.com',
  'verification_token_here',
  'User Name'
);
```

### 密码重置
```typescript
import { sendPasswordResetEmail } from '@/lib/email';

await sendPasswordResetEmail(
  'user@example.com',
  'reset_token_here',
  'User Name'
);
```

### 欢迎邮件
```typescript
import { sendWelcomeEmail } from '@/lib/email';

await sendWelcomeEmail('user@example.com', 'User Name');
```

---

## 常见问题

### Q: 邮件没有发送？
**A:** 检查以下几点：
1. API Key 是否正确配置在 `.env.local`
2. 收件人邮箱是否正确
3. 查看 Resend Dashboard 的 **Logs** 标签查看错误信息

### Q: 如何测试邮件发送？
**A:** 在 Resend Dashboard 的 **Emails** 标签中可以看到所有发送的邮件记录。

### Q: 免费额度用完了怎么办？
**A:** 升级到付费计划，按实际使用量计费（通常 $0.0005 per email）。

### Q: 能否自定义发件人地址？
**A:** 目前使用 `noreply@resend.dev`。升级到付费计划后可配置自定义域名。

---

## 迁移说明

### 已移除的配置
以下 Gmail 相关配置已不再需要：
```bash
# 已弃用
EMAIL_SERVICE=gmail
EMAIL_USER=wangfengaf@gmail.com
EMAIL_PASSWORD=hgzy zihi wsvb wsqo
```

### 代码变更
- `src/lib/email.ts` - 已更新为使用 Resend API
- 所有邮件发送函数保持相同的接口，无需修改调用代码

---

## 相关文档
- [Resend 官方文档](https://resend.com/docs)
- [Resend API 参考](https://resend.com/docs/api-reference)
- [邮件模板最佳实践](https://resend.com/docs/templates)

---

## 支持
如有问题，请：
1. 查看 Resend Dashboard 的错误日志
2. 参考 [Resend 文档](https://resend.com/docs)
3. 联系 Resend 支持团队
