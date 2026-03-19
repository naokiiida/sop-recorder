performance.mark('sw-start');
import { RecordingStateMachine } from '../core/recording-state-machine.js';
import { StepManager } from '../core/step-manager.js';
import type {
  CapturedEvent,
  ContentMessage,
  PanelMessage,
  Recording,
  SessionRecordingState,
} from '../core/types.js';
import type { PanelPort } from '../adapters/interfaces/index.js';
import { ChromeStorageAdapter } from '../adapters/chrome/storage-adapter.js';
import { IndexedDBBlobStore } from '../adapters/chrome/blob-store.js';
import {
  captureScreenshotSafe,
  generateThumbnail,
  renderStepBadge,
} from '../adapters/chrome/screenshot-adapter.js';
import { ChromeTabAdapter, isRestrictedUrl } from '../adapters/chrome/tab-adapter.js';
import { ChromeMessageBus } from '../adapters/chrome/message-bus.js';
import { ChromeAlarmAdapter } from '../adapters/chrome/alarm-adapter.js';
import { QuotaManager } from '../adapters/chrome/quota-manager.js';
import { ChromeDownloadAdapter } from '../adapters/chrome/download-adapter.js';
import { exportAsZip } from '../core/zip-exporter.js';
import { Logger } from '../core/logger.js';

// ── Instantiate adapters and core modules ───────────────────────────────────

const stateMachine = new RecordingStateMachine();
const stepManager = new StepManager();
const storageAdapter = new ChromeStorageAdapter();
const blobStore = new IndexedDBBlobStore();
const tabAdapter = new ChromeTabAdapter();
const messageBus = new ChromeMessageBus();
const alarmAdapter = new ChromeAlarmAdapter();
const quotaManager = new QuotaManager(storageAdapter, blobStore);
const downloadAdapter = new ChromeDownloadAdapter();

// Track active recording tab and panel port
let activeTabId: number | null = null;
let activePanelPort: PanelPort | null = null;
let activeRecordingId: string = '';

// Screenshot delay (ms) — wait for overlay to render before capturing
const SCREENSHOT_DELAY_MS = 200;

export default defineBackground(() => {
  console.log('SOP Recorder background service worker started.');

  // Open side panel when extension icon is clicked
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  // ── Recover state + auto-purge on startup ──────────────────────────────
  recoverState();
  quotaManager.purgeOldRecordings().catch(console.error);

  // ── Content script messages ───────────────────────────────────────────
  messageBus.onContentMessage((message: ContentMessage, tabId: number) => {
    if (message.type === 'CONTENT_READY') {
      // Content script loaded — if we're recording on this tab, start capture
      if (stateMachine.getState() === 'recording' && tabId === activeTabId) {
        tabAdapter.sendMessageToTab(tabId, { type: 'START_CAPTURE' }).catch(console.error);
      }
    } else if (message.type === 'STEP_CAPTURED') {
      handleStepCaptured(message.payload, tabId).catch(console.error);
    }
  });

  // ── Panel port connection ─────────────────────────────────────────────
  messageBus.onPanelConnect((port: PanelPort) => {
    activePanelPort = port;

    port.onMessage((message: PanelMessage) => {
      handlePanelMessage(message).catch(console.error);
    });

    port.onDisconnect(() => {
      activePanelPort = null;
    });

    // Send current state to newly connected panel
    sendStateToPanel();
  });

  // ── Keyboard shortcut ─────────────────────────────────────────────────
  browser.commands.onCommand.addListener((command) => {
    console.log('[SOP Recorder] Command received:', command);
    if (command === 'toggle-recording') {
      toggleRecording().catch((err) => console.error('[SOP Recorder] toggleRecording error:', err));
    }
  });

  // ── Tab URL change detection (for restricted page handling) ─────────
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId !== activeTabId || !changeInfo.url) return;
    if (stateMachine.getState() !== 'recording' && stateMachine.getState() !== 'paused') return;

    const url = changeInfo.url;
    if (isRestrictedUrl(url)) {
      // Navigated to restricted page mid-recording — pause
      if (stateMachine.getState() === 'recording') {
        Logger.warn('background', 'Pausing recording — navigated to restricted page', { url });
        stateMachine.pause();
        persistSessionState().catch(() => {});
        activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'paused' });
        activePanelPort?.postMessage({ type: 'PAGE_RESTRICTED', url });
      }
    } else {
      // Navigated away from restricted page — attempt re-injection and resume
      if (stateMachine.getState() === 'paused') {
        Logger.warn('background', 'Attempting re-injection after leaving restricted page', { url });
        activePanelPort?.postMessage({ type: 'PAGE_RECORDABLE' });
        tabAdapter.injectContentScript(tabId).then(() => {
          tabAdapter.sendMessageToTab(tabId, { type: 'START_CAPTURE' }).catch(() => {});
          stateMachine.resume();
          persistSessionState().catch(() => {});
          activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'recording' });
        }).catch((err) => {
          Logger.error('background', 'Re-injection failed', { originalError: err });
        });
      }
    }
  });

  // ── Keepalive alarm ───────────────────────────────────────────────────
  alarmAdapter.onAlarm(() => {
    // Just a heartbeat — prevents SW termination during recording
  });

  // ── Cold start measurement ─────────────────────────────────────────
  performance.mark('sw-ready');
  const measure = performance.measure('sw-cold-start', 'sw-start', 'sw-ready');
  console.debug(`[SOP Recorder] Service worker cold start: ${measure.duration.toFixed(1)}ms`);
});

// ── Panel Message Handler ───────────────────────────────────────────────────

async function handlePanelMessage(message: PanelMessage): Promise<void> {
  switch (message.type) {
    case 'START_RECORDING':
      await startRecording();
      break;
    case 'STOP_RECORDING':
      await stopRecording();
      break;
    case 'PAUSE_RECORDING':
      await pauseRecording();
      break;
    case 'RESUME_RECORDING':
      await resumeRecording();
      break;
    case 'GET_STATE':
      sendStateToPanel();
      break;
    case 'DELETE_STEP': {
      stepManager.deleteStep(message.stepId);
      await persistSessionState();
      activePanelPort?.postMessage({ type: 'STEP_DELETED', stepId: message.stepId });
      break;
    }
    case 'UPDATE_STEP': {
      const updated = stepManager.updateStep(message.stepId, message.changes);
      await persistSessionState();
      activePanelPort?.postMessage({ type: 'STEP_UPDATED', step: updated });
      break;
    }
    case 'REORDER_STEPS': {
      // Reorder by moving each ID to its new position
      const idOrder = message.stepIds;
      for (let i = 0; i < idOrder.length; i++) {
        const id = idOrder[i];
        if (id) stepManager.reorderStep(id, i);
      }
      await persistSessionState();
      activePanelPort?.postMessage({ type: 'STEPS_REORDERED', steps: stepManager.getSteps() });
      break;
    }
    case 'SAVE_RECORDING':
      await saveCurrentRecording();
      break;
    case 'LIST_RECORDINGS': {
      const recordings = await storageAdapter.listRecordings();
      activePanelPort?.postMessage({ type: 'RECORDING_LIST', recordings });
      break;
    }
    case 'LOAD_RECORDING': {
      const recording = await storageAdapter.getRecording(message.recordingId);
      if (recording) {
        activePanelPort?.postMessage({ type: 'RECORDING_LOADED', recording });
      } else {
        activePanelPort?.postMessage({ type: 'ERROR', message: 'Recording not found' });
      }
      break;
    }
    case 'DELETE_RECORDING': {
      await deleteRecordingWithBlobs(message.recordingId);
      const recordings = await storageAdapter.listRecordings();
      activePanelPort?.postMessage({ type: 'RECORDING_LIST', recordings });
      break;
    }
    case 'EXPORT_RECORDING': {
      try {
        const recording = await storageAdapter.getRecording(message.recordingId);
        if (!recording) {
          activePanelPort?.postMessage({ type: 'ERROR', message: 'Recording not found' });
          break;
        }
        const { blob, filename } = await exportAsZip(recording, (key) => blobStore.get(key));
        await downloadAdapter.downloadBlob(blob, filename);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Export failed';
        activePanelPort?.postMessage({ type: 'ERROR', message: errorMessage });
      }
      break;
    }
  }
}

// ── Recording Lifecycle ─────────────────────────────────────────────────────

async function startRecording(): Promise<void> {
  // Check storage quota before starting
  const quota = await quotaManager.checkQuota();
  if (quota.isFull) {
    Logger.warn('background', 'Recording blocked — storage full', { percentUsed: quota.percentUsed });
    activePanelPort?.postMessage({ type: 'QUOTA_FULL' });
    activePanelPort?.postMessage({
      type: 'ERROR',
      message: 'Storage full — export or delete old recordings to continue.',
    });
    return;
  }
  if (quota.isWarning) {
    Logger.warn('background', 'Storage quota warning', { percentUsed: quota.percentUsed });
    activePanelPort?.postMessage({ type: 'QUOTA_WARNING', percentUsed: quota.percentUsed });
    // Warning only — still allow recording
  }

  const tab = await tabAdapter.getCurrentTab();
  console.log('[SOP Recorder] startRecording — active tab:', tab);
  if (!tab) {
    console.warn('[SOP Recorder] No active tab found');
    activePanelPort?.postMessage({ type: 'ERROR', message: 'No active tab found' });
    return;
  }

  stateMachine.start();
  console.log('[SOP Recorder] Recording started on tab', tab.id, tab.url);
  activeTabId = tab.id;
  activeRecordingId = crypto.randomUUID();
  stepManager.clear();

  // Start keepalive
  alarmAdapter.createKeepalive();

  // Persist initial state
  await persistSessionState();

  // Check if starting on a restricted page
  if (isRestrictedUrl(tab.url)) {
    Logger.warn('background', 'Cannot record on restricted page', { url: tab.url });
    activePanelPort?.postMessage({ type: 'PAGE_RESTRICTED', url: tab.url });
  }

  // Inject and start content script
  try {
    await tabAdapter.injectContentScript(tab.id);
    console.log('[SOP Recorder] Content script injected');
  } catch (err) {
    // Distinguish "already injected" from real injection failure
    const errMsg = err instanceof Error ? err.message : String(err);
    if (isRestrictedUrl(tab.url)) {
      Logger.warn('background', 'Content script injection failed on restricted page', { url: tab.url });
    } else {
      Logger.warn('background', 'Content script injection skipped (may already exist)', { error: errMsg });
    }
  }

  try {
    await tabAdapter.sendMessageToTab(tab.id, { type: 'START_CAPTURE' });
    console.log('[SOP Recorder] START_CAPTURE sent to tab', tab.id);
  } catch (err) {
    console.warn('[SOP Recorder] START_CAPTURE failed (content script not ready yet):', err);
  }

  // Notify panel
  activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'recording' });
}

async function stopRecording(): Promise<void> {
  stateMachine.stop();

  // Stop content script
  if (activeTabId !== null) {
    tabAdapter.sendMessageToTab(activeTabId, { type: 'STOP_CAPTURE' }).catch(() => {});
  }

  // Clear keepalive
  alarmAdapter.clearKeepalive();

  // Notify panel
  activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'idle' });

  // Clear session state (recording is over)
  await storageAdapter.clearSessionState();
}

async function pauseRecording(): Promise<void> {
  stateMachine.pause();

  if (activeTabId !== null) {
    tabAdapter.sendMessageToTab(activeTabId, { type: 'PAUSE_CAPTURE' }).catch(() => {});
  }

  await persistSessionState();
  activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'paused' });
}

async function resumeRecording(): Promise<void> {
  stateMachine.resume();

  if (activeTabId !== null) {
    tabAdapter.sendMessageToTab(activeTabId, { type: 'RESUME_CAPTURE' }).catch(() => {});
  }

  await persistSessionState();
  activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'recording' });
}

async function toggleRecording(): Promise<void> {
  const state = stateMachine.getState();
  if (state === 'idle') {
    await startRecording();
  } else {
    await stopRecording();
  }
}

// ── Step Capture Flow ───────────────────────────────────────────────────────

async function handleStepCaptured(event: CapturedEvent, tabId: number): Promise<void> {
  console.log('[SOP Recorder] STEP_CAPTURED received:', event.type, 'from tab', tabId, 'state:', stateMachine.getState(), 'activeTab:', activeTabId);
  if (stateMachine.getState() !== 'recording') return;
  if (tabId !== activeTabId) return;
  console.log('[SOP Recorder] Processing step:', event.type, event.accessibleName);

  // 1. Tell content script to show overlay (for click events)
  if (event.type === 'click' || event.type === 'dblclick') {
    // Overlay is already applied by the content script recorder
    // Wait for it to render
    await delay(SCREENSHOT_DELAY_MS);
  }

  // 2. Capture screenshot (with latency measurement)
  const captureStart = performance.now();
  const screenshotBlob = await captureScreenshotSafe();
  let screenshotBlobKey = '';
  let thumbnailDataUrl: string | undefined;

  if (screenshotBlob) {
    const stepNumber = stepManager.getSteps().length + 1;

    // 3. Generate zoomed thumbnail from clean screenshot (before badge)
    try {
      thumbnailDataUrl = await generateThumbnail(screenshotBlob, event.clickCoordinates, event.viewport);
    } catch {
      // Thumbnail generation failed — not critical
    }

    // 4. Render step badge + click indicator on full screenshot
    const badgedBlob = await renderStepBadge(screenshotBlob, stepNumber, event.clickCoordinates, event.viewport);

    // 5. Store screenshot blob
    screenshotBlobKey = `${activeRecordingId}_step_${stepNumber}`;
    await blobStore.put(screenshotBlobKey, badgedBlob);

    const captureLatency = performance.now() - captureStart;
    console.debug(`[SOP Recorder] Screenshot capture latency: ${captureLatency.toFixed(1)}ms (target: <300ms)`);
  }

  // 6. Remove overlay
  if (event.type === 'click' || event.type === 'dblclick') {
    tabAdapter.sendMessageToTab(tabId, { type: 'REMOVE_OVERLAY' }).catch(() => {});
  }

  // 7. Create step via StepManager
  const step = stepManager.addStep(event, screenshotBlobKey, thumbnailDataUrl);

  // 8. Persist to session storage
  await persistSessionState();

  // 9. Notify panel
  activePanelPort?.postMessage({ type: 'STEP_ADDED', step });

  // 10. Notify panel if screenshot was unavailable
  if (!screenshotBlob) {
    Logger.warn('background', 'Screenshot unavailable for step', { stepId: step.id, tabId });
    activePanelPort?.postMessage({ type: 'SCREENSHOT_UNAVAILABLE', stepId: step.id });
  }

  // 11. Check quota after storing screenshot blob
  if (screenshotBlobKey) {
    try {
      const postQuota = await quotaManager.checkQuota();
      if (postQuota.isWarning) {
        activePanelPort?.postMessage({ type: 'QUOTA_WARNING', percentUsed: postQuota.percentUsed });
      }
    } catch (err) {
      Logger.error('background', 'Quota check after step failed', { originalError: err });
    }
  }
}

// ── Persistence ─────────────────────────────────────────────────────────────

async function persistSessionState(): Promise<void> {
  const sessionState: SessionRecordingState = {
    state: stateMachine.getState(),
    recordingId: activeRecordingId,
    tabId: activeTabId ?? -1,
    steps: stepManager.getSteps(),
  };
  await storageAdapter.setSessionState(sessionState);
}

async function saveCurrentRecording(): Promise<void> {
  const steps = stepManager.getSteps();
  if (steps.length === 0) return;

  const firstStep = steps[0];
  const recording: Recording = {
    id: activeRecordingId,
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

  await storageAdapter.saveRecording(recording);
  activePanelPort?.postMessage({ type: 'RECORDING_LOADED', recording });
  activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: 'idle' });
}

// ── State Recovery ──────────────────────────────────────────────────────────

async function recoverState(): Promise<void> {
  try {
    const session = await storageAdapter.getSessionState();
    if (!session || session.state === 'idle') return;

    // Recover state machine
    stateMachine.recover(session.state);
    activeRecordingId = session.recordingId;
    activeTabId = session.tabId;

    // Recover steps
    stepManager.loadSteps(session.steps);

    // Restart keepalive if recording
    if (session.state === 'recording') {
      alarmAdapter.createKeepalive();
    }

    Logger.warn('background', 'State recovered', { state: session.state, stepCount: session.steps.length });

    // Notify connected panel with full state sync
    sendStateToPanel();
  } catch (err) {
    Logger.error('background', 'State recovery failed', { originalError: err });
  }
}

// ── Cleanup Helpers ─────────────────────────────────────────────────────────

async function deleteRecordingWithBlobs(recordingId: string): Promise<void> {
  const recording = await storageAdapter.getRecording(recordingId);
  if (recording) {
    // Delete associated screenshot blobs
    const blobKeys = recording.steps
      .map((s) => s.screenshotBlobKey)
      .filter((k) => k.length > 0);
    if (blobKeys.length > 0) {
      await blobStore.deleteMany(blobKeys);
    }
  }
  await storageAdapter.deleteRecording(recordingId);
}

function sendStateToPanel(): void {
  activePanelPort?.postMessage({ type: 'STATE_UPDATE', state: stateMachine.getState() });
  // Also send current steps if recording
  if (stateMachine.getState() !== 'idle') {
    const steps = stepManager.getSteps();
    activePanelPort?.postMessage({ type: 'STEPS_REORDERED', steps });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
