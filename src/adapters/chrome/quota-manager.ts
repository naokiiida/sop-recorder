import type { IStorageAdapter } from '../interfaces/index.js';
import type { IBlobStore } from '../interfaces/index.js';

const QUOTA_WARNING_THRESHOLD = 0.8; // 80%
const AUTO_PURGE_DAYS = 30;

export interface QuotaStatus {
  used: number;
  quota: number;
  percentUsed: number;
  isWarning: boolean;
  isFull: boolean;
}

/**
 * Storage quota monitoring and auto-purge for old recordings.
 */
export class QuotaManager {
  constructor(
    private storage: IStorageAdapter,
    private blobStore: IBlobStore,
  ) {}

  /**
   * Check current storage usage and return status.
   */
  async checkQuota(): Promise<QuotaStatus> {
    const { used, quota } = await this.storage.getStorageUsage();
    const percentUsed = quota > 0 ? used / quota : 0;

    return {
      used,
      quota,
      percentUsed,
      isWarning: percentUsed >= QUOTA_WARNING_THRESHOLD,
      isFull: percentUsed >= 0.95,
    };
  }

  /**
   * Purge recordings older than 30 days.
   * Deletes both metadata and associated screenshot blobs.
   * Returns the number of recordings purged.
   */
  async purgeOldRecordings(): Promise<number> {
    const cutoff = Date.now() - AUTO_PURGE_DAYS * 24 * 60 * 60 * 1000;
    const recordings = await this.storage.listRecordings();
    let purged = 0;

    for (const meta of recordings) {
      const updatedAt = (meta as unknown as { updatedAt?: number }).updatedAt ?? 0;
      if (updatedAt < cutoff) {
        const recording = await this.storage.getRecording(
          (meta as unknown as { id: string }).id,
        );
        if (recording) {
          const blobKeys = recording.steps
            .map((s) => s.screenshotBlobKey)
            .filter((k) => k.length > 0);
          if (blobKeys.length > 0) {
            await this.blobStore.deleteMany(blobKeys);
          }
        }
        await this.storage.deleteRecording((meta as unknown as { id: string }).id);
        purged++;
      }
    }

    return purged;
  }
}
