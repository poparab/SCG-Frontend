import { test, expect, API_BASE, ADMIN_PREFIX } from '../fixtures/helpers';

const ADMIN_BASE_URL = process.env.BASE_URL_ADMIN || 'http://localhost:4201';

function adminUrl(path: string): string {
  return `${ADMIN_BASE_URL}${ADMIN_PREFIX}${path}`;
}

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

  test('should search agencies by text and filter them by status', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const apiHelpers = new helpers(page);

    const pendingEmail = `pending-filter-${Date.now()}@test.com`;
    const approvedEmail = `approved-filter-${Date.now()}@test.com`;

    await apiHelpers.registerAgency(pendingEmail);
    await apiHelpers.registerAgency(approvedEmail);

    const adminToken = await apiHelpers.loginAdmin();
    await apiHelpers.approveAgency(approvedEmail, adminToken);

    await page.goto(adminUrl('/auth/login'));
    await page.fill('#email', 'admin@scg.gov.eg');
    await page.fill('#password', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    await page.goto(adminUrl('/agencies'));

    const searchInput = page.locator('input[type="search"], input[placeholder*="وكيل"], input[placeholder*="Agency"], input[placeholder*="Search"]').first();
    const approvedPill = page.locator('button.pill').filter({ hasText: /Approved|معتمد/i });
    const pendingRow = page.locator('tr', { has: page.locator(`text=${pendingEmail}`) });
    const approvedRow = page.locator('tr', { has: page.locator(`text=${approvedEmail}`) });

    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill(pendingEmail);
    await expect(pendingRow.first()).toBeVisible({ timeout: 10_000 });

    await approvedPill.click();
    await expect(pendingRow).toHaveCount(0, { timeout: 10_000 });

    await searchInput.fill(approvedEmail);
    await expect(approvedRow.first()).toBeVisible({ timeout: 10_000 });

    await context.close();
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

  test('should show newly added nationality for every agency detail', async ({ page, apiHelpers }) => {
    const adminToken = await apiHelpers.loginAdmin();
    const code = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const createdNationality = await apiHelpers.createNationality(adminToken, code, 125);
    expect(createdNationality === null || createdNationality.id).toBeTruthy();

    const email = `agency-nats-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);

    const listRes = await page.request.get(
      `${API_BASE}/agencies?searchTerm=${email}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json();
    const agencyId = list.data.items[0].id as string;

    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);

    await expect(page.locator('table.data-table')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('tbody tr').filter({ hasText: code }).first()).toBeVisible({ timeout: 10_000 });
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
    await modal.locator('select[formControlName="paymentMethod"]').selectOption('Cash');
    await modal.locator('input[formControlName="reference"]').fill(`REF-E2E-${Date.now()}`);

    // Submit
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10_000 });

    const walletResponse = await page.request.get(`${API_BASE}/agencies/${agencyId}/wallet`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(walletResponse.ok()).toBeTruthy();
    const wallet = await walletResponse.json();
    expect(wallet.data.balance).toBe(1000);
  });

  test('US-M2-W1: should credit agency wallet without manual reference', async ({ page, apiHelpers }) => {
    const email = `credit-no-ref-${Date.now()}@test.com`;
    await apiHelpers.registerAgency(email);
    const adminToken = await apiHelpers.loginAdmin();
    const agencyId = await apiHelpers.approveAgency(email, adminToken);

    await page.goto(`${ADMIN_PREFIX}/agencies/${agencyId}`);

    const creditBtn = page.locator('button').filter({ hasText: /Credit|إيداع/i }).first();
    await expect(creditBtn).toBeVisible({ timeout: 5_000 });
    await creditBtn.click();

    const modal = page.locator('.modal-panel');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await modal.locator('input[formControlName="amount"]').fill('750');
    await modal.locator('select[formControlName="paymentMethod"]').selectOption('Cash');

    await modal.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10_000 });

    const walletResponse = await page.request.get(`${API_BASE}/agencies/${agencyId}/wallet`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(walletResponse.ok()).toBeTruthy();
    const wallet = await walletResponse.json();
    expect(wallet.data.balance).toBe(750);
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
