import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('recording can be deleted from editor view', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // 1. Start recording with a real test page, capture a step, and stop
  const testPage = await panel.startRecordingWithPage();
  await testPage.bringToFront();
  await testPage.waitForTimeout(3000);
  await testPage.locator('[data-testid="btn-save"]').click();

  await page.bringToFront();
  await panel.waitForStepCount(1, 15000);
  await panel.stopRecording();

  // Should be in editor view
  await expect(page.locator('h2.sop-editable')).toBeVisible();

  // 2. Click "Delete Recording"
  await panel.deleteRecording();

  // 3. Verify view returns to home (auto-navigates after delete from editor)
  await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible({
    timeout: 5000,
  });

  // 4. Verify the recording no longer appears
  const recordingCards = panel.getRecordingCards();
  await expect(recordingCards).toHaveCount(0, { timeout: 5000 });
});
