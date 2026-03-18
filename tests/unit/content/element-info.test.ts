import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessibleName,
  extractElementMetadata,
  getViewport,
  getScrollPosition,
  getClickCoordinates,
} from '../../../src/content/element-info.js';

describe('getAccessibleName', () => {
  beforeEach(() => {
    while (document.body.firstChild) document.body.firstChild.remove();
  });

  it('returns aria-label when present', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Close dialog');
    document.body.appendChild(btn);

    expect(getAccessibleName(btn)).toBe('Close dialog');
  });

  it('returns aria-labelledby text', () => {
    const label = document.createElement('span');
    label.id = 'my-label';
    label.textContent = 'Username';
    document.body.appendChild(label);

    const input = document.createElement('input');
    input.setAttribute('aria-labelledby', 'my-label');
    document.body.appendChild(input);

    expect(getAccessibleName(input)).toBe('Username');
  });

  it('returns aria-labelledby with multiple IDs', () => {
    const label1 = document.createElement('span');
    label1.id = 'first';
    label1.textContent = 'First';
    document.body.appendChild(label1);

    const label2 = document.createElement('span');
    label2.id = 'last';
    label2.textContent = 'Last';
    document.body.appendChild(label2);

    const input = document.createElement('input');
    input.setAttribute('aria-labelledby', 'first last');
    document.body.appendChild(input);

    expect(getAccessibleName(input)).toBe('First Last');
  });

  it('returns alt text for images', () => {
    const img = document.createElement('img');
    img.setAttribute('alt', 'Company logo');
    document.body.appendChild(img);

    expect(getAccessibleName(img)).toBe('Company logo');
  });

  it('returns title attribute', () => {
    const div = document.createElement('div');
    div.setAttribute('title', 'Tooltip text');
    document.body.appendChild(div);

    expect(getAccessibleName(div)).toBe('Tooltip text');
  });

  it('returns label[for] text', () => {
    const label = document.createElement('label');
    label.setAttribute('for', 'email-field');
    label.textContent = 'Email address';
    document.body.appendChild(label);

    const input = document.createElement('input');
    input.id = 'email-field';
    document.body.appendChild(input);

    expect(getAccessibleName(input)).toBe('Email address');
  });

  it('returns placeholder text', () => {
    const input = document.createElement('input');
    input.setAttribute('placeholder', 'Enter your name');
    document.body.appendChild(input);

    expect(getAccessibleName(input)).toBe('Enter your name');
  });

  it('returns textContent', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Submit';
    document.body.appendChild(btn);

    expect(getAccessibleName(btn)).toBe('Submit');
  });

  it('truncates textContent at 50 characters', () => {
    const p = document.createElement('p');
    p.textContent = 'A'.repeat(80);
    document.body.appendChild(p);

    expect(getAccessibleName(p)).toBe('A'.repeat(50));
  });

  it('returns empty string when no accessible name found', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    expect(getAccessibleName(div)).toBe('');
  });

  it('trims whitespace from names', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', '  Save changes  ');
    document.body.appendChild(btn);

    expect(getAccessibleName(btn)).toBe('Save changes');
  });

  it('prioritizes aria-label over textContent', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Close');
    btn.textContent = 'X';
    document.body.appendChild(btn);

    expect(getAccessibleName(btn)).toBe('Close');
  });
});

describe('extractElementMetadata', () => {
  it('extracts basic metadata from a button', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Save';
    document.body.appendChild(btn);

    const metadata = extractElementMetadata(btn);

    expect(metadata.tagName).toBe('BUTTON');
    expect(metadata.elementType).toBe('button');
    expect(metadata.accessibleName).toBe('Save');
    expect(metadata.boundingBox).toHaveProperty('x');
    expect(metadata.boundingBox).toHaveProperty('y');
    expect(metadata.boundingBox).toHaveProperty('width');
    expect(metadata.boundingBox).toHaveProperty('height');
    expect(metadata.selectors).toHaveProperty('css');
    expect(metadata.selectors).toHaveProperty('xpath');
  });

  it('masks password input values', () => {
    const input = document.createElement('input');
    input.type = 'password';
    input.value = 'secret123';
    document.body.appendChild(input);

    const metadata = extractElementMetadata(input);

    expect(metadata.inputValue).toBe('••••••••');
  });

  it('captures text input values', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'hello world';
    document.body.appendChild(input);

    const metadata = extractElementMetadata(input);

    expect(metadata.inputValue).toBe('hello world');
  });

  it('captures textarea values', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'some text';
    document.body.appendChild(textarea);

    const metadata = extractElementMetadata(textarea);

    expect(metadata.inputValue).toBe('some text');
  });

  it('extracts role attribute', () => {
    const div = document.createElement('div');
    div.setAttribute('role', 'navigation');
    document.body.appendChild(div);

    const metadata = extractElementMetadata(div);

    expect(metadata.elementRole).toBe('navigation');
  });

  it('returns undefined for elementRole when no role', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const metadata = extractElementMetadata(div);

    expect(metadata.elementRole).toBeUndefined();
  });
});

describe('getViewport', () => {
  it('returns width and height', () => {
    const vp = getViewport();
    expect(vp).toHaveProperty('width');
    expect(vp).toHaveProperty('height');
    expect(typeof vp.width).toBe('number');
    expect(typeof vp.height).toBe('number');
  });
});

describe('getScrollPosition', () => {
  it('returns x and y', () => {
    const pos = getScrollPosition();
    expect(pos).toHaveProperty('x');
    expect(pos).toHaveProperty('y');
    expect(typeof pos.x).toBe('number');
    expect(typeof pos.y).toBe('number');
  });
});

describe('getClickCoordinates', () => {
  it('extracts clientX and clientY from MouseEvent', () => {
    const event = new MouseEvent('click', { clientX: 150, clientY: 200 });
    const coords = getClickCoordinates(event);

    expect(coords.x).toBe(150);
    expect(coords.y).toBe(200);
  });
});
