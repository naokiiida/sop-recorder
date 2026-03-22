import type {
  BackgroundToContentMessage,
  BackgroundToPanelMessage,
  ContentMessage,
  PanelMessage,
  Recording,
  RecordingMetadata,
  SessionRecordingState,
} from '../../core/types.js';

// ── Screenshot Capture ──────────────────────────────────────────────────────

export interface IScreenshotCapture {
  captureVisibleTab(): Promise<Blob>;
}

// ── Storage Adapter ─────────────────────────────────────────────────────────

export interface IStorageAdapter {
  // Session storage (active recording state)
  getSessionState(): Promise<SessionRecordingState | null>;
  setSessionState(state: SessionRecordingState): Promise<void>;
  clearSessionState(): Promise<void>;

  // Local storage (saved recordings)
  saveRecording(recording: Recording): Promise<void>;
  getRecording(id: string): Promise<Recording | null>;
  listRecordings(): Promise<RecordingMetadata[]>;
  deleteRecording(id: string): Promise<void>;
  getStorageUsage(): Promise<{ used: number; quota: number }>;
}

// ── Blob Store (IndexedDB) ──────────────────────────────────────────────────

export interface IBlobStore {
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | null>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  getUsage(): Promise<number>; // bytes
}

// ── Tab Adapter ─────────────────────────────────────────────────────────────

export interface ITabAdapter {
  getCurrentTab(): Promise<{ id: number; url: string; title: string } | null>;
  sendMessageToTab(tabId: number, message: BackgroundToContentMessage): Promise<void>;
  injectContentScript(tabId: number): Promise<void>;
}

// ── Message Bus ─────────────────────────────────────────────────────────────

export interface IMessageBus {
  onContentMessage(handler: (message: ContentMessage, tabId: number) => void): void;
  onPanelConnect(handler: (port: PanelPort) => void): void;
}

export interface PanelPort {
  postMessage(message: BackgroundToPanelMessage): void;
  onMessage(handler: (message: PanelMessage) => void): void;
  onDisconnect(handler: () => void): void;
}

// ── Alarm Adapter ───────────────────────────────────────────────────────────

export interface IAlarmAdapter {
  createKeepalive(): void;
  clearKeepalive(): void;
  onAlarm(handler: () => void): void;
}

// ── Download Adapter ────────────────────────────────────────────────────────

export interface IDownloadAdapter {
  downloadBlob(blob: Blob, filename: string): Promise<void>;
}
