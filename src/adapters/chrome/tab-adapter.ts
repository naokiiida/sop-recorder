import type { ITabAdapter } from '../interfaces/index.js';
import type { BackgroundToContentMessage } from '../../core/types.js';

const RESTRICTED_URL_PATTERNS = [
  /^chrome:\/\//,
  /^chrome-extension:\/\//,
  /^edge:\/\//,
  /^about:/,
  /^https?:\/\/chrome\.google\.com\/webstore/,
  /^devtools:\/\//,
];

/**
 * Check if a URL is restricted (cannot inject content scripts).
 * Handles undefined/null/empty URLs gracefully (treated as restricted).
 */
export function isRestrictedUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  return RESTRICTED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Chrome Tab adapter — query active tab, send messages, inject content scripts.
 */
export class ChromeTabAdapter implements ITabAdapter {
  async getCurrentTab(): Promise<{ id: number; url: string; title: string } | null> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return null;
    return { id: tab.id, url: tab.url, title: tab.title ?? '' };
  }

  async sendMessageToTab(tabId: number, message: BackgroundToContentMessage): Promise<void> {
    await browser.tabs.sendMessage(tabId, message);
  }

  async injectContentScript(tabId: number): Promise<void> {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['/content-scripts/content.js'],
    });
  }
}
