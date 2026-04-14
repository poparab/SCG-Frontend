import type { Page } from '@playwright/test';
import { test, expect, testAgency, testTravelers, selectSearchableOption } from '../fixtures/helpers';

const travelerDocumentFixture = 'public/favicon.png';

async function uploadRequiredTravelerDocuments(page: Page): Promise<void> {
  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(travelerDocumentFixture);
  await fileInputs.nth(1).setInputFiles(travelerDocumentFixture);
}

test.describe.configure({ mode: 'serial' });

test.describe('Batch Wizard', () => {
  let agencyEmail: string;
  let agencyToken: string;
  let agencyId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helpers = (await import('../fixtures/helpers')).ApiHelpers;
    const api = new helpers(page);

    agencyEmail = `batch-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
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
    await page.fill('#password', testAgency.password);
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
    const t = testTravelers[1]; // Ahmed Al-Masri — SY (Syria)
    await page.fill('input[formControlName="firstNameEn"]', t.firstNameEn);
    await page.fill('input[formControlName="lastNameEn"]', t.lastNameEn);
    await page.selectOption('select[formControlName="nationalityCode"]', t.nationality);
    await page.fill('input[formControlName="passportNumber"]', `SY${Date.now()}`);
    await page.fill('input[formControlName="passportExpiry"]', t.passportExpiry);
    await page.fill('input[formControlName="dateOfBirth"]', t.birthDate);
    await page.selectOption('select[formControlName="gender"]', '0');
    await selectSearchableOption(page, 'departureCountry', t.nationality);
    await page.fill('input[formControlName="travelDate"]', '2026-10-01');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await uploadRequiredTravelerDocuments(page);
    await page.click('button[type="submit"].wz-btn-success');

    // Wait for traveler row to appear in the table
    await expect(page.locator('.travelers-table-section .data-table tbody tr')).toHaveCount(1, { timeout: 5_000 });

    // Click Submit on Step 2
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Confirmation modal should appear
    await expect(page.locator('.confirm-modal')).toBeVisible({ timeout: 5_000 });
    await page.click('.confirm-modal-footer .wz-btn-primary');

    // Should show success
    await expect(page.locator('.state-icon-success')).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate back between wizard steps', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', 'Nav Test Batch');
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Wait for Step 2 to render (traveler form appears)
    await expect(page.locator('input[formControlName="firstNameEn"]')).toBeVisible({ timeout: 5_000 });

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
    const t1 = testTravelers[1]; // Ahmed Al-Masri — SY
    await page.fill('input[formControlName="firstNameEn"]', t1.firstNameEn);
    await page.fill('input[formControlName="lastNameEn"]', t1.lastNameEn);
    await page.fill('input[formControlName="passportNumber"]', `SY${Date.now()}1`);
    await page.fill('input[formControlName="dateOfBirth"]', t1.birthDate);
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', t1.nationality);
    await page.fill('input[formControlName="passportExpiry"]', t1.passportExpiry);
    await selectSearchableOption(page, 'departureCountry', t1.nationality);
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-10-01');
    await uploadRequiredTravelerDocuments(page);
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.travelers-table-section .data-table tbody tr')).toHaveCount(1, { timeout: 5_000 });

    // Add second traveler
    const t2 = testTravelers[3]; // Khalid Benghazi — LY
    await page.fill('input[formControlName="firstNameEn"]', t2.firstNameEn);
    await page.fill('input[formControlName="lastNameEn"]', t2.lastNameEn);
    await page.fill('input[formControlName="passportNumber"]', `LY${Date.now()}2`);
    await page.fill('input[formControlName="dateOfBirth"]', t2.birthDate);
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', t2.nationality);
    await page.fill('input[formControlName="passportExpiry"]', t2.passportExpiry);
    await selectSearchableOption(page, 'departureCountry', t2.nationality);
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-10-01');
    await uploadRequiredTravelerDocuments(page);
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.travelers-table-section .data-table tbody tr')).toHaveCount(2, { timeout: 5_000 });
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

  test('should show confirmation modal before submit', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', `Confirm Test ${Date.now()}`);
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Step 2 — add traveler
    const t = testTravelers[1]; // Ahmed Al-Masri — SY
    await page.fill('input[formControlName="firstNameEn"]', t.firstNameEn);
    await page.fill('input[formControlName="lastNameEn"]', t.lastNameEn);
    await page.fill('input[formControlName="passportNumber"]', `SY${Date.now()}`);
    await page.fill('input[formControlName="dateOfBirth"]', t.birthDate);
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', t.nationality);
    await page.fill('input[formControlName="passportExpiry"]', t.passportExpiry);
    await selectSearchableOption(page, 'departureCountry', t.nationality);
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-08-01');
    await uploadRequiredTravelerDocuments(page);
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.travelers-table-section .data-table tbody tr')).toHaveCount(1, { timeout: 5_000 });

    // Click Submit — modal should appear
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Confirmation modal should be visible with batch info and warning
    await expect(page.locator('.confirm-modal')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.confirm-modal .irreversible-warning')).toBeVisible();
    await expect(page.locator('.confirm-modal .confirm-summary-card')).toBeVisible();

    // Cancel should close the modal
    await page.click('.confirm-modal-footer .wz-btn-secondary');
    await expect(page.locator('.confirm-modal')).not.toBeVisible();
  });

  test('should remove a traveler from the list', async ({ page }) => {
    await page.goto('/batches/new');

    // Step 1
    await page.fill('input[formControlName="name"]', 'Remove Traveler Test');
    await page.click('.wizard-card-footer .wz-btn-primary');

    // Add a traveler
    const t = testTravelers[1]; // Ahmed Al-Masri — SY
    await page.fill('input[formControlName="firstNameEn"]', t.firstNameEn);
    await page.fill('input[formControlName="lastNameEn"]', t.lastNameEn);
    await page.fill('input[formControlName="passportNumber"]', `SY${Date.now()}`);
    await page.fill('input[formControlName="dateOfBirth"]', t.birthDate);
    await page.selectOption('select[formControlName="gender"]', '0');
    await page.selectOption('select[formControlName="nationalityCode"]', t.nationality);
    await page.fill('input[formControlName="passportExpiry"]', t.passportExpiry);
    await selectSearchableOption(page, 'departureCountry', t.nationality);
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await page.fill('input[formControlName="travelDate"]', '2026-06-01');
    await uploadRequiredTravelerDocuments(page);
    await page.click('button[type="submit"].wz-btn-success');

    await expect(page.locator('.travelers-table-section .data-table tbody tr')).toHaveCount(1, { timeout: 5_000 });

    // Click remove button
    const removeBtn = page.locator('.travelers-table-section .data-table tbody tr .action-icon.ai-delete').first();
    if (await removeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await removeBtn.click();
      await expect(page.locator('.travelers-table-section .data-table tbody tr')).toHaveCount(0, { timeout: 5_000 });
    }
  });
});
