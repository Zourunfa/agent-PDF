# Integration Test Report

**Generated:** 2026-03-09T08:42:42.961Z

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 0 |
| Passed | 0 |
| Failed | 3 |
| Duration | 5854ms |
| Success Rate | NaN% |

## Test Results

### ❌ __tests__/integration/data-isolation.test.ts

- **Status:** failed
- **Tests:** 0
- **Failures:** 1
- **Duration:** 0ms

#### Errors

- Command failed: npx jest __tests__/integration/data-isolation.test.ts --verbose --json
FAIL __tests__/integration/data-isolation.test.ts
  Data Isolation Tests
    User PDF Data Isolation
      ✕ User can only view their own PDFs (3 ms)
      ✕ User cannot view other users PDFs (1 ms)
      ✕ User cannot insert PDFs for other users (1 ms)
      ✕ User cannot delete other users PDFs (1 ms)
      ✕ User cannot update other users PDFs
    Admin Data Access
      ✕ Admin can view all users PDFs
    Pinecone Namespace Isolation
      ✕ PDFs are stored in correct user namespaces
      ✕ User can only query their own namespace (1 ms)
    Cross-User Data Leak Prevention
      ✕ SQL injection cannot bypass RLS (1 ms)

  ● Data Isolation Tests › User PDF Data Isolation › User can only view their own PDFs

    expect(received).toBeDefined()

    Received: undefined

      156 |
      157 |     test('User can only view their own PDFs', async () => {
    > 158 |       expect(createdUsers.user1).toBeDefined();
          |                                  ^
      159 |       expect(createdUsers.user2).toBeDefined();
      160 |
      161 |       // Create user1's client

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:158:34)

  ● Data Isolation Tests › User PDF Data Isolation › User cannot view other users PDFs

    expect(received).toBeDefined()

    Received: undefined

      180 |
      181 |     test('User cannot view other users PDFs', async () => {
    > 182 |       expect(createdUsers.user2).toBeDefined();
          |                                  ^
      183 |
      184 |       // Create user2's client
      185 |       const user2Client = createClient(supabaseUrl, createdUsers.user2!.accessToken);

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:182:34)

  ● Data Isolation Tests › User PDF Data Isolation › User cannot insert PDFs for other users

    expect(received).toBeDefined()

    Received: undefined

      200 |
      201 |     test('User cannot insert PDFs for other users', async () => {
    > 202 |       expect(createdUsers.user1).toBeDefined();
          |                                  ^
      203 |       expect(createdUsers.user2).toBeDefined();
      204 |
      205 |       // Create user1's client

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:202:34)

  ● Data Isolation Tests › User PDF Data Isolation › User cannot delete other users PDFs

    expect(received).toBeDefined()

    Received: undefined

      233 |     test('User cannot delete other users PDFs', async () => {
      234 |       expect(testPdfId).toBeDefined();
    > 235 |       expect(createdUsers.user2).toBeDefined();
          |                                  ^
      236 |
      237 |       // Create user2's client
      238 |       const user2Client = createClient(supabaseUrl, createdUsers.user2!.accessToken);

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:235:34)

  ● Data Isolation Tests › User PDF Data Isolation › User cannot update other users PDFs

    expect(received).toBeDefined()

    Received: undefined

      262 |     test('User cannot update other users PDFs', async () => {
      263 |       expect(testPdfId).toBeDefined();
    > 264 |       expect(createdUsers.user2).toBeDefined();
          |                                  ^
      265 |
      266 |       // Create user2's client
      267 |       const user2Client = createClient(supabaseUrl, createdUsers.user2!.accessToken);

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:264:34)

  ● Data Isolation Tests › Admin Data Access › Admin can view all users PDFs

    expect(received).toBeDefined()

    Received: undefined

      291 |   describe('Admin Data Access', () => {
      292 |     test('Admin can view all users PDFs', async () => {
    > 293 |       expect(createdUsers.admin).toBeDefined();
          |                                  ^
      294 |       expect(createdUsers.user1).toBeDefined();
      295 |
      296 |       // Create a test PDF for user1

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:293:34)

  ● Data Isolation Tests › Pinecone Namespace Isolation › PDFs are stored in correct user namespaces

    expect(received).toBeDefined()

    Received: undefined

      332 |   describe('Pinecone Namespace Isolation', () => {
      333 |     test('PDFs are stored in correct user namespaces', async () => {
    > 334 |       expect(createdUsers.user1).toBeDefined();
          |                                  ^
      335 |
      336 |       // Create a test PDF
      337 |       const { data: testPdf } = await adminClient

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:334:34)

  ● Data Isolation Tests › Pinecone Namespace Isolation › User can only query their own namespace

    expect(received).toBeDefined()

    Received: undefined

      361 |       // This test validates the application-level logic
      362 |       // The actual namespace filtering happens in the vector store implementation
    > 363 |       expect(createdUsers.user1).toBeDefined();
          |                                  ^
      364 |       expect(createdUsers.user2).toBeDefined();
      365 |
      366 |       // Verify that different users have different namespaces

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:363:34)

  ● Data Isolation Tests › Cross-User Data Leak Prevention › SQL injection cannot bypass RLS

    expect(received).toBeDefined()

    Received: undefined

      378 |   describe('Cross-User Data Leak Prevention', () => {
      379 |     test('SQL injection cannot bypass RLS', async () => {
    > 380 |       expect(createdUsers.user1).toBeDefined();
          |                                  ^
      381 |
      382 |       const user1Client = createClient(supabaseUrl, createdUsers.user1!.accessToken);
      383 |

      at Object.toBeDefined (__tests__/integration/data-isolation.test.ts:380:34)

Test Suites: 1 failed, 1 total
Tests:       9 failed, 9 total
Snapshots:   0 total
Time:        0.734 s
Ran all test suites matching __tests__/integration/data-isolation.test.ts.


### ❌ __tests__/integration/quota-system.test.ts

- **Status:** failed
- **Tests:** 0
- **Failures:** 1
- **Duration:** 0ms

#### Errors

- Command failed: npx jest __tests__/integration/quota-system.test.ts --verbose --json
FAIL __tests__/integration/quota-system.test.ts
  Quota System Tests
    Quota Definitions
      ✕ Default quota definitions exist (1 ms)
      ✕ Free user has correct default limits (1 ms)
    Upload Quota Enforcement
      ✕ User starts with zero usage
      ✕ Upload usage is recorded correctly (1 ms)
      ✕ Multiple uploads increment usage correctly
    Chat Quota Enforcement
      ✕ Chat usage is recorded correctly
    Quota Statistics
      ✕ User can view their own quota stats
      ✕ User can view their own usage history
    Quota Reset Behavior
      ✕ Daily quotas reset correctly (1 ms)
    Custom Quota Limits
      ✕ User can have custom quota limits
      ✕ Custom quota can have expiration (1 ms)
    Quota Operations Logging
      ✕ Quota operations are logged

  ● Quota System Tests › Quota Definitions › Default quota definitions exist

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Quota Definitions › Free user has correct default limits

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Upload Quota Enforcement › User starts with zero usage

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Upload Quota Enforcement › Upload usage is recorded correctly

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Upload Quota Enforcement › Multiple uploads increment usage correctly

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Chat Quota Enforcement › Chat usage is recorded correctly

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Quota Statistics › User can view their own quota stats

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Quota Statistics › User can view their own usage history

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Quota Reset Behavior › Daily quotas reset correctly

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Custom Quota Limits › User can have custom quota limits

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Custom Quota Limits › Custom quota can have expiration

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

  ● Quota System Tests › Quota Operations Logging › Quota operations are logged

    AuthRetryableFetchError: fetch is not defined

      34 |     try {
      35 |       // Create test user
    > 36 |       const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
         |                                                                               ^
      37 |         email: testUser.email,
      38 |         password: testUser.password,
      39 |         options: {

      at _handleRequest (node_modules/@supabase/auth-js/src/lib/fetch.ts:191:11)
      at _request (node_modules/@supabase/auth-js/src/lib/fetch.ts:157:22)
      at SupabaseAuthClient.signUp (node_modules/@supabase/auth-js/src/GoTrueClient.ts:621:29)
      at Object.signUp (__tests__/integration/quota-system.test.ts:36:79)

Test Suites: 1 failed, 1 total
Tests:       12 failed, 12 total
Snapshots:   0 total
Time:        0.694 s
Ran all test suites matching __tests__/integration/quota-system.test.ts.


### ❌ __tests__/integration/guest-quota.test.ts

- **Status:** failed
- **Tests:** 0
- **Failures:** 1
- **Duration:** 0ms

#### Errors

- Command failed: npx jest __tests__/integration/guest-quota.test.ts --verbose --json
FAIL __tests__/integration/guest-quota.test.ts
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation, specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /Users/a123456/Code/open-source/agent-PDF/node_modules/uncrypto/dist/crypto.web.mjs:15
    export { _crypto as default, getRandomValues, randomUUID, subtle };
    ^^^^^^

    SyntaxError: Unexpected token 'export'

       8 | import { Redis } from '@upstash/redis';
       9 |
    > 10 | // Mock Redis client for testing
         |                ^
      11 | const getTestRedisClient = () => {
      12 |   const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      13 |   const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1318:40)
      at Object.<anonymous> (node_modules/@upstash/redis/nodejs.js:3795:23)
      at Object.<anonymous> (__tests__/integration/guest-quota.test.ts:10:16)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.637 s
Ran all test suites matching __tests__/integration/guest-quota.test.ts.


## Recommendations

⚠️  Some tests failed. Please review the errors above and:

1. Check that Supabase connection is configured correctly
2. Verify that RLS policies are applied
3. Ensure quota tables are properly set up
4. Check Redis connection for guest quota tests

