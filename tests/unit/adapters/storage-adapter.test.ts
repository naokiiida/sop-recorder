import { describe, it, expect, beforeEach } from 'vitest';
import { ChromeStorageAdapter } from '../../../src/adapters/chrome/storage-adapter.js';
import type { Recording, SessionRecordingState } from '../../../src/core/types.js';

describe('ChromeStorageAdapter', () => {
  let adapter: ChromeStorageAdapter;

  beforeEach(async () => {
    adapter = new ChromeStorageAdapter();
    // Clear storage between tests
    await browser.storage.session.clear();
    await browser.storage.local.clear();
  });

  describe('session state', () => {
    it('returns null when no session state exists', async () => {
      const state = await adapter.getSessionState();
      expect(state).toBeNull();
    });

    it('sets and gets session state', async () => {
      const sessionState: SessionRecordingState = {
        state: 'recording',
        recordingId: 'test-123',
        tabId: 1,
        steps: [],
      };

      await adapter.setSessionState(sessionState);
      const result = await adapter.getSessionState();

      expect(result).toEqual(sessionState);
    });

    it('clears session state', async () => {
      await adapter.setSessionState({
        state: 'recording',
        recordingId: 'test-123',
        tabId: 1,
        steps: [],
      });

      await adapter.clearSessionState();
      const result = await adapter.getSessionState();

      expect(result).toBeNull();
    });
  });

  describe('recordings CRUD', () => {
    const makeRecording = (id: string, title: string): Recording => ({
      id,
      title,
      createdAt: Date.now() - 1000,
      updatedAt: Date.now(),
      steps: [],
      metadata: {
        startUrl: 'https://example.com',
        startPageTitle: 'Example',
        browserVersion: 'test',
        stepCount: 0,
      },
    });

    it('saves and retrieves a recording', async () => {
      const recording = makeRecording('rec-1', 'Test SOP');

      await adapter.saveRecording(recording);
      const result = await adapter.getRecording('rec-1');

      expect(result).toEqual(recording);
    });

    it('returns null for non-existent recording', async () => {
      const result = await adapter.getRecording('nonexistent');
      expect(result).toBeNull();
    });

    it('lists recordings sorted by updatedAt descending', async () => {
      const rec1 = makeRecording('rec-1', 'First');
      rec1.updatedAt = 1000;
      const rec2 = makeRecording('rec-2', 'Second');
      rec2.updatedAt = 3000;
      const rec3 = makeRecording('rec-3', 'Third');
      rec3.updatedAt = 2000;

      await adapter.saveRecording(rec1);
      await adapter.saveRecording(rec2);
      await adapter.saveRecording(rec3);

      const list = await adapter.listRecordings();
      expect(list.length).toBe(3);
      // Newest first
      expect(list[0]!.startUrl).toBe('https://example.com');
    });

    it('deletes a recording', async () => {
      const recording = makeRecording('rec-1', 'To Delete');
      await adapter.saveRecording(recording);

      await adapter.deleteRecording('rec-1');

      const result = await adapter.getRecording('rec-1');
      expect(result).toBeNull();

      const list = await adapter.listRecordings();
      expect(list.length).toBe(0);
    });

    it('updates existing recording in index', async () => {
      const recording = makeRecording('rec-1', 'Original');
      await adapter.saveRecording(recording);

      recording.title = 'Updated';
      recording.updatedAt = Date.now() + 1000;
      await adapter.saveRecording(recording);

      const list = await adapter.listRecordings();
      expect(list.length).toBe(1);
    });
  });

  describe('storage usage', () => {
    it('returns usage object with used and quota', async () => {
      const usage = await adapter.getStorageUsage();
      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('quota');
      expect(typeof usage.used).toBe('number');
      expect(typeof usage.quota).toBe('number');
    });
  });
});
