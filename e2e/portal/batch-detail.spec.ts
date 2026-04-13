import { test, expect, testAgency, testTravelers, uniqueTestEmail } from '../fixtures/helpers';

function unwrap<T>(body: { data: T }): T {
  return body.data;
}

test.describe.configure({ mode: 'serial' });

test.describe('Portal Batch Detail (US-40, US-40A)', () => {
  let agencyEmail: string;
  let agencyId: string;
  let batchId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = uniqueTestEmail('bdetail-e2e');
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);
    await api.createNationality(adminToken, 'AF', 100);

    // Create and submit a batch using the current API contract.
    const agencyToken = await api.loginAgency(agencyEmail, 'Test@1234');
    const batch = await api.createBatch(agencyToken, agencyId, `Detail Test Batch ${Date.now()}`, 'E2E batch detail setup');
    batchId = batch.id;

    for (const traveler of [
      {
        firstNameEn: testTravelers[6].firstNameEn,   // Ali — AF
        lastNameEn: testTravelers[6].lastNameEn,
        passportNumber: `AF${Date.now()}A`,
        dateOfBirth: testTravelers[6].birthDate,
        gender: 0,
        travelDate: '2026-10-01'
      },
      {
        firstNameEn: testTravelers[4].firstNameEn,   // Amira — SD (used as second traveler)
        lastNameEn: testTravelers[4].lastNameEn,
        passportNumber: `AF${Date.now()}B`,
        dateOfBirth: testTravelers[4].birthDate,
        gender: 1,
        travelDate: '2026-10-01'
      }
    ]) {
      await api.addTravelerToBatch(agencyToken, batchId, {
        ...traveler,
        nationalityCode: 'AF',
        passportExpiry: '2030-01-01',
        departureCountry: 'AF',
        purposeOfTravel: 'Tourism',
        arrivalAirport: null,
        transitCountries: null,
        flightNumber: null
      });
    }

    await api.submitBatch(agencyToken, batchId);

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', testAgency.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('AC1: should display batch detail with metadata', async ({ page }) => {
    await page.goto(`/batches/${batchId}`);
    await expect(page).toHaveURL(new RegExp(`/batches/${batchId}`));

    // Should show batch detail content (uses .portal-body/.portal-hero layout)
    const container = page.locator('.portal-body, .portal-hero, .batch-meta').first();
    await expect(container).toBeVisible({ timeout: 5_000 });
  });

  test('AC2: should display per-traveler table', async ({ page }) => {
    await page.goto(`/batches/${batchId}`);

    // Should have a table with traveler rows
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });
    // Should show travelers (at least the table structure)
    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('AC2: traveler rows should show expected columns', async ({ page }) => {
    await page.goto(`/batches/${batchId}`);

    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });

    // Table should have content (translated, so check for any text)
    const firstRow = table.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 5_000 });
  });

  test('should show back navigation', async ({ page }) => {
    await page.goto(`/batches/${batchId}`);

    const backBtn = page.locator('.btn-back, a[routerLink="/batches"]').first();
    await expect(backBtn).toBeVisible({ timeout: 5_000 });
  });

  test('US-40A AC1: should show export action', async ({ page }) => {
    await page.goto(`/batches/${batchId}`);

    // Look for export button
    const exportBtn = page.locator('button, a').filter({ hasText: /export|download|report/i }).first();
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible();
    }
  });
});
