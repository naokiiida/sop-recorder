// ── Event Filter ────────────────────────────────────────────────────────────
// Pure TypeScript module for filtering captured events.
// No Chrome/browser API dependencies.

/**
 * Minimal event interface for filtering decisions.
 * Not tied to DOM Event — only the fields needed for filter logic.
 */
export interface FilterableEvent {
  isTrusted: boolean;
  type: string;
  targetId: string; // unique identifier for the target element
  timestamp: number;
}

// ── Drag Detection ─────────────────────────────────────────────────────────

const DRAG_THRESHOLD_PX = 50;

/**
 * Returns true if the displacement between start and end exceeds 50px,
 * indicating a drag rather than a click.
 */
export function isDragEvent(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  return Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX;
}

// ── Input Debouncer ────────────────────────────────────────────────────────

const DEBOUNCE_INTERVAL_MS = 500;

export interface InputDebouncer {
  shouldCapture(targetId: string, timestamp: number): boolean;
}

/**
 * Creates a debouncer that rejects input events on the same target
 * if they occur within 500ms of the previous input on that target.
 */
export function createInputDebouncer(): InputDebouncer {
  const lastTimestamps = new Map<string, number>();

  return {
    shouldCapture(targetId: string, timestamp: number): boolean {
      const last = lastTimestamps.get(targetId);
      if (last !== undefined && timestamp - last < DEBOUNCE_INTERVAL_MS) {
        // Update the timestamp even when debounced, so the window slides
        lastTimestamps.set(targetId, timestamp);
        return false;
      }
      lastTimestamps.set(targetId, timestamp);
      return true;
    },
  };
}

// ── Click Deduplicator ─────────────────────────────────────────────────────

const DEDUP_INTERVAL_MS = 500;

export interface ClickDeduplicator {
  shouldCapture(targetId: string, timestamp: number): boolean;
}

/**
 * Creates a deduplicator that rejects clicks on the same target
 * if they occur within 500ms of the previous click on that target.
 */
export function createClickDeduplicator(): ClickDeduplicator {
  const lastTimestamps = new Map<string, number>();

  return {
    shouldCapture(targetId: string, timestamp: number): boolean {
      const last = lastTimestamps.get(targetId);
      if (last !== undefined && timestamp - last < DEDUP_INTERVAL_MS) {
        return false;
      }
      lastTimestamps.set(targetId, timestamp);
      return true;
    },
  };
}

// ── Composite Filter ───────────────────────────────────────────────────────

export interface EventFilterOptions {
  /** Whether to apply input debouncing. Default: true */
  debounceInputs?: boolean;
  /** Whether to apply click deduplication. Default: true */
  deduplicateClicks?: boolean;
}

export interface EventFilter {
  /**
   * Returns true if the event should be captured, false if it should be
   * filtered out.
   */
  shouldCapture(event: FilterableEvent): boolean;
}

/**
 * Creates a composite event filter that applies all filter rules:
 * 1. Reject untrusted events
 * 2. Debounce input events (same target within 500ms)
 * 3. Deduplicate clicks (same target within 500ms)
 */
export function createEventFilter(
  options: EventFilterOptions = {},
): EventFilter {
  const { debounceInputs = true, deduplicateClicks = true } = options;

  const inputDebouncer = createInputDebouncer();
  const clickDeduplicator = createClickDeduplicator();

  return {
    shouldCapture(event: FilterableEvent): boolean {
      // Rule 1: Reject untrusted events
      if (!event.isTrusted) {
        return false;
      }

      // Rule 3: Debounce input events
      if (debounceInputs && event.type === 'input') {
        return inputDebouncer.shouldCapture(event.targetId, event.timestamp);
      }

      // Rule 4: Deduplicate clicks
      if (deduplicateClicks && (event.type === 'click' || event.type === 'dblclick')) {
        return clickDeduplicator.shouldCapture(event.targetId, event.timestamp);
      }

      return true;
    },
  };
}
