import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/extension.js';

test('side panel passes WCAG 2.1 AA accessibility audit (home view)', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await page.waitForLoadState('domcontentloaded');

  // Wait for Lit components to render
  await page.waitForSelector('sop-app');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
