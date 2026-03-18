import { describe, it, expect } from 'vitest';
import { fakeBrowser } from '@webext-core/fake-browser';

describe('sample', () => {
  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to fake browser APIs', async () => {
    await fakeBrowser.storage.local.set({ key: 'value' });
    const result = await fakeBrowser.storage.local.get('key');
    expect(result).toEqual({ key: 'value' });
  });
});
