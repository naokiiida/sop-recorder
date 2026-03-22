import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('saved recordings appear in home view after completing a recording', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // 1. Complete a recording: start (with test page as active tab), perform an action, stop
  const testPage = await panel.startRecordingWithPage();
  await testPage.locator('[data-testid="btn-save"]').click();
  await panel.waitForStepCount(1);

  await page.bringToFront();
  await panel.stopRecording();

  // Should be in editor view now
  const titleHeader = page.locator('h2.sop-editable');
  await expect(titleHeader).toBeVisible();
  const expectedTitle = (await titleHeader.textContent()) ?? 'Untitled SOP';

  // 2. Navigate back to home
  await panel.goBack();

  // 3. Verify the recording card appears with correct info (AC #3)
  const recordingCards = panel.getRecordingCards();
  const firstCard = recordingCards.first();
  await expect(firstCard).toBeVisible({ timeout: 5000 });

  // Verify title (rendered as <strong> in the card, not <h3>)
  await expect(firstCard.locator('strong.sop-truncate')).toContainText(expectedTitle);

  // Verify step count info
  await expect(firstCard).toContainText(/\d+ steps?/);
});
