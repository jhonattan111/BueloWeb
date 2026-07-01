import { defineConfig, devices } from '@playwright/test'

// End-to-end tests exercise the web + API together (the real integration the unit tests can't cover).
// Playwright starts BOTH servers: the API (dotnet, sibling repo) and the Vite dev server, then drives
// a real browser against the app. Locally it reuses already-running servers; in CI it starts fresh.
const CI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  // The tests share one workspace/DB, so run them serially and reset state per test.
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // API on :5238 (sibling submodule). cwd = the project dir so definitions/ + buelo.db resolve.
      command: 'dotnet run',
      cwd: '../BueloApi/Buelo.Api',
      url: 'http://localhost:5238/ping',
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
})
