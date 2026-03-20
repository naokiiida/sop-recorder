import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests as the extension background script is a singleton
  // and only tracks one active panel port at a time.
  workers: 1,

  // Reporter to use.
  reporter: 'list',

  use: {
    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',
  },
});
