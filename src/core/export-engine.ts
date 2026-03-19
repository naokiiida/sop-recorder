import type { Recording } from './types.js';

// ── Markdown Generator ──────────────────────────────────────────────────────

/**
 * Generate a Markdown SOP document from a recording.
 *
 * @param mode 'zip' — relative image paths for ZIP bundle
 *             'clipboard' — text placeholders for pasting
 */
export function generateMarkdown(
  recording: Recording,
  mode: 'zip' | 'clipboard',
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${recording.title}`);
  lines.push('');

  const date = new Date(recording.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const stepCount = recording.steps.length;
  const startUrl = recording.metadata.startUrl;

  lines.push(`**Created:** ${date}  |  **Steps:** ${stepCount}  |  **Starting URL:** ${startUrl}`);
  lines.push('');

  if (stepCount === 0) {
    lines.push('*No steps recorded.*');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('---');
  lines.push('');

  // Steps
  for (let i = 0; i < recording.steps.length; i++) {
    const step = recording.steps[i]!;
    const num = i + 1;
    const padded = String(num).padStart(2, '0');

    lines.push(`## Step ${num}: ${step.title}`);
    lines.push('');

    if (step.description.trim()) {
      lines.push(step.description.trim());
      lines.push('');
    }

    lines.push(`**URL:** ${step.pageUrl}  **Action:** ${step.type}`);
    lines.push('');

    // Screenshot reference
    if (step.screenshotBlobKey) {
      if (mode === 'zip') {
        lines.push(`![Step ${num}](screenshots/step-${padded}.jpg)`);
      } else {
        lines.push(`[Screenshot: Step ${num}]`);
      }
    } else {
      lines.push('*(Screenshot unavailable)*');
    }
    lines.push('');

    // Separator between steps (not after last)
    if (i < recording.steps.length - 1) {
      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Filename Sanitization ───────────────────────────────────────────────────

const MAX_FILENAME_LENGTH = 60;

/**
 * Sanitize a recording title into a filesystem-safe filename.
 * Returns lowercase, hyphen-separated, max 60 chars.
 */
export function sanitizeFilename(title: string): string {
  const sanitized = title
    .replace(/[^a-zA-Z0-9\s-]/g, '') // strip non-alphanumeric (keep spaces, hyphens)
    .trim()
    .replace(/\s+/g, '-') // collapse whitespace to hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .toLowerCase()
    .slice(0, MAX_FILENAME_LENGTH);

  return sanitized || 'sop-export';
}
