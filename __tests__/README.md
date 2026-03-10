# Data Isolation and Quota Testing Suite

## Overview

This comprehensive test suite validates the data isolation and quota management systems for the agent-PDF application. It ensures that:

1. **Users can only access their own data** (PostgreSQL RLS policies)
2. **Pinecone vectors are properly isolated** by namespace
3. **Quota limits are enforced** for both uploads and chat
4. **Guest users are properly tracked** and limited
5. **Device fingerprinting works correctly**

## Test Structure

```
__tests__/
├── unit/
│   └── quota-check.test.ts          # Unit tests for quota logic
├── integration/
│   ├── data-isolation.test.ts       # PostgreSQL RLS tests
│   ├── quota-system.test.ts         # Quota management tests
│   ├── guest-quota.test.ts          # Guest quota tracking tests
│   ├── guest-isolation.test.ts      # Guest data isolation tests
│   └── pinecone-isolation.test.ts   # Pinecone namespace tests
├── e2e/
│   └── quota-enforcement.test.ts    # End-to-end API tests
├── run-tests.ts                     # Comprehensive test runner
└── README.md                        # This file
```

## Prerequisites

### Environment Variables

Create a `.env.test` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration (for guest quota)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Pinecone Configuration (optional, tests will skip if not configured)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=pdf-chat

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Ensure your Supabase project has the following tables with RLS policies:

1. `user_pdfs` - User PDF documents
2. `quota_definitions` - Quota limit definitions
3. `user_quotas` - User-specific quota overrides
4. `quota_usage` - Quota usage tracking

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Unit tests
npm test -- quota-check

# Data isolation tests
npm test -- data-isolation

# Quota system tests
npm test -- quota-system

# Guest quota tests
npm test -- guest-quota

# Pinecone isolation tests
npm test -- pinecone-isolation

# E2E tests
npm test -- quota-enforcement
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run Comprehensive Test Suite

```bash
ts-node __tests__/run-tests.ts
```

This will:
1. Run all test suites
2. Generate a detailed JSON report
3. Print a summary to console

## Test Coverage

### 1. PostgreSQL RLS Data Isolation

**File:** `integration/data-isolation.test.ts`

Tests:
- ✅ User can only view their own PDFs
- ✅ User cannot view other users' PDFs
- ✅ User cannot insert PDFs for other users
- ✅ User cannot delete other users' PDFs
- ✅ User cannot update other users' PDFs
- ✅ Admin can view all users' PDFs
- ✅ SQL injection cannot bypass RLS

### 2. Pinecone Namespace Isolation

**File:** `integration/pinecone-isolation.test.ts`

Tests:
- ✅ PDFs are stored in correct user namespaces
- ✅ User can only query their own namespace
- ✅ Users cannot access other users' namespaces
- ✅ Metadata filter enforces user isolation
- ✅ Combined userId and pdfId filter works correctly
- ✅ Default namespace is separate from user namespaces
- ✅ Deleting from one namespace does not affect others

**Note:** These tests will be skipped if `PINECONE_API_KEY` is not configured.

### 3. Quota System

**File:** `integration/quota-system.test.ts`

Tests:
- ✅ Default quota definitions exist
- ✅ Free user has correct default limits
- ✅ User starts with zero usage
- ✅ Upload usage is recorded correctly
- ✅ Multiple uploads increment usage correctly
- ✅ Chat usage is recorded correctly
- ✅ User can view their own quota stats
- ✅ User can view their own usage history
- ✅ Daily quotas reset correctly
- ✅ User can have custom quota limits
- ✅ Custom quota can have expiration

### 4. Guest Quota and Tracking

**File:** `integration/guest-quota.test.ts` and `integration/guest-isolation.test.ts`

Tests:
- ✅ New guest has zero usage
- ✅ Guest usage increments correctly
- ✅ Guest usage persists with TTL (30 days)
- ✅ Guest can proceed when under limit
- ✅ Guest cannot proceed when at limit
- ✅ Guest remaining quota calculated correctly
- ✅ Different devices have different fingerprints
- ✅ Same device has consistent fingerprint
- ✅ Guest data can be marked as migrated
- ✅ Migrated guest data is not migrated again
- ✅ Guest data can be cleaned up
- ✅ Different guests cannot access each other's data

### 5. End-to-End API Testing

**File:** `e2e/quota-enforcement.test.ts`

Tests:
- ✅ First upload succeeds
- ✅ Second upload succeeds
- ✅ Third upload succeeds (at quota limit)
- ✅ Fourth upload fails with quota exceeded error
- ✅ Quota usage is correctly tracked
- ✅ Chat respects daily quota limit
- ✅ User can view their quota statistics
- ✅ Quota stats reflect actual usage
- ✅ Quota resets at midnight

## Test Report

After running the comprehensive test suite, a JSON report is generated at:

```
__tests__/test-report.json
```

The report includes:
- Timestamp
- Summary statistics (total, passed, failed, duration)
- Individual test results
- Detailed test coverage breakdown

## Debugging Failed Tests

### View Detailed Output

```bash
npm test -- --verbose
```

### Run Tests in Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Check Database State

```sql
-- View recent quota usage
SELECT * FROM quota_usage
WHERE user_id = 'test-user-id'
ORDER BY created_at DESC
LIMIT 10;

-- View user quotas
SELECT * FROM user_quotas
WHERE user_id = 'test-user-id';

-- View quota definitions
SELECT * FROM quota_definitions;
```

### Check Redis State

```bash
# View all guest usage keys
redis-cli KEYS "guest:*:usage"

# View specific guest usage
redis-cli GET "guest:fingerprint-here:usage"
```

### Check Pinecone Namespaces

```javascript
// List all namespaces
const pinecone = new Pinecone({ apiKey: 'your-key' });
const index = pinecone.index('pdf-chat');
const namespaces = await index.listNamespaces();
console.log(namespaces);
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Data Isolation & Quota

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: __tests__/test-report.json
```

## Best Practices

### When Adding New Tests

1. **Test Isolation:** Each test should clean up after itself
2. **Independent Tests:** Tests should not depend on each other
3. **Clear Names:** Use descriptive test names
4. **Assertions:** Use specific assertions with clear error messages
5. **Mocking:** Mock external dependencies (API, database) for unit tests
6. **Real Resources:** Use real Supabase/Redis for integration tests

### Common Issues

**Issue:** Tests fail with "Missing environment variables"
**Solution:** Ensure `.env.test` file exists with all required variables

**Issue:** Tests timeout
**Solution:** Increase timeout in `jest.setup.js` or test configuration

**Issue:** Pinecone tests skip
**Solution:** Set `PINECONE_API_KEY` in environment variables

**Issue:** Tests leave data in database
**Solution:** Ensure `afterAll` cleanup is working correctly

## Maintenance

### Updating Tests

When modifying quota logic or data isolation:

1. Update the corresponding test file
2. Add new tests for new functionality
3. Update this README with new test coverage
4. Run full test suite to ensure no regressions

### Test Data Cleanup

Run cleanup script to remove test data:

```bash
ts-node __tests__/cleanup-test-data.ts
```

## Support

For issues or questions about the test suite:

1. Check test output for specific error messages
2. Review test report at `__tests__/test-report.json`
3. Ensure all prerequisites are met
4. Verify database RLS policies are correctly configured
5. Check environment variables are set correctly

## License

This test suite is part of the agent-PDF project.
