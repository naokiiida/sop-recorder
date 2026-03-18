import { describe, it, expect, vi } from 'vitest';
import { QuotaManager } from '../../../src/adapters/chrome/quota-manager.js';
import type { IStorageAdapter, IBlobStore } from '../../../src/adapters/interfaces/index.js';

function createMockStorage(overrides: Partial<IStorageAdapter> = {}): IStorageAdapter {
  return {
    getSessionState: vi.fn().mockResolvedValue(null),
    setSessionState: vi.fn().mockResolvedValue(undefined),
    clearSessionState: vi.fn().mockResolvedValue(undefined),
    saveRecording: vi.fn().mockResolvedValue(undefined),
    getRecording: vi.fn().mockResolvedValue(null),
    listRecordings: vi.fn().mockResolvedValue([]),
    deleteRecording: vi.fn().mockResolvedValue(undefined),
    getStorageUsage: vi.fn().mockResolvedValue({ used: 0, quota: 1000000 }),
    ...overrides,
  };
}

function createMockBlobStore(): IBlobStore {
  return {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteMany: vi.fn().mockResolvedValue(undefined),
    getUsage: vi.fn().mockResolvedValue(0),
  };
}

describe('QuotaManager', () => {
  describe('checkQuota', () => {
    it('returns not warning when usage is low', async () => {
      const storage = createMockStorage({
        getStorageUsage: vi.fn().mockResolvedValue({ used: 100, quota: 1000 }),
      });
      const manager = new QuotaManager(storage, createMockBlobStore());

      const status = await manager.checkQuota();

      expect(status.percentUsed).toBeCloseTo(0.1);
      expect(status.isWarning).toBe(false);
      expect(status.isFull).toBe(false);
    });

    it('returns warning at 80% usage', async () => {
      const storage = createMockStorage({
        getStorageUsage: vi.fn().mockResolvedValue({ used: 800, quota: 1000 }),
      });
      const manager = new QuotaManager(storage, createMockBlobStore());

      const status = await manager.checkQuota();

      expect(status.isWarning).toBe(true);
      expect(status.isFull).toBe(false);
    });

    it('returns full at 95% usage', async () => {
      const storage = createMockStorage({
        getStorageUsage: vi.fn().mockResolvedValue({ used: 960, quota: 1000 }),
      });
      const manager = new QuotaManager(storage, createMockBlobStore());

      const status = await manager.checkQuota();

      expect(status.isWarning).toBe(true);
      expect(status.isFull).toBe(true);
    });

    it('handles zero quota gracefully', async () => {
      const storage = createMockStorage({
        getStorageUsage: vi.fn().mockResolvedValue({ used: 0, quota: 0 }),
      });
      const manager = new QuotaManager(storage, createMockBlobStore());

      const status = await manager.checkQuota();

      expect(status.percentUsed).toBe(0);
      expect(status.isWarning).toBe(false);
    });
  });

  describe('purgeOldRecordings', () => {
    it('returns 0 when no recordings exist', async () => {
      const storage = createMockStorage();
      const manager = new QuotaManager(storage, createMockBlobStore());

      const purged = await manager.purgeOldRecordings();

      expect(purged).toBe(0);
    });

    it('purges recordings older than 30 days', async () => {
      const oldDate = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const storage = createMockStorage({
        listRecordings: vi.fn().mockResolvedValue([
          { id: 'old-1', updatedAt: oldDate, startUrl: '', startPageTitle: '', browserVersion: '', stepCount: 0 },
        ]),
        getRecording: vi.fn().mockResolvedValue({
          id: 'old-1',
          steps: [{ screenshotBlobKey: 'blob-1' }, { screenshotBlobKey: 'blob-2' }],
        }),
      });
      const blobStore = createMockBlobStore();
      const manager = new QuotaManager(storage, blobStore);

      const purged = await manager.purgeOldRecordings();

      expect(purged).toBe(1);
      expect(storage.deleteRecording).toHaveBeenCalledWith('old-1');
      expect(blobStore.deleteMany).toHaveBeenCalledWith(['blob-1', 'blob-2']);
    });

    it('does not purge recent recordings', async () => {
      const recentDate = Date.now() - 1000;
      const storage = createMockStorage({
        listRecordings: vi.fn().mockResolvedValue([
          { id: 'recent-1', updatedAt: recentDate, startUrl: '', startPageTitle: '', browserVersion: '', stepCount: 0 },
        ]),
      });
      const manager = new QuotaManager(storage, createMockBlobStore());

      const purged = await manager.purgeOldRecordings();

      expect(purged).toBe(0);
      expect(storage.deleteRecording).not.toHaveBeenCalled();
    });
  });
});
