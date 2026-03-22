import type { BrowserContext, Page } from '@playwright/test';
import path from 'node:path';

/**
 * Page-object helper encapsulating common side panel interactions.
 * Keeps test files focused on assertions rather than selector details.
 */
export class SidePanelPage {
  readonly page: Page;
  private readonly extensionId: string;
  private readonly context: BrowserContext;

  constructor(page: Page, extensionId: string, context: BrowserContext) {
    this.page = page;
    this.extensionId = extensionId;
    this.context = context;

    // Forward console logs to Playwright output
    this.page.on('console', (msg) => {
      console.log(`[Panel Console] ${msg.type()}: ${msg.text()}`);
    });
  }

  /** Navigate to the side panel page and wait for sop-app to render. */
  async goto(): Promise<void> {
    await this.page.goto(`chrome-extension://${this.extensionId}/sidepanel.html`);
    await this.page.waitForSelector('sop-app');

    // Manually trigger a state request to ensure full sync
    await this.page.evaluate(() => {
      const app = document.querySelector('sop-app');
      // @ts-expect-error - accessing private ctrl for testing
      app?.ctrl?.send({ type: 'GET_STATE' });
    });

    // Small delay to ensure port connection is established
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click "Start Recording" and wait for the recording view to appear.
   * IMPORTANT: A non-extension page must be the active tab before calling this,
   * because the background records whichever tab is active at start time.
   * Use `startRecordingWithPage()` to handle this automatically.
   */
  async startRecording(): Promise<void> {
    await this.page.getByRole('button', { name: 'Start Recording' }).click();
    await this.page.waitForSelector('strong[role="status"]', { timeout: 10000 });
  }

  /** Click "Stop" and wait for view transition (editor or home). */
  async stopRecording(): Promise<void> {
    await this.page.getByRole('button', { name: /Stop/ }).click();
    // After stopping, view transitions to editor (if steps exist) or home
    await this.page.waitForFunction(
      () =>
        document.querySelector('h2.sop-editable') !== null ||
        document.querySelector('.sop-empty-state') !== null,
      { timeout: 10000 },
    );
  }

  /**
   * Open a test fixture page, make it the active tab, then start recording.
   * In real Chrome the side panel isn't a tab, so the user's webpage is always
   * the active tab when recording starts. This method replicates that setup.
   */
  async startRecordingWithPage(): Promise<Page> {
    const testPage = await this.openTestPage();
    await testPage.bringToFront();
    await this.page.getByRole('button', { name: 'Start Recording' }).click();
    await this.page.waitForSelector('strong[role="status"]', { timeout: 10000 });
    return testPage;
  }

  /** Click "Pause" button. */
  async pauseRecording(): Promise<void> {
    await this.page.locator('.sop-control-grid button.secondary', { hasText: 'Pause' }).click();
  }

  /** Click "Resume" button. */
  async resumeRecording(): Promise<void> {
    await this.page.locator('.sop-control-grid button.secondary', { hasText: 'Resume' }).click();
  }

  /** Get all step cards currently visible in the recording or editor view. */
  getStepCards() {
    return this.page.locator('article.sop-step-card');
  }

  /** Get recording cards on the home view. */
  getRecordingCards() {
    return this.page.locator('article.sop-rec-card');
  }

  /** Edit a step title in the editor view by index (0-based). */
  async editStepTitle(index: number, newTitle: string): Promise<void> {
    // Scope search to the specific step card
    const card = this.page.locator('article.sop-step-card').nth(index);
    const editableTitle = card.locator('strong.sop-editable[aria-label="Edit step title"]');

    await editableTitle.click();
    // Input is part of the card while editing
    const input = card.locator('input[type="text"]');
    await input.fill(newTitle);
    await input.press('Enter');
  }

  /** Click "Export as ZIP" and return the download. */
  async exportAsZip() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByRole('button', { name: 'Export as ZIP' }).click(),
    ]);
    return download;
  }

  /** Click "Copy Markdown" button. */
  async copyMarkdown(): Promise<void> {
    await this.page.getByRole('button', { name: 'Copy Markdown' }).click();
  }

  /** Click "Delete Recording" button and wait for transition to home. */
  async deleteRecording(): Promise<void> {
    await this.page.getByRole('button', { name: /Delete Recording/ }).click();
    // Wait for home view (Start Recording button should appear)
    await this.page.waitForSelector('button.contrast', { timeout: 5000 });
  }

  /** Click the back button to return to home view. */
  async goBack(): Promise<void> {
    await this.page.locator('button.sop-back-button').click();
    // Wait for home view to appear
    await this.page.waitForSelector('button.contrast', { timeout: 5000 });
  }

  /** Check if the empty state is visible. */
  async isEmpty(): Promise<boolean> {
    return this.page.locator('.sop-empty-state').isVisible();
  }

  /** Get the text content of the announcer live region. */
  async getAnnouncerText(): Promise<string> {
    return (await this.page.locator('#sop-announcer').textContent()) ?? '';
  }

  /** Open the test fixture page in a new tab and return it. */
  async openTestPage(): Promise<Page> {
    const testPage = await this.context.newPage();
    const fixturePath = path.resolve('tests/e2e/fixtures/test-page.html');
    await testPage.goto(`file://${fixturePath}`);
    await testPage.waitForLoadState('domcontentloaded');
    // Ensure it is focused so getCurrentTab() finds it
    await testPage.bringToFront();
    return testPage;
  }

  /**
   * Wait for a specific number of step cards to appear in the recording view.
   * Useful after performing actions on the test page.
   */
  async waitForStepCount(count: number, timeout = 10000): Promise<void> {
    await this.page.waitForFunction(
      (expectedCount) =>
        document.querySelectorAll('section[role="log"] article.sop-step-card').length >=
        expectedCount,
      count,
      { timeout },
    );
  }

  /** Get the recording status text (e.g., "Recording" or "Paused"). */
  async getStatusText(): Promise<string> {
    return (await this.page.locator('strong[role="status"]').textContent()) ?? '';
  }
}
