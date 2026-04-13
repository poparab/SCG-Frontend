import { test, expect, testAgency, uniqueTestEmail } from '../fixtures/helpers';

test.describe('Portal Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'WrongPassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 10_000 });
  });

  test('should login with approved agency and redirect to dashboard', async ({ page, apiHelpers }) => {
    const email = uniqueTestEmail('login-e2e');
    const password = testAgency.password;

    // Setup via API: register, approve
    await apiHelpers.registerAgency(email, password);
    const adminToken = await apiHelpers.loginAdmin();
    await apiHelpers.approveAgency(email, adminToken);

    // Login via UI
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('a[routerLink="/register"]');
    await expect(page).toHaveURL(/\/register/);
  });

  test('US-26 AC3: should block login for pending (unapproved) account', async ({ page, apiHelpers }) => {
    const email = uniqueTestEmail('pending-e2e');
    const password = testAgency.password;

    // Register but do NOT approve
    await apiHelpers.registerAgency(email, password);

    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    // Should show pending account error
    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 10_000 });
    // Should NOT redirect to dashboard
    await expect(page).toHaveURL(/\/login/);
  });

  test('US-26: should show validation error for empty email', async ({ page }) => {
    await page.fill('#password', 'SomePassword');
    await page.click('button[type="submit"]');

    // Should show email required validation
    await expect(page.locator('.is-invalid, .field-error').first()).toBeVisible({ timeout: 3_000 });
  });

  test('US-26: should show validation error for empty password', async ({ page }) => {
    await page.fill('#email', 'test@test.com');
    await page.click('button[type="submit"]');

    // Should show password required validation
    await expect(page.locator('.is-invalid, .field-error').first()).toBeVisible({ timeout: 3_000 });
  });
});
