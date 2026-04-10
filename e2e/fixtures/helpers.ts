import { test as base, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:5155/api';

export interface TestFixtures {
  apiHelpers: ApiHelpers;
}

export class ApiHelpers {
  constructor(private page: Page) {}

  async registerAgency(email: string, password = 'Test@1234') {
    const res = await this.page.request.post(`${API_BASE}/auth/register`, {
      data: {
        agencyName: `E2E Agency ${Date.now()}`,
        commercialRegNumber: `CR${Date.now()}`,
        contactPersonName: 'E2E Tester',
        email,
        password,
        countryCode: '+20',
        mobileNumber: '01012345678',
      },
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async loginAdmin(): Promise<string> {
    const res = await this.page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@scg.gov.eg', password: 'Admin@1234', loginType: 'admin' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return body.token;
  }

  async loginAgency(email: string, password = 'Test@1234'): Promise<string> {
    const res = await this.page.request.post(`${API_BASE}/auth/login`, {
      data: { email, password, loginType: 'agency' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return body.token;
  }

  async approveAgency(email: string, adminToken: string): Promise<string> {
    const listRes = await this.page.request.get(
      `${API_BASE}/agencies?searchTerm=${email}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const list = await listRes.json();
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
    return res.json();
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
