import { defineConfig, devices } from '@playwright/test';

const portalBaseURL = process.env.BASE_URL_PORTAL || 'http://localhost:4200';
const adminBaseURL = process.env.BASE_URL_ADMIN || 'http://localhost:4201';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: 'html',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'portal',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: portalBaseURL,
      },
      testMatch: /portal\/.+\.spec\.ts$/,
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: adminBaseURL,
      },
      testMatch: /admin\/.+\.spec\.ts$/,
    },
  ],
});
