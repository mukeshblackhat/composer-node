import { defineConfig, devices } from '@playwright/test';

// Set CHROME_PATH to use an installed Chrome instead of Playwright's own
// browser (run `npx playwright install chromium` for that one).
const executablePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  // Golden hashes are kept per operating system: text edges differ between
  // platforms, so a hash only has to match on the same one.
  snapshotPathTemplate: '{testDir}/__goldens__/{arg}-{platform}{ext}',
  use: {
    baseURL: 'http://localhost:4173',
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
