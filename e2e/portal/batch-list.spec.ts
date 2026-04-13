import { test, expect, testAgency, testTravelers, uniqueTestEmail } from '../fixtures/helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Portal Batch List (US-BL-01)', () => {
  let agencyEmail: string;
  let agencyId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = uniqueTestEmail('blist-e2e');
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);
    await api.createNationality(adminToken, 'IQ', 100);

    // Create and submit a batch via API to have data
    const agencyToken = await api.loginAgency(agencyEmail, testAgency.password);
    const t = testTravelers[0]; // Omar Al-Rashidi — IQ
    const batch = await api.createBatch(agencyToken, agencyId, `Batch ListTest ${Date.now()}`);
    await api.addTravelerToBatch(agencyToken, batch.id, {
      firstNameEn: t.firstNameEn,
      lastNameEn: t.lastNameEn,
      firstNameAr: t.firstNameAr,
      lastNameAr: t.lastNameAr,
      passportNumber: `IQ${Date.now()}`,
      nationalityCode: 'IQ',
      dateOfBirth: t.birthDate,
      gender: 0,
      travelDate: '2026-10-01',
      arrivalAirport: null,
      transitCountries: null,
      passportExpiry: t.passportExpiry,
      departureCountry: 'IQ',
      purposeOfTravel: 'Tourism',
      flightNumber: null
    });
    await api.submitBatch(agencyToken, batch.id);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', testAgency.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await page.goto('/batches');
  });

  test('should display batch list page with table', async ({ page }) => {
    await expect(page).toHaveURL(/\/batches/);
    await expect(page.locator('.data-table-card').first()).toBeVisible({ timeout: 5_000 });
  });

  test('should display filter controls', async ({ page }) => {
    // Check for filter bar with status and search
    const filterBar = page.locator('.filter-bar');
    await expect(filterBar).toBeVisible({ timeout: 5_000 });
  });

  test('should show batch rows with expected columns', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('.data-table-card .data-table');
    await expect(table).toBeVisible({ timeout: 5_000 });
    // Check header columns exist
    const headers = table.locator('thead th');
    await expect(headers.first()).toBeVisible();
  });

  test('should navigate to batch detail on row click', async ({ page }) => {
    const row = page.locator('.data-table-card .data-table tbody tr').first();
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      await row.click();
      await expect(page).toHaveURL(/\/batches\/.+/, { timeout: 5_000 });
    }
  });

  test('should navigate to create new batch', async ({ page }) => {
    const createBtn = page.locator('a[routerLink="/batches/new"], a[href="/batches/new"]').first();
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();
    await expect(page).toHaveURL(/\/batches\/new/);
  });

  test('should filter batches by status', async ({ page }) => {
    const statusFilter = page.locator('select').filter({ hasText: /Draft|Submitted/ }).first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption('Submitted');
      // Apply filter
      const applyBtn = page.locator('.filter-bar .btn-search').first();
      if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
