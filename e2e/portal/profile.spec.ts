import { test, expect, testAgency } from '../fixtures/helpers';

test.describe('Portal Profile (US-PR-01)', () => {
  let agencyEmail: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = `profile-e2e-${Date.now()}@test.com`;
    await api.registerAgency(agencyEmail, testAgency.password);
    const adminToken = await api.loginAdmin();
    await api.approveAgency(agencyEmail, adminToken);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', testAgency.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await page.goto('/profile');
  });

  test('AC1: should display profile page with agency info', async ({ page }) => {
    await expect(page).toHaveURL(/\/profile/);

    const infoCard = page.locator('.info-card').first();
    await expect(infoCard).toBeVisible({ timeout: 5_000 });

    // Should display the agency email
    await expect(page.locator('.info-value').filter({ hasText: agencyEmail })).toBeVisible({ timeout: 5_000 });
  });

  test('AC2: should display the change password form', async ({ page }) => {
    const pwForm = page.locator('.pw-form');
    await expect(pwForm).toBeVisible({ timeout: 5_000 });

    await expect(pwForm.locator('input[formControlName="currentPassword"]')).toBeVisible();
    await expect(pwForm.locator('input[formControlName="newPassword"]')).toBeVisible();
    await expect(pwForm.locator('input[formControlName="confirmNewPassword"]')).toBeVisible();
  });

  test('AC3: should show validation error when new password is too short', async ({ page }) => {
    const pwForm = page.locator('.pw-form');

    await pwForm.locator('input[formControlName="currentPassword"]').fill(testAgency.password);
    await pwForm.locator('input[formControlName="newPassword"]').fill('abc');
    await pwForm.locator('input[formControlName="newPassword"]').blur();

    const error = page.locator('.field-error').filter({ hasText: /8|character|أحرف/i });
    await expect(error.first()).toBeVisible({ timeout: 3_000 });
  });

  test('AC4: should show validation error when passwords do not match', async ({ page }) => {
    const pwForm = page.locator('.pw-form');

    await pwForm.locator('input[formControlName="currentPassword"]').fill(testAgency.password);
    await pwForm.locator('input[formControlName="newPassword"]').fill('NewPass@1234');
    await pwForm.locator('input[formControlName="confirmNewPassword"]').fill('Different@9999');
    await pwForm.locator('input[formControlName="confirmNewPassword"]').blur();

    const mismatchError = page.locator('.field-error').filter({ hasText: /match|تطابق/i });
    await expect(mismatchError.first()).toBeVisible({ timeout: 3_000 });
  });

  test('AC5: wrong current password shows error', async ({ page }) => {
    const pwForm = page.locator('.pw-form');

    await pwForm.locator('input[formControlName="currentPassword"]').fill('WrongOldPass@1');
    await pwForm.locator('input[formControlName="newPassword"]').fill('NewPass@5678');
    await pwForm.locator('input[formControlName="confirmNewPassword"]').fill('NewPass@5678');

    await pwForm.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger, .alert.alert-danger')).toBeVisible({ timeout: 10_000 });
  });

  test('AC6: correct password change succeeds', async ({ page }) => {
    // Use a different agency per run to avoid state pollution from the wrong-password test
    const context = page.context();
    const freshPage = await context.newPage();

    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(freshPage);
    const freshEmail = `profile-pw-chg-${Date.now()}@test.com`;
    const newPassword = 'Changed@5678';

    await api.registerAgency(freshEmail, testAgency.password);
    const adminToken = await api.loginAdmin();
    await api.approveAgency(freshEmail, adminToken);

    await freshPage.goto('/login');
    await freshPage.fill('#email', freshEmail);
    await freshPage.fill('#password', testAgency.password);
    await freshPage.click('button[type="submit"]');
    await freshPage.waitForURL('**/dashboard', { timeout: 10_000 });
    await freshPage.goto('/profile');

    const pwForm = freshPage.locator('.pw-form');
    await pwForm.locator('input[formControlName="currentPassword"]').fill(testAgency.password);
    await pwForm.locator('input[formControlName="newPassword"]').fill(newPassword);
    await pwForm.locator('input[formControlName="confirmNewPassword"]').fill(newPassword);
    await pwForm.locator('button[type="submit"]').click();

    await expect(freshPage.locator('.alert-success')).toBeVisible({ timeout: 10_000 });
    await freshPage.close();
  });
});
