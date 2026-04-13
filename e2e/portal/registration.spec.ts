import { test, expect, testAgency } from '../fixtures/helpers';

test.describe('Portal Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form with all fields', async ({ page }) => {
    await expect(page.locator('#agencyName')).toBeVisible();
    await expect(page.locator('#commercialRegNumber')).toBeVisible();
    await expect(page.locator('#contactPersonName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.locator('#mobileNumber')).toBeVisible();
  });

  test('should register a new agency successfully', async ({ page }) => {
    const email = `reg-e2e-${Date.now()}@test.com`;

    await page.fill('#agencyName', testAgency.nameEn);
    await page.fill('#commercialRegNumber', `LICETEST${Date.now().toString().slice(-8)}`);
    await page.fill('#contactPersonName', testAgency.contactPersonName);
    await page.fill('#email', email);
    await page.fill('#password', testAgency.password);
    await page.fill('#confirmPassword', testAgency.password);
    await page.selectOption('select[formControlName="countryCode"]', '+20');
    await page.fill('#mobileNumber', '01099887766');

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10_000 });
  });

  test('should show error for duplicate email', async ({ page, apiHelpers }) => {
    const email = `dup-e2e-${Date.now()}@test.com`;

    // Register via API first
    await apiHelpers.registerAgency(email, testAgency.password);

    // Try same email via UI
    await page.fill('#agencyName', testAgency.nameEn);
    await page.fill('#commercialRegNumber', `LICEDUP${Date.now().toString().slice(-8)}`);
    await page.fill('#contactPersonName', testAgency.contactPersonName);
    await page.fill('#email', email);
    await page.fill('#password', testAgency.password);
    await page.fill('#confirmPassword', testAgency.password);
    await page.selectOption('select[formControlName="countryCode"]', '+20');
    await page.fill('#mobileNumber', '01011223344');

    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 10_000 });
  });

  test('US-22 AC2: should block submission when required fields are empty', async ({ page }) => {
    // Click submit without filling any fields
    await page.click('button[type="submit"]');

    // Should show validation errors (fields highlighted)
    await expect(page.locator('.is-invalid, .invalid-feedback').first()).toBeVisible({ timeout: 3_000 });

    // Should NOT navigate away
    await expect(page).toHaveURL(/\/register/);
  });

  test('US-22: should show error for password mismatch', async ({ page }) => {
    await page.fill('#agencyName', 'Mismatch Agency');
    await page.fill('#commercialRegNumber', `CRMM${Date.now()}`);
    await page.fill('#contactPersonName', 'Mismatch Tester');
    await page.fill('#email', `mm-${Date.now()}@test.com`);
    await page.fill('#password', 'Test@1234');
    await page.fill('#confirmPassword', 'Different@5678');
    await page.selectOption('select[formControlName="countryCode"]', '+20');
    await page.fill('#mobileNumber', '01055667788');

    await page.click('button[type="submit"]');

    // Should show password mismatch error
    const mismatchError = page.locator('.invalid-feedback, .alert-danger').filter({ hasText: /match|متطابق/i });
    await expect(mismatchError.first()).toBeVisible({ timeout: 5_000 });
  });

  test('US-22: should show error for invalid email format', async ({ page }) => {
    await page.fill('#email', 'not-an-email');
    await page.locator('#email').blur();

    // Should show email format error
    const emailError = page.locator('.invalid-feedback').filter({ hasText: /email|بريد/i });
    await expect(emailError.first()).toBeVisible({ timeout: 3_000 });
  });

  test('US-22: should show error for short password', async ({ page }) => {
    await page.fill('#password', 'abc');
    await page.locator('#password').blur();

    // Should show password constraint error
    const pwdError = page.locator('.invalid-feedback').filter({ hasText: /8|characters|أحرف/i });
    await expect(pwdError.first()).toBeVisible({ timeout: 3_000 });
  });
});
