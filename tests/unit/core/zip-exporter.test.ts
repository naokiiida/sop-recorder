import { describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { exportAsZip, type BlobFetcher } from '../../../src/core/zip-exporter.js';
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

function makeFakePng(): Blob {
  return new Blob(['fake-png-data'], { type: 'image/jpeg' });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('exportAsZip', () => {
  it('produces a ZIP with sop.md and screenshot files', async () => {
    const steps = [
      makeStep({ screenshotBlobKey: 'key-1' }),
      makeStep({ screenshotBlobKey: 'key-2', title: 'Step two' }),
    ];
    const recording = makeRecording(steps);

    const fetchBlob: BlobFetcher = vi.fn(async (key: string) => {
      if (key === 'key-1' || key === 'key-2') return makeFakePng();
      return null;
    });

    const { blob, filename } = await exportAsZip(recording, fetchBlob);

    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe('my-sop.zip');

    // Verify ZIP contents
    const zip = await JSZip.loadAsync(blob);
    expect(zip.file('sop.md')).not.toBeNull();
    expect(zip.file('screenshots/step-01.jpg')).not.toBeNull();
    expect(zip.file('screenshots/step-02.jpg')).not.toBeNull();

    // Verify markdown content
    const mdContent = await zip.file('sop.md')!.async('string');
    expect(mdContent).toContain('# My SOP');
    expect(mdContent).toContain('![Step 1](screenshots/step-01.jpg)');
  });

  it('skips missing screenshots gracefully', async () => {
    const steps = [
      makeStep({ screenshotBlobKey: 'key-1' }),
      makeStep({ screenshotBlobKey: 'key-missing', title: 'Missing screenshot' }),
    ];
    const recording = makeRecording(steps);

    const fetchBlob: BlobFetcher = vi.fn(async (key: string) => {
      if (key === 'key-1') return makeFakePng();
      return null;
    });

    const { blob } = await exportAsZip(recording, fetchBlob);
    const zip = await JSZip.loadAsync(blob);

    expect(zip.file('screenshots/step-01.jpg')).not.toBeNull();
    expect(zip.file('screenshots/step-02.jpg')).toBeNull();
  });

  it('handles steps with empty screenshotBlobKey', async () => {
    const steps = [makeStep({ screenshotBlobKey: '' })];
    const recording = makeRecording(steps);

    const fetchBlob: BlobFetcher = vi.fn(async () => null);
    const { blob } = await exportAsZip(recording, fetchBlob);
    const zip = await JSZip.loadAsync(blob);

    // Blob fetcher should not be called for empty keys
    expect(fetchBlob).not.toHaveBeenCalled();
    expect(zip.file('screenshots/step-01.jpg')).toBeNull();
  });

  it('sanitizes filename from recording title', async () => {
    const recording = makeRecording([makeStep()], { title: 'SOP - My App / Tests' });

    const fetchBlob: BlobFetcher = vi.fn(async () => makeFakePng());
    const { filename } = await exportAsZip(recording, fetchBlob);

    expect(filename).toBe('sop-my-app-tests.zip');
  });

  it('produces a ZIP even with no steps', async () => {
    const recording = makeRecording([]);
    const fetchBlob: BlobFetcher = vi.fn(async () => null);

    const { blob } = await exportAsZip(recording, fetchBlob);
    const zip = await JSZip.loadAsync(blob);

    expect(zip.file('sop.md')).not.toBeNull();
  });

  it('includes "Screenshot unavailable" in sop.md for steps with missing blobs', async () => {
    const steps = [
      makeStep({ screenshotBlobKey: '' }),
      makeStep({ screenshotBlobKey: 'key-missing', title: 'No blob' }),
    ];
    const recording = makeRecording(steps);

    const fetchBlob: BlobFetcher = vi.fn(async () => null);
    const { blob } = await exportAsZip(recording, fetchBlob);
    const zip = await JSZip.loadAsync(blob);

    const mdContent = await zip.file('sop.md')!.async('string');
    expect(mdContent).toContain('*(Screenshot unavailable)*');
  });
});
