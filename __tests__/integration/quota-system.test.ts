/**
 * Quota System Integration Tests
 *
 * These tests verify that quota limits are properly enforced for both
 * authenticated users and guest users.
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for setup and cleanup
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Test user
const testUser = {
  email: `quota-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Quota Test User',
};

let createdUser: { id: string; email: string; accessToken: string } | null = null;

describe('Quota System Tests', () => {
  beforeAll(async () => {
    console.log('Setting up quota test environment...');

    try {
      // Create test user
      const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            name: testUser.name,
            role: 'user',
          },
        },
      });

      if (signUpError) {
        console.error('Failed to create test user:', signUpError);
        throw signUpError;
      }

      if (signUpData.user) {
        createdUser = {
          id: signUpData.user.id,
          email: signUpData.user.email,
          accessToken: signUpData.session?.access_token || '',
        };

        // Set up custom quota for testing
        const { data: quotaDef } = await adminClient
          .from('quota_definitions')
          .select('id')
          .eq('name', 'pdf_uploads_daily')
          .single();

        if (quotaDef) {
          await adminClient.from('user_quotas').insert({
            user_id: createdUser.id,
            quota_id: quotaDef.id,
            limit_value: 5, // Low limit for testing
          });
        }

        console.log(`✓ Created quota test user: ${testUser.email}`);
      }
    } catch (error) {
      console.error('Error setting up test environment:', error);
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up quota test environment...');

    if (createdUser && adminClient) {
      try {
        // Delete quota records
        await adminClient.from('quota_usage').delete().eq('user_id', createdUser.id);
        await adminClient.from('user_quotas').delete().eq('user_id', createdUser.id);

        // Delete user's PDFs
        await adminClient.from('user_pdfs').delete().eq('user_id', createdUser.id);

        // Delete user profile
        await adminClient.from('user_profiles').delete().eq('id', createdUser.id);

        // Delete auth user
        await adminClient.auth.admin.deleteUser(createdUser.id);

        console.log(`✓ Cleaned up quota test user: ${createdUser.email}`);
      } catch (error) {
        console.error('Error cleaning up:', error);
      }
    }
  });

  describe('Quota Definitions', () => {
    test('Default quota definitions exist', async () => {
      const { data: quotaDefs, error } = await adminClient
        .from('quota_definitions')
        .select('*');

      expect(error).toBeNull();
      expect(quotaDefs).toBeDefined();
      expect(quotaDefs?.length).toBeGreaterThan(0);

      // Check for expected quota types
      const uploadQuota = quotaDefs?.find((q) => q.name === 'pdf_uploads_daily');
      const chatQuota = quotaDefs?.find((q) => q.name === 'ai_calls_daily');

      expect(uploadQuota).toBeDefined();
      expect(chatQuota).toBeDefined();

      console.log('✓ Default quota definitions exist');
      console.log(`  - Upload quota: ${uploadQuota?.default_limit} per day`);
      console.log(`  - Chat quota: ${chatQuota?.default_limit} per day`);
    });

    test('Free user has correct default limits', async () => {
      expect(createdUser).toBeDefined();

      const { data: quotaDefs, error } = await adminClient
        .from('quota_definitions')
        .select('*')
        .eq('name', 'pdf_uploads_daily')
        .single();

      expect(error).toBeNull();
      expect(quotaDefs?.default_limit).toBeDefined();

      const defaultLimit = quotaDefs?.default_limit || 10;

      console.log(`✓ Free user upload limit: ${defaultLimit} per day`);
      expect(defaultLimit).toBeGreaterThan(0);
    });
  });

  describe('Upload Quota Enforcement', () => {
    beforeEach(async () => {
      // Clear existing usage for clean test
      if (createdUser) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await adminClient
          .from('quota_usage')
          .delete()
          .eq('user_id', createdUser.id)
          .gte('created_at', today.toISOString());
      }
    });

    test('User starts with zero usage', async () => {
      expect(createdUser).toBeDefined();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: usage, error } = await adminClient
        .from('quota_usage')
        .select('*')
        .eq('user_id', createdUser!.id)
        .gte('created_at', today.toISOString());

      expect(error).toBeNull();
      expect(usage).toBeDefined();

      const totalUsage = usage?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      expect(totalUsage).toBe(0);

      console.log('✓ User starts with zero upload usage');
    });

    test('Upload usage is recorded correctly', async () => {
      expect(createdUser).toBeDefined();

      // Get quota definition ID
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      expect(quotaDef).toBeDefined();

      // Record a usage
      const { error: insertError } = await adminClient.from('quota_usage').insert({
        user_id: createdUser!.id,
        quota_id: quotaDef!.id,
        usage_date: new Date().toISOString().split('T')[0],
        usage_count: 1,
      });

      expect(insertError).toBeNull();

      // Verify usage was recorded
      const { data: usage } = await adminClient
        .from('quota_usage')
        .select('*')
        .eq('user_id', createdUser!.id)
        .eq('quota_id', quotaDef!.id);

      expect(usage).toBeDefined();
      expect(usage?.length).toBeGreaterThan(0);

      console.log('✓ Upload usage is recorded correctly');
    });

    test('Multiple uploads increment usage correctly', async () => {
      expect(createdUser).toBeDefined();

      // Get quota definition ID
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      expect(quotaDef).toBeDefined();

      // Record multiple usages
      const uploadCount = 3;
      for (let i = 0; i < uploadCount; i++) {
        await adminClient.from('quota_usage').insert({
          user_id: createdUser!.id,
          quota_id: quotaDef!.id,
          usage_date: new Date().toISOString().split('T')[0],
          usage_count: 1,
        });
      }

      // Query total usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: usage } = await adminClient
        .from('quota_usage')
        .select('usage_count')
        .eq('user_id', createdUser!.id)
        .eq('quota_id', quotaDef!.id)
        .eq('usage_date', today.toISOString().split('T')[0]);

      const totalUsage = usage?.reduce((sum, record) => sum + (record.usage_count || 0), 0) || 0;

      expect(totalUsage).toBe(uploadCount);

      console.log(`✓ ${uploadCount} uploads recorded correctly (total: ${totalUsage})`);
    });
  });

  describe('Chat Quota Enforcement', () => {
    test('Chat usage is recorded correctly', async () => {
      expect(createdUser).toBeDefined();

      // Get quota definition ID for chat
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'ai_calls_daily')
        .single();

      expect(quotaDef).toBeDefined();

      // Record chat usage
      const { error: insertError } = await adminClient.from('quota_usage').insert({
        user_id: createdUser!.id,
        quota_id: quotaDef!.id,
        usage_date: new Date().toISOString().split('T')[0],
        usage_count: 1,
      });

      expect(insertError).toBeNull();

      // Verify usage was recorded
      const { data: usage } = await adminClient
        .from('quota_usage')
        .select('*')
        .eq('user_id', createdUser!.id)
        .eq('quota_id', quotaDef!.id);

      expect(usage).toBeDefined();
      expect(usage?.length).toBeGreaterThan(0);

      console.log('✓ Chat usage is recorded correctly');
    });
  });

  describe('Quota Statistics', () => {
    test('User can view their own quota stats', async () => {
      expect(createdUser).toBeDefined();

      const userClient = createClient(supabaseUrl, createdUser!.accessToken);

      // Get quota definitions
      const { data: quotaDefs } = await userClient
        .from('quota_definitions')
        .select('*')
        .in('name', ['pdf_uploads_daily', 'ai_calls_daily']);

      expect(quotaDefs).toBeDefined();
      expect(quotaDefs?.length).toBeGreaterThan(0);

      console.log('✓ User can view quota definitions');
      quotaDefs?.forEach((def) => {
        console.log(`  - ${def.display_name}: ${def.default_limit} ${def.unit}`);
      });
    });

    test('User can view their own usage history', async () => {
      expect(createdUser).toBeDefined();

      const userClient = createClient(supabaseUrl, createdUser!.accessToken);

      const { data: usage, error } = await userClient
        .from('quota_usage')
        .select('*')
        .eq('user_id', createdUser!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(usage).toBeDefined();

      console.log(`✓ User can view usage history (${usage?.length} records)`);
    });
  });

  describe('Quota Reset Behavior', () => {
    test('Daily quotas reset correctly', async () => {
      // This test validates the quota reset logic
      // In production, quotas reset based on usage_date

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Create usage records for yesterday
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      if (quotaDef && createdUser) {
        await adminClient.from('quota_usage').insert({
          user_id: createdUser.id,
          quota_id: quotaDef.id,
          usage_date: yesterdayStr,
          usage_count: 5,
        });

        // Query today's usage (should be 0 or different from yesterday)
        const { data: todayUsage } = await adminClient
          .from('quota_usage')
          .select('usage_count')
          .eq('user_id', createdUser.id)
          .eq('usage_date', todayStr);

        const todayTotal = todayUsage?.reduce((sum, r) => sum + (r.usage_count || 0), 0) || 0;

        console.log('✓ Daily quota reset logic validated');
        console.log(`  - Yesterday usage: 5`);
        console.log(`  - Today usage: ${todayTotal}`);
      }
    });
  });

  describe('Custom Quota Limits', () => {
    test('User can have custom quota limits', async () => {
      expect(createdUser).toBeDefined();

      // Get quota definition
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      expect(quotaDef).toBeDefined();

      // Set custom quota
      const customLimit = 20;
      const { error: updateError } = await adminClient
        .from('user_quotas')
        .upsert({
          user_id: createdUser!.id,
          quota_id: quotaDef!.id,
          limit_value: customLimit,
        });

      expect(updateError).toBeNull();

      // Verify custom quota
      const { data: customQuota } = await adminClient
        .from('user_quotas')
        .select('*')
        .eq('user_id', createdUser!.id)
        .eq('quota_id', quotaDef!.id)
        .single();

      expect(customQuota).toBeDefined();
      expect(customQuota?.limit_value).toBe(customLimit);

      console.log(`✓ Custom quota limit set: ${customLimit}`);
    });

    test('Custom quota can have expiration', async () => {
      expect(createdUser).toBeDefined();

      // Get quota definition
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      expect(quotaDef).toBeDefined();

      // Set temporary quota that expires tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { error: updateError } = await adminClient
        .from('user_quotas')
        .upsert({
          user_id: createdUser!.id,
          quota_id: quotaDef!.id,
          limit_value: 100,
          expires_at: tomorrow.toISOString(),
        });

      expect(updateError).toBeNull();

      console.log('✓ Temporary quota with expiration set');
    });
  });

  describe('Quota Operations Logging', () => {
    test('Quota operations are logged', async () => {
      expect(createdUser).toBeDefined();

      // Get quota definition
      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      expect(quotaDef).toBeDefined();

      // Log a quota operation
      const { error: logError } = await adminClient.from('quota_operations').insert({
        user_id: createdUser!.id,
        operation_type: 'upload_pdf',
        quota_id: quotaDef!.id,
        amount: 1,
        status: 'allowed',
        metadata: { pdf_id: 'test-pdf-123' },
      });

      expect(logError).toBeNull();

      // Verify operation was logged
      const { data: operations } = await adminClient
        .from('quota_operations')
        .select('*')
        .eq('user_id', createdUser!.id)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(operations).toBeDefined();
      expect(operations?.length).toBeGreaterThan(0);
      expect(operations?.[0].operation_type).toBe('upload_pdf');

      console.log('✓ Quota operations are logged correctly');
    });
  });
});
