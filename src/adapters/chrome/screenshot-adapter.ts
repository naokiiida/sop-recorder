import type { IScreenshotCapture } from '../interfaces/index.js';
import type { Coordinates } from '../../core/types.js';

const JPEG_QUALITY = 0.85;
const MAX_WIDTH = 1920;
const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;

/**
 * Screenshot capture adapter using chrome.tabs.captureVisibleTab.
 * Returns JPEG Blobs; gracefully returns null on failure (chrome:// pages, etc.).
 */
export class ChromeScreenshotAdapter implements IScreenshotCapture {
  async captureVisibleTab(): Promise<Blob> {
    const dataUrl = await browser.tabs.captureVisibleTab({ format: 'jpeg', quality: 85 });
    return dataUrlToBlob(dataUrl);
  }
}

/**
 * Capture a screenshot, returning null on failure.
 */
export async function captureScreenshotSafe(): Promise<Blob | null> {
  try {
    const dataUrl = await browser.tabs.captureVisibleTab({ format: 'jpeg', quality: 85 });
    return dataUrlToBlob(dataUrl);
  } catch {
    // Fails on chrome://, edge://, devtools, etc.
    return null;
  }
}

/**
 * Generate a 320x180 thumbnail from a screenshot Blob.
 * Uses OffscreenCanvas (available in service workers).
 * Returns a data URL string for inline display.
 */
export async function generateThumbnail(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);

  // Calculate scaling to fit within thumbnail dimensions
  const scale = Math.min(THUMBNAIL_WIDTH / bitmap.width, THUMBNAIL_HEIGHT / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get OffscreenCanvas 2d context');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const thumbnailBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
  return blobToDataUrl(thumbnailBlob);
}

/**
 * Render a step number badge onto a screenshot at the given coordinates.
 * Returns a new Blob with the badge drawn.
 */
export async function renderStepBadge(
  screenshotBlob: Blob,
  stepNumber: number,
  coordinates: Coordinates | undefined,
): Promise<Blob> {
  const bitmap = await createImageBitmap(screenshotBlob);

  // Scale down if wider than MAX_WIDTH
  let width = bitmap.width;
  let height = bitmap.height;
  if (width > MAX_WIDTH) {
    const scale = MAX_WIDTH / width;
    width = MAX_WIDTH;
    height = Math.round(height * scale);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get OffscreenCanvas 2d context');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Draw badge at click coordinates or top-left corner
  const badgeX = coordinates ? Math.min(coordinates.x, width - 16) : 20;
  const badgeY = coordinates ? Math.min(coordinates.y, height - 16) : 20;
  const radius = 14;

  // Red circle
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#e53e3e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // White number
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(stepNumber), badgeX, badgeY);

  const resultBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  return resultBlob;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  if (!header || !base64) throw new Error('Invalid data URL');

  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
