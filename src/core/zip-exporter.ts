import JSZip from 'jszip';
import { generateMarkdown, sanitizeFilename } from './export-engine.js';
import type { Recording } from './types.js';

/**
 * Abstraction for fetching blobs — matches IBlobStore.get signature.
 * Injected to keep this module Chrome-free.
 */
export type BlobFetcher = (key: string) => Promise<Blob | null>;

/**
 * Assemble a ZIP containing:
 *   - sop.md (the Markdown document)
 *   - screenshots/step-01.jpg, step-02.jpg, ...
 *
 * Missing screenshots are skipped; the Markdown already marks them as unavailable.
 */
export async function exportAsZip(
  recording: Recording,
  fetchBlob: BlobFetcher,
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();

  // Add Markdown document
  const markdown = generateMarkdown(recording, 'zip');
  zip.file('sop.md', markdown);

  // Add screenshots
  const screenshotsFolder = zip.folder('screenshots')!;
  for (let i = 0; i < recording.steps.length; i++) {
    const step = recording.steps[i]!;
    if (!step.screenshotBlobKey) continue;

    const blob = await fetchBlob(step.screenshotBlobKey);
    if (!blob) continue;

    const padded = String(i + 1).padStart(2, '0');
    screenshotsFolder.file(`step-${padded}.jpg`, blob);
  }

  // Generate ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${sanitizeFilename(recording.title)}.zip`;

  return { blob: zipBlob, filename };
}
