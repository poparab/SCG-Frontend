import { request } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5155/api';

/**
 * Playwright global teardown — runs once after ALL tests finish.
 * Calls the backend E2E cleanup endpoint to remove test data (@test.com agencies, batches, etc.).
 */
async function globalTeardown() {
  console.log('\n🧹 Running E2E cleanup...');

  try {
    const context = await request.newContext();

    // Login as admin to get auth cookie
    const loginRes = await context.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@scg.gov.eg', password: 'Admin@1234', loginType: 'admin' },
    });

    if (!loginRes.ok()) {
      console.log(`⚠️  Cleanup skipped — admin login failed (${loginRes.status()})`);
      await context.dispose();
      return;
    }

    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    // Call cleanup endpoint
    const cleanupRes = await context.post(`${API_BASE}/e2e/cleanup`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (cleanupRes.ok()) {
      const result = await cleanupRes.json();
      const data = result.data || result;
      console.log('✅ E2E cleanup completed:');
      for (const [key, count] of Object.entries(data)) {
        if (typeof count === 'number' && count > 0) {
          console.log(`   ${key}: ${count} deleted`);
        }
      }
    } else {
      console.log(`⚠️  Cleanup endpoint returned ${cleanupRes.status()} — may not be available in this environment`);
    }

    await context.dispose();
  } catch (err) {
    // Cleanup is best-effort — don't fail the test run
    console.log(`⚠️  Cleanup skipped — ${(err as Error).message}`);
  }
}

export default globalTeardown;
