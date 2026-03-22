import type { CapturedEvent, RecordedStep, StepAction } from './types.js';

/**
 * Generate a human-readable title from a CapturedEvent.
 *
 * Examples:
 *   click  + "Save"      -> "Clicked 'Save' button"
 *   input  + "Email"     -> "Typed in 'Email' field"
 *   navigate + ""        -> "Navigated to /dashboard"
 */
function generateTitle(event: CapturedEvent): string {
  const name = event.accessibleName.trim();

  const titleGenerators: Record<StepAction, () => string> = {
    click: () =>
      name ? `Clicked '${name}' ${labelForTag(event)}` : `Clicked ${labelForTag(event)}`,
    dblclick: () =>
      name
        ? `Double-clicked '${name}' ${labelForTag(event)}`
        : `Double-clicked ${labelForTag(event)}`,
    input: () => (name ? `Typed in '${name}' field` : 'Typed in field'),
    select: () => (name ? `Selected option in '${name}'` : 'Selected option'),
    check: () => (name ? `Toggled '${name}' checkbox` : 'Toggled checkbox'),
    navigate: () => {
      try {
        const url = new URL(event.pageUrl);
        return `Navigated to ${url.pathname}`;
      } catch {
        return `Navigated to ${event.pageUrl}`;
      }
    },
    scroll: () => 'Scrolled page',
    submit: () => (name ? `Submitted '${name}' form` : 'Submitted form'),
    keypress: () => (event.inputValue ? `Pressed '${event.inputValue}' key` : 'Pressed key'),
  };

  return titleGenerators[event.type]();
}

/**
 * Derive a friendly label from the element's tag name.
 */
function labelForTag(event: CapturedEvent): string {
  const tag = event.tagName.toLowerCase();
  const roleMap: Record<string, string> = {
    button: 'button',
    a: 'link',
    input: event.elementType ? `${event.elementType} input` : 'input',
    select: 'dropdown',
    textarea: 'text area',
    img: 'image',
    label: 'label',
  };
  return roleMap[tag] ?? 'element';
}

/**
 * Re-assign sequenceNumber = index + 1 for every step in the array.
 */
function renumber(steps: RecordedStep[]): void {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step) step.sequenceNumber = i + 1;
  }
}

/**
 * Pure-TypeScript step manager. No Chrome API dependencies.
 */
export class StepManager {
  private steps: RecordedStep[] = [];

  /**
   * Create a RecordedStep from a CapturedEvent, auto-generating a title.
   */
  addStep(
    event: CapturedEvent,
    screenshotBlobKey: string,
    thumbnailDataUrl?: string,
  ): RecordedStep {
    const step: RecordedStep = {
      id: crypto.randomUUID(),
      sequenceNumber: this.steps.length + 1,
      timestamp: event.timestamp,
      type: event.type,
      inputValue: event.inputValue,
      selectors: { ...event.selectors },
      tagName: event.tagName,
      elementType: event.elementType,
      elementRole: event.elementRole,
      accessibleName: event.accessibleName,
      boundingBox: { ...event.boundingBox },
      clickCoordinates: event.clickCoordinates ? { ...event.clickCoordinates } : undefined,
      pageUrl: event.pageUrl,
      pageTitle: event.pageTitle,
      viewport: { ...event.viewport },
      scrollPosition: { ...event.scrollPosition },
      title: generateTitle(event),
      description: '',
      screenshotBlobKey,
      thumbnailDataUrl,
    };

    this.steps.push(step);
    return { ...step };
  }

  /**
   * Update a step's title and/or description.
   * @throws Error if step not found.
   */
  updateStep(
    id: string,
    updates: Partial<Pick<RecordedStep, 'title' | 'description'>>,
  ): RecordedStep {
    const step = this.steps.find((s) => s.id === id);
    if (!step) {
      throw new Error(`Step not found: ${id}`);
    }

    if (updates.title !== undefined) {
      step.title = updates.title;
    }
    if (updates.description !== undefined) {
      step.description = updates.description;
    }

    return { ...step };
  }

  /**
   * Remove a step and renumber the remaining steps.
   * @throws Error if step not found.
   */
  deleteStep(id: string): void {
    const index = this.steps.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Step not found: ${id}`);
    }
    this.steps.splice(index, 1);
    renumber(this.steps);
  }

  /**
   * Move a step to a new index (0-based), then renumber all steps.
   * @throws Error if step not found or newIndex is out of bounds.
   */
  reorderStep(id: string, newIndex: number): void {
    const currentIndex = this.steps.findIndex((s) => s.id === id);
    if (currentIndex === -1) {
      throw new Error(`Step not found: ${id}`);
    }
    if (newIndex < 0 || newIndex >= this.steps.length) {
      throw new Error(`Index out of bounds: ${newIndex} (valid range: 0–${this.steps.length - 1})`);
    }

    const removed = this.steps.splice(currentIndex, 1);
    const step = removed[0];
    if (step) this.steps.splice(newIndex, 0, step);
    renumber(this.steps);
  }

  /**
   * Return a shallow copy of the steps array (each step is also a shallow copy).
   */
  getSteps(): RecordedStep[] {
    return this.steps.map((s) => ({ ...s }));
  }

  /**
   * Return a copy of a single step, or undefined if not found.
   */
  getStep(id: string): RecordedStep | undefined {
    const step = this.steps.find((s) => s.id === id);
    return step ? { ...step } : undefined;
  }

  /**
   * Remove all steps.
   */
  clear(): void {
    this.steps = [];
  }

  /**
   * Replace internal state with the given steps (for recovery).
   * Steps are cloned and renumbered.
   */
  loadSteps(steps: RecordedStep[]): void {
    this.steps = steps.map((s) => ({ ...s }));
    renumber(this.steps);
  }
}
