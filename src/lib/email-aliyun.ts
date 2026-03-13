// 阿里云邮件服务 - DirectMail
// 使用 DirectMail API 发送邮件

// 阿里云 DirectMail 配置
const ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || '';
const ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
const ACCOUNT_NAME = process.env.ALIYUN_DM_ACCOUNT_NAME || '';
const REGION = process.env.ALIYUN_DM_REGION || 'cn-hangzhou';
const FROM_ADDRESS = process.env.ALIYUN_DM_FROM_ADDRESS || '';
const FROM_ALIAS = process.env.ALIYUN_DM_FROM_ALIAS || 'PDF AI Chat';

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
    .footer {
      background-color: #f9f9f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #999;
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
// 阿里云 DirectMail API 调用
// ============================================

/**
 * 阿里云 API 签名 (使用 HMAC-SHA1)
 */
function generateSignature(method: string, params: Record<string, string>, secret: string): string {
  // 1. 参数排序
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map((key) => `${specialEncode(key)}=${specialEncode(params[key])}`)
    .join('&');

  // 2. 构造待签名字符串
  const stringToSign = `${method}&${specialEncode('/')}&${specialEncode(canonicalizedQueryString)}`;

  // 3. 计算 HMAC-SHA1 签名
  const crypto = require('crypto');
  const signature = crypto.createHmac('sha1', `${secret}&`).update(stringToSign).digest('base64');

  return signature;
}

/**
 * URL 编码 (符合阿里云 API 规范)
 */
function specialEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\!/g, '%21')
    .replace(/\'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * 调用阿里云 DirectMail API (RPC 风格)
 */
async function callDirectMailAPI(action: string, params: Record<string, any>): Promise<any> {
  const crypto = require('crypto');

  // 公共参数
  const commonParams = {
    Format: 'JSON',
    Version: '2015-11-23',
    AccessKeyId: ACCESS_KEY_ID,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomBytes(16).toString('hex'),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString(),
    Action: action,
  };

  // 合并参数
  const allParams = { ...commonParams, ...params };

  // 生成签名
  const signature = generateSignature('GET', allParams, ACCESS_KEY_SECRET);
  allParams.Signature = signature;

  // 构造 URL
  const queryString = Object.keys(allParams)
    .sort()
    .map((key) => `${key}=${specialEncode(allParams[key])}`)
    .join('&');
  const url = `https://dm.${REGION}.aliyuncs.com/?${queryString}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.Code && data.Code !== 'OK') {
      throw new Error(`DirectMail API Error: ${data.Code} - ${data.Message}`);
    }

    return data;
  } catch (error) {
    console.error('[Aliyun Mail] API call failed:', error);
    throw error;
  }
}

/**
 * 发送单封邮件
 */
async function sendSingleMail(
  toAddress: string,
  subject: string,
  htmlBody: string
): Promise<string> {
  const accountName = ACCOUNT_NAME || '';
  const fromAlias = FROM_ALIAS || 'PDF AI Chat';

  const params = {
    AccountName: accountName,
    AddressType: 1,
    ReplyToAddress: false,
    ToAddress: toAddress,
    FromAlias,
    Subject: subject,
    HtmlBody: htmlBody,
  };

  const result = await callDirectMailAPI('SingleSendMail', params);

  return result.Env?.RequestId || result?.RequestId || 'unknown';
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
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !FROM_ADDRESS) {
    console.warn('⚠️ 阿里云邮件服务未配置，尝试使用 Resend 备用');

    // 降级到 Resend
    const { sendVerificationEmail: resendSend } = await import('./email');
    return resendSend(email, token, name);
  }

  try {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    const html = getVerificationEmailTemplate({ email, name, verifyUrl });

    console.log('[Aliyun Mail] 发送验证邮件到:', email);

    const messageId = await sendSingleMail(email, '验证您的邮箱地址 - PDF AI Chat', html);

    console.log('✓ 阿里云验证邮件发送成功:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('✗ 阿里云邮件发送失败:', error.message);

    // 降级到 Resend
    console.log('降级到 Resend 服务...');
    const { sendVerificationEmail: resendSend } = await import('./email');
    return resendSend(email, token, name);
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
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !FROM_ADDRESS) {
    const { sendPasswordResetEmail: resendSend } = await import('./email');
    return resendSend(email, token, name);
  }

  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const html = getPasswordResetEmailTemplate({ email, name, resetUrl });

    console.log('[Aliyun Mail] 发送密码重置邮件到:', email);

    const messageId = await sendSingleMail(email, '重置您的密码 - PDF AI Chat', html);

    console.log('✓ 阿里云密码重置邮件发送成功:', messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error('✗ 阿里云邮件发送失败:', error.message);

    // 降级到 Resend
    const { sendPasswordResetEmail: resendSend } = await import('./email');
    return resendSend(email, token, name);
  }
}

/**
 * 检查邮件服务是否可用
 */
export function isEmailServiceAvailable(): boolean {
  return !!(ACCESS_KEY_ID && ACCESS_KEY_SECRET && FROM_ADDRESS);
}
