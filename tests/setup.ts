import { test as base, expect } from '@playwright/test';

// Extend base test with custom fixtures
export const test = base.extend({
  // Custom page fixture with default options
  page: async ({ page }, use) => {
    // Set default timeouts for smoke tests
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(20000);
    await use(page);
  },
});

export { expect };