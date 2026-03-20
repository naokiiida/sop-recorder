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
  }

  /** Navigate to the side panel page and wait for sop-app to render. */
  async goto(): Promise<void> {
    await this.page.goto(`chrome-extension://${this.extensionId}/sidepanel.html`);
    await this.page.waitForSelector('sop-app');
  }

  /** Click "Start Recording" and wait for the recording view to appear. */
  async startRecording(): Promise<void> {
    await this.page.getByRole('button', { name: 'Start Recording' }).click();
    await this.page.waitForSelector('strong[role="status"]', { timeout: 5000 });
  }

  /** Click "Stop" and wait for view transition (editor or home). */
  async stopRecording(): Promise<void> {
    await this.page.getByRole('button', { name: /Stop/ }).click();
    // After stopping, view transitions to editor (if steps exist) or home
    await this.page.waitForFunction(
      () =>
        document.querySelector('h2.sop-editable') !== null ||
        document.querySelector('.sop-empty-state') !== null,
      { timeout: 5000 },
    );
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
    const editableTitle = this.page
      .locator('strong.sop-editable[aria-label="Edit step title"]')
      .nth(index);
    await editableTitle.click();
    const input = this.page.locator('sop-step-card input[type="text"]').first();
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

  /** Click "Delete Recording" button. */
  async deleteRecording(): Promise<void> {
    await this.page.getByRole('button', { name: /Delete Recording/ }).click();
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
