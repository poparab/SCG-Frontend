import { test, expect } from '../fixtures/helpers';

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display admin login form', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login as admin and redirect to dashboard', async ({ page }) => {
    await page.fill('#email', 'admin@scg.gov.eg');
    await page.fill('#password', 'Admin@1234');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.fill('#email', 'admin@scg.gov.eg');
    await page.fill('#password', 'WrongPassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 10_000 });
  });
});
