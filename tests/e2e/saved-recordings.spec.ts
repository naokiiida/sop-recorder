import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('saved recordings appear in home view after completing a recording', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // 1. Complete a recording: start, perform an action, stop
  await panel.startRecording();

  const testPage = await panel.openTestPage();
  await testPage.waitForTimeout(1500);
  await testPage.locator('[data-testid="btn-save"]').click();
  await testPage.waitForTimeout(1000);

  await page.bringToFront();
  await panel.waitForStepCount(1, 10000);
  await panel.stopRecording();

  // Should be in editor view now
  await expect(page.locator('h2.sop-editable')).toBeVisible();

  // 2. Navigate back to home
  await panel.goBack();

  // 3. Verify at least one recording card appears
  const recordingCards = panel.getRecordingCards();
  await expect(recordingCards.first()).toBeVisible({ timeout: 5000 });
  const cardCount = await recordingCards.count();
  expect(cardCount).toBeGreaterThanOrEqual(1);

  // 4. Verify the card shows step count info
  const firstCard = recordingCards.first();
  await expect(firstCard).toContainText(/\d+ steps?/);
});
