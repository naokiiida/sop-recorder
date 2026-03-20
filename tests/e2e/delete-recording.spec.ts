import { test, expect } from './fixtures/extension.js';
import { SidePanelPage } from './fixtures/side-panel.js';

test('recording can be deleted from editor view', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const panel = new SidePanelPage(page, extensionId, context);
  await panel.goto();

  // Handle the deletion confirmation dialog
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toContain('delete this recording');
    await dialog.accept();
  });

  // 1. Start recording (with test page as active tab), capture a step, and stop
  const testPage = await panel.startRecordingWithPage();
  await testPage.locator('[data-testid="btn-save"]').click();

  await page.bringToFront();
  await panel.waitForStepCount(1);
  await panel.stopRecording();

  // Should be in editor view
  await expect(page.locator('h2.sop-editable')).toBeVisible();

  // 2. Click "Delete Recording" (using the spec-mandated class selector)
  const deleteBtn = page.locator('button.sop-btn-danger', { hasText: 'Delete Recording' });
  await expect(deleteBtn).toBeVisible();
  await panel.deleteRecording();

  // 3. Verify view returns to home (auto-navigates after delete from editor)
  // Verification: Start Recording button (button.contrast) should be visible
  await expect(page.locator('button.contrast', { hasText: 'Start Recording' })).toBeVisible({
    timeout: 5000,
  });

  // 4. Verify the recording no longer appears in home view
  const recordingCards = panel.getRecordingCards();
  await expect(recordingCards).toHaveCount(0, { timeout: 5000 });
});
