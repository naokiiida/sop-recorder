import { describe, it, expect, beforeEach } from 'vitest';
import { injectOverlay, removeOverlay } from '../../../src/content/overlay.js';

describe('CSS Overlay', () => {
  beforeEach(() => {
    // Clean up DOM for each test
    while (document.body.firstChild) document.body.firstChild.remove();
    while (document.head.firstChild) document.head.firstChild.remove();
    removeOverlay();
  });

  describe('injectOverlay', () => {
    it('adds data-sop-highlight attribute to the element', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);

      injectOverlay(el);

      expect(el.hasAttribute('data-sop-highlight')).toBe(true);
    });

    it('injects a <style> element into <head>', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);

      injectOverlay(el);

      const style = document.getElementById('sop-recorder-highlight-style');
      expect(style).not.toBeNull();
      expect(style?.tagName).toBe('STYLE');
      expect(style?.textContent).toContain('#e53e3e');
      expect(style?.textContent).toContain('outline');
    });

    it('does not create duplicate style elements', () => {
      const el1 = document.createElement('button');
      const el2 = document.createElement('div');
      document.body.appendChild(el1);
      document.body.appendChild(el2);

      injectOverlay(el1);
      injectOverlay(el2);

      const styles = document.querySelectorAll('#sop-recorder-highlight-style');
      expect(styles.length).toBe(1);
    });

    it('removes previous highlight before applying new one', () => {
      const el1 = document.createElement('button');
      const el2 = document.createElement('div');
      document.body.appendChild(el1);
      document.body.appendChild(el2);

      injectOverlay(el1);
      expect(el1.hasAttribute('data-sop-highlight')).toBe(true);

      injectOverlay(el2);
      expect(el1.hasAttribute('data-sop-highlight')).toBe(false);
      expect(el2.hasAttribute('data-sop-highlight')).toBe(true);
    });
  });

  describe('removeOverlay', () => {
    it('removes the data-sop-highlight attribute', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);

      injectOverlay(el);
      removeOverlay();

      expect(el.hasAttribute('data-sop-highlight')).toBe(false);
    });

    it('removes the style element', () => {
      const el = document.createElement('button');
      document.body.appendChild(el);

      injectOverlay(el);
      removeOverlay();

      expect(document.getElementById('sop-recorder-highlight-style')).toBeNull();
    });

    it('is safe to call when no overlay exists', () => {
      expect(() => removeOverlay()).not.toThrow();
    });
  });
});
