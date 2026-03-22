import { describe, it, expect } from 'vitest';
import {
  generateSelectors,
  _cssEscape,
  _xpathEscape,
  type ElementLike,
} from '~/core/selector-generator';

// ── Test Helpers ────────────────────────────────────────────────────────────

/** Create a minimal ElementLike stub. */
function createElement(
  overrides: Partial<{
    id: string;
    tagName: string;
    textContent: string | null;
    parentElement: ElementLike | null;
    children: ElementLike[];
    attributes: Record<string, string>;
  }> = {},
): ElementLike {
  const attrs = overrides.attributes ?? {};
  return {
    id: overrides.id ?? '',
    tagName: overrides.tagName ?? 'DIV',
    textContent: overrides.textContent ?? null,
    parentElement: overrides.parentElement ?? null,
    children: overrides.children ?? [],
    getAttribute(name: string): string | null {
      return attrs[name] ?? null;
    },
  };
}

/** Build a simple DOM tree: root > parent > ...children, returning the specified child. */
function buildTree(opts: {
  childTag: string;
  childAttrs?: Record<string, string>;
  childId?: string;
  childText?: string | null;
  siblingTags?: string[];
}): ElementLike {
  const root = createElement({ tagName: 'HTML' });

  const siblings: ElementLike[] = [];
  const parent = createElement({
    tagName: 'BODY',
    parentElement: root,
    children: siblings,
  });

  // Add preceding siblings
  for (const st of opts.siblingTags ?? []) {
    siblings.push(createElement({ tagName: st, parentElement: parent, children: [] }));
  }

  const child = createElement({
    tagName: opts.childTag,
    id: opts.childId ?? '',
    textContent: opts.childText ?? null,
    parentElement: parent,
    children: [],
    attributes: opts.childAttrs ?? {},
  });
  siblings.push(child);

  // Wire root's children
  (root as unknown as { children: ElementLike[] }).children = [parent];

  return child;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('generateSelectors', () => {
  describe('CSS selector priority', () => {
    it('uses #id when element has an id', () => {
      const el = buildTree({ childTag: 'DIV', childId: 'myId' });
      const result = generateSelectors(el);
      expect(result.css).toBe('#myId');
    });

    it('uses [data-testid] when element has data-testid', () => {
      const el = buildTree({
        childTag: 'DIV',
        childAttrs: { 'data-testid': 'submit-btn' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('[data-testid="submit-btn"]');
    });

    it('uses [aria-label] when element has aria-label', () => {
      const el = buildTree({
        childTag: 'BUTTON',
        childAttrs: { 'aria-label': 'Close dialog' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('[aria-label="Close dialog"]');
    });

    it('uses tag[name] for input with name attribute', () => {
      const el = buildTree({
        childTag: 'INPUT',
        childAttrs: { name: 'email' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('input[name="email"]');
    });

    it('uses tag[role] for element with role attribute', () => {
      const el = buildTree({
        childTag: 'DIV',
        childAttrs: { role: 'navigation' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('div[role="navigation"]');
    });

    it('uses tag[href] for link with href', () => {
      const el = buildTree({
        childTag: 'A',
        childAttrs: { href: '/about' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('a[href="\\/about"]');
    });

    it('falls back to nth-of-type path when no distinguishing attributes', () => {
      const el = buildTree({
        childTag: 'SPAN',
        siblingTags: ['SPAN', 'SPAN'],
      });
      const result = generateSelectors(el);
      // Root > body:nth-of-type(1) > span:nth-of-type(3)
      expect(result.css).toBe('html > body:nth-of-type(1) > span:nth-of-type(3)');
    });

    it('id takes priority over data-testid', () => {
      const el = buildTree({
        childTag: 'DIV',
        childId: 'myId',
        childAttrs: { 'data-testid': 'test-id' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('#myId');
    });
  });

  describe('XPath generation', () => {
    it('generates a positional XPath', () => {
      const el = buildTree({ childTag: 'BUTTON' });
      const result = generateSelectors(el);
      expect(result.xpath).toBe('/html/body[1]/button[1]');
    });

    it('generates correct position among same-tag siblings', () => {
      const el = buildTree({
        childTag: 'LI',
        siblingTags: ['LI', 'LI'],
      });
      const result = generateSelectors(el);
      expect(result.xpath).toBe('/html/body[1]/li[3]');
    });
  });

  describe('ARIA selector', () => {
    it('returns aria-label value', () => {
      const el = buildTree({
        childTag: 'BUTTON',
        childAttrs: { 'aria-label': 'Submit form' },
      });
      const result = generateSelectors(el);
      expect(result.aria).toBe('Submit form');
    });

    it('falls back to alt attribute', () => {
      const el = buildTree({
        childTag: 'IMG',
        childAttrs: { alt: 'Logo image' },
      });
      const result = generateSelectors(el);
      expect(result.aria).toBe('Logo image');
    });

    it('falls back to title attribute', () => {
      const el = buildTree({
        childTag: 'DIV',
        childAttrs: { title: 'Tooltip text' },
      });
      const result = generateSelectors(el);
      expect(result.aria).toBe('Tooltip text');
    });

    it('returns undefined when no accessible name', () => {
      const el = buildTree({ childTag: 'DIV' });
      const result = generateSelectors(el);
      expect(result.aria).toBeUndefined();
    });
  });

  describe('textContent selector', () => {
    it('returns text content for button with text', () => {
      const el = buildTree({
        childTag: 'BUTTON',
        childText: 'Click me',
      });
      const result = generateSelectors(el);
      expect(result.textContent).toBe('Click me');
    });

    it('truncates text content at 50 characters', () => {
      const longText = 'A'.repeat(80);
      const el = buildTree({
        childTag: 'P',
        childText: longText,
      });
      const result = generateSelectors(el);
      expect(result.textContent).toBe('A'.repeat(50));
      expect(result.textContent!.length).toBe(50);
    });

    it('trims whitespace from text content', () => {
      const el = buildTree({
        childTag: 'SPAN',
        childText: '  hello world  ',
      });
      const result = generateSelectors(el);
      expect(result.textContent).toBe('hello world');
    });

    it('returns undefined for empty text', () => {
      const el = buildTree({ childTag: 'DIV', childText: '' });
      const result = generateSelectors(el);
      expect(result.textContent).toBeUndefined();
    });

    it('returns undefined for null text', () => {
      const el = buildTree({ childTag: 'DIV', childText: null });
      const result = generateSelectors(el);
      expect(result.textContent).toBeUndefined();
    });
  });

  describe('special characters in attribute values', () => {
    it('escapes special characters in id', () => {
      const el = buildTree({ childTag: 'DIV', childId: 'my.id' });
      const result = generateSelectors(el);
      expect(result.css).toBe('#my\\.id');
    });

    it('escapes special characters in data-testid', () => {
      const el = buildTree({
        childTag: 'DIV',
        childAttrs: { 'data-testid': 'btn[0]' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('[data-testid="btn\\[0\\]"]');
    });

    it('escapes quotes and special chars in name attribute', () => {
      const el = buildTree({
        childTag: 'INPUT',
        childAttrs: { name: 'field"value' },
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('input[name="field\\"value"]');
    });

    it('escapes special characters in href', () => {
      const el = buildTree({
        childTag: 'A',
        childAttrs: { href: '/path?q=1&b=2' },
      });
      const result = generateSelectors(el);
      expect(result.css).toContain('\\?');
      expect(result.css).toContain('\\&');
    });
  });

  describe('cssEscape helper', () => {
    it('escapes dots, brackets, and other special chars', () => {
      expect(_cssEscape('a.b')).toBe('a\\.b');
      expect(_cssEscape('x[0]')).toBe('x\\[0\\]');
      expect(_cssEscape('a:b')).toBe('a\\:b');
    });
  });

  describe('xpathEscape helper', () => {
    it('wraps value in single quotes when no single quote present', () => {
      expect(_xpathEscape('hello world')).toBe("'hello world'");
    });

    it('wraps value in double quotes when single quote present but no double quote', () => {
      expect(_xpathEscape("it's here")).toBe('"it\'s here"');
    });

    it('uses concat() when both single and double quotes are present', () => {
      const result = _xpathEscape(`it's a "test"`);
      // Verify the full structurally-complete concat expression
      expect(result).toBe(`concat('it', "'", 's a "test"')`);
    });

    it('handles empty string', () => {
      expect(_xpathEscape('')).toBe("''");
    });
  });

  describe('fallback path when element not in parent children', () => {
    it('handles element whose reference is not found in parent children (fallback index)', () => {
      // Create a parent with no children but point el's parentElement to it
      const orphanParent = createElement({ tagName: 'DIV', children: [] });
      const orphan = createElement({
        tagName: 'SPAN',
        parentElement: orphanParent,
        children: [],
      });
      // orphan is NOT in orphanParent.children — hits the fallback return in nthOfTypeIndex
      const result = generateSelectors(orphan);
      // Known bug (D1): fallback returns 0, producing invalid :nth-of-type(0) and /span[0].
      // We assert the actual (invalid) output to document the behavior until D1 is fixed.
      expect(result.css).toContain('span:nth-of-type(0)');
      expect(result.xpath).toContain('/span[0]');
    });
  });

  describe('return shape', () => {
    it('always returns css and xpath', () => {
      const el = buildTree({ childTag: 'DIV' });
      const result = generateSelectors(el);
      expect(result).toHaveProperty('css');
      expect(result).toHaveProperty('xpath');
      expect(typeof result.css).toBe('string');
      expect(typeof result.xpath).toBe('string');
    });

    it('conforms to SelectorSet type with all fields', () => {
      const el = buildTree({
        childTag: 'BUTTON',
        childId: 'btn1',
        childAttrs: { 'aria-label': 'Submit' },
        childText: 'Submit',
      });
      const result = generateSelectors(el);
      expect(result.css).toBe('#btn1');
      expect(result.xpath).toBeDefined();
      expect(result.aria).toBe('Submit');
      expect(result.textContent).toBe('Submit');
    });
  });
});
