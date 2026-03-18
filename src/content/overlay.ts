/**
 * CSS Overlay for screenshot annotation.
 * Highlights the interacted element with a red outline before screenshot capture.
 *
 * Uses data attributes and a <style> element to avoid triggering
 * MutationObserver-based frameworks (React, Vue) and causing layout shift.
 */

const HIGHLIGHT_ATTR = 'data-sop-highlight';
const STYLE_ID = 'sop-recorder-highlight-style';

const HIGHLIGHT_CSS = `[${HIGHLIGHT_ATTR}] {
  outline: 2px solid #e53e3e !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.2) !important;
}`;

let highlightedElement: Element | null = null;

/**
 * Inject a CSS overlay highlighting the given element.
 * If a previous overlay exists, it is removed first.
 */
export function injectOverlay(element: Element): void {
  removeOverlay();

  // Inject style element if not already present
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = HIGHLIGHT_CSS;
    document.head.appendChild(style);
  }

  element.setAttribute(HIGHLIGHT_ATTR, '');
  highlightedElement = element;
}

/**
 * Remove the highlight overlay from the previously highlighted element.
 */
export function removeOverlay(): void {
  if (highlightedElement) {
    highlightedElement.removeAttribute(HIGHLIGHT_ATTR);
    highlightedElement = null;
  }

  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
}
