import { describe, expect, it } from 'vitest';
import { generateMarkdown, sanitizeFilename } from '../../../src/core/export-engine.js';
import type { Recording, RecordedStep } from '../../../src/core/types.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<RecordedStep> = {}): RecordedStep {
  return {
    id: crypto.randomUUID(),
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
    title: 'Clicked "Save" button',
    description: '',
    screenshotBlobKey: 'rec1_step_1',
    ...overrides,
  };
}

function makeRecording(
  steps: RecordedStep[] = [],
  overrides: Partial<Recording> = {},
): Recording {
  return {
    id: 'rec-1',
    title: 'My SOP',
    createdAt: new Date('2026-03-19T10:00:00Z').getTime(),
    updatedAt: Date.now(),
    steps,
    metadata: {
      startUrl: 'https://example.com',
      startPageTitle: 'Example',
      browserVersion: 'Chrome/130',
      stepCount: steps.length,
    },
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('generateMarkdown', () => {
  it('generates header-only document for empty steps', () => {
    const md = generateMarkdown(makeRecording(), 'zip');
    expect(md).toContain('# My SOP');
    expect(md).toContain('**Steps:** 0');
    expect(md).toContain('*No steps recorded.*');
  });

  it('generates markdown with image paths in zip mode', () => {
    const steps = [
      makeStep({ title: 'Clicked "Login"', pageUrl: 'https://example.com/login' }),
      makeStep({
        title: 'Typed email',
        type: 'input',
        description: 'Entered user@test.com',
        screenshotBlobKey: 'rec1_step_2',
        pageUrl: 'https://example.com/login',
      }),
    ];
    const md = generateMarkdown(makeRecording(steps), 'zip');

    expect(md).toContain('## Step 1: Clicked "Login"');
    expect(md).toContain('![Step 1](screenshots/step-01.jpg)');
    expect(md).toContain('## Step 2: Typed email');
    expect(md).toContain('![Step 2](screenshots/step-02.jpg)');
    expect(md).toContain('Entered user@test.com');
    expect(md).toContain('**Action:** input');
  });

  it('generates placeholders in clipboard mode', () => {
    const steps = [makeStep()];
    const md = generateMarkdown(makeRecording(steps), 'clipboard');

    expect(md).toContain('[Screenshot: Step 1]');
    expect(md).not.toContain('![');
  });

  it('marks missing screenshots as unavailable', () => {
    const steps = [makeStep({ screenshotBlobKey: '' })];
    const md = generateMarkdown(makeRecording(steps), 'zip');

    expect(md).toContain('*(Screenshot unavailable)*');
    expect(md).not.toContain('![');
  });

  it('omits empty descriptions', () => {
    const steps = [makeStep({ description: '' })];
    const md = generateMarkdown(makeRecording(steps), 'zip');

    // Description line should not appear between title and URL
    const lines = md.split('\n');
    const titleIdx = lines.findIndex((l) => l.startsWith('## Step 1'));
    const urlIdx = lines.findIndex((l) => l.startsWith('**URL:**'));
    // Only empty lines between title and URL (no content lines)
    const between = lines.slice(titleIdx + 1, urlIdx).filter((l) => l.trim());
    expect(between).toHaveLength(0);
  });

  it('includes descriptions when non-empty', () => {
    const steps = [makeStep({ description: 'Click the save button' })];
    const md = generateMarkdown(makeRecording(steps), 'zip');
    expect(md).toContain('Click the save button');
  });

  it('separates steps with horizontal rules', () => {
    const steps = [makeStep(), makeStep({ title: 'Step two' })];
    const md = generateMarkdown(makeRecording(steps), 'zip');

    // Count --- separators (one after header, one between steps)
    const separators = md.split('\n').filter((l) => l === '---');
    expect(separators.length).toBe(2); // header separator + between steps
  });

  it('includes metadata in header', () => {
    const md = generateMarkdown(makeRecording([makeStep()]), 'zip');
    expect(md).toContain('**Created:**');
    expect(md).toContain('**Steps:** 1');
    expect(md).toContain('**Starting URL:** https://example.com');
  });

  it('generates markdown for a recording with 5 steps', () => {
    const steps = Array.from({ length: 5 }, (_, i) =>
      makeStep({ title: `Step ${i + 1}`, sequenceNumber: i + 1 }),
    );
    const md = generateMarkdown(makeRecording(steps), 'zip');

    expect(md).toContain('**Steps:** 5');
    expect(md).toContain('## Step 1:');
    expect(md).toContain('## Step 5:');
    expect(md).toContain('![Step 1](screenshots/step-01.jpg)');
    expect(md).toContain('![Step 5](screenshots/step-05.jpg)');
  });

  it('generates zero-padded filenames for 50 steps', () => {
    const steps = Array.from({ length: 50 }, (_, i) =>
      makeStep({ title: `Step ${i + 1}`, sequenceNumber: i + 1 }),
    );
    const md = generateMarkdown(makeRecording(steps), 'zip');

    expect(md).toContain('**Steps:** 50');
    expect(md).toContain('![Step 1](screenshots/step-01.jpg)');
    expect(md).toContain('![Step 10](screenshots/step-10.jpg)');
    expect(md).toContain('![Step 50](screenshots/step-50.jpg)');
    // Ensure NO unpadded references for any single-digit step
    expect(md).not.toMatch(/screenshots\/step-5\.jpg/);
    expect(md).not.toMatch(/screenshots\/step-3\.jpg/);
    // Verify a mid-range single-digit step IS zero-padded
    expect(md).toContain('![Step 3](screenshots/step-03.jpg)');
  });

  it('includes Starting URL field even when startUrl is empty', () => {
    const recording = makeRecording([makeStep()], {
      metadata: {
        startUrl: '',
        startPageTitle: 'Example',
        browserVersion: 'Chrome/130',
        stepCount: 1,
      },
    });
    const md = generateMarkdown(recording, 'zip');
    // Export engine always emits the field; value is just empty
    expect(md).toContain('**Starting URL:**');
  });
});

describe('sanitizeFilename', () => {
  it('converts title to lowercase hyphenated string', () => {
    expect(sanitizeFilename('My SOP Title')).toBe('my-sop-title');
  });

  it('strips special characters', () => {
    expect(sanitizeFilename('SOP - My App / Dashboard')).toBe('sop-my-app-dashboard');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(sanitizeFilename('hello   --  world')).toBe('hello-world');
  });

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(60);
  });

  it('falls back to sop-export for empty input', () => {
    expect(sanitizeFilename('')).toBe('sop-export');
    expect(sanitizeFilename('!@#$%')).toBe('sop-export');
  });

  it('preserves existing hyphens', () => {
    expect(sanitizeFilename('my-sop')).toBe('my-sop');
  });
});
