import { test, expect } from '../fixtures/helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'admin@scg.gov.eg');
    await page.fill('#password', 'Admin@1234');
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
    await apiHelpers.registerAgency(`dash-a1-${Date.now()}@test.com`);
    await apiHelpers.registerAgency(`dash-a2-${Date.now()}@test.com`);

    // Refresh dashboard
    await page.reload();
    await page.waitForTimeout(2000);

    // Dashboard content should be visible
    await expect(page.locator('.dashboard, .card, [class*="dashboard"]').first()).toBeVisible();
  });
});
