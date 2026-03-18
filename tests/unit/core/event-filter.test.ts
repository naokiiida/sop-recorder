import { describe, expect, it } from 'vitest';
import {
  createClickDeduplicator,
  createEventFilter,
  createInputDebouncer,
  isDragEvent,
  type FilterableEvent,
} from '../../../src/core/event-filter.js';

// ── Helper ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<FilterableEvent> = {}): FilterableEvent {
  return {
    isTrusted: true,
    type: 'click',
    targetId: 'btn-1',
    timestamp: Date.now(),
    ...overrides,
  };
}

// ── isDragEvent ────────────────────────────────────────────────────────────

describe('isDragEvent', () => {
  it('returns false when displacement is 0', () => {
    expect(isDragEvent(100, 100, 100, 100)).toBe(false);
  });

  it('returns false when displacement is exactly 50px', () => {
    // 50px horizontal
    expect(isDragEvent(0, 0, 50, 0)).toBe(false);
  });

  it('returns false when displacement is under 50px', () => {
    expect(isDragEvent(0, 0, 30, 40)).toBe(false); // 50px exactly — boundary
    expect(isDragEvent(0, 0, 10, 10)).toBe(false);
  });

  it('returns true when displacement exceeds 50px', () => {
    expect(isDragEvent(0, 0, 51, 0)).toBe(true);
    expect(isDragEvent(0, 0, 0, 51)).toBe(true);
    expect(isDragEvent(0, 0, 40, 40)).toBe(true); // ~56.57px
  });

  it('handles negative displacement', () => {
    expect(isDragEvent(100, 100, 49, 100)).toBe(true); // 51px
    expect(isDragEvent(100, 100, 60, 100)).toBe(false); // 40px
  });
});

// ── createInputDebouncer ───────────────────────────────────────────────────

describe('createInputDebouncer', () => {
  it('allows the first input event on a target', () => {
    const debouncer = createInputDebouncer();
    expect(debouncer.shouldCapture('input-1', 1000)).toBe(true);
  });

  it('rejects input on same target within 500ms', () => {
    const debouncer = createInputDebouncer();
    debouncer.shouldCapture('input-1', 1000);
    expect(debouncer.shouldCapture('input-1', 1200)).toBe(false);
    expect(debouncer.shouldCapture('input-1', 1499)).toBe(false);
  });

  it('allows input on same target after 500ms', () => {
    const debouncer = createInputDebouncer();
    debouncer.shouldCapture('input-1', 1000);
    expect(debouncer.shouldCapture('input-1', 1500)).toBe(true);
  });

  it('allows input on different target within 500ms', () => {
    const debouncer = createInputDebouncer();
    debouncer.shouldCapture('input-1', 1000);
    expect(debouncer.shouldCapture('input-2', 1200)).toBe(true);
  });

  it('tracks targets independently', () => {
    const debouncer = createInputDebouncer();
    debouncer.shouldCapture('input-1', 1000);
    debouncer.shouldCapture('input-2', 1100);
    // input-1 at 1499 is still within 500ms of 1000
    expect(debouncer.shouldCapture('input-1', 1499)).toBe(false);
    // input-2 at 1600 is 500ms after 1100
    expect(debouncer.shouldCapture('input-2', 1600)).toBe(true);
  });

  it('slides the debounce window on rejected events', () => {
    const debouncer = createInputDebouncer();
    debouncer.shouldCapture('input-1', 1000); // accepted
    debouncer.shouldCapture('input-1', 1200); // rejected, window slides to 1200
    // 1200 + 500 = 1700, so 1699 should still be rejected
    expect(debouncer.shouldCapture('input-1', 1699)).toBe(false);
    // Window slid to 1699, so need 1699 + 500 = 2199 to pass
    expect(debouncer.shouldCapture('input-1', 2199)).toBe(true);
  });
});

// ── createClickDeduplicator ────────────────────────────────────────────────

describe('createClickDeduplicator', () => {
  it('allows the first click on a target', () => {
    const dedup = createClickDeduplicator();
    expect(dedup.shouldCapture('btn-1', 1000)).toBe(true);
  });

  it('rejects click on same target within 500ms', () => {
    const dedup = createClickDeduplicator();
    dedup.shouldCapture('btn-1', 1000);
    expect(dedup.shouldCapture('btn-1', 1200)).toBe(false);
    expect(dedup.shouldCapture('btn-1', 1499)).toBe(false);
  });

  it('allows click on same target after 500ms', () => {
    const dedup = createClickDeduplicator();
    dedup.shouldCapture('btn-1', 1000);
    expect(dedup.shouldCapture('btn-1', 1500)).toBe(true);
  });

  it('allows click on different target within 500ms', () => {
    const dedup = createClickDeduplicator();
    dedup.shouldCapture('btn-1', 1000);
    expect(dedup.shouldCapture('btn-2', 1200)).toBe(true);
  });

  it('does not slide window on rejected events', () => {
    const dedup = createClickDeduplicator();
    dedup.shouldCapture('btn-1', 1000); // accepted, window at 1000
    dedup.shouldCapture('btn-1', 1200); // rejected, window stays at 1000
    // 1500 is exactly 500ms after 1000, should pass
    expect(dedup.shouldCapture('btn-1', 1500)).toBe(true);
  });
});

// ── createEventFilter (composite) ──────────────────────────────────────────

describe('createEventFilter', () => {
  describe('untrusted event filtering', () => {
    it('rejects untrusted events', () => {
      const filter = createEventFilter();
      const event = makeEvent({ isTrusted: false });
      expect(filter.shouldCapture(event)).toBe(false);
    });

    it('allows trusted events', () => {
      const filter = createEventFilter();
      const event = makeEvent({ isTrusted: true });
      expect(filter.shouldCapture(event)).toBe(true);
    });
  });

  describe('input debouncing', () => {
    it('allows first input event', () => {
      const filter = createEventFilter();
      const event = makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1000 });
      expect(filter.shouldCapture(event)).toBe(true);
    });

    it('rejects input on same target within 500ms', () => {
      const filter = createEventFilter();
      filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1200 })),
      ).toBe(false);
    });

    it('allows input on same target after 500ms', () => {
      const filter = createEventFilter();
      filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1500 })),
      ).toBe(true);
    });

    it('can be disabled via options', () => {
      const filter = createEventFilter({ debounceInputs: false });
      filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: 1100 })),
      ).toBe(true);
    });
  });

  describe('click deduplication', () => {
    it('allows first click', () => {
      const filter = createEventFilter();
      const event = makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1000 });
      expect(filter.shouldCapture(event)).toBe(true);
    });

    it('rejects duplicate click on same target within 500ms', () => {
      const filter = createEventFilter();
      filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1200 })),
      ).toBe(false);
    });

    it('allows click on same target after 500ms', () => {
      const filter = createEventFilter();
      filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1500 })),
      ).toBe(true);
    });

    it('deduplicates dblclick events too', () => {
      const filter = createEventFilter();
      filter.shouldCapture(makeEvent({ type: 'dblclick', targetId: 'btn-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'dblclick', targetId: 'btn-1', timestamp: 1200 })),
      ).toBe(false);
    });

    it('can be disabled via options', () => {
      const filter = createEventFilter({ deduplicateClicks: false });
      filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1000 }));
      expect(
        filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: 1100 })),
      ).toBe(true);
    });
  });

  describe('passthrough for other event types', () => {
    it('allows navigate events', () => {
      const filter = createEventFilter();
      expect(filter.shouldCapture(makeEvent({ type: 'navigate' }))).toBe(true);
    });

    it('allows submit events', () => {
      const filter = createEventFilter();
      expect(filter.shouldCapture(makeEvent({ type: 'submit' }))).toBe(true);
    });

    it('allows select events', () => {
      const filter = createEventFilter();
      expect(filter.shouldCapture(makeEvent({ type: 'select' }))).toBe(true);
    });
  });

  describe('combined filter scenarios', () => {
    it('untrusted check runs before debounce/dedup', () => {
      const filter = createEventFilter();
      // Even if it is a first input, untrusted should be rejected
      const event = makeEvent({
        isTrusted: false,
        type: 'input',
        targetId: 'field-1',
        timestamp: 1000,
      });
      expect(filter.shouldCapture(event)).toBe(false);
    });

    it('input and click filters are independent', () => {
      const filter = createEventFilter();
      // Input on target-1 at t=1000
      filter.shouldCapture(makeEvent({ type: 'input', targetId: 'target-1', timestamp: 1000 }));
      // Click on target-1 at t=1100 should pass (click dedup is separate from input debounce)
      expect(
        filter.shouldCapture(makeEvent({ type: 'click', targetId: 'target-1', timestamp: 1100 })),
      ).toBe(true);
    });

    it('handles rapid mixed events correctly', () => {
      const filter = createEventFilter();
      const t = 1000;

      // First click on btn-1 passes
      expect(filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: t }))).toBe(true);
      // Rapid input on field-1 passes (first)
      expect(filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: t + 50 }))).toBe(true);
      // Duplicate click on btn-1 rejected
      expect(filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-1', timestamp: t + 100 }))).toBe(false);
      // Debounced input on field-1 rejected
      expect(filter.shouldCapture(makeEvent({ type: 'input', targetId: 'field-1', timestamp: t + 200 }))).toBe(false);
      // Click on different button passes
      expect(filter.shouldCapture(makeEvent({ type: 'click', targetId: 'btn-2', timestamp: t + 100 }))).toBe(true);
      // Navigate always passes
      expect(filter.shouldCapture(makeEvent({ type: 'navigate', targetId: 'page', timestamp: t + 150 }))).toBe(true);
    });
  });
});
