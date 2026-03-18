import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNavigationDetector } from '../../../src/content/navigation-detector.js';

describe('NavigationDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not fire handler on start (initial URL is stored, not emitted)', () => {
    const detector = createNavigationDetector();
    const handler = vi.fn();

    detector.start(handler);
    vi.advanceTimersByTime(500);

    // Should not fire because URL hasn't changed
    expect(handler).not.toHaveBeenCalled();
    detector.stop();
  });

  it('stops polling and listeners on stop()', () => {
    const detector = createNavigationDetector();
    const handler = vi.fn();
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    detector.start(handler);
    detector.stop();

    vi.advanceTimersByTime(2000);
    expect(handler).not.toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('is safe to call stop() without start()', () => {
    const detector = createNavigationDetector();
    expect(() => detector.stop()).not.toThrow();
  });

  it('registers popstate event listener', () => {
    const detector = createNavigationDetector();
    const handler = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');

    detector.start(handler);

    expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
    addSpy.mockRestore();
    detector.stop();
  });
});
