// Brevo (原 Sendinblue) 邮件服务
// 免费 300 封/天，可发送到任意邮箱

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@yourdomain.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'PDF AI Chat';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * 发送邮件结果
 */
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 邮件模板变量
 */
interface EmailTemplateVars {
  email: string;
  name?: string;
  token?: string;
  verifyUrl?: string;
  resetUrl?: string;
  expiryHours?: number;
}

// ============================================
// 邮件模板
// ============================================

/**
 * 验证邮件模板
 */
function getVerificationEmailTemplate(vars: EmailTemplateVars): string {
  const { email, name = email.split('@')[0], verifyUrl, expiryHours = 24 } = vars;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>验证您的邮箱地址</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      margin-bottom: 30px;
      color: #666;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #999;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>验证您的邮箱地址</h1>
    </div>
    <div class="content">
      <p class="greeting">您好，${name}！</p>
      <p class="message">
        感谢您注册 PDF AI Chat。为了确保账户安全，请点击下面的按钮验证您的邮箱地址：
      </p>
      <div class="button-container">
        <a href="${verifyUrl}" class="button" target="_blank">验证邮箱地址</a>
      </div>
      <p class="message">
        或者复制以下链接到浏览器中打开：<br>
        <a href="${verifyUrl}" style="word-break: break-all; color: #667eea;">${verifyUrl}</a>
      </p>
      <div class="warning">
        <strong>⚠️ 重要提示：</strong>此验证链接将在 ${expiryHours} 小时后过期。如果您没有注册 PDF AI Chat 账户，请忽略此邮件。
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PDF AI Chat. 保留所有权利。</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 密码重置邮件模板
 */
function getPasswordResetEmailTemplate(vars: EmailTemplateVars): string {
  const { email, name = email.split('@')[0], resetUrl, expiryHours = 1 } = vars;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>重置您的密码</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      margin-bottom: 30px;
      color: #666;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #999;
    }
    .footer a {
      color: #f5576c;
      text-decoration: none;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
    }
    .security-note {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>重置您的密码</h1>
    </div>
    <div class="content">
      <p class="greeting">您好，${name}！</p>
      <p class="message">
        我们收到了您账户的密码重置请求。如果这是您发起的，请点击下面的按钮重置密码：
      </p>
      <div class="button-container">
        <a href="${resetUrl}" class="button" target="_blank">重置密码</a>
      </div>
      <p class="message">
        或者复制以下链接到浏览器中打开：<br>
        <a href="${resetUrl}" style="word-break: break-all; color: #f5576c;">${resetUrl}</a>
      </p>
      <div class="warning">
        <strong>⏰ 有效期：</strong>此重置链接将在 ${expiryHours} 小时后过期。
      </div>
      <div class="security-note">
        <strong>🔒 安全提示：</strong>如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。如果您认为自己的账户已被入侵，请立即联系我们的客服团队。
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PDF AI Chat. 保留所有权利。</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// Brevo API 调用
// ============================================

/**
 * 调用 Brevo API 发送邮件
 */
async function sendEmailViaBrevo(
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<string> {
  const url = 'https://api.brevo.com/v3/smtp/email';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: BREVO_SENDER_EMAIL,
        name: BREVO_SENDER_NAME,
      },
      to: [
        {
          email: toEmail,
          name: toName,
        },
      ],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.messageId || 'unknown';
}

// ============================================
// 公开接口
// ============================================

/**
 * 发送验证邮件
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<SendEmailResult> {
  // 检查配置
  if (!BREVO_API_KEY) {
    console.error('Brevo API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    const displayName = name || email.split('@')[0];
    const html = getVerificationEmailTemplate({ email, name: displayName, verifyUrl });

    console.log('[Brevo] 发送验证邮件到:', email);

    const messageId = await sendEmailViaBrevo(
      email,
      displayName,
      '验证您的邮箱地址 - PDF AI Chat',
      html
    );

    console.log('✓ Brevo 验证邮件发送成功:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('✗ Brevo 邮件发送失败:', error.message);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
): Promise<SendEmailResult> {
  // 检查配置
  if (!BREVO_API_KEY) {
    console.error('Brevo API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const displayName = name || email.split('@')[0];
    const html = getPasswordResetEmailTemplate({ email, name: displayName, resetUrl });

    console.log('[Brevo] 发送密码重置邮件到:', email);

    const messageId = await sendEmailViaBrevo(
      email,
      displayName,
      '重置您的密码 - PDF AI Chat',
      html
    );

    console.log('✓ Brevo 密码重置邮件发送成功:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('✗ Brevo 邮件发送失败:', error.message);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * 检查邮件服务是否可用
 */
export function isEmailServiceAvailable(): boolean {
  return !!BREVO_API_KEY;
}
