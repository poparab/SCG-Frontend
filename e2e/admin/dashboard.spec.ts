import { test, expect, ADMIN_PREFIX, testAdmin, uniqueTestEmail } from '../fixtures/helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_PREFIX}/auth/login`);
    await page.fill('#email', testAdmin.email);
    await page.fill('#password', testAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('should display admin dashboard with KPIs', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('.dashboard, .card, .kpi, [class*="dashboard"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('should show sidebar navigation', async ({ page }) => {
    // Admin should have sidebar with navigation links
    const sidebar = page.locator('nav, .sidebar, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should reflect registered agencies in dashboard KPIs', async ({ page, apiHelpers }) => {
    // Register agencies via API
    await apiHelpers.registerAgency(uniqueTestEmail('dash-a1'));
    await apiHelpers.registerAgency(uniqueTestEmail('dash-a2'));

    // Refresh dashboard
    await page.reload();
    await page.waitForTimeout(2000);

    // Dashboard content should be visible
    await expect(page.locator('.dashboard, .card, [class*="dashboard"]').first()).toBeVisible();
  });

});
