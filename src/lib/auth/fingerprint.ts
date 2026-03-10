// 设备指纹生成工具
// 用于识别游客设备，防止滥用免费试用

import { headers } from 'next/headers';

/**
 * 生成设备指纹
 * 基于 IP + User-Agent + 其他浏览器特征
 */
export async function generateFingerprint(): Promise<string> {
  try {
    const headersList = await headers();

    // 获取 IP 地址
    const ip = headersList.get('x-forwarded-for') ||
               headersList.get('x-real-ip') ||
               headersList.get('cf-connecting-ip') || // Cloudflare
               'unknown';

    // 获取 User-Agent
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 获取其他特征
    const acceptLanguage = headersList.get('accept-language') || '';
    const acceptEncoding = headersList.get('accept-encoding') || '';

    // 组合特征
    const fingerprintData = `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;

    // 生成 SHA-256 哈希
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    // 如果指纹生成失败，返回一个随机ID
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 从请求头中提取设备信息
 */
export async function getDeviceInfo(): Promise<{
  ip: string;
  userAgent: string;
  deviceName: string;
  deviceType: string;
}> {
  try {
    const headersList = await headers();

    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('cf-connecting-ip') ||
               'unknown';

    const userAgent = headersList.get('user-agent') || 'unknown';

    // 解析 User-Agent 获取设备信息
    const deviceName = parseDeviceName(userAgent);
    const deviceType = parseDeviceType(userAgent);

    return {
      ip,
      userAgent,
      deviceName,
      deviceType,
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      ip: 'unknown',
      userAgent: 'unknown',
      deviceName: 'Unknown Device',
      deviceType: 'unknown',
    };
  }
}

/**
 * 解析设备名称
 */
function parseDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) {
    const match = ua.match(/android\s([0-9\.]+)/);
    return `Android ${match ? match[1] : ''}`;
  }
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'Mac';
  if (ua.includes('linux')) return 'Linux';

  // 检测浏览器
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edge')) return 'Edge';

  return 'Unknown Device';
}

/**
 * 解析设备类型
 */
function parseDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'mobile';
  }

  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * 生成简单的会话ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
