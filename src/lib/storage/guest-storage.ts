// 游客计数存储
// 使用 Redis 存储游客使用计数，防止滥用

import { Redis } from '@upstash/redis';

// 简单的内存存储（用于开发环境）
const memoryStore = new Map<string, any>();

// 检查是否配置了Redis
const hasRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token && url.length > 0 && token.length > 0;
};

// 初始化 Redis 客户端（如果配置了）
let redis: Redis | null = null;
if (hasRedisConfig()) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
    });
  } catch (error) {
    console.warn('[Guest Storage] Failed to initialize Redis:', error);
    redis = null;
  }
} else {
  console.log('[Guest Storage] Redis not configured, using memory store');
}

/**
 * 游客使用计数接口
 */
export interface GuestUsage {
  count: number;
  pdfIds: string[];
  lastUsed: string;
}

/**
 * 获取游客使用计数
 */
export async function getGuestUsage(fingerprint: string): Promise<GuestUsage> {
  try {
    if (!redis) {
      // 使用内存存储
      const key = `guest:${fingerprint}:usage`;
      const data = memoryStore.get(key);
      return data || { count: 0, pdfIds: [], lastUsed: '' };
    }

    const key = `guest:${fingerprint}:usage`;
    const data = await redis.get(key);

    if (!data) {
      return {
        count: 0,
        pdfIds: [],
        lastUsed: '',
      };
    }

    // Redis 返回的数据可能是字符串或对象
    if (typeof data === 'string') {
      return JSON.parse(data);
    }

    return data as GuestUsage;
  } catch (error) {
    console.error('Error getting guest usage:', error);
    return {
      count: 0,
      pdfIds: [],
      lastUsed: '',
    };
  }
}

/**
 * 增加游客使用计数
 */
export async function incrementGuestUsage(
  fingerprint: string,
  pdfId?: string
): Promise<GuestUsage> {
  try {
    const key = `guest:${fingerprint}:usage`;
    const current = await getGuestUsage(fingerprint);

    // 增加计数
    const updated: GuestUsage = {
      count: current.count + 1,
      pdfIds: pdfId ? [...current.pdfIds, pdfId] : current.pdfIds,
      lastUsed: new Date().toISOString(),
    };

    // 保存到存储，TTL 30天
    if (redis) {
      await redis.set(key, JSON.stringify(updated), { ex: 30 * 24 * 60 * 60 });
    } else {
      // 使用内存存储
      memoryStore.set(key, updated);
      // 30分钟后自动清理
      setTimeout(() => {
        memoryStore.delete(key);
      }, 30 * 60 * 1000);
    }

    return updated;
  } catch (error) {
    console.error('Error incrementing guest usage:', error);
    throw new Error('Failed to track guest usage');
  }
}

/**
 * 检查游客是否可以继续使用
 */
export async function canGuestProceed(fingerprint: string): Promise<boolean> {
  try {
    const usage = await getGuestUsage(fingerprint);
    return usage.count < 3; // 免费试用3次
  } catch (error) {
    console.error('Error checking guest quota:', error);
    return true; // 出错时允许使用（更友好的开发体验）
  }
}

/**
 * 获取游客剩余次数
 */
export async function getGuestRemaining(fingerprint: string): Promise<number> {
  try {
    const usage = await getGuestUsage(fingerprint);
    return Math.max(0, 3 - usage.count);
  } catch (error) {
    console.error('Error getting guest remaining:', error);
    return 3; // 出错时返回默认值
  }
}

/**
 * 迁移游客数据到用户账户
 */
export async function migrateGuestData(
  fingerprint: string,
  userId: string
): Promise<{ migratedPdfs: number }> {
  try {
    const key = `guest:${fingerprint}:usage`;
    const migrationKey = `guest:migrated:${fingerprint}:${userId}`;

    if (redis) {
      // 检查是否已经迁移过
      const migrated = await redis.get(migrationKey);
      if (migrated) {
        return { migratedPdfs: 0 };
      }
    }

    const usage = await getGuestUsage(fingerprint);

    // 标记为已迁移
    if (redis) {
      await redis.set(migrationKey, Date.now(), { ex: 30 * 24 * 60 * 60 });
      // 删除原数据
      await redis.del(key);
    } else {
      memoryStore.set(migrationKey, Date.now());
      memoryStore.delete(key);
    }

    return {
      migratedPdfs: usage.pdfIds.length,
    };
  } catch (error) {
    console.error('Error migrating guest data:', error);
    throw new Error('Failed to migrate guest data');
  }
}

/**
 * 清理游客数据（用于删除PDF时）
 */
export async function cleanupGuestData(fingerprint: string): Promise<void> {
  try {
    const key = `guest:${fingerprint}:usage`;
    if (redis) {
      await redis.del(key);
    } else {
      memoryStore.delete(key);
    }
  } catch (error) {
    console.error('Error cleaning up guest data:', error);
  }
}
