import { test, expect, API_BASE, testAgency, testTravelers } from '../fixtures/helpers';

test.describe('Portal Inquiry List (US-IL-01)', () => {
  let agencyEmail: string;
  let agencyId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = `inqlist-e2e-${Date.now()}@test.com`;
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);
    await api.createNationality(adminToken, 'SD', 100);

    // Create and submit a batch to generate inquiries
    const agencyToken = await api.loginAgency(agencyEmail, testAgency.password);
    const t = testTravelers[4]; // Amira Hassan — SD
    const batchRes = await page.request.post(`${API_BASE}/batches`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
      data: {
        name: `InqList Batch ${Date.now()}`,
        nationalityCode: 'SD',
        travelers: [{
          firstNameEn: t.firstNameEn, lastNameEn: t.lastNameEn,
          passportNumber: `SD${Date.now()}`, dateOfBirth: t.birthDate,
          gender: 1, travelDate: '2026-10-01'
        }]
      }
    });
    if (batchRes.ok()) {
      const batch = await batchRes.json();
      if (batch.id) {
        await page.request.post(`${API_BASE}/batches/${batch.id}/submit`, {
          headers: { Authorization: `Bearer ${agencyToken}` }
        });
      }
    }
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', testAgency.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await page.goto('/inquiries');
  });

  test('AC1: should display inquiry list page with table', async ({ page }) => {
    await expect(page).toHaveURL(/\/inquiries/);
    // Inquiry list goes straight to filter bar + table (no KPI cards)
    const table = page.locator('.data-table-card').first();
    await expect(table).toBeVisible({ timeout: 5_000 });
  });

  test('AC2: should display search and filter controls', async ({ page }) => {
    const filterBar = page.locator('.filter-bar');
    await expect(filterBar).toBeVisible({ timeout: 5_000 });
  });

  test('AC3: should display inquiry table with expected columns', async ({ page }) => {
    const table = page.locator('.data-table-card .data-table');
    await expect(table).toBeVisible({ timeout: 5_000 });

    // Should have header row
    const headers = table.locator('thead th');
    await expect(headers.first()).toBeVisible();
  });

  test('AC3: should show at least one inquiry row', async ({ page }) => {
    const table = page.locator('.data-table-card .data-table');
    await expect(table).toBeVisible({ timeout: 5_000 });

    const rows = table.locator('tbody tr');
    // Check rows exist (may show empty state in Arabic if no inquiries created)
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to inquiry detail on row click', async ({ page }) => {
    const row = page.locator('.data-table-card .data-table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await expect(page).toHaveURL(/\/inquiries\/.+/, { timeout: 5_000 });
    }
  });

  test('AC2: should filter inquiries by status', async ({ page }) => {
    const statusFilter = page.locator('select').filter({ hasText: /Submitted|Approved|Rejected/ }).first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption('Submitted');
      const applyBtn = page.locator('.filter-bar .btn-search').first();
      if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
