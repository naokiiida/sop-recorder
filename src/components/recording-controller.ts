import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type {
  BackgroundToPanelMessage,
  ExportFormat,
  PanelMessage,
  RecordedStep,
  Recording,
  RecordingMetadata,
  RecordingState,
  ViewState,
} from '../core/types.js';

/**
 * Lit ReactiveController that maintains a port connection to the background
 * service worker and synchronizes recording state for reactive UI updates.
 */
export class RecordingController implements ReactiveController {
  private host: ReactiveControllerHost;
  private port: Browser.runtime.Port | null = null;

  // ── Reactive state ──────────────────────────────────────────────────────

  /** Current recording state from background */
  recordingState: RecordingState = 'idle';

  /** Current view for routing */
  viewState: ViewState = 'home';

  /** Steps for the current recording session */
  steps: RecordedStep[] = [];

  /** Saved recording list */
  recordings: RecordingMetadata[] = [];

  /** Currently loaded recording for editing */
  loadedRecording: Recording | null = null;

  /** Last error message */
  error: string | null = null;

  /** Whether we're reconnecting to the background */
  reconnecting = false;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  hostConnected(): void {
    this.connect();
  }

  hostDisconnected(): void {
    this.disconnect();
  }

  // ── Port Connection ─────────────────────────────────────────────────────

  private connect(): void {
    try {
      this.port = browser.runtime.connect({ name: 'sidepanel' });

      this.port.onMessage.addListener((msg: BackgroundToPanelMessage) => {
        try {
          this.handleMessage(msg);
        } catch (err) {
          console.error('[SOP Recorder] Error handling message:', err);
        }
      });

      this.port.onDisconnect.addListener(() => {
        this.port = null;
        this.reconnecting = true;
        this.host.requestUpdate();
        // Attempt reconnect after a short delay
        setTimeout(() => {
          if (!this.port) this.connect();
        }, 1000);
      });

      // Clear reconnecting state
      if (this.reconnecting) {
        this.reconnecting = false;
        this.host.requestUpdate();
      }

      // Request initial state (also serves as full state sync after reconnect)
      this.send({ type: 'GET_STATE' });
      this.send({ type: 'LIST_RECORDINGS' });
    } catch (err) {
      console.error('[SOP Recorder] Port connection failed:', err);
    }
  }

  private disconnect(): void {
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }

  private send(message: PanelMessage): void {
    if (this.port) {
      this.port.postMessage(message);
    }
  }

  // ── Message Handler ─────────────────────────────────────────────────────

  private handleMessage(msg: BackgroundToPanelMessage): void {
    switch (msg.type) {
      case 'STATE_UPDATE':
        this.recordingState = msg.state;
        this.updateViewFromRecordingState(msg.state);
        break;

      case 'STEP_ADDED':
        this.steps = [...this.steps, msg.step];
        break;

      case 'STEP_UPDATED':
        this.steps = this.steps.map((s) => (s.id === msg.step.id ? msg.step : s));
        break;

      case 'STEP_DELETED':
        this.steps = this.steps.filter((s) => s.id !== msg.stepId);
        break;

      case 'STEPS_REORDERED':
        this.steps = msg.steps;
        break;

      case 'RECORDING_LIST':
        this.recordings = msg.recordings;
        break;

      case 'RECORDING_LOADED':
        this.loadedRecording = msg.recording;
        this.steps = msg.recording.steps;
        this.viewState = 'edit';
        break;

      case 'SCREENSHOT_UNAVAILABLE':
        // Transient warning — step was recorded but screenshot failed
        this.error = 'Screenshot unavailable for this step';
        setTimeout(() => {
          this.error = null;
          this.host.requestUpdate();
        }, 3000);
        break;

      case 'QUOTA_WARNING':
        this.error = `Storage is ${Math.round(msg.percentUsed * 100)}% full. Export or delete old recordings to free space.`;
        // Persistent — no auto-clear for quota warnings
        break;

      case 'QUOTA_FULL':
        this.error = 'Storage full — export or delete old recordings to continue.';
        break;

      case 'PAGE_RESTRICTED':
        this.error = 'Cannot record on this page';
        break;

      case 'PAGE_RECORDABLE':
        if (this.error === 'Cannot record on this page') {
          this.error = null;
        }
        break;

      case 'EXPORT_READY':
        // Will be handled in Sprint 6
        break;

      case 'ERROR':
        this.error = msg.message;
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          this.error = null;
          this.host.requestUpdate();
        }, 5000);
        break;
    }

    this.host.requestUpdate();
  }

  private updateViewFromRecordingState(state: RecordingState): void {
    if (state === 'recording' || state === 'paused') {
      this.viewState = 'recording';
    } else if (state === 'idle' && this.viewState === 'recording') {
      // Recording just stopped — go to edit if we have steps
      if (this.steps.length > 0) {
        this.viewState = 'edit';
      } else {
        this.viewState = 'home';
      }
    }
  }

  // ── Public Methods (commands to background) ─────────────────────────────

  startRecording(): void {
    this.send({ type: 'START_RECORDING' });
  }

  stopRecording(): void {
    this.send({ type: 'STOP_RECORDING' });
  }

  pauseRecording(): void {
    this.send({ type: 'PAUSE_RECORDING' });
  }

  resumeRecording(): void {
    this.send({ type: 'RESUME_RECORDING' });
  }

  saveRecording(): void {
    this.send({ type: 'SAVE_RECORDING' });
  }

  deleteStep(stepId: string): void {
    this.send({ type: 'DELETE_STEP', stepId });
  }

  updateStep(stepId: string, changes: Partial<RecordedStep>): void {
    this.send({ type: 'UPDATE_STEP', stepId, changes });
  }

  reorderSteps(stepIds: string[]): void {
    this.send({ type: 'REORDER_STEPS', stepIds });
  }

  loadRecording(recordingId: string): void {
    this.send({ type: 'LOAD_RECORDING', recordingId });
  }

  deleteRecording(recordingId: string): void {
    this.send({ type: 'DELETE_RECORDING', recordingId });
  }

  listRecordings(): void {
    this.send({ type: 'LIST_RECORDINGS' });
  }

  exportRecording(recordingId: string, format: ExportFormat = 'markdown-zip'): void {
    this.send({ type: 'EXPORT_RECORDING', recordingId, format });
  }

  // ── View Navigation ─────────────────────────────────────────────────────

  navigateTo(view: ViewState): void {
    this.viewState = view;
    this.host.requestUpdate();
  }
}
