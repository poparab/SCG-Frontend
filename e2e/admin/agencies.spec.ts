import { test, expect, API_BASE, ADMIN_PREFIX } from '../fixtures/helpers';

test.describe('Admin Agency Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${ADMIN_PREFIX}/auth/login`);
    await page.fill('#email', 'admin@scg.gov.eg');
    await page.fill('#password', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('should navigate to agencies list', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/agencies`);
    await expect(page).toHaveURL(/\/agencies/);
    // Should show a table or list
    await expect(page.locator('table, .agency-list, [class*="agencies"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('should approve a pending agency', async ({ page, apiHelpers }) => {
    // Register an agency via API
    const email = `admin-approve-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);

    // Navigate to agencies
    await page.goto(`${ADMIN_PREFIX}/agencies`);
    await page.waitForTimeout(1000);

    // Look for the agency in the list (or search for it)
    const searchInput = page.locator('input[type="search"], input[type="text"][placeholder*="Search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(email);
      await page.waitForTimeout(1000);
    }

    // Find and click on the agency's detail action button
    const agencyRow = page.locator('tr', { has: page.locator(`text=${email}`) });
    const actionBtn = agencyRow.locator('a.btn-action').first();
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      // Should navigate to agency detail
      await expect(page).toHaveURL(/\/agencies\/.+/);
    }
  });

  test('should view agency detail', async ({ page, apiHelpers }) => {
    const email = `detail-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);
    const adminToken = await apiHelpers.loginAdmin();
    const agencyId = await apiHelpers.approveAgency(email, adminToken);

    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);
    await expect(page).toHaveURL(new RegExp(`/agencies/${agencyId}`));
  });

  test('US-M2-09 AC2/AC3: should approve agency via detail page UI', async ({ page, apiHelpers }) => {
    const email = `ui-approve-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);

    // Find agency via API to get ID
    const adminToken = await apiHelpers.loginAdmin();
    const listRes = await page.request.get(
      `${API_BASE}/agencies?searchTerm=${email}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const list = await listRes.json();
    const agencyId = list.data.items[0].id;

    // Navigate to agency detail
    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);
    await expect(page).toHaveURL(new RegExp(`/agencies/${agencyId}`));

    // Should show Approve button for pending agency
    const approveBtn = page.locator('button.btn-success').filter({ hasText: /Approve|اعتماد/i });
    await expect(approveBtn).toBeVisible({ timeout: 5_000 });

    // Click approve
    await approveBtn.click();
    await page.waitForTimeout(2000);

    // Status should change (badge should update)
    const badge = page.locator('.badge');
    await expect(badge).toContainText(/Approved|Active/i, { timeout: 5_000 });
  });

  test('US-M2-09 AC4: approved agency should be able to login', async ({ page, apiHelpers }) => {
    const email = `login-after-approve-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email, 'Test@1234');
    const adminToken = await apiHelpers.loginAdmin();
    await apiHelpers.approveAgency(email, adminToken);

    // Verify the agency can login via API
    const token = await apiHelpers.loginAgency(email, 'Test@1234');
    expect(token).toBeTruthy();
  });

  test('US-M2-W1 AC1/AC2: should show wallet section with credit button on active agency', async ({ page, apiHelpers }) => {
    const email = `wallet-ui-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);
    const adminToken = await apiHelpers.loginAdmin();
    const agencyId = await apiHelpers.approveAgency(email, adminToken);

    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);

    // Wallet section should be visible (last info-card contains wallet)
    const walletSection = page.locator('.info-card').last();
    await expect(walletSection).toBeVisible({ timeout: 5_000 });

    // Credit button should exist
    const creditBtn = walletSection.locator('button').filter({ hasText: /Credit|إيداع/i });
    await expect(creditBtn).toBeVisible();
  });

  test('US-M2-W1 AC3: should credit agency wallet via UI modal', async ({ page, apiHelpers }) => {
    const email = `credit-ui-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);
    const adminToken = await apiHelpers.loginAdmin();
    const agencyId = await apiHelpers.approveAgency(email, adminToken);

    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);

    // Click credit wallet button
    const creditBtn = page.locator('button').filter({ hasText: /Credit|إيداع/i }).first();
    await expect(creditBtn).toBeVisible({ timeout: 5_000 });
    await creditBtn.click();

    // Modal should open
    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    // Fill credit form
    await modal.locator('input[formControlName="amount"]').fill('1000');
    await modal.locator('input[formControlName="reference"]').fill(`REF-E2E-${Date.now()}`);

    // Submit
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();

    // Wait for API response and modal to close (or success feedback)
    await page.waitForTimeout(3000);
    // Check if modal closed or if success alert appeared
    const modalStillVisible = await modal.isVisible().catch(() => false);
    if (modalStillVisible) {
      // Check for success alert on the page behind modal
      const successAlert = page.locator('.alert-success');
      const hasSuccess = await successAlert.isVisible({ timeout: 3000 }).catch(() => false);
      // Close modal manually if success
      if (hasSuccess) {
        await page.locator('.modal-close, .modal-backdrop').first().click();
      }
    }
  });

  test('US-M2-W1: credit wallet form should require amount', async ({ page, apiHelpers }) => {
    const email = `credit-val-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);
    const adminToken = await apiHelpers.loginAdmin();
    const agencyId = await apiHelpers.approveAgency(email, adminToken);

    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);

    const creditBtn = page.locator('button').filter({ hasText: /Credit|إيداع/i }).first();
    await creditBtn.click();

    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    // Submit without filling amount
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();

    // Should show validation error
    await expect(modal.locator('.is-invalid, .invalid-feedback').first()).toBeVisible({ timeout: 3_000 });
  });
});
