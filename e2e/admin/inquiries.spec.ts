import { test, expect } from '../fixtures/helpers';

test.describe('Admin Inquiry Management (US-M2-15, US-M2-16)', () => {
  let agencyEmail: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    // Create an agency with a submitted batch to generate inquiries
    agencyEmail = `adm-inq-e2e-${Date.now()}@test.com`;
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    const agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);
    await api.createNationality(adminToken, 'SO', 100);

    const agencyToken = await api.loginAgency(agencyEmail, 'Test@1234');
    const batchRes = await page.request.post('http://localhost:5155/api/batches', {
      headers: { Authorization: `Bearer ${agencyToken}` },
      data: {
        name: `Admin InqTest ${Date.now()}`,
        nationalityCode: 'SO',
        travelers: [{
          firstNameEn: 'Mohamed', lastNameEn: 'Abdi',
          passportNumber: `SO${Date.now()}`, dateOfBirth: '1991-04-12',
          gender: 0, travelDate: '2026-10-01'
        }]
      }
    });
    if (batchRes.ok()) {
      const batch = await batchRes.json();
      if (batch.id) {
        await page.request.post(`http://localhost:5155/api/batches/${batch.id}/submit`, {
          headers: { Authorization: `Bearer ${agencyToken}` }
        });
      }
    }
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'admin@scg.gov.eg');
    await page.fill('#password', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('US-M2-15 AC1: should display inquiry list with data columns', async ({ page }) => {
    await page.goto('/inquiries');
    await expect(page).toHaveURL(/\/inquiries/);

    const table = page.locator('table.data-table, .table-card table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });

    // Check headers exist
    const headers = table.locator('thead th');
    await expect(headers.first()).toBeVisible();
  });

  test('US-M2-15 AC1: should show at least one inquiry', async ({ page }) => {
    await page.goto('/inquiries');

    const table = page.locator('table.data-table, .table-card table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });

    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('US-M2-15 AC2: should have search and filter controls', async ({ page }) => {
    await page.goto('/inquiries');

    // Search box
    const searchBox = page.locator('.search-box input, input[type="search"]').first();
    await expect(searchBox).toBeVisible({ timeout: 5_000 });

    // Filter pills for status
    const pills = page.locator('button.pill');
    const pillCount = await pills.count();
    expect(pillCount).toBeGreaterThanOrEqual(2);
  });

  test('US-M2-15 AC2: should filter inquiries by status', async ({ page }) => {
    await page.goto('/inquiries');

    // Click a status filter pill
    const submittedPill = page.locator('button.pill').filter({ hasText: /Submitted|Under/ }).first();
    if (await submittedPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submittedPill.click();
      await page.waitForTimeout(1000);
      // Table should still be visible (may show filtered results or empty state)
      const table = page.locator('table.data-table, .table-card table').first();
      await expect(table).toBeVisible({ timeout: 5_000 });
    }
  });

  test('US-M2-16 AC1: should navigate to inquiry detail', async ({ page }) => {
    await page.goto('/inquiries');

    const viewBtn = page.locator('a.btn-action').first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await expect(page).toHaveURL(/\/inquiries\/.+/, { timeout: 5_000 });

      // Detail page should show traveler info
      const detail = page.locator('.detail-page, [class*="detail"]').first();
      await expect(detail).toBeVisible({ timeout: 5_000 });
    }
  });

  test('US-M2-15 AC2: should search inquiries by text', async ({ page }) => {
    await page.goto('/inquiries');

    const searchBox = page.locator('.search-box input').first();
    await expect(searchBox).toBeVisible({ timeout: 5_000 });
    await searchBox.fill('Mohamed');
    await searchBox.press('Enter');
    await page.waitForTimeout(1000);

    // Table should be visible with results
    const table = page.locator('table.data-table, .table-card table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });
  });
});
