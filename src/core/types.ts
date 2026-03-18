// ── Primitives ──────────────────────────────────────────────────────────────

export type StepAction =
  | 'click'
  | 'dblclick'
  | 'input'
  | 'select'
  | 'check'
  | 'navigate'
  | 'scroll'
  | 'submit'
  | 'keypress';

export interface SelectorSet {
  css: string;
  xpath?: string | undefined;
  aria?: string | undefined;
  textContent?: string | undefined;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

// ── Recording State ─────────────────────────────────────────────────────────

export type RecordingState = 'idle' | 'recording' | 'paused';

export type ViewState = 'home' | 'recording' | 'edit';

export type ExportFormat = 'markdown-zip';

// ── Data Model ──────────────────────────────────────────────────────────────

export interface RecordedStep {
  id: string; // UUID
  sequenceNumber: number; // For ordering
  timestamp: number; // Unix ms

  // Action
  type: StepAction;
  inputValue?: string | undefined; // Masked for password fields

  // Target element — multiple selector strategies
  selectors: SelectorSet;
  tagName: string;
  elementType?: string | undefined; // input type, button, link, etc.
  elementRole?: string | undefined; // ARIA role
  accessibleName: string; // Human-readable element name (WAI-ARIA spec)

  // Spatial data — for tour overlays and replay
  boundingBox: BoundingBox;
  clickCoordinates?: Coordinates | undefined; // Viewport-relative

  // Page context
  pageUrl: string;
  pageTitle: string;
  viewport: ViewportSize;
  scrollPosition: Coordinates;

  // User-editable content
  title: string; // Auto-generated, user-editable
  description: string; // User-editable

  // Screenshot — stored as Blob in IndexedDB, referenced by key
  screenshotBlobKey: string; // IndexedDB key for screenshot Blob
  thumbnailDataUrl?: string | undefined; // Small inline thumbnail for list view (320x180, < 10 KB)
}

export interface RecordingMetadata {
  startUrl: string;
  startPageTitle: string;
  browserVersion: string;
  stepCount: number;
}

export interface Recording {
  id: string; // UUID
  title: string; // User-editable SOP title
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
  steps: RecordedStep[];
  metadata: RecordingMetadata;
}

// ── Captured Event (content script → background) ───────────────────────────

export interface CapturedEvent {
  sequenceNumber: number;
  timestamp: number;
  type: StepAction;
  inputValue?: string | undefined; // Masked for password fields
  selectors: SelectorSet;
  tagName: string;
  elementType?: string | undefined;
  elementRole?: string | undefined;
  accessibleName: string;
  boundingBox: BoundingBox;
  clickCoordinates?: Coordinates | undefined;
  pageUrl: string;
  pageTitle: string;
  viewport: ViewportSize;
  scrollPosition: Coordinates;
}

// ── Session State (persisted via chrome.storage.session) ────────────────────

export interface SessionRecordingState {
  state: RecordingState;
  recordingId: string;
  tabId: number;
  steps: RecordedStep[];
}

// ── Messages: Content Script → Background ──────────────────────────────────

export type ContentMessage =
  | { type: 'STEP_CAPTURED'; payload: CapturedEvent }
  | { type: 'CONTENT_READY'; tabId: number };

// ── Messages: Background → Content Script ──────────────────────────────────

export type BackgroundToContentMessage =
  | { type: 'START_CAPTURE' }
  | { type: 'STOP_CAPTURE' }
  | { type: 'PAUSE_CAPTURE' }
  | { type: 'RESUME_CAPTURE' }
  | { type: 'SHOW_OVERLAY' }
  | { type: 'REMOVE_OVERLAY' };

// ── Messages: Panel → Background ───────────────────────────────────────────

export type PanelMessage =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'DELETE_STEP'; stepId: string }
  | { type: 'REORDER_STEPS'; stepIds: string[] }
  | { type: 'UPDATE_STEP'; stepId: string; changes: Partial<RecordedStep> }
  | { type: 'EXPORT_RECORDING'; recordingId: string; format: ExportFormat }
  | { type: 'SAVE_RECORDING' }
  | { type: 'LOAD_RECORDING'; recordingId: string }
  | { type: 'DELETE_RECORDING'; recordingId: string }
  | { type: 'LIST_RECORDINGS' }
  | { type: 'GET_STATE' };

// ── Messages: Background → Panel ───────────────────────────────────────────

export type BackgroundToPanelMessage =
  | { type: 'STATE_UPDATE'; state: RecordingState }
  | { type: 'STEP_ADDED'; step: RecordedStep }
  | { type: 'STEP_UPDATED'; step: RecordedStep }
  | { type: 'STEP_DELETED'; stepId: string }
  | { type: 'STEPS_REORDERED'; steps: RecordedStep[] }
  | { type: 'RECORDING_LIST'; recordings: RecordingMetadata[] }
  | { type: 'RECORDING_LOADED'; recording: Recording }
  | { type: 'EXPORT_READY'; blob: Blob; filename: string }
  | { type: 'ERROR'; message: string };
