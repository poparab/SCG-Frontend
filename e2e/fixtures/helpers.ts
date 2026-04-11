import { test as base, expect, Page } from '@playwright/test';

export const API_BASE = process.env.API_BASE || 'http://localhost:5155/api';
export const ADMIN_PREFIX = process.env.ADMIN_PREFIX || '';

/** Unwrap the ApiResponse<T> envelope — returns the `data` field. */
function unwrap<T = unknown>(body: { success: boolean; data: T; error: unknown }): T {
  return body.data;
}

export interface TestFixtures {
  apiHelpers: ApiHelpers;
}

export class ApiHelpers {
  constructor(private page: Page) {}

  async registerAgency(email: string, password = 'Test@1234') {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const res = await this.page.request.post(`${API_BASE}/auth/register`, {
      data: {
        agencyName: `E2E Agency ${uniqueSuffix}`,
        commercialRegNumber: `CR${uniqueSuffix}`,
        contactPersonName: 'E2E Tester',
        email,
        password,
        countryCode: '+20',
        mobileNumber: '01012345678',
      },
    });
    expect(res.ok()).toBeTruthy();
    return unwrap(await res.json());
  }

  async loginAdmin(): Promise<string> {
    const res = await this.page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@scg.gov.eg', password: 'Admin@1234', loginType: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    const body = unwrap<{ token: string }>(await res.json());
    return body.token;
  }

  async loginAgency(email: string, password = 'Test@1234'): Promise<string> {
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

  async createNationality(adminToken: string, code: string, fee = 100) {
    const res = await this.page.request.post(`${API_BASE}/nationalities`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { code, nameAr: code, nameEn: code, requiresInquiry: true, defaultFee: fee },
    });
    return unwrap(await res.json());
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
}

export const test = base.extend<TestFixtures>({
  apiHelpers: async ({ page }, use) => {
    await use(new ApiHelpers(page));
  },
});

export { expect };
