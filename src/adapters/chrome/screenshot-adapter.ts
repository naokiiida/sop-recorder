import type { IScreenshotCapture } from '../interfaces/index.js';
import type { Coordinates, ViewportSize } from '../../core/types.js';

const JPEG_QUALITY = 0.85;
const MAX_WIDTH = 1920;
const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;
const CROP_WIDTH_CSS = 640;
const CROP_HEIGHT_CSS = 360;

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
 * When click coordinates are provided, crops a 640x360 CSS-pixel region
 * centered on the click (2x zoom) and draws a blue click indicator.
 * Falls back to full-viewport scaling when no coordinates are available.
 */
export async function generateThumbnail(
  blob: Blob,
  clickCoordinates?: Coordinates,
  viewport?: ViewportSize,
): Promise<string> {
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get OffscreenCanvas 2d context');

  const canZoom = clickCoordinates && viewport && viewport.width >= CROP_WIDTH_CSS;

  if (canZoom) {
    const dpr = bitmap.width / viewport.width;
    const cropW = Math.round(CROP_WIDTH_CSS * dpr);
    const cropH = Math.round(CROP_HEIGHT_CSS * dpr);
    const clickX = Math.round(clickCoordinates.x * dpr);
    const clickY = Math.round(clickCoordinates.y * dpr);

    // Center crop on click, clamp to image bounds
    const cropX = clamp(clickX - cropW / 2, 0, bitmap.width - cropW);
    const cropY = clamp(clickY - cropH / 2, 0, bitmap.height - cropH);

    ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

    // Map click position into thumbnail coordinates
    const indicatorX = (clickX - cropX) * (THUMBNAIL_WIDTH / cropW);
    const indicatorY = (clickY - cropY) * (THUMBNAIL_HEIGHT / cropH);
    drawClickIndicator(ctx, indicatorX, indicatorY, 1);
  } else {
    // Full-viewport scaling fallback
    const scale = Math.min(THUMBNAIL_WIDTH / bitmap.width, THUMBNAIL_HEIGHT / bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0, width, height);
  }

  bitmap.close();

  const thumbnailBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 });
  return blobToDataUrl(thumbnailBlob);
}

/**
 * Render a step number badge and click indicator onto a screenshot.
 * Returns a new Blob with the overlays drawn.
 */
export async function renderStepBadge(
  screenshotBlob: Blob,
  stepNumber: number,
  coordinates: Coordinates | undefined,
  viewport?: ViewportSize,
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

  // Compute DPI scale: screenshot pixels / viewport CSS pixels
  const dpr = viewport ? width / viewport.width : 1;

  const badgeX = coordinates ? clamp(coordinates.x * dpr, 16, width - 16) : 20;
  const badgeY = coordinates ? clamp(coordinates.y * dpr, 16, height - 16) : 20;

  // Draw click indicator underneath the badge
  if (coordinates) {
    drawClickIndicator(ctx, badgeX, badgeY, dpr);
  }

  // Red circle badge with step number
  const radius = 14 * dpr;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#e53e3e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${14 * dpr}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(stepNumber), badgeX, badgeY);

  const resultBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  return resultBlob;
}

// ── Click Indicator ─────────────────────────────────────────────────────────

/**
 * Draw a 3-layer blue circle at (x, y) to indicate a click location.
 * Inspired by Claude in Chrome's teach mode indicator.
 */
function drawClickIndicator(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  scaleFactor: number,
): void {
  ctx.save();

  // Outer glow
  ctx.beginPath();
  ctx.arc(x, y, 18 * scaleFactor, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
  ctx.fill();

  // Inner circle
  ctx.beginPath();
  ctx.arc(x, y, 12 * scaleFactor, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.fill();

  // Border ring
  ctx.beginPath();
  ctx.arc(x, y, 12 * scaleFactor, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(59, 130, 246, 1.0)';
  ctx.lineWidth = 2.5 * scaleFactor;
  ctx.stroke();

  ctx.restore();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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
