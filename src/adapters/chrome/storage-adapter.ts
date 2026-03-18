import type { IStorageAdapter } from '../interfaces/index.js';
import type {
  Recording,
  RecordingMetadata,
  SessionRecordingState,
} from '../../core/types.js';

const SESSION_KEY = 'sop_session_state';
const RECORDINGS_PREFIX = 'sop_recording_';
const RECORDINGS_INDEX_KEY = 'sop_recordings_index';

/**
 * Chrome Storage adapter — session storage for active state,
 * local storage for saved recordings.
 */
export class ChromeStorageAdapter implements IStorageAdapter {
  // ── Session State ───────────────────────────────────────────────────────

  async getSessionState(): Promise<SessionRecordingState | null> {
    const result = await browser.storage.session.get(SESSION_KEY);
    const data = result[SESSION_KEY] as SessionRecordingState | undefined;
    return data ?? null;
  }

  async setSessionState(state: SessionRecordingState): Promise<void> {
    await browser.storage.session.set({ [SESSION_KEY]: state });
  }

  async clearSessionState(): Promise<void> {
    await browser.storage.session.remove(SESSION_KEY);
  }

  // ── Local Storage (Saved Recordings) ────────────────────────────────────

  async saveRecording(recording: Recording): Promise<void> {
    const key = RECORDINGS_PREFIX + recording.id;
    await browser.storage.local.set({ [key]: recording });

    // Update the index
    const index = await this.getIndex();
    const existing = index.findIndex((m) => m.id === recording.id);
    const meta: RecordingMetadata & { id: string; title: string; createdAt: number; updatedAt: number } = {
      id: recording.id,
      title: recording.title,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      startUrl: recording.metadata.startUrl,
      startPageTitle: recording.metadata.startPageTitle,
      browserVersion: recording.metadata.browserVersion,
      stepCount: recording.metadata.stepCount,
    };

    if (existing !== -1) {
      index[existing] = meta;
    } else {
      index.push(meta);
    }

    await browser.storage.local.set({ [RECORDINGS_INDEX_KEY]: index });
  }

  async getRecording(id: string): Promise<Recording | null> {
    const key = RECORDINGS_PREFIX + id;
    const result = await browser.storage.local.get(key);
    const data = result[key] as Recording | undefined;
    return data ?? null;
  }

  async listRecordings(): Promise<RecordingMetadata[]> {
    const index = await this.getIndex();
    // Sort by updatedAt descending (newest first)
    return index.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }

  async deleteRecording(id: string): Promise<void> {
    const key = RECORDINGS_PREFIX + id;
    await browser.storage.local.remove(key);

    // Update index
    const index = await this.getIndex();
    const filtered = index.filter((m) => m.id !== id);
    await browser.storage.local.set({ [RECORDINGS_INDEX_KEY]: filtered });
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      };
    }
    return { used: 0, quota: 0 };
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private async getIndex(): Promise<IndexEntry[]> {
    const result = await browser.storage.local.get(RECORDINGS_INDEX_KEY);
    const data = result[RECORDINGS_INDEX_KEY] as IndexEntry[] | undefined;
    return data ?? [];
  }
}

interface IndexEntry extends RecordingMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}
