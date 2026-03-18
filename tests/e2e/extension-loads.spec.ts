import { test, expect } from './fixtures/extension.js';

test('extension service worker loads without errors', async ({ extensionId }) => {
  expect(extensionId).toBeTruthy();
  expect(extensionId).toMatch(/^[a-z]{32}$/);
});

test('extension side panel page is accessible', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Verify the page loaded (not a Chrome error page).
  await expect(page).not.toHaveTitle('chrome-extension');

  // Collect console errors during page load.
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Reload to capture console messages from a fresh load.
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  expect(errors).toEqual([]);
});
