import type { IDownloadAdapter } from '../interfaces/index.js';

/**
 * Chrome Download adapter — triggers file downloads from Blobs.
 */
export class ChromeDownloadAdapter implements IDownloadAdapter {
  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    // URL.createObjectURL is unavailable in MV3 service workers — use data URL instead
    const dataUrl = await this.blobToDataUrl(blob);
    await browser.downloads.download({
      url: dataUrl,
      filename,
      saveAs: true,
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
