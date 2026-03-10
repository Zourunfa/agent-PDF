/**
 * Comprehensive Test Runner for Data Isolation and Quota Testing
 *
 * This script runs all tests and generates a detailed report.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  file: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  tests: number;
  failures: number;
}

interface TestReport {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  results: TestResult[];
  details: {
    dataIsolation: {
      postgresqlRLS: string[];
      pineconeNamespace: string[];
      crossUserAccess: string[];
    };
    guestQuota: {
      deviceFingerprinting: string[];
      quotaLimitEnforcement: string[];
      dataIsolation: string[];
    };
    quotaSystem: {
      uploadQuota: string[];
      chatQuota: string[];
      quotaStatistics: string[];
      quotaReset: string[];
    };
  };
}

class TestRunner {
  private results: TestResult[] = [];
  private reportPath: string;

  constructor() {
    this.reportPath = path.join(process.cwd(), '__tests__', 'test-report.json');
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting comprehensive test suite...\n');

    const startTime = Date.now();

    // Run unit tests first
    await this.runTestSuite('Unit Tests', 'npm test -- --testPathPattern=__tests__/unit');

    // Run integration tests
    await this.runTestSuite('Data Isolation Tests', 'npm test -- --testPathPattern=data-isolation');
    await this.runTestSuite('Quota System Tests', 'npm test -- --testPathPattern=quota-system');
    await this.runTestSuite('Guest Quota Tests', 'npm test -- --testPathPattern=guest-quota');
    await this.runTestSuite('Guest Isolation Tests', 'npm test -- --testPathPattern=guest-isolation');
    await this.runTestSuite('Pinecone Isolation Tests', 'npm test -- --testPathPattern=pinecone-isolation');

    // Run E2E tests
    await this.runTestSuite('Quota Enforcement E2E', 'npm test -- --testPathPattern=quota-enforcement');

    const duration = Date.now() - startTime;

    // Generate report
    this.generateReport(duration);

    // Print summary
    this.printSummary();
  }

  private async runTestSuite(name: string, command: string): Promise<void> {
    console.log(`\n📋 Running: ${name}`);
    console.log('─'.repeat(60));

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 120000, // 2 minutes per suite
      });

      console.log(output);

      // Parse results
      const result = this.parseTestOutput(name, output, true);
      this.results.push(result);

      console.log(`✅ ${name}: PASSED\n`);
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || '';
      console.log(errorOutput);

      const result = this.parseTestOutput(name, errorOutput, false);
      this.results.push(result);

      console.log(`❌ ${name}: FAILED\n`);
    }
  }

  private parseTestOutput(suiteName: string, output: string, passed: boolean): TestResult {
    // Extract test count and failures from Jest output
    const testsMatch = output.match(/Tests:\s+(\d+)\s+passed,/);
    const failuresMatch = output.match(/(\d+)\s+failed/);
    const durationMatch = output.match(/in\s+(\d+\.?\d*)\s*s/);

    const tests = testsMatch ? parseInt(testsMatch[1]) : 0;
    const failures = failuresMatch ? parseInt(failuresMatch[1]) : 0;
    const duration = durationMatch ? parseFloat(durationMatch[1]) * 1000 : 0;

    return {
      file: suiteName,
      status: passed ? 'pass' : 'fail',
      duration,
      tests: tests + failures,
      failures,
    };
  }

  private generateReport(totalDuration: number): void {
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.reduce((sum, r) => sum + r.tests, 0),
        passed: this.results.filter(r => r.status === 'pass').reduce((sum, r) => sum + r.tests, 0),
        failed: this.results.reduce((sum, r) => sum + r.failures, 0),
        skipped: 0,
        duration: totalDuration,
      },
      results: this.results,
      details: {
        dataIsolation: {
          postgresqlRLS: [
            'User can only view their own PDFs',
            'User cannot view other users PDFs',
            'User cannot insert PDFs for other users',
            'User cannot delete other users PDFs',
            'User cannot update other users PDFs',
            'SQL injection cannot bypass RLS',
          ],
          pineconeNamespace: [
            'PDFs are stored in correct user namespaces',
            'User can only query their own namespace',
            'Different users have different namespaces',
            'Namespace filter enforces user isolation',
            'Combined userId and pdfId filter works correctly',
            'Deleting from one namespace does not affect others',
          ],
          crossUserAccess: [
            'Users cannot access data from other namespaces',
            'Cross-namespace search returns no results',
            'Default namespace is separate from user namespaces',
          ],
        },
        guestQuota: {
          deviceFingerprinting: [
            'Unique fingerprints for different devices',
            'Same device maintains consistent fingerprint',
            'Fingerprint includes IP and User-Agent',
          ],
          quotaLimitEnforcement: [
            'Guest allowed when under limit (0-2 uses)',
            'Guest blocked when at limit (3 uses)',
            'Guest remaining quota calculated correctly',
            'Guest usage increments on upload',
          ],
          dataIsolation: [
            'Different guests cannot access each other data',
            'Guest data marked as migrated after registration',
            'Migrated guest data not migrated again',
            'Guest data can be cleaned up',
          ],
        },
        quotaSystem: {
          uploadQuota: [
            'Default quota definitions exist',
            'User starts with zero usage',
            'Upload usage is recorded correctly',
            'Multiple uploads increment usage correctly',
            'Quota enforcement at API level',
          ],
          chatQuota: [
            'Chat usage is recorded correctly',
            'Chat respects daily quota limit',
            'Chat quota check before processing',
          ],
          quotaStatistics: [
            'User can view their own quota stats',
            'Quota stats reflect actual usage',
            'Quota stats API returns correct format',
          ],
          quotaReset: [
            'Daily quotas reset correctly',
            'Quota reset at day boundary',
          ],
        },
      },
    };

    // Write report to file
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report saved to: ${this.reportPath}`);
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'pass');
    const failed = this.results.filter(r => r.status === 'fail');
    const totalTests = this.results.reduce((sum, r) => sum + r.tests, 0);
    const totalFailures = this.results.reduce((sum, r) => sum + r.failures, 0);

    console.log('\n' + '═'.repeat(60));
    console.log('📈 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Test Suites: ${this.results.length}`);
    console.log(`Passed: ${passed.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Total Failures: ${totalFailures}`);
    console.log('═'.repeat(60));

    if (failed.length > 0) {
      console.log('\n❌ Failed Test Suites:');
      failed.forEach(r => {
        console.log(`  - ${r.file} (${r.failures} failures)`);
      });
    }

    console.log('\n✅ Passed Test Suites:');
    passed.forEach(r => {
      console.log(`  - ${r.file}`);
    });

    console.log('\n');
  }
}

// Run tests
const runner = new TestRunner();
runner.runAllTests().catch(console.error);
