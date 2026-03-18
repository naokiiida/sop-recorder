import { describe, expect, it } from 'vitest';
import type {
  BackgroundToContentMessage,
  BackgroundToPanelMessage,
  BoundingBox,
  CapturedEvent,
  ContentMessage,
  Coordinates,
  ExportFormat,
  PanelMessage,
  RecordedStep,
  Recording,
  RecordingMetadata,
  RecordingState,
  SelectorSet,
  SessionRecordingState,
  StepAction,
  ViewportSize,
  ViewState,
} from '../../../src/core/types.js';
import type {
  IAlarmAdapter,
  IBlobStore,
  IDownloadAdapter,
  IMessageBus,
  IScreenshotCapture,
  IStorageAdapter,
  ITabAdapter,
  PanelPort,
} from '../../../src/adapters/interfaces/index.js';

// Helper to assert a value matches a type at compile time.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertType<T>(_value: T): void {
  // compile-time only
}

describe('Core types compile correctly', () => {
  it('StepAction covers all expected actions', () => {
    const actions: StepAction[] = [
      'click',
      'dblclick',
      'input',
      'select',
      'check',
      'navigate',
      'scroll',
      'submit',
      'keypress',
    ];
    expect(actions).toHaveLength(9);
  });

  it('SelectorSet accepts required and optional fields', () => {
    const minimal: SelectorSet = { css: '#btn' };
    const full: SelectorSet = {
      css: '#btn',
      xpath: '//button',
      aria: 'Submit',
      textContent: 'Submit',
    };
    assertType<SelectorSet>(minimal);
    assertType<SelectorSet>(full);
    expect(minimal.css).toBe('#btn');
    expect(full.xpath).toBe('//button');
  });

  it('BoundingBox has x, y, width, height', () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 50 };
    assertType<BoundingBox>(box);
    expect(box.width).toBe(100);
  });

  it('Coordinates has x, y', () => {
    const coords: Coordinates = { x: 5, y: 10 };
    assertType<Coordinates>(coords);
    expect(coords.x).toBe(5);
  });

  it('ViewportSize has width, height', () => {
    const vp: ViewportSize = { width: 1920, height: 1080 };
    assertType<ViewportSize>(vp);
    expect(vp.width).toBe(1920);
  });

  it('RecordingState covers all states', () => {
    const states: RecordingState[] = ['idle', 'recording', 'paused'];
    expect(states).toHaveLength(3);
  });

  it('ViewState covers all states', () => {
    const states: ViewState[] = ['home', 'recording', 'edit'];
    expect(states).toHaveLength(3);
  });

  it('ExportFormat covers markdown-zip', () => {
    const format: ExportFormat = 'markdown-zip';
    assertType<ExportFormat>(format);
    expect(format).toBe('markdown-zip');
  });

  it('RecordedStep conforms to PRD section 8.4', () => {
    const step: RecordedStep = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      sequenceNumber: 1,
      timestamp: Date.now(),
      type: 'click',
      selectors: { css: '#submit-btn' },
      tagName: 'BUTTON',
      accessibleName: 'Submit',
      boundingBox: { x: 100, y: 200, width: 80, height: 32 },
      pageUrl: 'https://example.com/form',
      pageTitle: 'Example Form',
      viewport: { width: 1280, height: 720 },
      scrollPosition: { x: 0, y: 0 },
      title: 'Click Submit',
      description: '',
      screenshotBlobKey: 'blob-key-1',
    };
    assertType<RecordedStep>(step);
    expect(step.id).toBeTruthy();
  });

  it('RecordedStep accepts all optional fields', () => {
    const step: RecordedStep = {
      id: 'uuid',
      sequenceNumber: 2,
      timestamp: Date.now(),
      type: 'input',
      inputValue: 'hello',
      selectors: {
        css: 'input#name',
        xpath: '//input[@id="name"]',
        aria: 'Name',
        textContent: 'Name',
      },
      tagName: 'INPUT',
      elementType: 'text',
      elementRole: 'textbox',
      accessibleName: 'Name',
      boundingBox: { x: 0, y: 0, width: 200, height: 30 },
      clickCoordinates: { x: 100, y: 15 },
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      viewport: { width: 1920, height: 1080 },
      scrollPosition: { x: 0, y: 100 },
      title: 'Type name',
      description: 'Enter your name in the field',
      screenshotBlobKey: 'blob-key-2',
      thumbnailDataUrl: 'data:image/png;base64,abc',
    };
    assertType<RecordedStep>(step);
    expect(step.inputValue).toBe('hello');
    expect(step.thumbnailDataUrl).toBeTruthy();
  });

  it('RecordingMetadata has expected fields', () => {
    const meta: RecordingMetadata = {
      startUrl: 'https://example.com',
      startPageTitle: 'Example',
      browserVersion: '130.0.0.0',
      stepCount: 5,
    };
    assertType<RecordingMetadata>(meta);
    expect(meta.stepCount).toBe(5);
  });

  it('Recording contains steps and metadata', () => {
    const recording: Recording = {
      id: 'rec-1',
      title: 'My SOP',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
      metadata: {
        startUrl: 'https://example.com',
        startPageTitle: 'Example',
        browserVersion: '130.0.0.0',
        stepCount: 0,
      },
    };
    assertType<Recording>(recording);
    expect(recording.title).toBe('My SOP');
  });

  it('CapturedEvent has all required fields', () => {
    const event: CapturedEvent = {
      sequenceNumber: 1,
      timestamp: Date.now(),
      type: 'click',
      selectors: { css: 'button.primary' },
      tagName: 'BUTTON',
      accessibleName: 'Save',
      boundingBox: { x: 0, y: 0, width: 100, height: 40 },
      pageUrl: 'https://example.com',
      pageTitle: 'Example',
      viewport: { width: 1280, height: 720 },
      scrollPosition: { x: 0, y: 0 },
    };
    assertType<CapturedEvent>(event);
    expect(event.type).toBe('click');
  });

  it('SessionRecordingState has required fields', () => {
    const session: SessionRecordingState = {
      state: 'recording',
      recordingId: 'rec-1',
      tabId: 42,
      steps: [],
    };
    assertType<SessionRecordingState>(session);
    expect(session.state).toBe('recording');
  });
});

describe('Message types use discriminated unions', () => {
  it('ContentMessage discriminates on type field', () => {
    const captured: ContentMessage = {
      type: 'STEP_CAPTURED',
      payload: {
        sequenceNumber: 1,
        timestamp: Date.now(),
        type: 'click',
        selectors: { css: '#btn' },
        tagName: 'BUTTON',
        accessibleName: 'Submit',
        boundingBox: { x: 0, y: 0, width: 100, height: 40 },
        pageUrl: 'https://example.com',
        pageTitle: 'Example',
        viewport: { width: 1280, height: 720 },
        scrollPosition: { x: 0, y: 0 },
      },
    };
    const ready: ContentMessage = { type: 'CONTENT_READY', tabId: 1 };
    assertType<ContentMessage>(captured);
    assertType<ContentMessage>(ready);
    expect(captured.type).toBe('STEP_CAPTURED');
    expect(ready.type).toBe('CONTENT_READY');
  });

  it('BackgroundToContentMessage discriminates on type field', () => {
    const msgs: BackgroundToContentMessage[] = [
      { type: 'START_CAPTURE' },
      { type: 'STOP_CAPTURE' },
      { type: 'PAUSE_CAPTURE' },
      { type: 'RESUME_CAPTURE' },
      { type: 'SHOW_OVERLAY' },
      { type: 'REMOVE_OVERLAY' },
    ];
    expect(msgs).toHaveLength(6);
  });

  it('PanelMessage discriminates on type field', () => {
    const msgs: PanelMessage[] = [
      { type: 'START_RECORDING' },
      { type: 'STOP_RECORDING' },
      { type: 'PAUSE_RECORDING' },
      { type: 'RESUME_RECORDING' },
      { type: 'DELETE_STEP', stepId: 's1' },
      { type: 'REORDER_STEPS', stepIds: ['s1', 's2'] },
      {
        type: 'UPDATE_STEP',
        stepId: 's1',
        changes: { title: 'Updated' },
      },
      {
        type: 'EXPORT_RECORDING',
        recordingId: 'r1',
        format: 'markdown-zip',
      },
      { type: 'SAVE_RECORDING' },
      { type: 'LOAD_RECORDING', recordingId: 'r1' },
      { type: 'DELETE_RECORDING', recordingId: 'r1' },
      { type: 'LIST_RECORDINGS' },
      { type: 'GET_STATE' },
    ];
    expect(msgs).toHaveLength(13);
  });

  it('BackgroundToPanelMessage discriminates on type field', () => {
    const msgs: BackgroundToPanelMessage[] = [
      { type: 'STATE_UPDATE', state: 'idle' },
      {
        type: 'STEP_ADDED',
        step: {
          id: 's1',
          sequenceNumber: 1,
          timestamp: Date.now(),
          type: 'click',
          selectors: { css: '#btn' },
          tagName: 'BUTTON',
          accessibleName: 'OK',
          boundingBox: { x: 0, y: 0, width: 80, height: 30 },
          pageUrl: 'https://example.com',
          pageTitle: 'Example',
          viewport: { width: 1280, height: 720 },
          scrollPosition: { x: 0, y: 0 },
          title: 'Click OK',
          description: '',
          screenshotBlobKey: 'key-1',
        },
      },
      { type: 'STEP_DELETED', stepId: 's1' },
      { type: 'STEPS_REORDERED', steps: [] },
      { type: 'RECORDING_LIST', recordings: [] },
      {
        type: 'RECORDING_LOADED',
        recording: {
          id: 'r1',
          title: 'Test',
          createdAt: 0,
          updatedAt: 0,
          steps: [],
          metadata: {
            startUrl: '',
            startPageTitle: '',
            browserVersion: '',
            stepCount: 0,
          },
        },
      },
      {
        type: 'EXPORT_READY',
        blob: new Blob(['test']),
        filename: 'export.zip',
      },
      { type: 'ERROR', message: 'Something went wrong' },
    ];
    expect(msgs.length).toBeGreaterThanOrEqual(8);
  });
});

describe('Adapter interfaces compile correctly', () => {
  it('IScreenshotCapture has captureVisibleTab', () => {
    const adapter: IScreenshotCapture = {
      captureVisibleTab: async () => new Blob(['img']),
    };
    assertType<IScreenshotCapture>(adapter);
    expect(adapter.captureVisibleTab).toBeTypeOf('function');
  });

  it('IStorageAdapter has session and recording CRUD methods', () => {
    const adapter: IStorageAdapter = {
      getSessionState: async () => null,
      setSessionState: async () => {},
      clearSessionState: async () => {},
      saveRecording: async () => {},
      getRecording: async () => null,
      listRecordings: async () => [],
      deleteRecording: async () => {},
      getStorageUsage: async () => ({ used: 0, quota: 10485760 }),
    };
    assertType<IStorageAdapter>(adapter);
    expect(adapter.getSessionState).toBeTypeOf('function');
    expect(adapter.saveRecording).toBeTypeOf('function');
  });

  it('IBlobStore has put/get/delete/deleteMany/getUsage', () => {
    const store: IBlobStore = {
      put: async () => {},
      get: async () => null,
      delete: async () => {},
      deleteMany: async () => {},
      getUsage: async () => 0,
    };
    assertType<IBlobStore>(store);
    expect(store.put).toBeTypeOf('function');
    expect(store.getUsage).toBeTypeOf('function');
  });

  it('ITabAdapter has getCurrentTab, sendMessageToTab, injectContentScript', () => {
    const adapter: ITabAdapter = {
      getCurrentTab: async () => ({ id: 1, url: 'https://example.com', title: 'Example' }),
      sendMessageToTab: async () => {},
      injectContentScript: async () => {},
    };
    assertType<ITabAdapter>(adapter);
    expect(adapter.getCurrentTab).toBeTypeOf('function');
  });

  it('IMessageBus has onContentMessage and onPanelConnect', () => {
    const bus: IMessageBus = {
      onContentMessage: () => {},
      onPanelConnect: () => {},
    };
    assertType<IMessageBus>(bus);
    expect(bus.onContentMessage).toBeTypeOf('function');
  });

  it('PanelPort has postMessage, onMessage, onDisconnect', () => {
    const port: PanelPort = {
      postMessage: () => {},
      onMessage: () => {},
      onDisconnect: () => {},
    };
    assertType<PanelPort>(port);
    expect(port.postMessage).toBeTypeOf('function');
  });

  it('IAlarmAdapter has createKeepalive, clearKeepalive, onAlarm', () => {
    const adapter: IAlarmAdapter = {
      createKeepalive: () => {},
      clearKeepalive: () => {},
      onAlarm: () => {},
    };
    assertType<IAlarmAdapter>(adapter);
    expect(adapter.createKeepalive).toBeTypeOf('function');
  });

  it('IDownloadAdapter has downloadBlob', () => {
    const adapter: IDownloadAdapter = {
      downloadBlob: async () => {},
    };
    assertType<IDownloadAdapter>(adapter);
    expect(adapter.downloadBlob).toBeTypeOf('function');
  });
});
