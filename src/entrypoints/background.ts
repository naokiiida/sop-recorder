performance.mark('sw-start');
import { RecordingStateMachine } from '../core/recording-state-machine.js';
import { StepManager } from '../core/step-manager.js';
import type {
  ContentMessage,
  PanelMessage,
} from '../core/types.js';
import { ChromeStorageAdapter } from '../adapters/chrome/storage-adapter.js';
import { IndexedDBBlobStore } from '../adapters/chrome/blob-store.js';
import { ChromeTabAdapter, isRestrictedUrl } from '../adapters/chrome/tab-adapter.js';
import { ChromeMessageBus } from '../adapters/chrome/message-bus.js';
import { ChromeAlarmAdapter } from '../adapters/chrome/alarm-adapter.js';
import { QuotaManager } from '../adapters/chrome/quota-manager.js';
import { ChromeDownloadAdapter } from '../adapters/chrome/download-adapter.js';
import { Logger } from '../core/logger.js';

import { MessagingService } from '../core/services/messaging-service.js';
import { StorageOrchestrator } from '../core/services/storage-orchestrator.js';
import { RecordingOrchestrator } from '../core/services/recording-orchestrator.js';

// ── Instantiate adapters and services ───────────────────────────────────────

const storageAdapter = new ChromeStorageAdapter();
const blobStore = new IndexedDBBlobStore();
const tabAdapter = new ChromeTabAdapter();
const messageBus = new ChromeMessageBus();
const alarmAdapter = new ChromeAlarmAdapter();
const quotaManager = new QuotaManager(storageAdapter, blobStore);
const downloadAdapter = new ChromeDownloadAdapter();

const stateMachine = new RecordingStateMachine();
const stepManager = new StepManager();

const messagingService = new MessagingService(messageBus);
const storageOrchestrator = new StorageOrchestrator(storageAdapter, blobStore, downloadAdapter);
const recordingOrchestrator = new RecordingOrchestrator(
  stateMachine,
  stepManager,
  storageAdapter,
  blobStore,
  tabAdapter,
  alarmAdapter,
  quotaManager,
);

export default defineBackground(() => {
  Logger.info('background', 'Service worker started');

  // Open side panel when extension icon is clicked
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    Logger.error('background', 'Failed to set panel behavior', { error: String(err) });
  });

  // ── Initialization ────────────────────────────────────────────────────────
  recordingOrchestrator.recoverState().catch((err) => {
    Logger.error('background', 'State recovery failed', { error: String(err) });
  });
  quotaManager.purgeOldRecordings().catch((err) => {
    Logger.error('background', 'Quota purge failed', { error: String(err) });
  });

  // ── Messaging ─────────────────────────────────────────────────────────────
  messagingService.listen(handlePanelMessage, () => {
    syncStateToPanel();
  });

  messageBus.onContentMessage((message: ContentMessage, tabId: number) => {
    if (message.type === 'CONTENT_READY') {
      if (
        recordingOrchestrator.getState() === 'recording' &&
        tabId === recordingOrchestrator.getActiveTabId()
      ) {
        tabAdapter.sendMessageToTab(tabId, { type: 'START_CAPTURE' }).catch(() => {});
      }
    } else if (message.type === 'STEP_CAPTURED') {
      recordingOrchestrator
        .handleStepCaptured(message.payload, tabId)
        .then((step) => {
          if (step) {
            messagingService.postMessage({ type: 'STEP_ADDED', step });
          }
        })
        .catch((err) => {
          Logger.error('background', 'Step capture failed', { error: String(err) });
        });
    }
  });

  // ── Browser Events ────────────────────────────────────────────────────────
  browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-recording') {
      recordingOrchestrator
        .toggle()
        .then(() => syncStateToPanel())
        .catch((err) => {
          Logger.error('background', 'Toggle recording failed', { error: String(err) });
        });
    }
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId !== recordingOrchestrator.getActiveTabId() || !changeInfo.url) return;
    const state = recordingOrchestrator.getState();
    if (state !== 'recording' && state !== 'paused') return;

    const url = changeInfo.url;
    if (isRestrictedUrl(url)) {
      if (state === 'recording') {
        Logger.info('background', 'Pausing recording — navigated to restricted page', { url });
        recordingOrchestrator.pause().then(() => {
          messagingService.postMessage({ type: 'STATE_UPDATE', state: 'paused' });
          messagingService.postMessage({ type: 'PAGE_RESTRICTED', url });
        });
      }
    } else if (state === 'paused') {
      Logger.info('background', 'Attempting re-injection after leaving restricted page', { url });
      messagingService.postMessage({ type: 'PAGE_RECORDABLE' });
      tabAdapter
        .injectContentScript(tabId)
        .then(() => {
          tabAdapter.sendMessageToTab(tabId, { type: 'START_CAPTURE' }).catch(() => {});
          return recordingOrchestrator.resume();
        })
        .then(() => {
          messagingService.postMessage({ type: 'STATE_UPDATE', state: 'recording' });
        })
        .catch((err) => {
          Logger.error('background', 'Re-injection/Resume failed', { error: String(err) });
        });
    }
  });

  alarmAdapter.onAlarm(() => {
    // Keepalive heartbeat
  });

  // Cold start measurement
  performance.mark('sw-ready');
  const measure = performance.measure('sw-cold-start', 'sw-start', 'sw-ready');
  Logger.debug('background', `Service worker cold start: ${measure.duration.toFixed(1)}ms`);
});

// ── Panel Message Handler ───────────────────────────────────────────────────

async function handlePanelMessage(message: PanelMessage): Promise<void> {
  try {
    switch (message.type) {
      case 'START_RECORDING':
        await recordingOrchestrator.start();
        syncStateToPanel();
        break;
      case 'STOP_RECORDING':
        await recordingOrchestrator.stop();
        syncStateToPanel();
        break;
      case 'PAUSE_RECORDING':
        await recordingOrchestrator.pause();
        syncStateToPanel();
        break;
      case 'RESUME_RECORDING':
        await recordingOrchestrator.resume();
        syncStateToPanel();
        break;
      case 'GET_STATE':
        syncStateToPanel();
        break;
      case 'DELETE_STEP': {
        await recordingOrchestrator.deleteStep(message.stepId);
        messagingService.postMessage({ type: 'STEP_DELETED', stepId: message.stepId });
        break;
      }
      case 'UPDATE_STEP': {
        const updated = await recordingOrchestrator.updateStep(message.stepId, message.changes);
        messagingService.postMessage({ type: 'STEP_UPDATED', step: updated });
        break;
      }
      case 'REORDER_STEPS': {
        const steps = await recordingOrchestrator.reorderSteps(message.stepIds);
        messagingService.postMessage({ type: 'STEPS_REORDERED', steps });
        break;
      }
      case 'SAVE_RECORDING': {
        const recording = await recordingOrchestrator.saveCurrentRecording();
        messagingService.postMessage({ type: 'RECORDING_LOADED', recording });
        messagingService.postMessage({ type: 'STATE_UPDATE', state: 'idle' });
        break;
      }
      case 'LIST_RECORDINGS': {
        const recordings = await storageOrchestrator.listRecordings();
        messagingService.postMessage({ type: 'RECORDING_LIST', recordings });
        break;
      }
      case 'LOAD_RECORDING': {
        const recording = await storageOrchestrator.getRecording(message.recordingId);
        if (recording) {
          messagingService.postMessage({ type: 'RECORDING_LOADED', recording });
        } else {
          messagingService.postMessage({ type: 'ERROR', message: 'Recording not found' });
        }
        break;
      }
      case 'DELETE_RECORDING': {
        await storageOrchestrator.deleteRecording(message.recordingId);
        const recordings = await storageOrchestrator.listRecordings();
        messagingService.postMessage({ type: 'RECORDING_LIST', recordings });
        break;
      }
      case 'EXPORT_RECORDING': {
        await storageOrchestrator.exportRecording(message.recordingId);
        break;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage === 'QUOTA_FULL') {
      messagingService.postMessage({ type: 'QUOTA_FULL' });
      messagingService.postMessage({
        type: 'ERROR',
        message: 'Storage full — export or delete old recordings to continue.',
      });
    } else {
      messagingService.postMessage({ type: 'ERROR', message: errorMessage });
    }
  }
}

function syncStateToPanel(): void {
  messagingService.postMessage({ type: 'STATE_UPDATE', state: recordingOrchestrator.getState() });
  if (recordingOrchestrator.getState() !== 'idle') {
    messagingService.postMessage({
      type: 'STEPS_REORDERED',
      steps: recordingOrchestrator.getSteps(),
    });
  }
}
