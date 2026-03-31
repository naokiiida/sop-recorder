import type { Recording, RecordingMetadata } from '../types.js';
import type {
  IBlobStore,
  IDownloadAdapter,
  IStorageAdapter,
} from '../../adapters/interfaces/index.js';
import { exportAsZip } from '../zip-exporter.js';
import { Logger } from '../logger.js';

/**
 * Orchestrator responsible for managing saved recordings and blob storage.
 */
export class StorageOrchestrator {
  private storageAdapter: IStorageAdapter;
  private blobStore: IBlobStore;
  private downloadAdapter: IDownloadAdapter;

  constructor(
    storageAdapter: IStorageAdapter,
    blobStore: IBlobStore,
    downloadAdapter: IDownloadAdapter,
  ) {
    this.storageAdapter = storageAdapter;
    this.blobStore = blobStore;
    this.downloadAdapter = downloadAdapter;
  }

  /**
   * List all saved recordings.
   */
  async listRecordings(): Promise<RecordingMetadata[]> {
    return this.storageAdapter.listRecordings();
  }

  /**
   * Get a specific recording by ID.
   */
  async getRecording(id: string): Promise<Recording | null> {
    return this.storageAdapter.getRecording(id);
  }

  /**
   * Save a new recording.
   */
  async saveRecording(recording: Recording): Promise<void> {
    await this.storageAdapter.saveRecording(recording);
  }

  /**
   * Delete a recording and its associated screenshot blobs.
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = await this.storageAdapter.getRecording(recordingId);
    if (recording) {
      // Delete associated screenshot blobs
      const blobKeys = recording.steps.map((s) => s.screenshotBlobKey).filter((k) => k.length > 0);
      if (blobKeys.length > 0) {
        await this.blobStore.deleteMany(blobKeys);
        Logger.info('StorageOrchestrator', 'Deleted blobs for recording', {
          recordingId,
          count: blobKeys.length,
        });
      }
    }
    await this.storageAdapter.deleteRecording(recordingId);
  }

  /**
   * Export a recording as a ZIP file.
   */
  async exportRecording(recordingId: string): Promise<void> {
    const recording = await this.storageAdapter.getRecording(recordingId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    const { blob, filename } = await exportAsZip(recording, (key) => this.blobStore.get(key));
    await this.downloadAdapter.downloadBlob(blob, filename);
    Logger.info('StorageOrchestrator', 'Exported recording', { recordingId, filename });
  }

  /**
   * Get total storage usage in bytes.
   */
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    return this.storageAdapter.getStorageUsage();
  }
}
