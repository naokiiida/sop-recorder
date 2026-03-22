import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
});

// Must import after mocking
const { announce } = await import('../../../src/components/sop-app.js');

describe('announce', () => {
  let announcer: HTMLDivElement;

  beforeEach(() => {
    announcer = document.createElement('div');
    announcer.id = 'sop-announcer';
    announcer.setAttribute('aria-live', 'polite');
    document.body.appendChild(announcer);
  });

  afterEach(() => {
    announcer.remove();
  });

  it('sets text content on the announcer element', () => {
    announce('Step deleted');
    expect(announcer.textContent).toBe('Step deleted');
  });

  it('defaults to polite priority', () => {
    announce('Test message');
    expect(announcer.getAttribute('aria-live')).toBe('polite');
  });

  it('sets assertive priority when specified', () => {
    announce('Recording started', 'assertive');
    expect(announcer.getAttribute('aria-live')).toBe('assertive');
  });

  it('does nothing if announcer element is missing', () => {
    announcer.remove();
    // Should not throw
    expect(() => announce('No element')).not.toThrow();
  });

  it('clears text before setting new text (for re-trigger)', () => {
    announcer.textContent = 'old message';
    // After the rAF mock runs synchronously, text should be updated
    announce('new message');
    expect(announcer.textContent).toBe('new message');
  });
});
