import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('full record -> edit -> export flow', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // 1. Start recording from side panel
  await panel.startRecording();
  await expect(page.locator('strong[role="status"]')).toContainText('Recording');

  // 2. Open test page in a new tab and perform actions
  const testPage = await panel.openTestPage();

  // Wait briefly for content script injection
  await testPage.waitForTimeout(1500);

  // Perform 2 clicks on test page elements
  await testPage.locator('[data-testid="btn-save"]').click();
  await testPage.waitForTimeout(1000);
  await testPage.locator('[data-testid="btn-cancel"]').click();
  await testPage.waitForTimeout(1000);

  // 3. Switch back to side panel and verify steps appear
  await page.bringToFront();
  await panel.waitForStepCount(2, 15000);

  const stepLog = page.locator('section[role="log"]');
  await expect(stepLog).toBeVisible();

  const stepCards = panel.getStepCards();
  const stepCount = await stepCards.count();
  expect(stepCount).toBeGreaterThanOrEqual(2);

  // 4. Stop recording -> should transition to editor
  await panel.stopRecording();
  await expect(page.locator('h2.sop-editable')).toBeVisible();

  // 5. Edit a step title
  await panel.editStepTitle(0, 'Updated Step Title');

  // Verify title change persists
  const firstTitle = page
    .locator('strong.sop-editable[aria-label="Edit step title"]')
    .first();
  await expect(firstTitle).toContainText('Updated Step Title');

  // 6. Export as ZIP and verify download
  const download = await panel.exportAsZip();
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});
