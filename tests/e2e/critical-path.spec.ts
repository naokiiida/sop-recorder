import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('full record -> edit -> export flow', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // 1. Open test page and start recording (test page must be active tab)
  const testPage = await panel.startRecordingWithPage();
  await expect(page.locator('strong[role="status"]')).toContainText('Recording');

  // Perform 2 clicks on test page elements
  await testPage.locator('[data-testid="btn-save"]').click();
  // Wait for the step to be captured (panel handles async capture)
  await panel.waitForStepCount(1);
  
  await testPage.locator('[data-testid="btn-cancel"]').click();
  await panel.waitForStepCount(2);

  // 3. Switch back to side panel and verify steps appear
  await page.bringToFront();

  const stepLog = page.locator('section[role="log"]');
  await expect(stepLog).toBeVisible();

  const stepCards = panel.getStepCards();
  await expect(stepCards).toHaveCount(2);

  // 4. Stop recording -> should transition to editor
  await panel.stopRecording();
  await expect(page.locator('h2.sop-editable')).toBeVisible();

  // 5. Edit a step title
  await panel.editStepTitle(0, 'Updated Step Title');

  // Verify title change persists
  const firstTitle = page
    .locator('article.sop-step-card')
    .first()
    .locator('strong.sop-editable[aria-label="Edit step title"]');
  await expect(firstTitle).toContainText('Updated Step Title');

  // 6. Export as ZIP — uses chrome.downloads API which doesn't trigger Playwright
  //    download events. Verify button is clickable and no error appears.
  const exportBtn = page.getByRole('button', { name: 'Export as ZIP' });
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();
  // Allow time for async export pipeline to complete
  await page.waitForTimeout(2000);
  // Verify no error banner appeared
  await expect(page.locator('[role="alert"]')).not.toBeVisible();
});
