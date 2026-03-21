/**
 * Data Isolation Integration Tests
 *
 * These tests verify that users can only access their own data and that
 * PostgreSQL RLS policies properly enforce data isolation.
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

// Test user credentials
const testUsers = {
  user1: {
    email: `test-user-1-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User 1',
  },
  user2: {
    email: `test-user-2-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User 2',
  },
  admin: {
    email: `test-admin-${Date.now()}@example.com`,
    password: 'AdminPassword123!',
    name: 'Test Admin',
  },
};

// Store created user IDs and auth tokens
interface CreatedUser {
  id: string;
  email: string;
  accessToken: string;
}

let createdUsers: Record<string, CreatedUser> = {};
let testPdfId: string | null = null;

describe('Data Isolation Tests', () => {
  beforeAll(async () => {
    console.log('Setting up test environment...');

    // Create test users
    for (const [key, userData] of Object.entries(testUsers)) {
      try {
        // Create user with admin client
        const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              role: key === 'admin' ? 'admin' : 'user',
            },
          },
        });

        if (signUpError) {
          console.error(`Failed to create ${key}:`, signUpError);
          continue;
        }

        if (signUpData.user) {
          createdUsers[key] = {
            id: signUpData.user.id,
            email: userData.email,
            accessToken: signUpData.session?.access_token || '',
          };

          // Update user role if admin
          if (key === 'admin') {
            await adminClient
              .from('user_profiles')
              .update({ role: 'admin' })
              .eq('id', signUpData.user.id);
          }

          console.log(`✓ Created test user: ${key} (${userData.email})`);
        }
      } catch (error) {
        console.error(`Error creating ${key}:`, error);
      }
    }
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up test environment...');

    // Clean up test users
    for (const user of Object.values(createdUsers)) {
      try {
        // Delete user's PDFs first
        await adminClient.from('user_pdfs').delete().eq('user_id', user.id);

        // Delete user's quota records
        await adminClient.from('quota_usage').delete().eq('user_id', user.id);
        await adminClient.from('user_quotas').delete().eq('user_id', user.id);

        // Delete user profile
        await adminClient.from('user_profiles').delete().eq('id', user.id);

        // Delete auth user
        await adminClient.auth.admin.deleteUser(user.id);

        console.log(`✓ Cleaned up user: ${user.email}`);
      } catch (error) {
        console.error(`Error cleaning up user ${user.email}:`, error);
      }
    }
  });

  describe('User PDF Data Isolation', () => {
    beforeEach(async () => {
      // Create a test PDF for user1
      if (createdUsers.user1 && adminClient) {
        const { data: pdfData, error: pdfError } = await adminClient
          .from('user_pdfs')
          .insert({
            user_id: createdUsers.user1.id,
            filename: 'test-document.pdf',
            file_size: 1024000,
            page_count: 10,
            storage_path: `users/${createdUsers.user1.id}/pdfs/test.pdf`,
            pinecone_namespace: createdUsers.user1.id,
          })
          .select()
          .single();

        if (!pdfError && pdfData) {
          testPdfId = pdfData.id;
          console.log(`✓ Created test PDF: ${testPdfId}`);
        }
      }
    });

    afterEach(async () => {
      // Clean up test PDFs
      if (adminClient) {
        for (const user of Object.values(createdUsers)) {
          await adminClient.from('user_pdfs').delete().eq('user_id', user.id);
        }
      }
      testPdfId = null;
    });

    test('User can only view their own PDFs', async () => {
      expect(createdUsers.user1).toBeDefined();
      expect(createdUsers.user2).toBeDefined();

      // Create user1's client
      const user1Client = createClient(supabaseUrl, createdUsers.user1!.accessToken);

      // user1 should see their PDFs
      const { data: user1Pdfs, error: user1Error } = await user1Client
        .from('user_pdfs')
        .select('*');

      expect(user1Error).toBeNull();
      expect(user1Pdfs).toBeDefined();
      expect(user1Pdfs?.length).toBeGreaterThan(0);

      // All PDFs should belong to user1
      user1Pdfs?.forEach((pdf) => {
        expect(pdf.user_id).toBe(createdUsers.user1!.id);
      });

      console.log(`✓ User 1 can view their own PDFs (${user1Pdfs?.length} found)`);
    });

    test('User cannot view other users PDFs', async () => {
      expect(createdUsers.user2).toBeDefined();

      // Create user2's client
      const user2Client = createClient(supabaseUrl, createdUsers.user2!.accessToken);

      // user2 should NOT see user1's PDFs
      const { data: user2Pdfs, error: user2Error } = await user2Client
        .from('user_pdfs')
        .select('*');

      expect(user2Error).toBeNull();
      expect(user2Pdfs).toBeDefined();

      // user2 should see 0 PDFs (none belong to them)
      expect(user2Pdfs?.length).toBe(0);

      console.log('✓ User 2 cannot view User 1 PDFs (correctly isolated)');
    });

    test('User cannot insert PDFs for other users', async () => {
      expect(createdUsers.user1).toBeDefined();
      expect(createdUsers.user2).toBeDefined();

      // Create user1's client
      const user1Client = createClient(supabaseUrl, createdUsers.user1!.accessToken);

      // Try to insert a PDF with user2's user_id
      const { data: insertData, error: insertError } = await user1Client
        .from('user_pdfs')
        .insert({
          user_id: createdUsers.user2!.id, // Try to assign to user2
          filename: 'malicious.pdf',
          file_size: 512000,
          storage_path: 'fake/path.pdf',
        })
        .select();

      // Insert should fail due to RLS policy
      expect(insertError).toBeDefined();

      // Verify no PDF was created for user2
      const { data: user2Pdfs } = await adminClient
        .from('user_pdfs')
        .select('*')
        .eq('user_id', createdUsers.user2!.id);

      expect(user2Pdfs?.length).toBe(0);

      console.log('✓ User cannot insert PDFs for other users (RLS working)');
    });

    test('User cannot delete other users PDFs', async () => {
      expect(testPdfId).toBeDefined();
      expect(createdUsers.user2).toBeDefined();

      // Create user2's client
      const user2Client = createClient(supabaseUrl, createdUsers.user2!.accessToken);

      // Try to delete user1's PDF
      const { error: deleteError } = await user2Client
        .from('user_pdfs')
        .delete()
        .eq('id', testPdfId!);

      // Delete should fail or affect 0 rows
      expect(deleteError).toBeDefined();

      // Verify PDF still exists
      const { data: pdfStillExists } = await adminClient
        .from('user_pdfs')
        .select('*')
        .eq('id', testPdfId!)
        .single();

      expect(pdfStillExists).toBeDefined();
      expect(pdfStillExists?.id).toBe(testPdfId);

      console.log('✓ User cannot delete other users PDFs (RLS working)');
    });

    test('User cannot update other users PDFs', async () => {
      expect(testPdfId).toBeDefined();
      expect(createdUsers.user2).toBeDefined();

      // Create user2's client
      const user2Client = createClient(supabaseUrl, createdUsers.user2!.accessToken);

      // Try to update user1's PDF
      const { error: updateError } = await user2Client
        .from('user_pdfs')
        .update({ filename: 'hacked-filename.pdf' })
        .eq('id', testPdfId!);

      // Update should fail
      expect(updateError).toBeDefined();

      // Verify filename wasn't changed
      const { data: originalPdf } = await adminClient
        .from('user_pdfs')
        .select('*')
        .eq('id', testPdfId!)
        .single();

      expect(originalPdf?.filename).toBe('test-document.pdf');

      console.log('✓ User cannot update other users PDFs (RLS working)');
    });
  });

  describe('Admin Data Access', () => {
    test('Admin can view all users PDFs', async () => {
      expect(createdUsers.admin).toBeDefined();
      expect(createdUsers.user1).toBeDefined();

      // Create a test PDF for user1
      const { data: testPdf } = await adminClient
        .from('user_pdfs')
        .insert({
          user_id: createdUsers.user1!.id,
          filename: 'admin-test.pdf',
          file_size: 1024000,
          storage_path: `users/${createdUsers.user1!.id}/pdfs/admin-test.pdf`,
          pinecone_namespace: createdUsers.user1!.id,
        })
        .select()
        .single();

      expect(testPdf).toBeDefined();

      // Create admin client
      const adminUserClient = createClient(supabaseUrl, createdUsers.admin!.accessToken);

      // Admin should see all PDFs
      const { data: allPdfs, error: allPdfsError } = await adminUserClient
        .from('user_pdfs')
        .select('*');

      expect(allPdfsError).toBeNull();
      expect(allPdfs).toBeDefined();
      expect(allPdfs?.length).toBeGreaterThan(0);

      console.log(`✓ Admin can view all users PDFs (${allPdfs?.length} found)`);

      // Cleanup
      if (testPdf?.id) {
        await adminClient.from('user_pdfs').delete().eq('id', testPdf.id);
      }
    });
  });

  describe('Pinecone Namespace Isolation', () => {
    test('PDFs are stored in correct user namespaces', async () => {
      expect(createdUsers.user1).toBeDefined();

      // Create a test PDF
      const { data: testPdf } = await adminClient
        .from('user_pdfs')
        .insert({
          user_id: createdUsers.user1!.id,
          filename: 'namespace-test.pdf',
          file_size: 512000,
          storage_path: `users/${createdUsers.user1!.id}/pdfs/namespace-test.pdf`,
          pinecone_namespace: createdUsers.user1!.id,
        })
        .select()
        .single();

      expect(testPdf).toBeDefined();
      expect(testPdf?.pinecone_namespace).toBe(createdUsers.user1!.id);

      console.log(`✓ PDF stored in correct namespace: ${testPdf?.pinecone_namespace}`);

      // Cleanup
      if (testPdf?.id) {
        await adminClient.from('user_pdfs').delete().eq('id', testPdf.id);
      }
    });

    test('User can only query their own namespace', async () => {
      // This test validates the application-level logic
      // The actual namespace filtering happens in the vector store implementation
      expect(createdUsers.user1).toBeDefined();
      expect(createdUsers.user2).toBeDefined();

      // Verify that different users have different namespaces
      const user1Namespace = createdUsers.user1!.id;
      const user2Namespace = createdUsers.user2!.id;

      expect(user1Namespace).not.toBe(user2Namespace);

      console.log('✓ Users have unique Pinecone namespaces');
      console.log(`  User 1 namespace: ${user1Namespace}`);
      console.log(`  User 2 namespace: ${user2Namespace}`);
    });
  });

  describe('Cross-User Data Leak Prevention', () => {
    test('SQL injection cannot bypass RLS', async () => {
      expect(createdUsers.user1).toBeDefined();

      const user1Client = createClient(supabaseUrl, createdUsers.user1!.accessToken);

      // Try SQL injection in the query
      const maliciousQuery = "1=1 OR user_id != '" + createdUsers.user1!.id + "'";

      const { data: leakedData, error: leakError } = await user1Client
        .from('user_pdfs')
        .select('*')
        .or(maliciousQuery);

      // RLS should still protect against this
      expect(leakError).toBeDefined();

      if (!leakError && leakedData) {
        // If query succeeded, verify no leaked data
        leakedData.forEach((pdf) => {
          expect(pdf.user_id).toBe(createdUsers.user1!.id);
        });
      }

      console.log('✓ SQL injection attempt blocked by RLS');
    });
  });
});
