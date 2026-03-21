/**
 * Admin Authentication Utilities
 * 管理员认证工具
 */

// 管理员凭证（从环境变量读取，硬编码仅用于开发）
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aa123321';

/**
 * 验证管理员登录
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * 生成管理员会话令牌
 */
export function generateAdminToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`admin:${timestamp}:${random}`).toString('base64');
}

/**
 * 验证管理员令牌
 */
export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded.startsWith('admin:');
  } catch {
    return false;
  }
}

/**
 * 从请求头获取管理员信息（服务端）
 */
export async function getAdminFromHeaders(headers: Headers): { isAdmin: boolean; error?: string } {
  const authHeader = headers.get('authorization');
  const adminToken = headers.get('x-admin-token');

  // 检查 Bearer Token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (verifyAdminToken(token)) {
      return { isAdmin: true };
    }
  }

  // 检查 x-admin-token header
  if (adminToken && verifyAdminToken(adminToken)) {
    return { isAdmin: true };
  }

  return { isAdmin: false, error: 'Unauthorized' };
}

/**
 * 管理员登录 API 处理
 */
export interface AdminLoginResult {
  success: boolean;
  token?: string;
  error?: string;
}

export function adminLogin(username: string, password: string): AdminLoginResult {
  if (verifyAdminCredentials(username, password)) {
    return {
      success: true,
      token: generateAdminToken(),
    };
  }

  return {
    success: false,
    error: '用户名或密码错误',
  };
}
