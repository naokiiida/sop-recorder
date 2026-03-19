import { beforeEach, describe, expect, it } from 'vitest';
import { StepManager } from '../../../src/core/step-manager.js';
import type { CapturedEvent, RecordedStep } from '../../../src/core/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CapturedEvent> = {}): CapturedEvent {
  return {
    sequenceNumber: 1,
    timestamp: Date.now(),
    type: 'click',
    selectors: { css: '#btn' },
    tagName: 'BUTTON',
    accessibleName: 'Save',
    boundingBox: { x: 0, y: 0, width: 100, height: 40 },
    pageUrl: 'https://example.com/app',
    pageTitle: 'Example App',
    viewport: { width: 1280, height: 720 },
    scrollPosition: { x: 0, y: 0 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StepManager', () => {
  let manager: StepManager;

  beforeEach(() => {
    manager = new StepManager();
  });

  // ── addStep ─────────────────────────────────────────────────────────────

  describe('addStep', () => {
    it('creates a RecordedStep with UUID, sequenceNumber, and auto-generated title', () => {
      const step = manager.addStep(makeEvent(), 'blob-1');

      expect(step.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(step.sequenceNumber).toBe(1);
      expect(step.title).toBe("Clicked 'Save' button");
      expect(step.description).toBe('');
      expect(step.screenshotBlobKey).toBe('blob-1');
    });

    it('assigns incrementing sequence numbers', () => {
      const s1 = manager.addStep(makeEvent(), 'blob-1');
      const s2 = manager.addStep(makeEvent(), 'blob-2');
      const s3 = manager.addStep(makeEvent(), 'blob-3');

      expect(s1.sequenceNumber).toBe(1);
      expect(s2.sequenceNumber).toBe(2);
      expect(s3.sequenceNumber).toBe(3);
    });

    it('stores thumbnailDataUrl when provided', () => {
      const step = manager.addStep(makeEvent(), 'blob-1', 'data:image/png;base64,abc');
      expect(step.thumbnailDataUrl).toBe('data:image/png;base64,abc');
    });

    it('copies event fields into the step', () => {
      const event = makeEvent({
        inputValue: 'hello',
        elementType: 'text',
        elementRole: 'textbox',
        clickCoordinates: { x: 50, y: 20 },
      });
      const step = manager.addStep(event, 'blob-1');

      expect(step.type).toBe('click');
      expect(step.inputValue).toBe('hello');
      expect(step.selectors).toEqual({ css: '#btn' });
      expect(step.tagName).toBe('BUTTON');
      expect(step.elementType).toBe('text');
      expect(step.elementRole).toBe('textbox');
      expect(step.clickCoordinates).toEqual({ x: 50, y: 20 });
      expect(step.pageUrl).toBe('https://example.com/app');
      expect(step.pageTitle).toBe('Example App');
      expect(step.viewport).toEqual({ width: 1280, height: 720 });
      expect(step.scrollPosition).toEqual({ x: 0, y: 0 });
    });

    it('returns a copy — mutating the return value does not affect internal state', () => {
      const step = manager.addStep(makeEvent(), 'blob-1');
      step.title = 'CHANGED';

      const stored = manager.getStep(step.id);
      expect(stored?.title).toBe("Clicked 'Save' button");
    });
  });

  // ── Title generation ────────────────────────────────────────────────────

  describe('auto-generated titles', () => {
    it('click with accessible name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'click', accessibleName: 'Save', tagName: 'BUTTON' }),
        'b',
      );
      expect(step.title).toBe("Clicked 'Save' button");
    });

    it('click without accessible name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'click', accessibleName: '', tagName: 'DIV' }),
        'b',
      );
      expect(step.title).toBe('Clicked element');
    });

    it('click on a link', () => {
      const step = manager.addStep(
        makeEvent({ type: 'click', accessibleName: 'Home', tagName: 'A' }),
        'b',
      );
      expect(step.title).toBe("Clicked 'Home' link");
    });

    it('dblclick', () => {
      const step = manager.addStep(
        makeEvent({ type: 'dblclick', accessibleName: 'Row', tagName: 'TR' }),
        'b',
      );
      expect(step.title).toBe("Double-clicked 'Row' element");
    });

    it('input', () => {
      const step = manager.addStep(
        makeEvent({ type: 'input', accessibleName: 'Email', tagName: 'INPUT', elementType: 'email' }),
        'b',
      );
      expect(step.title).toBe("Typed in 'Email' field");
    });

    it('input without name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'input', accessibleName: '', tagName: 'INPUT' }),
        'b',
      );
      expect(step.title).toBe('Typed in field');
    });

    it('select', () => {
      const step = manager.addStep(
        makeEvent({ type: 'select', accessibleName: 'Country', tagName: 'SELECT' }),
        'b',
      );
      expect(step.title).toBe("Selected option in 'Country'");
    });

    it('check', () => {
      const step = manager.addStep(
        makeEvent({ type: 'check', accessibleName: 'Remember me', tagName: 'INPUT', elementType: 'checkbox' }),
        'b',
      );
      expect(step.title).toBe("Toggled 'Remember me' checkbox");
    });

    it('navigate', () => {
      const step = manager.addStep(
        makeEvent({ type: 'navigate', accessibleName: '', pageUrl: 'https://example.com/dashboard' }),
        'b',
      );
      expect(step.title).toBe('Navigated to /dashboard');
    });

    it('navigate with invalid URL falls back to raw pageUrl', () => {
      const step = manager.addStep(
        makeEvent({ type: 'navigate', accessibleName: '', pageUrl: 'not-a-url' }),
        'b',
      );
      expect(step.title).toBe('Navigated to not-a-url');
    });

    it('scroll', () => {
      const step = manager.addStep(makeEvent({ type: 'scroll' }), 'b');
      expect(step.title).toBe('Scrolled page');
    });

    it('submit with name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'submit', accessibleName: 'Login', tagName: 'FORM' }),
        'b',
      );
      expect(step.title).toBe("Submitted 'Login' form");
    });

    it('submit without name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'submit', accessibleName: '', tagName: 'FORM' }),
        'b',
      );
      expect(step.title).toBe('Submitted form');
    });

    it('keypress with inputValue', () => {
      const step = manager.addStep(
        makeEvent({ type: 'keypress', inputValue: 'Enter' }),
        'b',
      );
      expect(step.title).toBe("Pressed 'Enter' key");
    });

    it('keypress without inputValue', () => {
      const step = manager.addStep(makeEvent({ type: 'keypress' }), 'b');
      expect(step.title).toBe('Pressed key');
    });

    it('dblclick without accessible name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'dblclick', accessibleName: '', tagName: 'TR' }),
        'b',
      );
      expect(step.title).toBe('Double-clicked element');
    });

    it('select without accessible name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'select', accessibleName: '', tagName: 'SELECT' }),
        'b',
      );
      expect(step.title).toBe('Selected option');
    });

    it('check without accessible name', () => {
      const step = manager.addStep(
        makeEvent({ type: 'check', accessibleName: '', tagName: 'INPUT', elementType: 'checkbox' }),
        'b',
      );
      expect(step.title).toBe('Toggled checkbox');
    });
  });

  // ── updateStep ──────────────────────────────────────────────────────────

  describe('updateStep', () => {
    it('updates title only', () => {
      const step = manager.addStep(makeEvent(), 'b');
      const updated = manager.updateStep(step.id, { title: 'New Title' });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('');
    });

    it('updates description only', () => {
      const step = manager.addStep(makeEvent(), 'b');
      const updated = manager.updateStep(step.id, { description: 'Do this' });

      expect(updated.title).toBe("Clicked 'Save' button");
      expect(updated.description).toBe('Do this');
    });

    it('updates both title and description', () => {
      const step = manager.addStep(makeEvent(), 'b');
      const updated = manager.updateStep(step.id, {
        title: 'Custom',
        description: 'Details',
      });

      expect(updated.title).toBe('Custom');
      expect(updated.description).toBe('Details');
    });

    it('throws when step not found', () => {
      expect(() => manager.updateStep('nonexistent', { title: 'X' })).toThrow(
        'Step not found: nonexistent',
      );
    });

    it('returns a copy — mutating does not affect internal state', () => {
      const step = manager.addStep(makeEvent(), 'b');
      const updated = manager.updateStep(step.id, { title: 'Updated' });
      updated.title = 'MUTATED';

      expect(manager.getStep(step.id)?.title).toBe('Updated');
    });
  });

  // ── deleteStep ──────────────────────────────────────────────────────────

  describe('deleteStep', () => {
    it('removes the step', () => {
      const s1 = manager.addStep(makeEvent(), 'b1');
      manager.addStep(makeEvent(), 'b2');

      manager.deleteStep(s1.id);

      expect(manager.getSteps()).toHaveLength(1);
      expect(manager.getStep(s1.id)).toBeUndefined();
    });

    it('renumbers remaining steps', () => {
      const s1 = manager.addStep(makeEvent(), 'b1');
      manager.addStep(makeEvent(), 'b2');
      manager.addStep(makeEvent(), 'b3');

      manager.deleteStep(s1.id);

      const steps = manager.getSteps();
      expect(steps[0]!.sequenceNumber).toBe(1);
      expect(steps[1]!.sequenceNumber).toBe(2);
    });

    it('deleting the only step leaves an empty list', () => {
      const s = manager.addStep(makeEvent(), 'b');
      manager.deleteStep(s.id);
      expect(manager.getSteps()).toHaveLength(0);
    });

    it('throws when step not found', () => {
      expect(() => manager.deleteStep('nonexistent')).toThrow(
        'Step not found: nonexistent',
      );
    });
  });

  // ── reorderStep ─────────────────────────────────────────────────────────

  describe('reorderStep', () => {
    it('moves step to a new position and renumbers', () => {
      const s1 = manager.addStep(makeEvent({ accessibleName: 'A' }), 'b1');
      manager.addStep(makeEvent({ accessibleName: 'B' }), 'b2');
      manager.addStep(makeEvent({ accessibleName: 'C' }), 'b3');

      manager.reorderStep(s1.id, 2);

      const steps = manager.getSteps();
      expect(steps.map((s) => s.accessibleName)).toEqual(['B', 'C', 'A']);
      expect(steps.map((s) => s.sequenceNumber)).toEqual([1, 2, 3]);
    });

    it('moving to the same position is a no-op', () => {
      const s1 = manager.addStep(makeEvent({ accessibleName: 'A' }), 'b1');
      manager.addStep(makeEvent({ accessibleName: 'B' }), 'b2');

      manager.reorderStep(s1.id, 0);

      const steps = manager.getSteps();
      expect(steps.map((s) => s.accessibleName)).toEqual(['A', 'B']);
    });

    it('throws when step not found', () => {
      manager.addStep(makeEvent(), 'b');
      expect(() => manager.reorderStep('nonexistent', 0)).toThrow(
        'Step not found: nonexistent',
      );
    });

    it('throws when newIndex is negative', () => {
      const s = manager.addStep(makeEvent(), 'b');
      expect(() => manager.reorderStep(s.id, -1)).toThrow('Index out of bounds');
    });

    it('throws when newIndex is >= length', () => {
      const s = manager.addStep(makeEvent(), 'b');
      expect(() => manager.reorderStep(s.id, 1)).toThrow('Index out of bounds');
    });
  });

  // ── getSteps / getStep ──────────────────────────────────────────────────

  describe('getSteps', () => {
    it('returns empty array initially', () => {
      expect(manager.getSteps()).toEqual([]);
    });

    it('returns copies — mutating does not affect internal state', () => {
      manager.addStep(makeEvent(), 'b');
      const steps = manager.getSteps();
      steps[0]!.title = 'MUTATED';
      steps.push({} as RecordedStep);

      expect(manager.getSteps()).toHaveLength(1);
      expect(manager.getSteps()[0]!.title).toBe("Clicked 'Save' button");
    });
  });

  describe('getStep', () => {
    it('returns undefined for unknown id', () => {
      expect(manager.getStep('nope')).toBeUndefined();
    });

    it('returns matching step', () => {
      const s = manager.addStep(makeEvent(), 'b');
      expect(manager.getStep(s.id)?.id).toBe(s.id);
    });
  });

  // ── clear ───────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all steps', () => {
      manager.addStep(makeEvent(), 'b1');
      manager.addStep(makeEvent(), 'b2');

      manager.clear();

      expect(manager.getSteps()).toEqual([]);
    });
  });

  // ── loadSteps ───────────────────────────────────────────────────────────

  describe('loadSteps', () => {
    it('replaces internal state with provided steps', () => {
      manager.addStep(makeEvent(), 'old');

      const imported: RecordedStep[] = [
        {
          id: 'imported-1',
          sequenceNumber: 99,
          timestamp: 1000,
          type: 'click',
          selectors: { css: '#a' },
          tagName: 'A',
          accessibleName: 'Link',
          boundingBox: { x: 0, y: 0, width: 50, height: 20 },
          pageUrl: 'https://example.com',
          pageTitle: 'Test',
          viewport: { width: 1280, height: 720 },
          scrollPosition: { x: 0, y: 0 },
          title: 'Click Link',
          description: '',
          screenshotBlobKey: 'imported-blob',
        },
      ];

      manager.loadSteps(imported);

      const steps = manager.getSteps();
      expect(steps).toHaveLength(1);
      expect(steps[0]!.id).toBe('imported-1');
    });

    it('renumbers loaded steps starting from 1', () => {
      const imported: RecordedStep[] = [
        {
          id: 'a',
          sequenceNumber: 10,
          timestamp: 1000,
          type: 'click',
          selectors: { css: '#a' },
          tagName: 'BUTTON',
          accessibleName: '',
          boundingBox: { x: 0, y: 0, width: 50, height: 20 },
          pageUrl: 'https://example.com',
          pageTitle: 'Test',
          viewport: { width: 1280, height: 720 },
          scrollPosition: { x: 0, y: 0 },
          title: 'Step A',
          description: '',
          screenshotBlobKey: 'b-a',
        },
        {
          id: 'b',
          sequenceNumber: 20,
          timestamp: 2000,
          type: 'input',
          selectors: { css: '#b' },
          tagName: 'INPUT',
          accessibleName: '',
          boundingBox: { x: 0, y: 0, width: 50, height: 20 },
          pageUrl: 'https://example.com',
          pageTitle: 'Test',
          viewport: { width: 1280, height: 720 },
          scrollPosition: { x: 0, y: 0 },
          title: 'Step B',
          description: '',
          screenshotBlobKey: 'b-b',
        },
      ];

      manager.loadSteps(imported);

      const steps = manager.getSteps();
      expect(steps[0]!.sequenceNumber).toBe(1);
      expect(steps[1]!.sequenceNumber).toBe(2);
    });

    it('clones input — mutating the source array does not affect the manager', () => {
      const imported: RecordedStep[] = [
        {
          id: 'x',
          sequenceNumber: 1,
          timestamp: 1000,
          type: 'click',
          selectors: { css: '#x' },
          tagName: 'BUTTON',
          accessibleName: 'X',
          boundingBox: { x: 0, y: 0, width: 50, height: 20 },
          pageUrl: 'https://example.com',
          pageTitle: 'Test',
          viewport: { width: 1280, height: 720 },
          scrollPosition: { x: 0, y: 0 },
          title: 'Original',
          description: '',
          screenshotBlobKey: 'b-x',
        },
      ];

      manager.loadSteps(imported);
      imported[0]!.title = 'MUTATED';

      expect(manager.getStep('x')?.title).toBe('Original');
    });
  });
});
