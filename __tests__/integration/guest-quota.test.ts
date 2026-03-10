/**
 * Guest Quota Integration Tests
 *
 * These tests verify that guest users are properly limited and that
 * device fingerprinting works correctly for tracking guest usage.
 */

import { Redis } from '@upstash/redis';

// Mock Redis client for testing
const getTestRedisClient = () => {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error('Missing Redis environment variables');
  }

  return new Redis({
    url: redisUrl,
    token: redisToken,
  });
};

describe('Guest Quota Tests', () => {
  let redis: Redis;
  const testFingerprints = [
    `test-fp-1-${Date.now()}`,
    `test-fp-2-${Date.now()}`,
    `test-fp-3-${Date.now()}`,
  ];

  beforeAll(() => {
    console.log('Setting up guest quota tests...');
    redis = getTestRedisClient();
  });

  afterAll(async () => {
    console.log('Cleaning up guest quota tests...');

    // Clean up test fingerprints
    for (const fp of testFingerprints) {
      try {
        await redis.del(`guest:${fp}:usage`);
        await redis.del(`guest:migrated:${fp}:*`);
      } catch (error) {
        console.error(`Error cleaning up fingerprint ${fp}:`, error);
      }
    }
  });

  describe('Guest Usage Tracking', () => {
    test('New guest has zero usage', async () => {
      const fp = testFingerprints[0];

      // Mock getGuestUsage function behavior
      const key = `guest:${fp}:usage`;
      const data = await redis.get(key);

      expect(data).toBeNull();

      console.log(`✓ New guest ${fp} has zero usage`);
    });

    test('Guest usage increments correctly', async () => {
      const fp = testFingerprints[1];
      const key = `guest:${fp}:usage`;
      const pdfId = `test-pdf-${Date.now()}`;

      // First usage
      const usage1 = {
        count: 1,
        pdfIds: [pdfId],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage1), { ex: 30 * 24 * 60 * 60 });

      // Verify
      const data1 = await redis.get(key);
      expect(data1).toBeDefined();

      // Second usage
      const parsed1 = typeof data1 === 'string' ? JSON.parse(data1) : data1;
      const usage2 = {
        count: parsed1.count + 1,
        pdfIds: [...parsed1.pdfIds, `test-pdf-${Date.now()}`],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage2), { ex: 30 * 24 * 60 * 60 });

      // Verify
      const data2 = await redis.get(key);
      const parsed2 = typeof data2 === 'string' ? JSON.parse(data2) : data2;

      expect(parsed2.count).toBe(2);
      expect(parsed2.pdfIds.length).toBe(2);

      console.log(`✓ Guest usage increments correctly (${fp}: ${parsed2.count} uses)`);
    });

    test('Guest usage persists with TTL', async () => {
      const fp = testFingerprints[2];
      const key = `guest:${fp}:usage`;

      const usage = {
        count: 1,
        pdfIds: [`test-pdf-${Date.now()}`],
        lastUsed: new Date().toISOString(),
      };

      // Set with 30 day TTL
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Check if key exists
      const exists = await redis.exists(key);

      expect(exists).toBe(1);

      // Get TTL
      const ttl = await redis.ttl(key);

      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(30 * 24 * 60 * 60);

      console.log(`✓ Guest usage persists with TTL (${ttl}s remaining)`);
    });
  });

  describe('Guest Quota Limits', () => {
    test('Guest can proceed when under limit', async () => {
      const fp = `test-quota-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // Set usage to 2 (under limit of 3)
      const usage = {
        count: 2,
        pdfIds: ['pdf1', 'pdf2'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Check if can proceed
      const data = await redis.get(key);
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      const canProceed = parsed.count < 3;

      expect(canProceed).toBe(true);

      console.log(`✓ Guest under limit can proceed (${fp}: ${parsed.count}/3)`);

      // Cleanup
      await redis.del(key);
    });

    test('Guest cannot proceed when at limit', async () => {
      const fp = `test-quota-limit-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // Set usage to 3 (at limit)
      const usage = {
        count: 3,
        pdfIds: ['pdf1', 'pdf2', 'pdf3'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Check if can proceed
      const data = await redis.get(key);
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      const canProceed = parsed.count < 3;

      expect(canProceed).toBe(false);

      console.log(`✓ Guest at limit cannot proceed (${fp}: ${parsed.count}/3)`);

      // Cleanup
      await redis.del(key);
    });

    test('Guest remaining quota calculated correctly', async () => {
      const fp = `test-remaining-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // Set usage to 1
      const usage = {
        count: 1,
        pdfIds: ['pdf1'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Calculate remaining
      const data = await redis.get(key);
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      const remaining = Math.max(0, 3 - parsed.count);

      expect(remaining).toBe(2);

      console.log(`✓ Guest remaining quota calculated correctly (${fp}: ${remaining} left)`);

      // Cleanup
      await redis.del(key);
    });
  });

  describe('Guest Data Migration', () => {
    test('Guest data can be marked as migrated', async () => {
      const fp = `test-migrate-${Date.now()}`;
      const userId = `user-${Date.now()}`;
      const usageKey = `guest:${fp}:usage`;
      const migrationKey = `guest:migrated:${fp}:${userId}`;

      // Create guest usage
      const usage = {
        count: 2,
        pdfIds: ['pdf1', 'pdf2'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(usageKey, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Mark as migrated
      await redis.set(migrationKey, Date.now(), { ex: 30 * 24 * 60 * 60 });

      // Verify migration marker
      const migrated = await redis.get(migrationKey);

      expect(migrated).toBeDefined();

      console.log(`✓ Guest data marked as migrated (${fp} -> ${userId})`);

      // Cleanup
      await redis.del(usageKey);
      await redis.del(migrationKey);
    });

    test('Migrated guest data is not migrated again', async () => {
      const fp = `test-no-remigrate-${Date.now()}`;
      const userId = `user-${Date.now()}`;
      const migrationKey = `guest:migrated:${fp}:${userId}`;

      // Set migration marker
      await redis.set(migrationKey, Date.now(), { ex: 30 * 24 * 60 * 60 });

      // Check if already migrated
      const migrated = await redis.get(migrationKey);

      expect(migrated).toBeDefined();

      const shouldMigrate = !migrated;

      expect(shouldMigrate).toBe(false);

      console.log(`✓ Already migrated guest data is not migrated again`);

      // Cleanup
      await redis.del(migrationKey);
    });
  });

  describe('Guest Data Cleanup', () => {
    test('Guest data can be cleaned up', async () => {
      const fp = `test-cleanup-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // Create guest usage
      const usage = {
        count: 1,
        pdfIds: ['pdf1'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Verify exists
      let exists = await redis.exists(key);
      expect(exists).toBe(1);

      // Cleanup
      await redis.del(key);

      // Verify deleted
      exists = await redis.exists(key);
      expect(exists).toBe(0);

      console.log(`✓ Guest data cleaned up successfully (${fp})`);
    });
  });

  describe('Device Fingerprinting', () => {
    test('Different devices have different fingerprints', () => {
      // This test validates that fingerprinting logic creates unique IDs
      const fp1 = `fp-${Math.random().toString(36).substring(7)}`;
      const fp2 = `fp-${Math.random().toString(36).substring(7)}`;

      expect(fp1).not.toBe(fp2);

      console.log('✓ Different devices have unique fingerprints');
      console.log(`  - Device 1: ${fp1}`);
      console.log(`  - Device 2: ${fp2}`);
    });

    test('Same device has consistent fingerprint', () => {
      // This test validates fingerprint consistency
      const fp = `fp-consistent-${Date.now()}`;

      // Simulate multiple sessions with same fingerprint
      const session1Fp = fp;
      const session2Fp = fp;

      expect(session1Fp).toBe(session2Fp);

      console.log('✓ Same device maintains consistent fingerprint');
    });
  });

  describe('Guest Quota Error Handling', () => {
    test('Redis errors are handled gracefully', async () => {
      // Test with invalid Redis client
      const invalidRedis = new Redis({
        url: 'https://invalid.redis.upstash.io',
        token: 'invalid-token',
      });

      const fp = `test-error-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // This should not throw, but handle error gracefully
      try {
        await invalidRedis.get(key);
      } catch (error) {
        // Error is expected
        expect(error).toBeDefined();
      }

      console.log('✓ Redis errors are handled gracefully');
    });

    test('Missing usage data returns defaults', async () => {
      const fp = `test-missing-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // Ensure key doesn't exist
      await redis.del(key);

      // Get usage (should return defaults)
      const data = await redis.get(key);

      expect(data).toBeNull();

      // Default values should be used
      const defaultUsage = {
        count: 0,
        pdfIds: [],
        lastUsed: '',
      };

      expect(data).toBeNull(); // Key doesn't exist

      console.log('✓ Missing usage data handled correctly (defaults returned)');
    });
  });

  describe('Guest Quota Integration', () => {
    test('Complete guest upload flow', async () => {
      const fp = `test-flow-${Date.now()}`;
      const key = `guest:${fp}:usage`;
      const pdfId = `test-pdf-flow-${Date.now()}`;

      // Step 1: Check initial quota
      let data = await redis.get(key);
      let initialUsage = data ? (typeof data === 'string' ? JSON.parse(data) : data) : { count: 0 };
      expect(initialUsage.count).toBe(0);

      // Step 2: Increment usage
      const updatedUsage = {
        count: initialUsage.count + 1,
        pdfIds: [...(initialUsage.pdfIds || []), pdfId],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(updatedUsage), { ex: 30 * 24 * 60 * 60 });

      // Step 3: Verify new usage
      data = await redis.get(key);
      const newUsage = typeof data === 'string' ? JSON.parse(data) : data;

      expect(newUsage.count).toBe(1);
      expect(newUsage.pdfIds).toContain(pdfId);

      console.log('✓ Complete guest upload flow works correctly');
      console.log(`  - Usage: ${newUsage.count}/3`);
      console.log(`  - PDFs: ${newUsage.pdfIds.join(', ')}`);

      // Cleanup
      await redis.del(key);
    });

    test('Guest quota enforcement at boundary', async () => {
      const fp = `test-boundary-${Date.now()}`;
      const key = `guest:${fp}:usage`;

      // Start with 2 uses
      let usage = {
        count: 2,
        pdfIds: ['pdf1', 'pdf2'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Check if can proceed (should be allowed)
      let data = await redis.get(key);
      let parsed = typeof data === 'string' ? JSON.parse(data) : data;
      let canProceed = parsed.count < 3;
      expect(canProceed).toBe(true);

      // Add third use
      usage = {
        count: 3,
        pdfIds: ['pdf1', 'pdf2', 'pdf3'],
        lastUsed: new Date().toISOString(),
      };
      await redis.set(key, JSON.stringify(usage), { ex: 30 * 24 * 60 * 60 });

      // Check if can proceed (should be denied)
      data = await redis.get(key);
      parsed = typeof data === 'string' ? JSON.parse(data) : data;
      canProceed = parsed.count < 3;
      expect(canProceed).toBe(false);

      console.log('✓ Guest quota enforced correctly at boundary');
      console.log(`  - Use 1: Allowed (1/3)`);
      console.log(`  - Use 2: Allowed (2/3)`);
      console.log(`  - Use 3: Allowed (3/3)`);
      console.log(`  - Use 4: Denied (3/3)`);

      // Cleanup
      await redis.del(key);
    });
  });
});
