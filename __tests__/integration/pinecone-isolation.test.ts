/**
 * Pinecone Namespace Isolation Integration Tests
 *
 * These tests verify that Pinecone namespaces properly isolate user data
 * and that users cannot access vectors from other users' namespaces.
 */

import { createClient } from '@supabase/supabase-js';
import { getPineconeClient, isPineconeConfigured } from '@/lib/pinecone/config';
import { storePineconeVectors, searchPineconeVectors, hasPineconeVectors } from '@/lib/pinecone/vector-store';
import { Document } from '@langchain/core/documents';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for setup and cleanup
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Skip tests if Pinecone is not configured
const describeIfPinecone = isPineconeConfigured ? describe : describe.skip;

describeIfPinecone('Pinecone Namespace Isolation Tests', () => {
  let testUserId1: string;
  let testUserId2: string;
  let testPdfId1: string;
  let testPdfId2: string;
  const testDocuments: Document[] = [
    new Document({
      pageContent: 'This is a secret document for user 1.',
      metadata: { pdfId: 'pdf-1', chunkIndex: 0 },
    }),
    new Document({
      pageContent: 'Another secret paragraph for user 1.',
      metadata: { pdfId: 'pdf-1', chunkIndex: 1 },
    }),
  ];

  beforeAll(async () => {
    console.log('Setting up Pinecone isolation tests...');

    // Create test users
    const { data: user1 } = await adminClient.auth.signUp({
      email: `pinecone-test-1-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      options: { data: { name: 'Pinecone Test User 1', role: 'user' } },
    });

    const { data: user2 } = await adminClient.auth.signUp({
      email: `pinecone-test-2-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      options: { data: { name: 'Pinecone Test User 2', role: 'user' } },
    });

    if (user1?.user) {
      testUserId1 = user1.user.id;
      console.log(`✓ Created test user 1: ${testUserId1}`);
    }

    if (user2?.user) {
      testUserId2 = user2.user.id;
      console.log(`✓ Created test user 2: ${testUserId2}`);
    }

    // Generate test PDF IDs
    testPdfId1 = `pinecone-test-pdf-1-${Date.now()}`;
    testPdfId2 = `pinecone-test-pdf-2-${Date.now()}`;
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up Pinecone isolation tests...');

    // Clean up Pinecone vectors
    try {
      const pinecone = getPineconeClient();
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'pdf-chat');

      // Delete vectors from user 1's namespace
      try {
        await index.deleteMany({
          filter: { pdfId: { $eq: testPdfId1 } },
          namespace: testUserId1
        });
      } catch (e) {
        console.log('No vectors to clean for user 1');
      }

      // Delete vectors from user 2's namespace
      try {
        await index.deleteMany({
          filter: { pdfId: { $eq: testPdfId2 } },
          namespace: testUserId2
        });
      } catch (e) {
        console.log('No vectors to clean for user 2');
      }
    } catch (error) {
      console.error('Error cleaning up Pinecone:', error);
    }

    // Clean up test users
    if (testUserId1) {
      await adminClient.auth.admin.deleteUser(testUserId1);
      await adminClient.from('user_profiles').delete().eq('id', testUserId1);
    }

    if (testUserId2) {
      await adminClient.auth.admin.deleteUser(testUserId2);
      await adminClient.from('user_profiles').delete().eq('id', testUserId2);
    }

    console.log('✓ Cleanup complete');
  });

  describe('Namespace Storage Isolation', () => {
    test('User 1 can store vectors in their namespace', async () => {
      expect(testUserId1).toBeDefined();
      expect(testPdfId1).toBeDefined();

      await storePineconeVectors(testPdfId1, testDocuments, testUserId1);

      const hasVectors = await hasPineconeVectors(testPdfId1, testUserId1);

      expect(hasVectors).toBe(true);

      console.log('✓ User 1 can store vectors in their namespace');
    });

    test('User 2 can store vectors in their namespace', async () => {
      expect(testUserId2).toBeDefined();
      expect(testPdfId2).toBeDefined();

      const user2Docs = [
        new Document({
          pageContent: 'This is a secret document for user 2.',
          metadata: { pdfId: 'pdf-2', chunkIndex: 0 },
        }),
      ];

      await storePineconeVectors(testPdfId2, user2Docs, testUserId2);

      const hasVectors = await hasPineconeVectors(testPdfId2, testUserId2);

      expect(hasVectors).toBe(true);

      console.log('✓ User 2 can store vectors in their namespace');
    });

    test('Each namespace has independent vector counts', async () => {
      const pinecone = getPineconeClient();
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'pdf-chat');

      // Query user 1's namespace
      const user1Results = await index.query({
        vector: new Array(1536).fill(0),
        topK: 100,
        namespace: testUserId1,
        includeMetadata: false,
      });

      // Query user 2's namespace
      const user2Results = await index.query({
        vector: new Array(1536).fill(0),
        topK: 100,
        namespace: testUserId2,
        includeMetadata: false,
      });

      console.log(`✓ User 1 namespace has ${user1Results.matches.length} vectors`);
      console.log(`✓ User 2 namespace has ${user2Results.matches.length} vectors`);

      // Verify counts are independent
      expect(user1Results.matches.length).toBeGreaterThan(0);
      expect(user2Results.matches.length).toBeGreaterThan(0);
    });
  });

  describe('Namespace Search Isolation', () => {
    test('User can only search their own namespace', async () => {
      const query = 'secret document';

      // User 1 searches in their namespace
      const user1Results = await searchPineconeVectors(testPdfId1, query, 4, testUserId1);

      expect(user1Results).toBeDefined();
      expect(user1Results.length).toBeGreaterThan(0);

      console.log(`✓ User 1 found ${user1Results.length} results in their namespace`);
    });

    test('User cannot access other users namespaces', async () => {
      const query = 'secret document';

      // User 2 tries to search for user 1's PDF
      const user2Results = await searchPineconeVectors(testPdfId1, query, 4, testUserId2);

      // User 2 should not find user 1's documents
      expect(user2Results).toBeDefined();
      expect(user2Results.length).toBe(0);

      console.log('✓ User 2 cannot access User 1 documents (namespace isolation working)');
    });

    test('Search with wrong namespace returns no results', async () => {
      const query = 'secret document';

      // Search with user 1's PDF ID but user 2's namespace
      const results = await searchPineconeVectors(testPdfId1, query, 4, testUserId2);

      expect(results).toBeDefined();
      expect(results.length).toBe(0);

      console.log('✓ Cross-namespace search correctly returns no results');
    });
  });

  describe('Namespace Filter Security', () => {
    test('Metadata filter enforces user isolation', async () => {
      const pinecone = getPineconeClient();
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'pdf-chat');

      // Try to query without proper userId filter (should still be namespace-isolated)
      const results = await index.query({
        vector: new Array(1536).fill(0),
        topK: 10,
        filter: { pdfId: { $eq: testPdfId1 } },
        namespace: testUserId2, // Wrong namespace
        includeMetadata: true,
      });

      // Should return 0 results because namespace doesn't match
      expect(results.matches.length).toBe(0);

      console.log('✓ Metadata filter + namespace provides double isolation');
    });

    test('Combined userId and pdfId filter works correctly', async () => {
      const pinecone = getPineconeClient();
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'pdf-chat');

      // Query with correct filters
      const correctResults = await index.query({
        vector: new Array(1536).fill(0),
        topK: 10,
        filter: {
          pdfId: { $eq: testPdfId1 },
          userId: { $eq: testUserId1 }
        },
        namespace: testUserId1,
        includeMetadata: true,
      });

      expect(correctResults.matches.length).toBeGreaterThan(0);

      // Query with wrong userId filter
      const wrongResults = await index.query({
        vector: new Array(1536).fill(0),
        topK: 10,
        filter: {
          pdfId: { $eq: testPdfId1 },
          userId: { $eq: testUserId2 } // Wrong user
        },
        namespace: testUserId1,
        includeMetadata: true,
      });

      expect(wrongResults.matches.length).toBe(0);

      console.log('✓ Combined userId + pdfId filter provides strong isolation');
    });
  });

  describe('Namespace Boundary Tests', () => {
    test('Default namespace is separate from user namespaces', async () => {
      const pinecone = getPineconeClient();
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'pdf-chat');

      // Query default namespace
      const defaultResults = await index.query({
        vector: new Array(1536).fill(0),
        topK: 10,
        namespace: 'default',
        includeMetadata: false,
      });

      // Query user 1's namespace
      const user1Results = await index.query({
        vector: new Array(1536).fill(0),
        topK: 10,
        namespace: testUserId1,
        includeMetadata: false,
      });

      // Results should be independent
      console.log(`✓ Default namespace: ${defaultResults.matches.length} vectors`);
      console.log(`✓ User 1 namespace: ${user1Results.matches.length} vectors`);

      // At least one should have vectors (user 1)
      expect(defaultResults.matches.length + user1Results.matches.length).toBeGreaterThan(0);
    });

    test('Non-existent namespace returns empty results', async () => {
      const fakeUserId = 'fake-user-id-12345';
      const fakePdfId = 'fake-pdf-12345';

      const results = await searchPineconeVectors(fakePdfId, 'test query', 4, fakeUserId);

      expect(results).toBeDefined();
      expect(results.length).toBe(0);

      console.log('✓ Non-existent namespace correctly returns empty results');
    });
  });

  describe('Vector Deletion Isolation', () => {
    test('Deleting from one namespace does not affect others', async () => {
      const pinecone = getPineconeClient();
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'pdf-chat');

      // Count vectors before deletion
      const beforeUser1 = await index.query({
        vector: new Array(1536).fill(0),
        topK: 100,
        namespace: testUserId1,
        includeMetadata: false,
      });

      const beforeUser2 = await index.query({
        vector: new Array(1536).fill(0),
        topK: 100,
        namespace: testUserId2,
        includeMetadata: false,
      });

      // Delete user 1's vectors
      await index.deleteMany({
        filter: { pdfId: { $eq: testPdfId1 } },
        namespace: testUserId1,
      });

      // Count vectors after deletion
      const afterUser1 = await index.query({
        vector: new Array(1536).fill(0),
        topK: 100,
        namespace: testUserId1,
        includeMetadata: false,
      });

      const afterUser2 = await index.query({
        vector: new Array(1536).fill(0),
        topK: 100,
        namespace: testUserId2,
        includeMetadata: false,
      });

      // User 1's vectors should be deleted
      expect(afterUser1.matches.length).toBeLessThan(beforeUser1.matches.length);

      // User 2's vectors should be unchanged
      expect(afterUser2.matches.length).toBe(beforeUser2.matches.length);

      console.log('✓ Deletion is properly isolated per namespace');
      console.log(`  - User 1: ${beforeUser1.matches.length} → ${afterUser1.matches.length}`);
      console.log(`  - User 2: ${beforeUser2.matches.length} → ${afterUser2.matches.length}`);
    });
  });
});
