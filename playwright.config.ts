import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Optimize for CI - use fewer workers to keep under time limit */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // In CI: `github` turns each failure into a workflow annotation (readable
  // without downloading logs), `html` produces the report the workflow uploads.
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Faster timeout for CI */
    actionTimeout: process.env.CI ? 10000 : 30000,
    navigationTimeout: process.env.CI ? 15000 : 30000,
  },

  /* Configure projects for major browsers - limit to 2 for CI speed */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Skip Firefox in CI for speed */
    ...(process.env.CI ? [] : [{
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }]),
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // CI has already run `npm run build`, so serve that: `next dev` compiles
    // every route on first hit, which is far too slow for a cold CI runner.
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: process.env.CI ? 'pipe' : 'ignore',
    stderr: process.env.CI ? 'pipe' : 'ignore',
  },
  
  /* Global timeout for the entire test suite. Kept below the workflow step's
     timeout-minutes so Playwright aborts cleanly and still writes its report. */
  globalTimeout: process.env.CI ? 8 * 60 * 1000 : 300000,
  
  /* Test timeout */
  timeout: process.env.CI ? 30000 : 60000, // 30s per test for CI
});