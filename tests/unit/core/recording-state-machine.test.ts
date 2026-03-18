import { describe, it, expect, vi } from 'vitest';
import { RecordingStateMachine } from '~/core/recording-state-machine.js';

describe('RecordingStateMachine', () => {
  // ── Initial state ───────────────────────────────────────────────────────

  it('starts in idle state', () => {
    const sm = new RecordingStateMachine();
    expect(sm.getState()).toBe('idle');
  });

  // ── Valid transitions ───────────────────────────────────────────────────

  describe('valid transitions', () => {
    it('idle -> recording (start)', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      expect(sm.getState()).toBe('recording');
    });

    it('recording -> paused (pause)', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      sm.pause();
      expect(sm.getState()).toBe('paused');
    });

    it('paused -> recording (resume)', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      sm.pause();
      sm.resume();
      expect(sm.getState()).toBe('recording');
    });

    it('recording -> idle (stop)', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      sm.stop();
      expect(sm.getState()).toBe('idle');
    });

    it('paused -> idle (stop)', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      sm.pause();
      sm.stop();
      expect(sm.getState()).toBe('idle');
    });
  });

  // ── Invalid transitions ─────────────────────────────────────────────────

  describe('invalid transitions', () => {
    it('throws on start when already recording', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      expect(() => sm.start()).toThrow(
        'Invalid transition: cannot "start" from "recording"',
      );
    });

    it('throws on start when paused', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      sm.pause();
      expect(() => sm.start()).toThrow(
        'Invalid transition: cannot "start" from "paused"',
      );
    });

    it('throws on pause when idle', () => {
      const sm = new RecordingStateMachine();
      expect(() => sm.pause()).toThrow(
        'Invalid transition: cannot "pause" from "idle"',
      );
    });

    it('throws on pause when already paused', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      sm.pause();
      expect(() => sm.pause()).toThrow(
        'Invalid transition: cannot "pause" from "paused"',
      );
    });

    it('throws on resume when idle', () => {
      const sm = new RecordingStateMachine();
      expect(() => sm.resume()).toThrow(
        'Invalid transition: cannot "resume" from "idle"',
      );
    });

    it('throws on resume when recording', () => {
      const sm = new RecordingStateMachine();
      sm.start();
      expect(() => sm.resume()).toThrow(
        'Invalid transition: cannot "resume" from "recording"',
      );
    });

    it('throws on stop when idle', () => {
      const sm = new RecordingStateMachine();
      expect(() => sm.stop()).toThrow(
        'Invalid transition: cannot "stop" from "idle"',
      );
    });

    it('does not change state on invalid transition', () => {
      const sm = new RecordingStateMachine();
      try {
        sm.stop();
      } catch {
        // expected
      }
      expect(sm.getState()).toBe('idle');
    });
  });

  // ── Observer notifications ──────────────────────────────────────────────

  describe('onStateChange', () => {
    it('notifies observer on state change', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      sm.onStateChange(callback);

      sm.start();

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith('recording', 'idle');
    });

    it('notifies observer with correct previous and new states', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      sm.onStateChange(callback);

      sm.start();
      sm.pause();
      sm.resume();
      sm.stop();

      expect(callback).toHaveBeenCalledTimes(4);
      expect(callback).toHaveBeenNthCalledWith(1, 'recording', 'idle');
      expect(callback).toHaveBeenNthCalledWith(2, 'paused', 'recording');
      expect(callback).toHaveBeenNthCalledWith(3, 'recording', 'paused');
      expect(callback).toHaveBeenNthCalledWith(4, 'idle', 'recording');
    });

    it('does not notify observer on invalid transition', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      sm.onStateChange(callback);

      try {
        sm.stop();
      } catch {
        // expected
      }

      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple observers', () => {
      const sm = new RecordingStateMachine();
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      sm.onStateChange(cb1);
      sm.onStateChange(cb2);

      sm.start();

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
      expect(cb1).toHaveBeenCalledWith('recording', 'idle');
      expect(cb2).toHaveBeenCalledWith('recording', 'idle');
    });

    it('unsubscribe stops notifications', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      const unsubscribe = sm.onStateChange(callback);

      sm.start();
      expect(callback).toHaveBeenCalledOnce();

      unsubscribe();
      sm.pause();

      expect(callback).toHaveBeenCalledOnce(); // still 1 call
    });

    it('unsubscribe is idempotent', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      const unsubscribe = sm.onStateChange(callback);

      unsubscribe();
      unsubscribe(); // should not throw

      sm.start();
      expect(callback).not.toHaveBeenCalled();
    });

    it('removing one observer does not affect others', () => {
      const sm = new RecordingStateMachine();
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const unsub1 = sm.onStateChange(cb1);
      sm.onStateChange(cb2);

      unsub1();
      sm.start();

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
    });
  });

  // ── Recovery ────────────────────────────────────────────────────────────

  describe('recover', () => {
    it('restores to recording state', () => {
      const sm = new RecordingStateMachine();
      sm.recover('recording');
      expect(sm.getState()).toBe('recording');
    });

    it('restores to paused state', () => {
      const sm = new RecordingStateMachine();
      sm.recover('paused');
      expect(sm.getState()).toBe('paused');
    });

    it('restores to idle state', () => {
      const sm = new RecordingStateMachine();
      sm.recover('idle');
      expect(sm.getState()).toBe('idle');
    });

    it('does not notify observers on recovery', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      sm.onStateChange(callback);

      sm.recover('recording');

      expect(callback).not.toHaveBeenCalled();
    });

    it('allows valid transitions after recovery', () => {
      const sm = new RecordingStateMachine();
      sm.recover('recording');

      sm.pause();
      expect(sm.getState()).toBe('paused');

      sm.resume();
      expect(sm.getState()).toBe('recording');

      sm.stop();
      expect(sm.getState()).toBe('idle');
    });

    it('enforces transition rules after recovery', () => {
      const sm = new RecordingStateMachine();
      sm.recover('paused');

      expect(() => sm.pause()).toThrow();
      expect(() => sm.start()).toThrow();
    });
  });

  // ── Full lifecycle ──────────────────────────────────────────────────────

  describe('full lifecycle', () => {
    it('supports start -> pause -> resume -> stop cycle', () => {
      const sm = new RecordingStateMachine();
      const callback = vi.fn();
      sm.onStateChange(callback);

      sm.start();
      sm.pause();
      sm.resume();
      sm.stop();

      expect(sm.getState()).toBe('idle');
      expect(callback).toHaveBeenCalledTimes(4);
    });

    it('supports multiple recording sessions', () => {
      const sm = new RecordingStateMachine();

      sm.start();
      sm.stop();
      sm.start();
      sm.pause();
      sm.stop();
      sm.start();
      sm.stop();

      expect(sm.getState()).toBe('idle');
    });
  });
});
