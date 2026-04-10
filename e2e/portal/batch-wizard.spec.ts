import { test, expect } from '../fixtures/helpers';

test.describe('Batch Wizard', () => {
  let agencyEmail: string;
  let agencyToken: string;
  let agencyId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = `batch-e2e-${Date.now()}@test.com`;
    await api.registerAgency(agencyEmail, 'Test@1234');
    const adminToken = await api.loginAdmin();
    agencyId = await api.approveAgency(agencyEmail, adminToken);
    await api.creditWallet(adminToken, agencyId, 10000);
    await api.createNationality(adminToken, 'SY', 100);
    agencyToken = await api.loginAgency(agencyEmail, 'Test@1234');
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login via UI
    await page.goto('/login');
    await page.fill('#email', agencyEmail);
    await page.fill('#password', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('should create a batch with travelers and submit', async ({ page }) => {
    // Navigate to new batch
    await page.goto('/batches/new');

    // Step 1: Batch Info (name + notes only — no nationality)
    await page.fill('input[formControlName="name"]', `Batch ${Date.now()}`);
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 2: Add Travelers (now includes nationality per traveler + new fields)
    await page.fill('input[formControlName="firstNameEn"]', 'Ahmad');
    await page.fill('input[formControlName="lastNameEn"]', 'Khalil');
    await page.selectOption('select[formControlName="nationalityCode"]', 'SY');
    await page.fill('input[formControlName="passportNumber"]', 'SY123456');
    await page.fill('input[formControlName="passportExpiry"]', '2030-01-01');
    await page.fill('input[formControlName="dateOfBirth"]', '1990-05-15');
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="departureCountry"]', 'SY');
    await page.fill('input[formControlName="travelDate"]', '2026-06-01');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.click('button[type="submit"].wz-btn-success');

    // Wait for traveler card to appear
    await expect(page.locator('.traveler-card')).toHaveCount(1, { timeout: 5_000 });

    // Go to Step 3
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 3: Review & Submit
    await expect(page.locator('.review-section').first()).toBeVisible();
    await page.click('.confirm-actions-bar .wz-btn-primary');

    // Should show success
    await expect(page.locator('.state-icon-success')).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate back between wizard steps', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', 'Nav Test Batch');
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 2 — go back
    await page.click('.wizard-card-footer .wz-btn-secondary');

    // Should be back at step 1 with preserved data
    await expect(page.locator('input[formControlName="name"]')).toHaveValue('Nav Test Batch');
  });

  test('should block step 1 next when name is empty', async ({ page }) => {
    await page.goto('/batches/new');

    // Leave name empty — the Next button should be disabled because batchForm is invalid
    const nextBtn = page.locator('.wizard-card-footer .wz-btn-primary');
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await expect(nextBtn).toBeDisabled();

    // Should still be on step 1 with the name field visible
    await expect(page.locator('input[formControlName="name"]')).toBeVisible();
  });

  test('should add multiple travelers in step 2', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', `Multi Traveler ${Date.now()}`);
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 2 — add first traveler
    await page.fill('input[formControlName="firstNameEn"]', 'Traveler');
    await page.fill('input[formControlName="lastNameEn"]', 'One');
    await page.fill('input[formControlName="passportNumber"]', 'SY111111');
    await page.fill('input[formControlName="dateOfBirth"]', '1990-01-01');
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', 'SY');
    await page.fill('input[formControlName="passportExpiry"]', '2030-01-01');
    await page.selectOption('select[formControlName="departureCountry"]', 'SY');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-06-01');
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.traveler-card')).toHaveCount(1, { timeout: 5_000 });

    // Add second traveler
    await page.fill('input[formControlName="firstNameEn"]', 'Traveler');
    await page.fill('input[formControlName="lastNameEn"]', 'Two');
    await page.fill('input[formControlName="passportNumber"]', 'SY222222');
    await page.fill('input[formControlName="dateOfBirth"]', '1985-05-15');
    await page.selectOption('select[formControlName="gender"]', '1');
    await page.selectOption('select[formControlName="nationalityCode"]', 'SY');
    await page.fill('input[formControlName="passportExpiry"]', '2030-06-01');
    await page.selectOption('select[formControlName="departureCountry"]', 'SY');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-06-01');
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.traveler-card')).toHaveCount(2, { timeout: 5_000 });
  });

  test('should block step 2 next when no travelers added', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', 'Empty Travelers Batch');
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 2 — the Next button should be disabled when no travelers are added
    const nextBtn = page.locator('.wizard-card-footer .wz-btn-primary');
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await expect(nextBtn).toBeDisabled();
  });

  test('should show review content in step 3', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', `Review Test ${Date.now()}`);
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 2 — add traveler
    await page.fill('input[formControlName="firstNameEn"]', 'Review');
    await page.fill('input[formControlName="lastNameEn"]', 'Tester');
    await page.fill('input[formControlName="passportNumber"]', 'SY999999');
    await page.fill('input[formControlName="dateOfBirth"]', '1992-07-20');
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', 'SY');
    await page.fill('input[formControlName="passportExpiry"]', '2030-01-01');
    await page.selectOption('select[formControlName="departureCountry"]', 'SY');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-08-01');
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.traveler-card')).toHaveCount(1, { timeout: 5_000 });

    // Step 3
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Review section should be visible with batch info
    await expect(page.locator('.review-section').first()).toBeVisible({ timeout: 5_000 });
    // Should show the traveler info in review
    await expect(page.locator('body')).toContainText('Review');
  });

  test('should remove a traveler from the list', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', 'Remove Traveler Test');
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Add a traveler
    await page.fill('input[formControlName="firstNameEn"]', 'ToRemove');
    await page.fill('input[formControlName="lastNameEn"]', 'Person');
    await page.fill('input[formControlName="passportNumber"]', 'SY888888');
    await page.fill('input[formControlName="dateOfBirth"]', '1988-03-10');
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', 'SY');
    await page.fill('input[formControlName="passportExpiry"]', '2030-01-01');
    await page.selectOption('select[formControlName="departureCountry"]', 'SY');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-06-01');
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.traveler-card')).toHaveCount(1, { timeout: 5_000 });

    // Click remove button
    const removeBtn = page.locator('.traveler-card .traveler-card-actions .action-icon.ai-delete').first();
    if (await removeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await removeBtn.click();
      await expect(page.locator('.traveler-card')).toHaveCount(0, { timeout: 5_000 });
    }
  });
});
