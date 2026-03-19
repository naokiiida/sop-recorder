import { describe, it, expect } from 'vitest';
import { isRestrictedUrl } from '~/adapters/chrome/tab-adapter.js';

describe('isRestrictedUrl', () => {
  it('blocks chrome:// URLs', () => {
    expect(isRestrictedUrl('chrome://settings')).toBe(true);
    expect(isRestrictedUrl('chrome://extensions')).toBe(true);
    expect(isRestrictedUrl('chrome://newtab')).toBe(true);
  });

  it('blocks chrome-extension:// URLs', () => {
    expect(isRestrictedUrl('chrome-extension://abc123/popup.html')).toBe(true);
  });

  it('blocks edge:// URLs', () => {
    expect(isRestrictedUrl('edge://settings')).toBe(true);
  });

  it('blocks about: URLs', () => {
    expect(isRestrictedUrl('about:blank')).toBe(true);
  });

  it('blocks Chrome Web Store', () => {
    expect(isRestrictedUrl('https://chrome.google.com/webstore')).toBe(true);
    expect(isRestrictedUrl('https://chrome.google.com/webstore/detail/abc')).toBe(true);
  });

  it('blocks devtools:// URLs', () => {
    expect(isRestrictedUrl('devtools://devtools/bundled/inspector.html')).toBe(true);
  });

  it('allows normal URLs', () => {
    expect(isRestrictedUrl('https://example.com')).toBe(false);
    expect(isRestrictedUrl('http://localhost:3000')).toBe(false);
    expect(isRestrictedUrl('https://docs.google.com/document/d/123')).toBe(false);
  });
});
