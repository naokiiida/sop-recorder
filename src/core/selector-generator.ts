import type { SelectorSet } from './types';

// ── ElementLike interface ───────────────────────────────────────────────────
// Minimal interface matching the DOM Element shape needed for selector
// generation. Content scripts pass in real Elements; tests pass in stubs.

export interface ElementLike {
  id: string;
  tagName: string;
  textContent: string | null;
  parentElement: ElementLike | null;
  children: ArrayLike<ElementLike>;
  getAttribute(name: string): string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Escape special characters for use inside a CSS selector value. */
function cssEscape(value: string): string {
  return value.replace(/([\\!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
}

/** Escape special characters for use inside an XPath string literal. */
function xpathEscape(value: string): string {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  // Contains both quotes — use concat()
  const parts = value.split("'").map((p) => `'${p}'`);
  return `concat(${parts.join(', "\'", ')})`;
}

/** Return the lowercase tag name. */
function tag(el: ElementLike): string {
  return el.tagName.toLowerCase();
}

// ── CSS Selector Generation ─────────────────────────────────────────────────

/**
 * Generate the best single-element CSS selector following the priority chain:
 * id > data-testid > aria-label > tag+semantic attrs > nth-of-type path
 */
function generateCssSelector(el: ElementLike): string {
  // 1. ID
  if (el.id) {
    return `#${cssEscape(el.id)}`;
  }

  // 2. data-testid
  const testId = el.getAttribute('data-testid');
  if (testId) {
    return `[data-testid="${cssEscape(testId)}"]`;
  }

  // 3. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    return `[aria-label="${cssEscape(ariaLabel)}"]`;
  }

  // 4. tag + semantic attributes (name, role, href)
  const t = tag(el);
  const name = el.getAttribute('name');
  if (name) {
    return `${t}[name="${cssEscape(name)}"]`;
  }

  const role = el.getAttribute('role');
  if (role) {
    return `${t}[role="${cssEscape(role)}"]`;
  }

  const href = el.getAttribute('href');
  if (href) {
    return `${t}[href="${cssEscape(href)}"]`;
  }

  // 5. Fallback: nth-of-type path from root
  return buildNthOfTypePath(el);
}

/** Build a full nth-of-type path from the root ancestor down to `el`. */
function buildNthOfTypePath(el: ElementLike): string {
  const segments: string[] = [];
  let current: ElementLike | null = el;

  while (current) {
    const t = tag(current);
    const parent: ElementLike | null = current.parentElement ?? null;

    if (!parent) {
      // Root element — just use the tag
      segments.unshift(t);
    } else {
      const index = nthOfTypeIndex(current, parent);
      segments.unshift(`${t}:nth-of-type(${index})`);
    }

    current = parent;
  }

  return segments.join(' > ');
}

/** Return the 1-based nth-of-type index of `el` among its parent's children. */
function nthOfTypeIndex(el: ElementLike, parent: ElementLike): number {
  const t = tag(el);
  let index = 0;
  for (let i = 0; i < parent.children.length; i++) {
    const sibling = parent.children[i] as ElementLike | undefined;
    if (sibling && tag(sibling) === t) {
      index++;
      if (sibling === el) return index;
    }
  }
  return index; // fallback
}

// ── XPath Generation ────────────────────────────────────────────────────────

function generateXpath(el: ElementLike): string {
  const segments: string[] = [];
  let current: ElementLike | null = el;

  while (current) {
    const t = tag(current);
    const parent: ElementLike | null = current.parentElement ?? null;

    if (!parent) {
      segments.unshift(`/${t}`);
    } else {
      const index = xpathPositionIndex(current, parent);
      segments.unshift(`/${t}[${index}]`);
    }

    current = parent;
  }

  return segments.join('');
}

/** Return the 1-based position index for XPath (counting same-tag siblings). */
function xpathPositionIndex(el: ElementLike, parent: ElementLike): number {
  const t = tag(el);
  let index = 0;
  for (let i = 0; i < parent.children.length; i++) {
    const sibling = parent.children[i] as ElementLike | undefined;
    if (sibling && tag(sibling) === t) {
      index++;
      if (sibling === el) return index;
    }
  }
  return index;
}

// ── ARIA Selector ───────────────────────────────────────────────────────────

function generateAriaSelector(el: ElementLike): string | undefined {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const alt = el.getAttribute('alt');
  if (alt) return alt;

  const title = el.getAttribute('title');
  if (title) return title;

  return undefined;
}

// ── Text Content Selector ───────────────────────────────────────────────────

function generateTextContentSelector(el: ElementLike): string | undefined {
  const text = el.textContent?.trim();
  if (!text) return undefined;
  return text.length > 50 ? text.slice(0, 50) : text;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate multiple selector strategies for a given element.
 *
 * Returns a `SelectorSet` with:
 * - `css`  — always present, best-effort CSS selector
 * - `xpath` — always present, positional XPath
 * - `aria` — present when an accessible name can be derived
 * - `textContent` — present when the element has visible text (truncated to 50 chars)
 */
export function generateSelectors(element: ElementLike): SelectorSet {
  return {
    css: generateCssSelector(element),
    xpath: generateXpath(element),
    aria: generateAriaSelector(element),
    textContent: generateTextContentSelector(element),
  };
}

// Re-export helpers for testing edge cases
export { cssEscape as _cssEscape, xpathEscape as _xpathEscape };
