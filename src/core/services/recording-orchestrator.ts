import { RecordingStateMachine } from '../recording-state-machine.js';
import { StepManager } from '../step-manager.js';
import type {
  CapturedEvent,
  RecordedStep,
  Recording,
  RecordingState,
  SessionRecordingState,
} from '../types.js';
import type {
  IAlarmAdapter,
  IBlobStore,
  IStorageAdapter,
  ITabAdapter,
} from '../../adapters/interfaces/index.js';
import { QuotaManager } from '../../adapters/chrome/quota-manager.js';
import {
  captureScreenshotSafe,
  generateThumbnail,
  renderStepBadge,
} from '../../adapters/chrome/screenshot-adapter.js';
import { isRestrictedUrl } from '../../adapters/chrome/tab-adapter.js';
import { Logger } from '../logger.js';

// Screenshot delay (ms) — wait for overlay to render before capturing
const SCREENSHOT_DELAY_MS = 200;

/**
 * Orchestrator responsible for the recording lifecycle and step capture flow.
 */
export class RecordingOrchestrator {
  private stateMachine: RecordingStateMachine;
  private stepManager: StepManager;
  private storageAdapter: IStorageAdapter;
  private blobStore: IBlobStore;
  private tabAdapter: ITabAdapter;
  private alarmAdapter: IAlarmAdapter;
  private quotaManager: QuotaManager;

  private activeTabId: number | null = null;
  private activeRecordingId: string = '';

  constructor(
    stateMachine: RecordingStateMachine,
    stepManager: StepManager,
    storageAdapter: IStorageAdapter,
    blobStore: IBlobStore,
    tabAdapter: ITabAdapter,
    alarmAdapter: IAlarmAdapter,
    quotaManager: QuotaManager,
  ) {
    this.stateMachine = stateMachine;
    this.stepManager = stepManager;
    this.storageAdapter = storageAdapter;
    this.blobStore = blobStore;
    this.tabAdapter = tabAdapter;
    this.alarmAdapter = alarmAdapter;
    this.quotaManager = quotaManager;
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getState(): RecordingState {
    return this.stateMachine.getState();
  }

  getActiveTabId(): number | null {
    return this.activeTabId;
  }

  getActiveRecordingId(): string {
    return this.activeRecordingId;
  }

  getSteps(): RecordedStep[] {
    return this.stepManager.getSteps();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    const quota = await this.quotaManager.checkQuota();
    if (quota.isFull) {
      Logger.warn('RecordingOrchestrator', 'Recording blocked — storage full', {
        percentUsed: quota.percentUsed,
      });
      throw new Error('QUOTA_FULL');
    }

    const tab = await this.tabAdapter.getCurrentTab();
    if (!tab) {
      Logger.warn('RecordingOrchestrator', 'No active tab found');
      throw new Error('NO_ACTIVE_TAB');
    }

    this.stateMachine.start();
    this.activeTabId = tab.id;
    this.activeRecordingId = crypto.randomUUID();
    this.stepManager.clear();

    this.alarmAdapter.createKeepalive();
    await this.persistSessionState();

    if (isRestrictedUrl(tab.url)) {
      Logger.warn('RecordingOrchestrator', 'Started on restricted page', { url: tab.url });
    }

    try {
      await this.tabAdapter.injectContentScript(tab.id);
      await this.tabAdapter.sendMessageToTab(tab.id, { type: 'START_CAPTURE' });
    } catch (err) {
      Logger.warn('RecordingOrchestrator', 'Initial injection/capture signal failed', {
        error: String(err),
      });
    }

    Logger.info('RecordingOrchestrator', 'Recording started', {
      tabId: tab.id,
      recordingId: this.activeRecordingId,
    });
  }

  async stop(): Promise<void> {
    this.stateMachine.stop();

    if (this.activeTabId !== null) {
      this.tabAdapter.sendMessageToTab(this.activeTabId, { type: 'STOP_CAPTURE' }).catch(() => {});
    }

    this.alarmAdapter.clearKeepalive();
    await this.storageAdapter.clearSessionState();
    Logger.info('RecordingOrchestrator', 'Recording stopped');
  }

  async pause(): Promise<void> {
    this.stateMachine.pause();

    if (this.activeTabId !== null) {
      this.tabAdapter.sendMessageToTab(this.activeTabId, { type: 'PAUSE_CAPTURE' }).catch(() => {});
    }

    await this.persistSessionState();
    Logger.info('RecordingOrchestrator', 'Recording paused');
  }

  async resume(): Promise<void> {
    this.stateMachine.resume();

    if (this.activeTabId !== null) {
      this.tabAdapter.sendMessageToTab(this.activeTabId, { type: 'RESUME_CAPTURE' }).catch(() => {});
    }

    await this.persistSessionState();
    Logger.info('RecordingOrchestrator', 'Recording resumed');
  }

  async toggle(): Promise<void> {
    const state = this.getState();
    if (state === 'idle') {
      await this.start();
    } else {
      await this.stop();
    }
  }

  // ── Step Capture ──────────────────────────────────────────────────────────

  async handleStepCaptured(event: CapturedEvent, tabId: number): Promise<RecordedStep | null> {
    if (this.getState() !== 'recording') return null;
    if (tabId !== this.activeTabId) return null;

    // 1. Delay for overlay (if applicable)
    if (event.type === 'click' || event.type === 'dblclick') {
      await new Promise((resolve) => setTimeout(resolve, SCREENSHOT_DELAY_MS));
    }

    // 2. Capture screenshot
    const captureStart = performance.now();
    const screenshotBlob = await captureScreenshotSafe();
    let screenshotBlobKey = '';
    let thumbnailDataUrl: string | undefined;

    if (screenshotBlob) {
      const stepNumber = this.stepManager.getSteps().length + 1;

      // 3. Generate zoomed thumbnail
      try {
        thumbnailDataUrl = await generateThumbnail(
          screenshotBlob,
          event.clickCoordinates,
          event.viewport,
        );
      } catch (err) {
        Logger.error('RecordingOrchestrator', 'Thumbnail generation failed', {
          error: String(err),
        });
      }

      // 4. Render step badge
      const badgedBlob = await renderStepBadge(
        screenshotBlob,
        stepNumber,
        event.clickCoordinates,
        event.viewport,
      );

      // 5. Store screenshot blob
      screenshotBlobKey = `${this.activeRecordingId}_step_${stepNumber}`;
      await this.blobStore.put(screenshotBlobKey, badgedBlob);

      const captureLatency = performance.now() - captureStart;
      Logger.debug('RecordingOrchestrator', `Screenshot pipeline: ${captureLatency.toFixed(1)}ms`);
    }

    // 6. Remove overlay
    if (event.type === 'click' || event.type === 'dblclick') {
      this.tabAdapter.sendMessageToTab(tabId, { type: 'REMOVE_OVERLAY' }).catch(() => {});
    }

    // 7. Create step
    const step = this.stepManager.addStep(event, screenshotBlobKey, thumbnailDataUrl);

    // 8. Persist
    await this.persistSessionState();

    return step;
  }

  /**
   * Finalize and save the current recording.
   */
  async saveCurrentRecording(): Promise<Recording> {
    const steps = this.stepManager.getSteps();
    if (steps.length === 0) {
      throw new Error('No steps recorded');
    }

    const firstStep = steps[0];
    const recording: Recording = {
      id: this.activeRecordingId,
      title: firstStep ? `SOP - ${firstStep.pageTitle}` : 'Untitled SOP',
      createdAt: firstStep?.timestamp ?? Date.now(),
      updatedAt: Date.now(),
      steps,
      metadata: {
        startUrl: firstStep?.pageUrl ?? '',
        startPageTitle: firstStep?.pageTitle ?? '',
        browserVersion: navigator.userAgent,
        stepCount: steps.length,
      },
    };

    await this.storageAdapter.saveRecording(recording);
    Logger.info('RecordingOrchestrator', 'Recording saved', { id: recording.id });
    return recording;
  }

  // ── Step Management (Proxied to StepManager) ──────────────────────────────

  async deleteStep(stepId: string): Promise<void> {
    this.stepManager.deleteStep(stepId);
    await this.persistSessionState();
  }

  async updateStep(stepId: string, changes: Partial<RecordedStep>): Promise<RecordedStep> {
    const updated = this.stepManager.updateStep(stepId, changes);
    await this.persistSessionState();
    return updated;
  }

  async reorderSteps(stepIds: string[]): Promise<RecordedStep[]> {
    for (let i = 0; i < stepIds.length; i++) {
      const id = stepIds[i];
      if (id) this.stepManager.reorderStep(id, i);
    }
    await this.persistSessionState();
    return this.stepManager.getSteps();
  }

  // ── Persistence & Recovery ────────────────────────────────────────────────

  async persistSessionState(): Promise<void> {
    const sessionState: SessionRecordingState = {
      state: this.getState(),
      recordingId: this.activeRecordingId,
      tabId: this.activeTabId ?? -1,
      steps: this.stepManager.getSteps(),
    };
    await this.storageAdapter.setSessionState(sessionState);
  }

  async recoverState(): Promise<boolean> {
    try {
      const session = await this.storageAdapter.getSessionState();
      if (!session || session.state === 'idle') return false;

      this.stateMachine.recover(session.state);
      this.activeRecordingId = session.recordingId;
      this.activeTabId = session.tabId;
      this.stepManager.loadSteps(session.steps);

      if (session.state === 'recording') {
        this.alarmAdapter.createKeepalive();
      }

      Logger.info('RecordingOrchestrator', 'State recovered', {
        state: session.state,
        stepCount: session.steps.length,
      });
      return true;
    } catch (err) {
      Logger.error('RecordingOrchestrator', 'State recovery failed', { error: String(err) });
      return false;
    }
  }
}
