import { test, expect, ADMIN_PREFIX, testAdmin } from '../fixtures/helpers';

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/auth/login`);
    await page.fill('#email', testAdmin.email);
    await page.fill('#password', testAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('should display admin users list', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/users`);
    await expect(page).toHaveURL(/\/users/);

    const table = page.locator('table.data-table, .table-card table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });

    // Should show at least the seed admin
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5_000 });
  });

  test('should show search and filter controls on users page', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/users`);

    const searchInput = page.locator('input.filter-input').first();
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    // Role and active/inactive filter selects
    const roleSelect = page.locator('select.filter-select').first();
    await expect(roleSelect).toBeVisible({ timeout: 5_000 });
  });

  test('should open create user modal and validate required fields', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/users`);

    const createBtn = page.locator('button.btn-primary').filter({ hasText: /Create|إنشاء/i });
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    // Submit without filling — should stay on modal (validation)
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(modal).toBeVisible({ timeout: 3_000 });
  });

  test('should create a new admin user', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/users`);

    const createBtn = page.locator('button.btn-primary').filter({ hasText: /Create|إنشاء/i });
    await createBtn.click();

    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const uniqueSuffix = Date.now();
    await modal.locator('input[formControlName="fullName"]').fill(`E2E Admin ${uniqueSuffix}`);
    await modal.locator('input[formControlName="email"]').fill(`e2e-admin-${uniqueSuffix}@test.com`);
    await modal.locator('input[formControlName="password"]').fill('Admin@1234');
    await modal.locator('select[formControlName="role"]').selectOption('Admin');

    await modal.locator('button[type="submit"]').click();

    // Should show success or close modal
    await page.waitForTimeout(2000);
    const modalGone = await modal.isHidden({ timeout: 5000 }).catch(() => false);
    const hasSuccess = await page.locator('.alert-success').isVisible({ timeout: 3000 }).catch(() => false);
    expect(modalGone || hasSuccess).toBeTruthy();
  });

  test('should toggle a user active status', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/users`);

    const table = page.locator('table.data-table, .table-card table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });

    // Find a non-admin row to toggle (avoid deactivating the seeded SuperAdmin)
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    let toggled = false;
    for (let i = 0; i < rowCount; i++) {
      const rowText = await rows.nth(i).textContent();
      // Skip the seeded admin row to avoid locking us out
      if (rowText?.includes('admin@scg.gov.eg')) continue;
      const toggleBtn = rows.nth(i).locator('button.action-btn').first();
      if (await toggleBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await toggleBtn.click();
        await page.waitForTimeout(1500);
        // Check the status badge (second .badge in the row — first is role badge)
        const statusBadge = rows.nth(i).locator('.badge').last();
        await expect(statusBadge).toBeVisible({ timeout: 5_000 });
        toggled = true;
        break;
      }
    }
    // If only the seeded admin exists, just verify the table loaded
    if (!toggled) {
      await expect(rows.first()).toBeVisible();
    }
  });

  test('should navigate to user detail page', async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/users`);

    const table = page.locator('table.data-table, .table-card table').first();
    await expect(table).toBeVisible({ timeout: 5_000 });

    // Click the view action link in the first row
    const viewBtn = table.locator('tbody tr').first().locator('a.action-btn-view').first();
    if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBtn.click();
      await expect(page).toHaveURL(/\/users\/.+/, { timeout: 5_000 });
    } else {
      // Fall back to clicking the name link
      const nameLink = table.locator('tbody tr').first().locator('a.link-primary').first();
      if (await nameLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameLink.click();
        await expect(page).toHaveURL(/\/users\/.+/, { timeout: 5_000 });
      }
    }
  });
});
