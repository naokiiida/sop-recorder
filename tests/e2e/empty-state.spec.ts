import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('side panel shows empty state when no recordings exist', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // AC #2: Assert sop-app is visible
  await expect(page.locator('sop-app')).toBeVisible();

  // Assert .sop-empty-state is visible with correct text
  const emptyState = page.locator('.sop-empty-state');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText('Record your first SOP');

  // Assert "Start Recording" button is visible
  await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible();

  // Assert no recording cards exist
  await expect(page.locator('article.sop-rec-card')).toHaveCount(0);
});
