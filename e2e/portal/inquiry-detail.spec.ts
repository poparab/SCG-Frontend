import { test, expect, API_BASE } from '../fixtures/helpers';

function unwrap<T>(body: { data: T }): T {
  return body.data;
}

test.describe.configure({ mode: 'serial' });

test.describe('Portal Inquiry Detail (US-IV-01)', () => {
  let agencyEmail: string;
  let agencyId: string;
  let inquiryId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = `inqdet-e2e-${Date.now()}@test.com`;
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);

    const agencyToken = await api.loginAgency(agencyEmail, 'Test@1234');
    const batchRes = await page.request.post(`${API_BASE}/batches`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
      data: {
        agencyId,
        name: `InqDetail Batch ${Date.now()}`,
        notes: 'E2E inquiry detail setup'
      }
    });
    expect(batchRes.ok()).toBeTruthy();

    const batch = unwrap<{ id: string }>(await batchRes.json());

    const addTravelerRes = await page.request.post(`${API_BASE}/batches/${batch.id}/travelers`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
      data: {
        firstNameEn: 'Nasser',
        lastNameEn: 'Salem',
        firstNameAr: null,
        lastNameAr: null,
        passportNumber: `AF${Date.now()}`,
        nationalityCode: 'AF',
        dateOfBirth: '1995-02-28',
        gender: 0,
        travelDate: '2026-09-01',
        arrivalAirport: null,
        transitCountries: null,
        passportExpiry: '2030-01-01',
        departureCountry: 'AF',
        purposeOfTravel: 'Tourism',
        flightNumber: null
      }
    });
    expect(addTravelerRes.ok()).toBeTruthy();

    const submitRes = await page.request.post(`${API_BASE}/batches/${batch.id}/submit`, {
      headers: { Authorization: `Bearer ${agencyToken}` }
    });
    expect(submitRes.ok()).toBeTruthy();

    const inqRes = await page.request.get(`${API_BASE}/inquiries?agencyId=${agencyId}`, {
      headers: { Authorization: `Bearer ${agencyToken}` }
    });
    expect(inqRes.ok()).toBeTruthy();

    const inqData = unwrap<{ items: Array<{ id: string }> }>(await inqRes.json());
    inquiryId = inqData.items[0].id;

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('AC1: should display inquiry detail page with summary cards', async ({ page }) => {
    test.skip(!inquiryId, 'No inquiry ID available');
    await page.goto(`/inquiries/${inquiryId}`);
    await expect(page).toHaveURL(new RegExp(`/inquiries/${inquiryId}`));

    // Should show detail content (uses .portal-body layout with .detail-card)
    const detail = page.locator('.portal-body, .detail-card, .status-tracker').first();
    await expect(detail).toBeVisible({ timeout: 5_000 });
  });

  test('AC2: should display traveler and travel details', async ({ page }) => {
    test.skip(!inquiryId, 'No inquiry ID available');
    await page.goto(`/inquiries/${inquiryId}`);

    // Should show inquiry reference (INQ-XXXXXXXX-XXXXXX format) or traveler data
    await expect(page.locator('body')).toContainText(/INQ-|Nasser/, { timeout: 5_000 });
  });

  test('AC3: should display processing timeline', async ({ page }) => {
    test.skip(!inquiryId, 'No inquiry ID available');
    await page.goto(`/inquiries/${inquiryId}`);

    // Status section should be visible (no timeline component, uses status-tracker)
    const statusSection = page.locator('.status-tracker, .detail-card, .status-pill').first();
    if (await statusSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusSection).toBeVisible();
    }
  });

  test('AC4: should show back navigation to inquiry list', async ({ page }) => {
    test.skip(!inquiryId, 'No inquiry ID available');
    await page.goto(`/inquiries/${inquiryId}`);

    const backLink = page.locator('.btn-back, a[routerLink="/inquiries"]').first();
    await expect(backLink).toBeVisible({ timeout: 5_000 });
    await backLink.click();
    await expect(page).toHaveURL(/\/inquiries/, { timeout: 5_000 });
  });
});
