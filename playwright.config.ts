import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['mobile-seo-visual.spec.ts', 'contact-page-visual.spec.ts'],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
    baseURL: 'http://127.0.0.1:3000',
  },
  projects: [
    {
      name: 'Mobile Chrome (375px)',
      use: {
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'Mobile Chrome (390px)',
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Tablet Chrome (768px)',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Desktop Chrome (1366px)',
      use: {
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'Desktop Chrome (1920px)',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: 'npx -y http-server "C:\\Users\\abuba\\zq\\site-dist" -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
