import type { IDownloadAdapter } from '../interfaces/index.js';

/**
 * Chrome Download adapter — triggers file downloads from Blobs.
 */
export class ChromeDownloadAdapter implements IDownloadAdapter {
  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    try {
      await browser.downloads.download({
        url,
        filename,
        saveAs: true,
      });
    } finally {
      // Revoke after a short delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }
}
