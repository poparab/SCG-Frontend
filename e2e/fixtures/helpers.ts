import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test as base, expect, Page } from '@playwright/test';
import { testAdmin, testAgency, type Traveler } from './test-data';

export const API_BASE = process.env.API_BASE || 'http://localhost:5155/api';
export const ADMIN_PREFIX = process.env.ADMIN_PREFIX || '';
export const travelerDocumentFixturePath = path.resolve(process.cwd(), 'public', 'favicon.png');

const travelerDocumentBuffer = readFileSync(travelerDocumentFixturePath);

export function uniqueTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

function buildTravelerDocumentPart(name: string) {
  return {
    name,
    mimeType: 'image/png',
    buffer: travelerDocumentBuffer
  };
}

// Re-export test data for convenience in specs
export { testAdmin, testAgency, type Traveler };
export { testTravelers } from './test-data';

/** Unwrap the ApiResponse<T> envelope — returns the `data` field. */
function unwrap<T = unknown>(body: { success: boolean; data: T; error: unknown }): T {
  return body.data;
}

export interface TestFixtures {
  apiHelpers: ApiHelpers;
}

interface TravelerBatchPayload {
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  passportNumber: string;
  nationalityCode: string;
  dateOfBirth: string;
  gender: number;
  travelDate: string;
  arrivalAirport?: string | null;
  transitCountries?: string | null;
  passportExpiry: string;
  departureCountry: string;
  purposeOfTravel: string;
  flightNumber?: string | null;
}

export class ApiHelpers {
  constructor(private page: Page) {}

  async registerAgency(email: string, password = testAgency.password) {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const uniqueCommercialRegNumber = `${testAgency.licenseNumber}${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const res = await this.page.request.post(`${API_BASE}/auth/register`, {
      data: {
        agencyName: `${testAgency.nameEn} ${uniqueSuffix}`,
        commercialRegNumber: uniqueCommercialRegNumber,
        contactPersonName: testAgency.contactPersonName,
        email,
        password,
        countryCode: '+20',
        mobileNumber: '01012345678',
      },
    });
    const bodyText = await res.text();
    expect(res.ok(), `registerAgency failed (${res.status()}): ${bodyText}`).toBeTruthy();
    return unwrap(JSON.parse(bodyText));
  }

  async loginAdmin(): Promise<string> {
    const res = await this.page.request.post(`${API_BASE}/auth/login`, {
      data: { email: testAdmin.email, password: testAdmin.password, loginType: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    const body = unwrap<{ token: string }>(await res.json());
    return body.token;
  }

  async loginAgency(email: string, password = testAgency.password): Promise<string> {
    const res = await this.page.request.post(`${API_BASE}/auth/login`, {
      data: { email, password, loginType: 'agency' },
    });
    expect(res.ok()).toBeTruthy();
    const body = unwrap<{ token: string }>(await res.json());
    return body.token;
  }

  async approveAgency(email: string, adminToken: string): Promise<string> {
    const listRes = await this.page.request.get(
      `${API_BASE}/agencies?searchTerm=${email}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const list = unwrap<{ items: { id: string }[] }>(await listRes.json());
    const agencyId = list.items[0].id;

    await this.page.request.put(`${API_BASE}/agencies/${agencyId}/approve`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    return agencyId;
  }

  /**
   * Ensures a nationality exists. Creates it if missing, silently succeeds if it already exists.
   * Returns the created/existing nationality data (or null).
   */
  async createNationality(adminToken: string, code: string, fee = 100) {
    const res = await this.page.request.post(`${API_BASE}/nationalities`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { code, nameAr: code, nameEn: code, requiresInquiry: true, defaultFee: fee },
    });
    if (res.ok()) {
      return unwrap(await res.json());
    }
    // Nationality likely already exists — that's fine
    return null;
  }

  /** Returns the code of the first available nationality that requires inquiry. */
  async getExistingNationality(adminToken: string): Promise<string> {
    const res = await this.page.request.get(`${API_BASE}/nationalities?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = unwrap<{ items: { code: string }[] }>(await res.json());
    return body.items[0].code;
  }

  async creditWallet(adminToken: string, agencyId: string, amount = 5000) {
    await this.page.request.post(`${API_BASE}/agencies/${agencyId}/wallet/credit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      multipart: {
        amount: amount.toString(),
        paymentMethod: 'Cash',
        reference: `REF-${Date.now()}`,
        notes: 'E2E credit',
      },
    });
  }

  async createBatch(agencyToken: string, agencyId: string, name: string, notes?: string) {
    const res = await this.page.request.post(`${API_BASE}/batches`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
      data: {
        agencyId,
        name,
        inquiryTypeId: null,
        notes: notes ?? null,
      },
    });
    const bodyText = await res.text();
    expect(res.ok(), `createBatch failed (${res.status()}): ${bodyText}`).toBeTruthy();
    return unwrap<{ id: string }>(JSON.parse(bodyText));
  }

  async addTravelerToBatch(agencyToken: string, batchId: string, traveler: TravelerBatchPayload) {
    const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = {
      firstNameEn: traveler.firstNameEn,
      lastNameEn: traveler.lastNameEn,
      passportNumber: traveler.passportNumber,
      nationalityCode: traveler.nationalityCode,
      dateOfBirth: traveler.dateOfBirth,
      gender: traveler.gender.toString(),
      travelDate: traveler.travelDate,
      passportExpiry: traveler.passportExpiry,
      departureCountry: traveler.departureCountry,
      purposeOfTravel: traveler.purposeOfTravel,
      passportImageDocument: buildTravelerDocumentPart('passport.png'),
      ticketImageDocument: buildTravelerDocumentPart('ticket.png'),
    };

    if (traveler.firstNameAr) multipart['firstNameAr'] = traveler.firstNameAr;
    if (traveler.lastNameAr) multipart['lastNameAr'] = traveler.lastNameAr;
    if (traveler.arrivalAirport) multipart['arrivalAirport'] = traveler.arrivalAirport;
    if (traveler.transitCountries) multipart['transitCountries'] = traveler.transitCountries;
    if (traveler.flightNumber) multipart['flightNumber'] = traveler.flightNumber;

    const res = await this.page.request.post(`${API_BASE}/batches/${batchId}/travelers`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
      multipart,
    });
    const bodyText = await res.text();
    expect(res.ok(), `addTravelerToBatch failed (${res.status()}): ${bodyText}`).toBeTruthy();
    return unwrap<{ id: string }>(JSON.parse(bodyText));
  }

  async submitBatch(agencyToken: string, batchId: string) {
    const res = await this.page.request.post(`${API_BASE}/batches/${batchId}/submit`, {
      headers: { Authorization: `Bearer ${agencyToken}` },
    });
    const bodyText = await res.text();
    expect(res.ok(), `submitBatch failed (${res.status()}): ${bodyText}`).toBeTruthy();
    return JSON.parse(bodyText);
  }
}

/** UI helper: log in as admin through the admin app. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${ADMIN_PREFIX}/auth/login`);
  await page.fill('#email', testAdmin.email);
  await page.fill('#password', testAdmin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

/** UI helper: log in as an agency through the portal. */
export async function loginAsAgency(
  page: Page,
  email = testAgency.email,
  password = testAgency.password
): Promise<void> {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

/** Selects an option from an `app-searchable-select` component by typing a search term. */
export async function selectSearchableOption(
  page: Page,
  controlName: string,
  searchTerm: string
): Promise<void> {
  const select = page
    .locator(
      `app-searchable-select[formcontrolname="${controlName}"], app-searchable-select[ng-reflect-name="${controlName}"]`
    )
    .first();

  await expect(select).toBeVisible({ timeout: 5_000 });
  await select.locator('.ss-trigger').click();

  const dropdown = select.locator('.ss-dropdown');
  await expect(dropdown).toBeVisible({ timeout: 5_000 });

  await dropdown.locator('.ss-search-input').fill(searchTerm);
  await dropdown.locator('.ss-option').first().click();
}

export async function uploadRequiredTravelerDocuments(page: Page): Promise<void> {
  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(travelerDocumentFixturePath);
  await fileInputs.nth(1).setInputFiles(travelerDocumentFixturePath);
}

/**
 * UI helper: fills the batch wizard with the provided travelers and submits.
 * Assumes the agency is already logged in.
 * Appends a timestamp to passport numbers to avoid uniqueness conflicts on repeated runs.
 */
export async function createBatchWithTravelers(
  page: Page,
  travelers: Traveler[],
  batchName?: string
): Promise<void> {
  await page.goto('/batches/new');

  // Step 1: batch name
  await page.fill('input[formControlName="name"]', batchName ?? `E2E Batch ${Date.now()}`);
  await page.click('.wizard-card-footer .wz-btn-primary');

  // Step 2: add each traveler
  for (let i = 0; i < travelers.length; i++) {
    const t = travelers[i];
    await page.fill('input[formControlName="firstNameEn"]', t.firstNameEn);
    await page.fill('input[formControlName="lastNameEn"]', t.lastNameEn);
    await page.selectOption('select[formControlName="nationalityCode"]', t.nationality);
    // Unique passport to prevent constraint violations on repeated runs
    await page.fill('input[formControlName="passportNumber"]', `${t.nationality}${Date.now()}${i}`);
    await page.fill('input[formControlName="passportExpiry"]', t.passportExpiry);
    await page.fill('input[formControlName="dateOfBirth"]', t.birthDate);
    await page.selectOption('select[formControlName="gender"]', t.gender === 'Male' ? '0' : '1');
    await selectSearchableOption(page, 'departureCountry', t.nationality);
    await page.fill('input[formControlName="travelDate"]', '2026-10-01');
    await page.selectOption('select[formControlName="purposeOfTravel"]', 'Tourism');
    await uploadRequiredTravelerDocuments(page);
    await page.click('button[type="submit"].wz-btn-success');
    await expect(page.locator('.traveler-card')).toHaveCount(i + 1, { timeout: 5_000 });
  }

  // Step 2 → confirm
  await page.click('.wizard-card-footer .wz-btn-primary');
  await expect(page.locator('.confirm-modal')).toBeVisible({ timeout: 5_000 });
  await page.click('.confirm-modal-footer .wz-btn-primary');
}

export const test = base.extend<TestFixtures>({
  apiHelpers: async ({ page }, use) => {
    await use(new ApiHelpers(page));
  },
});

export { expect };
