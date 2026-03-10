// 邮件服务 - 使用 Nodemailer + Gmail
import nodemailer from 'nodemailer';

// 初始化 Nodemailer 传输
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null;

// 应用 URL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * 邮件类型
 */
export type EmailType = 'verification' | 'password-reset' | 'welcome';

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
        <a href="${verifyUrl}" class="button">验证邮箱地址</a>
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
      <p>
        如果您有任何问题，请联系我们的
        <a href="mailto:support@example.com">客服团队</a>
      </p>
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
        <a href="${resetUrl}" class="button">重置密码</a>
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
      <p>
        如果您有任何问题，请联系我们的
        <a href="mailto:support@example.com">客服团队</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// 邮件发送函数
// ============================================

/**
 * 发送验证邮件
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<SendEmailResult> {
  if (!transporter) {
    console.error('Email service not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    const html = getVerificationEmailTemplate({ email, name, verifyUrl });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '验证您的邮箱地址 - PDF AI Chat',
      html,
    });

    console.log('Verification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
  if (!transporter) {
    console.error('Email service not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const html = getPasswordResetEmailTemplate({ email, name, resetUrl });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '重置您的密码 - PDF AI Chat',
      html,
    });

    console.log('Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 发送欢迎邮件（可选功能）
 */
export async function sendWelcomeEmail(
  email: string,
  name?: string
): Promise<SendEmailResult> {
  if (!transporter) {
    console.error('Email service not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const displayName = name || email.split('@')[0];

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '欢迎加入 PDF AI Chat！',
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>欢迎加入 PDF AI Chat</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>欢迎加入 PDF AI Chat，${displayName}！</h1>
            <p>感谢您的注册。我们很高兴您能加入我们。</p>
            <p>您可以开始上传 PDF 文件并与 AI 进行对话了。</p>
            <p>如果您有任何问题，请随时联系我们的客服团队。</p>
            <a href="${APP_URL}" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">开始使用</a>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 检查邮件服务是否可用
 */
export function isEmailServiceAvailable(): boolean {
  return !!transporter;
}
