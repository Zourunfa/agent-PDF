# Brevo 邮件服务配置指南

## 概述
已将邮件服务切换到 **Brevo**（原 Sendinblue），一个免费的邮件服务提供商。

## 优势
✅ **免费 300 封/天** - 比大多数免费服务慷慨
✅ **可发送到任意邮箱** - 无收件人限制
✅ **配置简单** - 只需 API Key 即可使用
✅ **国内访问稳定** - 不像其他服务可能被墙

---

## 快速开始（5 分钟配置）

### 1️⃣ 注册 Brevo 账户

1. 访问 [Brevo 官网](https://www.brevo.com/)
2. 点击 **Sign Up** 注册账户
3. 使用邮箱注册并验证

### 2️⃣ 获取 API Key

1. 登录后，点击右上角头像 → **Settings**
2. 左侧菜单 → **API keys**
3. 点击 **Generate a new API key**
4. 输入名称（如 "PDF AI Chat"）
5. 复制生成的 API Key（格式：`xkeysib-...`）

### 3️⃣ 验证发件人邮箱（重要！）

**首次使用必须验证发件人邮箱，否则无法发送邮件：**

1. 左侧菜单 → **Senders**（或 **Campaigns** > **Senders**）
2. 点击 **New sender** 或 **+ Add a sender**
3. 填写发件人信息：
   - **From**: 填写你的邮箱（如 `noreply@yourdomain.com` 或你的个人邮箱）
   - **Name**: 填写发件人名称（如 "PDF AI Chat"）
4. Brevo 会发送验证邮件到该邮箱
5. 查收邮件并点击验证链接
6. 等待状态变为 **Verified**

> 💡 **提示**：测试时可以直接使用你的个人邮箱（如 1804491927@qq.com）作为发件人

### 4️⃣ 配置环境变量

编辑 `.env.local` 文件：

```bash
# Brevo Email Configuration
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=1804491927@qq.com  # 使用你验证过的邮箱
BREVO_SENDER_NAME=PDF AI Chat
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
import { sendVerificationEmail } from '@/lib/email-brevo';

await sendVerificationEmail(
  'user@example.com',
  'verification_token_here',
  'User Name'
);
```

### 密码重置
```typescript
import { sendPasswordResetEmail } from '@/lib/email-brevo';

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
1. API Key 是否正确配置在 `.env.local`
2. **发件人邮箱是否已验证**（这是最常见的错误原因）
3. 查看 Brevo Dashboard 的 **Logs** 标签查看错误信息

### Q: 收到错误 "Sender email is not verified"
**A:** 这表示发件人邮箱未验证。请按照步骤 3 验证发件人邮箱。

### Q: 如何测试邮件发送？
**A:** 在 Brevo Dashboard 的 **Transactional** > **Emails** 标签中可以看到所有发送的邮件记录。

### Q: 免费额度用完了怎么办？
**A:** 升级到付费计划，或等待第二天重置（免费版每天 300 封）。

### Q: 能否使用企业邮箱作为发件人？
**A:** 可以，但需要：
1. 在 Brevo 中验证该邮箱
2. 在 DNS 中添加 SPF/DKIM 记录（提升送达率）

---

## 迁移说明

### 已移除的配置
以下邮件服务配置已不再需要：
```bash
# 已弃用 - Resend（免费版有收件人限制）
RESEND_API_KEY=...

# 已弃用 - 阿里云 DirectMail（需要付费）
ALIYUN_ACCESS_KEY_ID=...
ALIYUN_ACCESS_KEY_SECRET=...
```

### 代码变更
- `src/lib/email-brevo.ts` - 新的 Brevo 邮件服务实现
- 所有 API 路由已更新为使用 Brevo

---

## 相关文档
- [Brevo 官方文档](https://developers.brevo.com/)
- [Brevo API 参考](https://developers.brevo.com/reference/sendtransacemail)
- [邮件模板最佳实践](https://help.brevo.com/hc/en-us/articles/115000163953)

---

## 支持
如有问题，请：
1. 查看 Brevo Dashboard 的错误日志
2. 参考 [Brevo 文档](https://developers.brevo.com/)
3. 联系 Brevo 客服团队
