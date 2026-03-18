/**
 * Element metadata extraction for captured events.
 * Extracts accessible names, bounding boxes, viewport info, and click coordinates.
 */

import type { BoundingBox, Coordinates, SelectorSet, ViewportSize } from '../core/types.js';
import { generateSelectors, type ElementLike } from '../core/selector-generator.js';

// ── Accessible Name Extraction (WAI-ARIA simplified) ────────────────────────

/**
 * Extract the accessible name following a simplified WAI-ARIA priority chain:
 * aria-label > aria-labelledby > alt > title > label[for] > placeholder > textContent
 */
export function getAccessibleName(element: Element): string {
  // 1. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();

  // 2. aria-labelledby — reference other element(s) by ID
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ids = labelledBy.split(/\s+/);
    const texts = ids
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean);
    if (texts.length > 0) return texts.join(' ');
  }

  // 3. alt (for images)
  const alt = element.getAttribute('alt');
  if (alt?.trim()) return alt.trim();

  // 4. title attribute
  const title = element.getAttribute('title');
  if (title?.trim()) return title.trim();

  // 5. label[for] — associated <label> element
  if (element.id) {
    // Escape the ID for use in a CSS attribute selector
    const escapedId = element.id.replace(/([\\!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
    const label = document.querySelector(`label[for="${escapedId}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }

  // 6. placeholder (for inputs/textareas)
  const placeholder = element.getAttribute('placeholder');
  if (placeholder?.trim()) return placeholder.trim();

  // 7. textContent (truncated)
  const text = element.textContent?.trim();
  if (text) return text.length > 50 ? text.slice(0, 50) : text;

  return '';
}

// ── Element Metadata ────────────────────────────────────────────────────────

export interface ElementMetadata {
  selectors: SelectorSet;
  tagName: string;
  elementType: string | undefined;
  elementRole: string | undefined;
  accessibleName: string;
  boundingBox: BoundingBox;
  inputValue: string | undefined;
}

/**
 * Extract full metadata from a DOM element.
 */
export function extractElementMetadata(element: Element): ElementMetadata {
  const rect = element.getBoundingClientRect();

  const tagName = element.tagName;
  const elementType =
    element instanceof HTMLInputElement
      ? element.type
      : element instanceof HTMLButtonElement
        ? 'button'
        : undefined;
  const elementRole = element.getAttribute('role') ?? undefined;

  // Get input value, masking passwords
  let inputValue: string | undefined;
  if (element instanceof HTMLInputElement) {
    inputValue = element.type === 'password' ? '••••••••' : element.value;
  } else if (element instanceof HTMLTextAreaElement) {
    inputValue = element.value;
  } else if (element instanceof HTMLSelectElement) {
    inputValue = element.options[element.selectedIndex]?.text;
  }

  return {
    selectors: generateSelectors(element as unknown as ElementLike),
    tagName,
    elementType,
    elementRole,
    accessibleName: getAccessibleName(element),
    boundingBox: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
    inputValue,
  };
}

/**
 * Capture current viewport dimensions.
 */
export function getViewport(): ViewportSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Capture current scroll position.
 */
export function getScrollPosition(): Coordinates {
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

/**
 * Extract click coordinates from a MouseEvent (viewport-relative).
 */
export function getClickCoordinates(event: MouseEvent): Coordinates {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}
