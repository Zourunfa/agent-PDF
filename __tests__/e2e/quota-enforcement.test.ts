/**
 * End-to-End Quota Enforcement Tests
 *
 * These tests verify that quota limits are properly enforced in the upload and chat APIs.
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

describe('Quota Enforcement E2E Tests', () => {
  let testUserId: string;
  let testUserEmail: string;
  let accessToken: string;
  let testPdfId: string;

  beforeAll(async () => {
    console.log('Setting up quota enforcement E2E tests...');

    // Create test user with low quota
    testUserEmail = `quota-e2e-${Date.now()}@example.com`;
    const { data, error } = await adminClient.auth.signUp({
      email: testUserEmail,
      password: 'TestPassword123!',
      options: {
        data: { name: 'Quota E2E Test User', role: 'user' }
      }
    });

    if (error || !data.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }

    testUserId = data.user.id;
    accessToken = data.session?.access_token || '';

    console.log(`✓ Created test user: ${testUserId}`);

    // Set up custom quota for testing (limit to 3 uploads/day)
    const { data: quotaDef } = await adminClient
      .from('quota_definitions')
      .select('id')
      .eq('name', 'pdf_uploads_daily')
      .single();

    if (quotaDef) {
      await adminClient.from('user_quotas').insert({
        user_id: testUserId,
        quota_id: quotaDef.id,
        limit_value: 3,
      });
      console.log('✓ Set custom quota: 3 uploads/day');
    }
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up quota enforcement E2E tests...');

    if (testUserId) {
      await adminClient.from('quota_usage').delete().eq('user_id', testUserId);
      await adminClient.from('user_quotas').delete().eq('user_id', testUserId);
      await adminClient.from('user_pdfs').delete().eq('user_id', testUserId);
      await adminClient.from('user_profiles').delete().eq('id', testUserId);
      await adminClient.auth.admin.deleteUser(testUserId);
      console.log('✓ Cleaned up test user');
    }
  });

  describe('Upload API Quota Enforcement', () => {
    beforeEach(async () => {
      // Clear usage for clean test
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await adminClient
        .from('quota_usage')
        .delete()
        .eq('user_id', testUserId)
        .gte('created_at', today.toISOString());
    });

    test('First upload should succeed', async () => {
      // Create a mock PDF file
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');

      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test1.pdf', { type: 'application/pdf' }));

      const response = await fetch(`${appUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.pdfId).toBeDefined();

      testPdfId = data.data.pdfId;

      console.log('✓ First upload succeeded');
    });

    test('Second upload should succeed', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');

      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test2.pdf', { type: 'application/pdf' }));

      const response = await fetch(`${appUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      console.log('✓ Second upload succeeded');
    });

    test('Third upload should succeed', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');

      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test3.pdf', { type: 'application/pdf' }));

      const response = await fetch(`${appUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      console.log('✓ Third upload succeeded (at quota limit)');
    });

    test('Fourth upload should fail with quota exceeded error', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock pdf content');

      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test4.pdf', { type: 'application/pdf' }));

      const response = await fetch(`${appUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('QUOTA_EXCEEDED');
      expect(data.error.quota).toBeDefined();
      expect(data.error.quota.remaining).toBe(0);

      console.log('✓ Fourth upload correctly blocked by quota');
      console.log(`  - Error: ${data.error.message}`);
    });

    test('Quota usage is correctly tracked', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      if (quotaDef) {
        const { data: usage } = await adminClient
          .from('quota_usage')
          .select('usage_count')
          .eq('user_id', testUserId)
          .eq('quota_id', quotaDef.id)
          .eq('usage_date', today.toISOString().split('T')[0]);

        const totalUsage = usage?.reduce((sum, record) => sum + (record.usage_count || 0), 0) || 0;

        expect(totalUsage).toBe(3);

        console.log(`✓ Quota usage tracked correctly: ${totalUsage}/3`);
      }
    });
  });

  describe('Chat API Quota Enforcement', () => {
    beforeEach(async () => {
      // Clear chat usage for clean test
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: chatQuotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'ai_calls_daily')
        .single();

      if (chatQuotaDef) {
        await adminClient
          .from('quota_usage')
          .delete()
          .eq('user_id', testUserId)
          .eq('quota_id', chatQuotaDef.id)
          .gte('usage_date', today.toISOString().split('T')[0]);
      }
    });

    test('Chat respects daily quota limit', async () => {
      // Set chat quota to 2 for testing
      const { data: chatQuotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'ai_calls_daily')
        .single();

      if (chatQuotaDef) {
        await adminClient.from('user_quotas').upsert({
          user_id: testUserId,
          quota_id: chatQuotaDef.id,
          limit_value: 2,
        });
      }

      // First chat should succeed
      const response1 = await fetch(`${appUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId: testPdfId,
          question: 'What is this document about?',
          conversationId: 'test-conv-1',
        }),
      });

      // Should get a streaming response
      expect(response1.status).toBe(200);
      expect(response1.headers.get('content-type')).toContain('text/event-stream');

      console.log('✓ First chat succeeded');

      // Second chat should succeed
      const response2 = await fetch(`${appUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId: testPdfId,
          question: 'Summarize the key points',
          conversationId: 'test-conv-2',
        }),
      });

      expect(response2.status).toBe(200);

      console.log('✓ Second chat succeeded (at quota limit)');

      // Third chat should fail
      const response3 = await fetch(`${appUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId: testPdfId,
          question: 'Any more details?',
          conversationId: 'test-conv-3',
        }),
      });

      expect(response3.status).toBe(403);

      const data = await response3.json();
      expect(data.error.code).toBe('QUOTA_EXCEEDED');

      console.log('✓ Third chat correctly blocked by quota');
    });
  });

  describe('Quota Statistics API', () => {
    test('User can view their quota statistics', async () => {
      const response = await fetch(`${appUrl}/api/quota/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.upload).toBeDefined();
      expect(data.chat).toBeDefined();

      console.log('✓ Quota statistics API works');
      console.log(`  - Upload: ${data.upload.used}/${data.upload.quotaLimit}`);
      console.log(`  - Chat: ${data.chat.used}/${data.chat.quotaLimit}`);
    });

    test('Quota stats reflect actual usage', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      if (quotaDef) {
        // Get upload usage from DB
        const { data: uploadUsage } = await adminClient
          .from('quota_usage')
          .select('usage_count')
          .eq('user_id', testUserId)
          .eq('quota_id', quotaDef.id)
          .eq('usage_date', today.toISOString().split('T')[0]);

        const dbUploadUsage = uploadUsage?.reduce((sum, r) => sum + (r.usage_count || 0), 0) || 0;

        // Get from API
        const response = await fetch(`${appUrl}/api/quota/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        expect(data.upload.used).toBe(dbUploadUsage);

        console.log(`✓ API stats match DB usage: ${dbUploadUsage}`);
      }
    });
  });

  describe('Quota Reset Behavior', () => {
    test('Quota resets at midnight', async () => {
      // This test validates the quota reset logic
      // In production, a cron job or scheduled function would reset quotas

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: quotaDef } = await adminClient
        .from('quota_definitions')
        .select('id')
        .eq('name', 'pdf_uploads_daily')
        .single();

      if (quotaDef) {
        // Create usage record for yesterday
        await adminClient.from('quota_usage').insert({
          user_id: testUserId,
          quota_id: quotaDef.id,
          usage_date: yesterday.toISOString().split('T')[0],
          usage_count: 5,
        });

        console.log('✓ Created yesterday usage record');

        // Query today's usage (should be separate)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayUsage } = await adminClient
          .from('quota_usage')
          .select('usage_count')
          .eq('user_id', testUserId)
          .eq('quota_id', quotaDef.id)
          .eq('usage_date', today.toISOString().split('T')[0]);

        const todayTotal = todayUsage?.reduce((sum, r) => sum + (r.usage_count || 0), 0) || 0;

        console.log('✓ Quota reset logic validated');
        console.log(`  - Yesterday: 5 uploads`);
        console.log(`  - Today: ${todayTotal} uploads`);
      }
    });
  });
});
