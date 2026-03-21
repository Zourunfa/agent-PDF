/**
 * Integration Test Runner
 *
 * This script runs all integration tests and generates a detailed report.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  tests: number;
  failures: number;
  errors: string[];
}

interface TestReport {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  results: TestResult[];
}

function runTests(): TestReport {
  console.log('🧪 Running Integration Tests...\n');

  const startTime = Date.now();
  const results: TestResult[] = [];

  // Test files to run
  const testFiles = [
    '__tests__/integration/data-isolation.test.ts',
    '__tests__/integration/quota-system.test.ts',
    '__tests__/integration/guest-quota.test.ts',
  ];

  for (const testFile of testFiles) {
    console.log(`\n📋 Running: ${testFile}`);

    try {
      const output = execSync(`npx jest ${testFile} --verbose --json`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const jestResult = JSON.parse(output);

      const testResult: TestResult = {
        file: testFile,
        status: jestResult.numFailedTests === 0 ? 'passed' : 'failed',
        duration: jestResult.testResults[0]?.duration || 0,
        tests: jestResult.numTotalTests || 0,
        failures: jestResult.numFailedTests || 0,
        errors: [],
      };

      // Extract errors from assertion results
      if (jestResult.testResults[0]?.assertionResults) {
        for (const assertion of jestResult.testResults[0].assertionResults) {
          if (assertion.status === 'failed') {
            testResult.errors.push(
              `${assertion.title}: ${assertion.error?.message || 'Unknown error'}`
            );
          }
        }
      }

      results.push(testResult);

      console.log(
        `  ${testResult.status === 'passed' ? '✅' : '❌'} ${testResult.tests} tests, ${testResult.failures} failures (${testResult.duration}ms)`
      );

      if (testResult.errors.length > 0) {
        console.log('  Errors:');
        testResult.errors.forEach((error) => console.log(`    - ${error}`));
      }
    } catch (error: any) {
      const stderr = error.stderr || '';
      console.error(`  ❌ Error running ${testFile}:`);

      // Try to extract useful error information
      if (stderr.includes('Cannot find module')) {
        console.log('    ⚠️  Missing dependencies or setup issue');
      } else if (stderr.includes('Authentication')) {
        console.log('    ⚠️  Authentication or configuration issue');
      } else {
        console.log(`    ${stderr.split('\n').slice(0, 3).join('\n    ')}`);
      }

      results.push({
        file: testFile,
        status: 'failed',
        duration: 0,
        tests: 0,
        failures: 1,
        errors: [error.message || 'Unknown error'],
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Generate summary
  const summary = {
    total: results.reduce((sum, r) => sum + r.tests, 0),
    passed: results.reduce((sum, r) => sum + (r.status === 'passed' ? r.tests : 0), 0),
    failed: results.reduce((sum, r) => sum + r.failures, 0),
    duration: totalDuration,
  };

  return {
    timestamp: new Date().toISOString(),
    summary,
    results,
  };
}

function generateReport(report: TestReport): void {
  const reportPath = join(process.cwd(), 'test-report.md');

  let markdown = `# Integration Test Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n\n`;

  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${report.summary.total} |\n`;
  markdown += `| Passed | ${report.summary.passed} |\n`;
  markdown += `| Failed | ${report.summary.failed} |\n`;
  markdown += `| Duration | ${report.summary.duration}ms |\n`;
  markdown += `| Success Rate | ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}% |\n\n`;

  // Results section
  markdown += `## Test Results\n\n`;

  for (const result of report.results) {
    const icon = result.status === 'passed' ? '✅' : '❌';
    markdown += `### ${icon} ${result.file}\n\n`;
    markdown += `- **Status:** ${result.status}\n`;
    markdown += `- **Tests:** ${result.tests}\n`;
    markdown += `- **Failures:** ${result.failures}\n`;
    markdown += `- **Duration:** ${result.duration}ms\n\n`;

    if (result.errors.length > 0) {
      markdown += `#### Errors\n\n`;
      for (const error of result.errors) {
        markdown += `- ${error}\n`;
      }
      markdown += `\n`;
    }
  }

  // Recommendations section
  markdown += `## Recommendations\n\n`;

  if (report.summary.failed === 0) {
    markdown += `✅ All tests passed! The data isolation and quota system is working correctly.\n\n`;
  } else {
    markdown += `⚠️  Some tests failed. Please review the errors above and:\n\n`;
    markdown += `1. Check that Supabase connection is configured correctly\n`;
    markdown += `2. Verify that RLS policies are applied\n`;
    markdown += `3. Ensure quota tables are properly set up\n`;
    markdown += `4. Check Redis connection for guest quota tests\n\n`;
  }

  // Write report
  writeFileSync(reportPath, markdown);

  console.log(`\n📄 Test report saved to: ${reportPath}`);
}

function printConsoleReport(report: TestReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  console.log(`\nTotal Tests:   ${report.summary.total}`);
  console.log(`✅ Passed:      ${report.summary.passed}`);
  console.log(`❌ Failed:      ${report.summary.failed}`);
  console.log(`⏱️  Duration:    ${report.summary.duration}ms`);
  console.log(
    `📈 Success:     ${((report.summary.passed / Math.max(1, report.summary.total)) * 100).toFixed(1)}%`
  );

  console.log('\n' + '='.repeat(60));

  if (report.summary.failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('='.repeat(60) + '\n');
}

// Main execution
try {
  const report = runTests();
  generateReport(report);
  printConsoleReport(report);

  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
} catch (error) {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
}
