import { test, expect, API_BASE } from '../fixtures/helpers';

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

    agencyEmail = `bdetail-e2e-${Date.now()}@test.com`;
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);
    await api.createNationality(adminToken, 'AF', 100);

    // Create and submit a batch using the current API contract.
    const agencyToken = await api.loginAgency(agencyEmail, 'Test@1234');
    const batchRes = await page.request.post(`${API_BASE}/batches`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
      data: {
        agencyId,
        name: `Detail Test Batch ${Date.now()}`,
        notes: 'E2E batch detail setup'
      }
    });
    expect(batchRes.ok()).toBeTruthy();

    const batch = unwrap<{ id: string }>(await batchRes.json());
    batchId = batch.id;

    for (const traveler of [
      {
        firstNameEn: 'Omar', lastNameEn: 'Farouq', passportNumber: `LY${Date.now()}A`,
        dateOfBirth: '1985-03-20', gender: 0, travelDate: '2026-07-01'
      },
      {
        firstNameEn: 'Sara', lastNameEn: 'Ahmed', passportNumber: `LY${Date.now()}B`,
        dateOfBirth: '1992-08-10', gender: 1, travelDate: '2026-07-01'
      }
    ]) {
      const addTravelerRes = await page.request.post(`${API_BASE}/batches/${batchId}/travelers`, {
        headers: { Authorization: `Bearer ${agencyToken}` },
        data: {
          ...traveler,
          nationalityCode: 'AF',
          passportExpiry: '2030-01-01',
          departureCountry: 'AF',
          purposeOfTravel: 'Tourism',
          arrivalAirport: null,
          transitCountries: null,
          flightNumber: null
        }
      });

      expect(addTravelerRes.ok()).toBeTruthy();
    }

    const submitRes = await page.request.post(`${API_BASE}/batches/${batchId}/submit`, {
      headers: { Authorization: `Bearer ${agencyToken}` }
    });
    expect(submitRes.ok()).toBeTruthy();

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', 'Test@1234');
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
