import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '~/core/logger.js';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs warning with [SOP Recorder] prefix and structured context', () => {
    Logger.warn('screenshot-adapter', 'captureVisibleTab failed', { url: 'chrome://settings' });

    expect(console.warn).toHaveBeenCalledOnce();
    const args = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(args[0]).toBe('[SOP Recorder]');
    expect(args[1]).toContain('screenshot-adapter');
    expect(args[1]).toContain('captureVisibleTab failed');
    expect(args[2]).toHaveProperty('url', 'chrome://settings');
    expect(args[2]).toHaveProperty('timestamp');
  });

  it('logs error with [SOP Recorder] prefix and error object', () => {
    const error = new Error('test error');
    Logger.error('background', 'handleStepCaptured failed', { originalError: error });

    expect(console.error).toHaveBeenCalledOnce();
    const args = (console.error as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(args[0]).toBe('[SOP Recorder]');
    expect(args[1]).toContain('background');
    expect(args[1]).toContain('handleStepCaptured failed');
    expect(args[2]).toHaveProperty('originalError', error);
    expect(args[2]).toHaveProperty('timestamp');
  });

  it('includes component name in structured output', () => {
    Logger.warn('quota-manager', 'storage high');

    const args = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(args[1]).toContain('quota-manager');
  });

  it('works without optional context parameter', () => {
    Logger.error('content', 'injection failed');

    expect(console.error).toHaveBeenCalledOnce();
    const args = (console.error as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(args[0]).toBe('[SOP Recorder]');
    expect(args[2]).toHaveProperty('timestamp');
  });
});
