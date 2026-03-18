# Technical Architecture Document -- SOP Recorder

**Author:** Naokiiida
**Date:** 2026-03-18
**Version:** 1.0
**Status:** Draft
**PRD Reference:** prd.md v2.0

---

## 1. Architecture Overview

### 1.1 System Context

SOP Recorder is a Chrome Extension (Manifest V3) that captures browser interactions and produces documented Standard Operating Procedures with annotated screenshots. It operates entirely within the browser with zero external dependencies.

```
+------------------------------------------------------------------+
|                    Chrome Browser                                  |
|                                                                    |
|  +------------------+    +-------------------+    +--------------+ |
|  | Content Script   |--->| Background        |--->| Side Panel   | |
|  | (per tab)        |    | Service Worker    |    | (Lit + Pico) | |
|  | - event capture  |    | - state machine   |    | - step list  | |
|  | - selectors      |    | - screenshot      |    | - editing    | |
|  | - CSS overlay     |    | - persistence     |    | - export     | |
|  +------------------+    +-------------------+    +--------------+ |
|                              |         |                           |
|                    +---------+---------+----------+                |
|                    |                   |          |                 |
|               IndexedDB        chrome.storage  chrome.storage      |
|              (screenshot       .local          .session             |
|               blobs)          (recordings)    (active state)       |
+------------------------------------------------------------------+
```

### 1.2 Architecture Principles

| Principle | Implementation |
|-----------|---------------|
| **Core-Shell Separation** | All business logic in `src/core/` as pure TypeScript. Chrome APIs accessed only through adapter interfaces (ports). Enables reuse as MCP server or Claude Code skill without refactoring. |
| **Minimal JS** | Lit 3.3.2 Web Components (light DOM, ~5.8 KB gzipped) + PicoCSS classless (~3 KB gzipped). No React, no virtual DOM. Total UI framework budget: ~10 KB gzipped. |
| **Record Rich, Export Thin** | Internal `RecordedStep[]` captures max context (multiple selectors, bounding box, viewport, scroll, accessible name). Export adapters select relevant fields per format. |
| **Local-First, Zero-Trust** | Zero network permissions in manifest. No accounts, no telemetry. Data leaves device only through explicit file download. |

### 1.3 Technology Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Extension Framework | WXT | 0.20.19+ (Vite 8 support) |
| Build Tool | Vite 8 (Rolldown bundler) | 8.0.x |
| Language | TypeScript 5.x (strict mode) | 5.x |
| UI Components | Lit (light DOM mode) | 3.3.2 |
| Base Styling | PicoCSS (classless) | 2.1.1 |
| Unit Testing | Vitest + WxtVitest + @webext-core/fake-browser | 4.1.0 |
| E2E Testing | Playwright + --load-extension | 1.58.x |
| ZIP Export | JSZip | latest |
| Package Manager | pnpm | latest |
| Linting | ESLint (flat config) + Prettier | latest |
| Bundle Monitoring | size-limit | latest |
| CI/CD | GitHub Actions | N/A |

---

## 2. Project Structure

WXT file-based entrypoint convention. All files under `src/` via WXT's `srcDir` config.

```
sop-recorder/
  src/
    entrypoints/
      background.ts              # Service worker entrypoint
      content.ts                 # Content script entrypoint (minimal bootstrap)
      sidepanel/                 # Side panel UI
        index.html               # HTML shell
        main.ts                  # Lit component bootstrap + PicoCSS import

    core/                        # Pure TS -- ZERO Chrome API dependencies
      recording-state-machine.ts # FSM: idle -> recording -> paused -> stopped
      step-manager.ts            # CRUD operations on RecordedStep[]
      selector-generator.ts      # Multi-strategy selector generation
      export-engine.ts           # Format adapters (Markdown, future: tour, etc.)
      event-filter.ts            # Debounce, dedup, noise reduction
      types.ts                   # RecordedStep, Recording, StepAction, messages

    adapters/
      interfaces/                # Port definitions (adapter contracts)
        index.ts                 # Re-exports all interfaces
      chrome/                    # Chrome API adapter implementations
        screenshot-adapter.ts    # captureVisibleTab wrapper
        storage-adapter.ts       # chrome.storage.local + session wrapper
        blob-store.ts            # IndexedDB for screenshot Blobs
        tab-adapter.ts           # Tab query, content script injection
        message-bus.ts           # Typed message send/receive
        alarm-adapter.ts         # Service worker keepalive alarms
        download-adapter.ts      # chrome.downloads for ZIP export

    components/                  # Lit Web Components (light DOM)
      sop-app.ts                 # Root shell, view routing
      sop-home.ts                # Recording list view
      sop-recording.ts           # Active recording view
      sop-editor.ts              # Step editing view
      sop-step-card.ts           # Individual step display/edit
      sop-export-panel.ts        # Export format selection + download

    styles/
      global.css                 # PicoCSS import + CSS custom properties

    assets/
      icon-16.png
      icon-48.png
      icon-128.png

  public/                        # Static files copied to output
    icons/                       # Extension icons (auto-discovered by WXT)

  tests/
    unit/                        # Vitest unit tests
    e2e/                         # Playwright E2E tests
      fixtures/
        extension.ts             # Extension loading fixture

  wxt.config.ts                  # WXT + manifest configuration
  vitest.config.ts               # Vitest + WxtVitest plugin
  playwright.config.ts           # Playwright for extension E2E
  eslint.config.mjs              # ESLint flat config
  tsconfig.json                  # Extends .wxt/tsconfig.json
  .size-limit.json               # Per-entry-point bundle budgets
  package.json
```

### 2.1 WXT Configuration

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  manifest: {
    name: 'SOP Recorder',
    description: 'Record browser workflows as documented SOPs with screenshots',
    permissions: [
      'activeTab',
      'scripting',
      'storage',
      'sidePanel',
      'alarms',
      'downloads',
    ],
    commands: {
      'toggle-recording': {
        suggested_key: { default: 'Alt+Shift+R' },
        description: 'Start/stop recording',
      },
    },
    action: {}, // Required for side panel toggle
  },
});
```

---

## 3. Component Communication

### 3.1 Extension Context Map

```
Content Script (per tab)          Background Service Worker          Side Panel
  - runs in page context           - singleton, may restart           - Lit UI
  - captures DOM events            - owns recording state machine     - displays steps
  - generates selectors            - captures screenshots             - editing + export
  - injects CSS overlays           - persists to storage
         |                                   |                            |
         |--- sendMessage (one-shot) ------->|                            |
         |                                   |<--- port connection -------|
         |                                   |---- port.postMessage ----->|
         |                                   |<--- port.postMessage ------|
```

### 3.2 Message Protocol (TypeScript Discriminated Unions)

All messages between extension contexts use a typed protocol defined in `src/core/types.ts`. Discriminated unions provide compile-time exhaustiveness checking.

```typescript
// src/core/types.ts

// Content Script -> Background
type ContentMessage =
  | { type: 'STEP_CAPTURED'; payload: CapturedEvent }
  | { type: 'CONTENT_READY'; tabId: number };

// Background -> Content Script
type BackgroundToContentMessage =
  | { type: 'START_CAPTURE' }
  | { type: 'STOP_CAPTURE' }
  | { type: 'PAUSE_CAPTURE' }
  | { type: 'RESUME_CAPTURE' }
  | { type: 'INJECT_OVERLAY'; payload: OverlayConfig }
  | { type: 'REMOVE_OVERLAY' };

// Side Panel <-> Background (via Port)
type PanelMessage =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'GET_STATE' }
  | { type: 'DELETE_STEP'; stepId: string }
  | { type: 'REORDER_STEPS'; stepIds: string[] }
  | { type: 'UPDATE_STEP'; stepId: string; changes: Partial<RecordedStep> }
  | { type: 'EXPORT_RECORDING'; recordingId: string; format: ExportFormat }
  | { type: 'SAVE_RECORDING' }
  | { type: 'LOAD_RECORDING'; recordingId: string }
  | { type: 'DELETE_RECORDING'; recordingId: string }
  | { type: 'LIST_RECORDINGS' };

type BackgroundToPanelMessage =
  | { type: 'STATE_UPDATE'; state: RecordingState }
  | { type: 'STEP_ADDED'; step: RecordedStep }
  | { type: 'STEP_UPDATED'; step: RecordedStep }
  | { type: 'STEP_DELETED'; stepId: string }
  | { type: 'STEPS_REORDERED'; steps: RecordedStep[] }
  | { type: 'RECORDING_LIST'; recordings: RecordingMetadata[] }
  | { type: 'RECORDING_LOADED'; recording: Recording }
  | { type: 'EXPORT_READY'; blob: Blob; filename: string }
  | { type: 'ERROR'; message: string };

// Shared event data captured by content script
interface CapturedEvent {
  sequenceNumber: number;
  timestamp: number;
  type: StepAction;
  inputValue?: string;          // Masked for password fields
  selectors: SelectorSet;
  tagName: string;
  elementType?: string;
  elementRole?: string;
  accessibleName: string;
  boundingBox: BoundingBox;
  clickCoordinates?: { x: number; y: number };
  pageUrl: string;
  pageTitle: string;
  viewport: { width: number; height: number };
  scrollPosition: { x: number; y: number };
}
```

### 3.3 Communication Patterns

**Content Script -> Background: One-shot messages**

Content scripts use `chrome.runtime.sendMessage()` for fire-and-forget event delivery. Each captured event includes a `sequenceNumber` for ordering.

**Background -> Content Script: Tab-targeted messages**

Background uses `chrome.tabs.sendMessage(tabId, message)` to control the content script (start/stop/pause capture, inject/remove overlays).

**Background <-> Side Panel: Long-lived Port connection**

The side panel establishes a port via `chrome.runtime.connect({ name: 'sidepanel' })` on mount. This port serves dual purpose:

1. **Bidirectional communication** -- State updates pushed from background, commands sent from panel.
2. **Service worker keepalive** -- An active port prevents the service worker from going idle during recording. Backup: `chrome.alarms.create('keepalive', { periodInMinutes: 0.4167 })` (25 seconds).

```typescript
// Side panel port setup
const port = chrome.runtime.connect({ name: 'sidepanel' });

port.onMessage.addListener((msg: BackgroundToPanelMessage) => {
  // Handle state updates, step additions, etc.
});

port.postMessage({ type: 'GET_STATE' } satisfies PanelMessage);
```

---

## 4. State Management

### 4.1 Recording State Machine

The `RecordingStateMachine` is a pure TypeScript finite state machine with no Chrome API dependencies. It lives in `src/core/recording-state-machine.ts`.

```
                    START
                      |
                      v
+-------+  start  +-----------+  pause  +--------+
|       |-------->|           |-------->|        |
| idle  |         | recording |         | paused |
|       |<--------|           |<--------|        |
+-------+  stop   +-----------+  resume +--------+
   ^                   |
   |      stop         |
   +-------------------+
   ^                   |
   |      stop         |
   +------- paused ----+
```

**States:**

| State | Description | Persisted |
|-------|-------------|-----------|
| `idle` | No active recording. Side panel shows Home view. | No |
| `recording` | Actively capturing events. Content script listeners active. | Yes (session) |
| `paused` | Recording suspended. Content script listeners inactive. Events not captured. | Yes (session) |

**Transitions:**

| From | Event | To | Guard | Side Effects |
|------|-------|----|-------|-------------|
| `idle` | `start` | `recording` | -- | Inject content script, start keepalive alarm |
| `recording` | `pause` | `paused` | -- | Pause content script listeners |
| `paused` | `resume` | `recording` | -- | Resume content script listeners |
| `recording` | `stop` | `idle` | -- | Stop capture, clear keepalive, persist recording |
| `paused` | `stop` | `idle` | -- | Same as above |
| `recording` | `step_captured` | `recording` | Event passes filter | Screenshot -> store step -> notify panel |
| any | `error` | `idle` | -- | Log error, attempt to save captured steps |

**Guards:**

- `start`: No existing recording in progress (prevent double-start)
- `step_captured`: Event passes `EventFilter` (debounce, dedup, noise reduction)

### 4.2 StepManager

CRUD operations on the in-memory `RecordedStep[]` array. Pure TypeScript, no side effects.

```typescript
class StepManager {
  addStep(event: CapturedEvent, screenshotBlobKey: string, thumbnailDataUrl: string): RecordedStep;
  deleteStep(stepId: string): void;
  reorderSteps(orderedIds: string[]): void;
  updateStep(stepId: string, changes: Partial<Pick<RecordedStep, 'title' | 'description'>>): RecordedStep;
  getSteps(): readonly RecordedStep[];
  getStep(stepId: string): RecordedStep | undefined;
  renumberSteps(): void;  // Called after delete/reorder
}
```

### 4.3 Persistence Strategy

Three storage tiers, each for a specific data lifecycle:

| Storage | Data | Lifecycle | Size Budget |
|---------|------|-----------|-------------|
| `chrome.storage.session` | Active recording state + steps (metadata only, no blobs) | Survives service worker restart. Cleared when browser closes. | ~5 MB |
| `chrome.storage.local` | Saved recording metadata (title, dates, step count, step data without blobs) | Permanent until user deletes. Auto-purge after 30 days. | 10 MB default |
| IndexedDB | Screenshot Blobs (JPEG) and thumbnail Blobs | Linked to recordings. Deleted when recording deleted. | Disk-bound (quota manager) |

**Persistence flow during recording:**

```
Step captured
  -> StepManager.addStep()
  -> Screenshot Blob -> IndexedDB (blob-store)
  -> Updated steps[] -> chrome.storage.session (session state)
  -> Notify side panel via port
```

**Save recording flow:**

```
Stop recording
  -> Full Recording object -> chrome.storage.local (metadata)
  -> Screenshot Blobs already in IndexedDB (no copy needed)
  -> Clear chrome.storage.session
```

---

## 5. Adapter Interface Definitions

All adapter interfaces live in `src/adapters/interfaces/index.ts`. Core modules depend ONLY on these interfaces, never on Chrome APIs directly.

```typescript
// src/adapters/interfaces/index.ts

export interface IScreenshotCapture {
  captureVisibleTab(): Promise<Blob>;
}

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

export interface IBlobStore {
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | null>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  getUsage(): Promise<number>;  // bytes
}

export interface ITabAdapter {
  getCurrentTab(): Promise<{ id: number; url: string; title: string } | null>;
  sendMessageToTab(tabId: number, message: BackgroundToContentMessage): Promise<void>;
  injectContentScript(tabId: number): Promise<void>;
}

export interface IMessageBus {
  onContentMessage(handler: (message: ContentMessage, tabId: number) => void): void;
  onPanelConnect(handler: (port: PanelPort) => void): void;
}

export interface PanelPort {
  postMessage(message: BackgroundToPanelMessage): void;
  onMessage(handler: (message: PanelMessage) => void): void;
  onDisconnect(handler: () => void): void;
}

export interface IAlarmAdapter {
  createKeepalive(): void;
  clearKeepalive(): void;
  onAlarm(handler: () => void): void;
}

export interface IDownloadAdapter {
  downloadBlob(blob: Blob, filename: string): Promise<void>;
}
```

### 5.1 Chrome Adapter Implementations

Each adapter in `src/adapters/chrome/` implements one interface:

**`screenshot-adapter.ts`** -- Wraps `chrome.tabs.captureVisibleTab()` with JPEG quality 85 encoding and data URL to Blob conversion.

**`storage-adapter.ts`** -- Wraps `chrome.storage.session` and `chrome.storage.local` with typed get/set operations. Uses WXT's `storage` utility where convenient.

**`blob-store.ts`** -- IndexedDB wrapper for screenshot Blob storage. Uses a single object store `screenshots` keyed by blob key (UUID). Handles database versioning.

**`tab-adapter.ts`** -- Wraps `chrome.tabs.query()`, `chrome.tabs.sendMessage()`, and `chrome.scripting.executeScript()` for content script injection.

**`message-bus.ts`** -- Wraps `chrome.runtime.onMessage` and `chrome.runtime.onConnect` with typed message routing.

**`alarm-adapter.ts`** -- Wraps `chrome.alarms.create()` and `chrome.alarms.onAlarm` for service worker keepalive (25-second interval).

**`download-adapter.ts`** -- Wraps `chrome.downloads.download()` for ZIP file export. Creates a blob URL, triggers download, revokes URL.

---

## 6. Content Script Architecture

### 6.1 Dynamic Loading Strategy

The content script entry point (`src/entrypoints/content.ts`) is a minimal bootstrap (target: < 20 KB). It registers a message listener and dynamically imports the full recording module only when recording starts.

```typescript
// src/entrypoints/content.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main(ctx) {
    let recorder: typeof import('../core/content-recorder') | null = null;

    chrome.runtime.onMessage.addListener(async (msg: BackgroundToContentMessage) => {
      switch (msg.type) {
        case 'START_CAPTURE':
          if (!recorder) {
            recorder = await import('../core/content-recorder');
          }
          recorder.startCapture(ctx);
          break;
        case 'STOP_CAPTURE':
          recorder?.stopCapture();
          break;
        case 'PAUSE_CAPTURE':
          recorder?.pauseCapture();
          break;
        case 'RESUME_CAPTURE':
          recorder?.resumeCapture();
          break;
        case 'INJECT_OVERLAY':
          recorder?.injectOverlay(msg.payload);
          break;
        case 'REMOVE_OVERLAY':
          recorder?.removeOverlay();
          break;
      }
    });

    // Notify background that content script is ready
    chrome.runtime.sendMessage({ type: 'CONTENT_READY', tabId: -1 });
  },
});
```

### 6.2 Event Capture

The dynamically loaded content recorder module captures:

| Event | Listener | What Is Captured |
|-------|----------|-----------------|
| `click` | `document.addEventListener('click', handler, true)` | Target element selectors, bounding box, accessible name, click coordinates |
| `input` | `document.addEventListener('input', handler, true)` | Input value (debounced 500ms), field name/label, masked for password fields |
| `change` | `document.addEventListener('change', handler, true)` | Select/checkbox value changes |
| `submit` | `document.addEventListener('submit', handler, true)` | Form submission events |
| Navigation | `window.addEventListener('popstate')` + URL polling | Page URL changes (SPA navigation detection) |

The `ctx` object from `defineContentScript` provides `ctx.addEventListener()` which auto-cleans up listeners on context invalidation (extension updates, navigation).

### 6.3 Selector Generation

Multi-strategy selector generation following priority chain. Runs at capture time against the live DOM for highest quality selectors.

```
Priority chain: id > data-testid > aria-label > tag+attributes > nth-of-type
```

```typescript
// src/core/selector-generator.ts

interface SelectorSet {
  css: string;        // Primary CSS selector
  xpath?: string;     // XPath fallback
  aria?: string;      // aria-label or accessible name
  textContent?: string; // Visible text (truncated at 100 chars)
}

function generateSelectors(element: Element): SelectorSet {
  const css = generateCssSelector(element);     // Best available strategy
  const xpath = generateXPath(element);          // Fallback
  const aria = getAccessibleName(element);       // WAI-ARIA spec
  const textContent = element.textContent?.trim().slice(0, 100);

  return { css, xpath, aria, textContent };
}
```

**CSS selector strategy cascade:**

1. `#uniqueId` -- if element has a unique ID
2. `[data-testid="value"]` -- if data-testid attribute present
3. `[aria-label="value"]` -- if aria-label present
4. `tag[attr="value"]` -- tag + distinguishing attributes (name, type, role)
5. `parent > tag:nth-of-type(n)` -- positional fallback

### 6.4 Element Info Extraction

At capture time, the content script extracts:

- **Bounding box**: `element.getBoundingClientRect()` (viewport-relative coordinates)
- **Accessible name**: Following WAI-ARIA accessible name computation (aria-label > aria-labelledby > alt > title > text content)
- **Viewport dimensions**: `window.innerWidth`, `window.innerHeight`
- **Scroll position**: `window.scrollX`, `window.scrollY`
- **Element metadata**: `tagName`, `type`, `role`, `name`, `placeholder`

### 6.5 CSS Overlay for Screenshot Annotation

Before each screenshot, a CSS overlay is injected to highlight the clicked element:

```
Event captured
  -> 200ms delay (DOM settle)
  -> Inject CSS overlay (red outline, 2px solid, slight shadow)
  -> Background: captureVisibleTab()
  -> Remove CSS overlay (within 100ms)
  -> Process screenshot
```

The overlay is a CSS outline + box-shadow applied via a `<style>` element injected into the page. No DOM structure changes, so it does not trigger mutations.

```css
/* Injected overlay style */
[data-sop-highlight] {
  outline: 2px solid #e53e3e !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.2) !important;
}
```

---

## 7. Screenshot Pipeline

### 7.1 Capture Flow

```
Content Script                Background Service Worker           IndexedDB
     |                              |                               |
     | STEP_CAPTURED event          |                               |
     |----------------------------->|                               |
     |                              |                               |
     |  INJECT_OVERLAY              | (200ms delay)                 |
     |<-----------------------------|                               |
     |  [overlay applied]           |                               |
     |                              |                               |
     |                              | captureVisibleTab()           |
     |                              | -> JPEG data URL              |
     |                              |                               |
     |  REMOVE_OVERLAY              |                               |
     |<-----------------------------|                               |
     |  [overlay removed]           |                               |
     |                              |                               |
     |                              | data URL -> Blob              |
     |                              | -> IBlobStore.put(key, blob)  |
     |                              |------------------------------>|
     |                              |                               |
     |                              | generate thumbnail            |
     |                              | (320x180, < 10 KB)            |
     |                              | via OffscreenCanvas           |
     |                              |                               |
     |                              | create RecordedStep           |
     |                              | -> persist to session storage |
     |                              | -> notify side panel          |
     |                              |                               |
```

### 7.2 Screenshot Specifications

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Format | JPEG | Fastest capture via `captureVisibleTab` |
| Quality | 85% | Best balance of speed, size (~200 KB), and text clarity |
| Max width | 1920px | Scale down larger viewports |
| Storage | Blob in IndexedDB | Avoids 33% base64 overhead; not subject to 10 MB chrome.storage quota |
| Thumbnail size | 320x180 | < 10 KB each; used in side panel step list |
| Thumbnail generation | OffscreenCanvas in service worker | No DOM needed; fast resize + JPEG compress |

### 7.3 Step Number Badge (Post-Capture)

After screenshot capture, a step number badge is rendered onto the screenshot using the Canvas API (via OffscreenCanvas in the service worker):

1. Draw screenshot onto canvas
2. At click coordinates, draw a numbered circle badge (e.g., red circle with white number)
3. Export as JPEG Blob
4. Store annotated screenshot in IndexedDB

---

## 8. Export Pipeline

### 8.1 Markdown Export Flow

```
User clicks "Export"
  -> ExportEngine.exportAsMarkdown(recording)
  -> For each step:
       -> Fetch screenshot Blob from IBlobStore
       -> Add to JSZip as screenshots/step-{nn}.jpg
  -> Generate sop.md with:
       - Title, date, metadata header
       - Numbered steps with title + description
       - Image references: ![Step N](screenshots/step-{nn}.jpg)
  -> Package as ZIP via JSZip
  -> IDownloadAdapter.downloadBlob(zipBlob, 'sop-recording.zip')
```

### 8.2 Export Engine Architecture

```typescript
// src/core/export-engine.ts

interface ExportAdapter {
  readonly format: ExportFormat;
  export(recording: Recording, blobStore: IBlobStore): Promise<ExportResult>;
}

type ExportFormat = 'markdown-zip';
// Future: 'html' | 'guidechimp-json' | 'driverjs-json' | 'claude-shortcut' | 'playwright-test'

interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

class MarkdownZipExporter implements ExportAdapter {
  readonly format = 'markdown-zip';

  async export(recording: Recording, blobStore: IBlobStore): Promise<ExportResult> {
    const zip = new JSZip();
    const md = this.generateMarkdown(recording);
    zip.file('sop.md', md);

    const screenshotsFolder = zip.folder('screenshots');
    for (const step of recording.steps) {
      const blob = await blobStore.get(step.screenshotBlobKey);
      if (blob && screenshotsFolder) {
        screenshotsFolder.file(
          `step-${String(step.sequenceNumber).padStart(2, '0')}.jpg`,
          blob,
        );
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return {
      blob: zipBlob,
      filename: `${sanitizeFilename(recording.title)}.zip`,
      mimeType: 'application/zip',
    };
  }
}
```

### 8.3 Markdown Output Format

```markdown
# {SOP Title}

**Date:** {createdAt formatted}
**Steps:** {stepCount}
**Starting URL:** {startUrl}

---

## Step 1: {step.title}

{step.description}

![Step 1](screenshots/step-01.jpg)

---

## Step 2: {step.title}

{step.description}

![Step 2](screenshots/step-02.jpg)

...
```

### 8.4 Future Export Adapters (v2+)

The `RecordedStep[]` data model already captures all fields needed for these adapters:

| Adapter | Output | Key Fields Used |
|---------|--------|----------------|
| **HTML** | Self-contained HTML file with base64 images | All step fields + inline screenshots |
| **GuideChimp JSON** | Tour JSON grouped by URL path | selectors.css, title, description, boundingBox |
| **Driver.js Config** | Step array for Driver.js | selectors.css, title, description |
| **Claude Shortcut** | Natural language prompt (AI-summarized) | type, accessibleName, inputValue, pageUrl |
| **Playwright Test** | TypeScript test skeleton | selectors (css/aria), type, inputValue, pageUrl |

---

## 9. Side Panel UI Architecture

### 9.1 Component Tree

```
<sop-app>                         # Root shell, manages view routing
  |
  +-- <sop-home>                  # Recording list + "Start Recording" CTA
  |     +-- recording cards       # Title, date, step count per recording
  |
  +-- <sop-recording>             # Active recording view
  |     +-- recording controls    # Start/Stop/Pause buttons + timer
  |     +-- live step list        # Steps added in real-time
  |           +-- <sop-step-card> # Thumbnail + auto-generated title
  |
  +-- <sop-editor>                # Post-recording editing view
        +-- <sop-step-card>       # Editable: title, description, delete, reorder
        +-- <sop-export-panel>    # Format selection + Export button
```

### 9.2 Lit Component Pattern (Light DOM)

All components use light DOM mode for PicoCSS compatibility:

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sop-app')
export class SopApp extends LitElement {
  // Light DOM: PicoCSS styles cascade into component
  createRenderRoot() { return this; }

  @state() private currentView: 'home' | 'recording' | 'editor' = 'home';

  render() {
    switch (this.currentView) {
      case 'home':
        return html`<sop-home @start-recording=${this.handleStart}></sop-home>`;
      case 'recording':
        return html`<sop-recording @stop=${this.handleStop}></sop-recording>`;
      case 'editor':
        return html`<sop-editor .recording=${this.activeRecording}></sop-editor>`;
    }
  }
}
```

### 9.3 State Synchronization

The side panel uses a `RecordingController` (Lit `ReactiveController`) that maintains a port connection to the background service worker and updates component state on messages:

```typescript
class RecordingController implements ReactiveController {
  private port: chrome.runtime.Port | null = null;
  state: RecordingState = 'idle';
  steps: RecordedStep[] = [];

  constructor(private host: ReactiveControllerHost) {
    host.addController(this);
  }

  hostConnected() {
    this.port = chrome.runtime.connect({ name: 'sidepanel' });
    this.port.onMessage.addListener((msg: BackgroundToPanelMessage) => {
      switch (msg.type) {
        case 'STATE_UPDATE':
          this.state = msg.state;
          this.host.requestUpdate();
          break;
        case 'STEP_ADDED':
          this.steps = [...this.steps, msg.step];
          this.host.requestUpdate();
          break;
        // ... other message handlers
      }
    });
    this.port.postMessage({ type: 'GET_STATE' });
  }

  hostDisconnected() {
    this.port?.disconnect();
    this.port = null;
  }
}
```

### 9.4 Styling Strategy

```css
/* src/styles/global.css */

/* PicoCSS classless import -- styles semantic HTML automatically */
@import '@picocss/pico/css/pico.classless.min.css';

/* Custom properties for extension-specific theming */
:root {
  --sop-recording-color: #e53e3e;
  --sop-step-border: var(--pico-muted-border-color);
  --sop-thumbnail-width: 120px;
}

/* Extension-specific overrides */
body {
  margin: 0;
  padding: 0.5rem;
  font-size: 0.875rem; /* Slightly smaller for side panel */
}
```

**Animations:** Use View Transitions API (native in Chrome 111+) for view switches and step list updates. Zero bundle cost.

---

## 10. Background Service Worker Architecture

### 10.1 Initialization

```typescript
// src/entrypoints/background.ts
export default defineBackground({
  type: 'module',

  main() {
    // 1. Create adapter instances (Chrome implementations)
    const screenshotAdapter = new ChromeScreenshotAdapter();
    const storageAdapter = new ChromeStorageAdapter();
    const blobStore = new IndexedDBBlobStore();
    const tabAdapter = new ChromeTabAdapter();
    const alarmAdapter = new ChromeAlarmAdapter();
    const downloadAdapter = new ChromeDownloadAdapter();

    // 2. Create core engine with adapters
    const stateMachine = new RecordingStateMachine();
    const stepManager = new StepManager();
    const exportEngine = new ExportEngine([new MarkdownZipExporter()]);

    // 3. Register event listeners SYNCHRONOUSLY (Chrome requirement)
    chrome.runtime.onMessage.addListener(handleContentMessage);
    chrome.runtime.onConnect.addListener(handlePanelConnect);
    chrome.commands.onCommand.addListener(handleCommand);
    chrome.alarms.onAlarm.addListener(handleAlarm);

    // 4. Recover state from session storage (service worker restart)
    recoverState();
  },
});
```

### 10.2 Service Worker Lifecycle Management

**Keepalive strategy during recording:**

1. **Primary:** Long-lived port from side panel. Active port prevents idle timeout.
2. **Backup:** `chrome.alarms.create('keepalive', { periodInMinutes: 0.4167 })` (25 seconds). Alarm fires every 25 seconds during recording, keeping the worker alive even if the port disconnects temporarily.

**State recovery after restart:**

```typescript
async function recoverState() {
  const sessionState = await storageAdapter.getSessionState();
  if (sessionState && sessionState.status !== 'idle') {
    // Service worker restarted during recording
    stateMachine.recover(sessionState.status);
    stepManager.loadSteps(sessionState.steps);
    // Side panel will detect recovery state and offer resume/save
  }
}
```

---

## 11. Testing Architecture

### 11.1 Test Pyramid

```
         /\
        /  \       E2E Tests (Playwright)
       / E2E\      - Full record -> edit -> export flow
      /------\     - Side panel rendering
     / Integ. \    - Content script injection
    /----------\
   /   Unit     \  Unit Tests (Vitest)
  / Tests (Core) \ - State machine transitions
 /________________\ - Selector generation
                    - Event filtering
                    - Export engine
                    - Step manager
```

### 11.2 Unit Testing Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: 'jsdom',
  },
});
```

**WxtVitest plugin provides:**
- Polyfilled `browser.*` APIs via `@webext-core/fake-browser`
- Auto-imports in tests
- Path alias resolution (`@/*`, `@@/*`)
- Vite config integration from `wxt.config.ts`

**Core module testing (no Chrome mocks needed):**

```typescript
// tests/unit/recording-state-machine.test.ts
import { describe, it, expect } from 'vitest';
import { RecordingStateMachine } from '../../src/core/recording-state-machine';

describe('RecordingStateMachine', () => {
  it('transitions from idle to recording on start', () => {
    const sm = new RecordingStateMachine();
    expect(sm.state).toBe('idle');
    sm.transition('start');
    expect(sm.state).toBe('recording');
  });

  it('prevents start when already recording', () => {
    const sm = new RecordingStateMachine();
    sm.transition('start');
    expect(() => sm.transition('start')).toThrow();
  });
});
```

### 11.3 E2E Testing Setup

```typescript
// tests/e2e/fixtures/extension.ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.resolve(__dirname, '../../../.output/chrome-mv3');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    const extensionId = sw.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
```

**Key E2E test: Side panel rendering**

```typescript
test('side panel renders correctly', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.locator('sop-app')).toBeVisible();
  await expect(page.getByRole('button', { name: /record/i })).toBeVisible();
});
```

**Key E2E test: WCAG compliance**

```typescript
import AxeBuilder from '@axe-core/playwright';

test('side panel passes WCAG 2.1 AA', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### 11.4 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck         # tsc --noEmit
      - run: pnpm lint              # eslint

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit         # vitest run --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build             # wxt build
      - run: pnpm exec playwright install chromium --with-deps
      - run: pnpm test:e2e          # playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm size-limit        # per-entry-point checks
```

### 11.5 Bundle Size Budgets

```json
[
  { "path": ".output/chrome-mv3/content-scripts/*.js", "limit": "50 KB" },
  { "path": ".output/chrome-mv3/background.js", "limit": "100 KB" },
  { "path": ".output/chrome-mv3/sidepanel/*.js", "limit": "200 KB" }
]
```

---

## 12. Security Model

### 12.1 Manifest Permissions (Minimal)

| Permission | Purpose |
|-----------|---------|
| `activeTab` | Inject content script, capture screenshot of active tab |
| `scripting` | Programmatic content script injection |
| `storage` | Persist recordings and settings |
| `sidePanel` | Display recording UI |
| `alarms` | Service worker keepalive during recording |
| `downloads` | Save exported ZIP files |

**NOT requested:** `offscreen`, `tabCapture`, `unlimitedStorage`, `webNavigation`, `<all_urls>` host permission, `debugger`, `history`, `management`.

### 12.2 Content Security Policy

Standard MV3 CSP. No modifications needed.

- No dynamic code generation or string-based code execution anywhere in codebase
- No remote code loading
- No inline scripts in HTML pages (Vite handles module bundling)
- Lit uses tagged template literals (CSP-safe, no string-to-code evaluation)

### 12.3 Data Security

| Concern | Mitigation |
|---------|-----------|
| Password exposure | `<input type="password">` values masked at capture time in content script |
| Credit card fields | Fields with `autocomplete="cc-number"` or similar masked |
| Network exfiltration | Zero network permissions in manifest. No fetch calls. No XMLHttpRequest. |
| Data at rest | All data in extension-scoped storage (chrome.storage + IndexedDB). Cleared on extension uninstall. |
| Screenshot sensitivity | Screenshots never leave device unless user explicitly exports. No thumbnails sent anywhere. |

### 12.4 CSP Validation Test

```typescript
// tests/unit/manifest.test.ts
it('has no unsafe-eval in CSP', () => {
  const csp = manifest.content_security_policy?.extension_pages ?? '';
  expect(csp).not.toContain('unsafe-eval');
});

it('requests only declared permissions', () => {
  const allowed = ['activeTab', 'scripting', 'storage', 'sidePanel', 'alarms', 'downloads'];
  const declared = manifest.permissions ?? [];
  const unexpected = declared.filter(p => !allowed.includes(p));
  expect(unexpected).toEqual([]);
});
```

---

## 13. Performance Budget

### 13.1 Bundle Size Targets

| Entry Point | Must-Have | Nice-to-Have |
|-------------|-----------|-------------|
| Content script | < 50 KB | < 20 KB |
| Service worker | < 100 KB | < 50 KB |
| Side panel JS | < 200 KB | < 100 KB |
| Side panel CSS | < 15 KB | < 10 KB |
| Total package ZIP | < 2 MB | < 1 MB |

### 13.2 Runtime Performance Targets

| Metric | Must-Have | Nice-to-Have |
|--------|-----------|-------------|
| Service worker cold start | < 200ms | < 100ms |
| Content script page load impact | < 50ms | < 10ms |
| Screenshot capture latency | < 300ms | < 150ms |
| Side panel FCP | < 1000ms | < 500ms |
| Side panel TTI | < 2000ms | < 1000ms |
| Memory idle | < 20 MB | < 10 MB |
| Memory per step | < 1 MB | < 500 KB |
| Export time (10 steps) | < 3s | < 1s |

### 13.3 Measurement Strategy

- **Bundle size:** `size-limit` in CI with per-entry-point budgets
- **Cold start:** `performance.mark()` in service worker, measured in E2E tests
- **Page load impact:** Playwright tracing in E2E
- **FCP/TTI:** `PerformanceObserver` in side panel, validated in E2E
- **Memory:** Chrome Task Manager verification during manual QA

---

## 14. Build and Development

### 14.1 Development Workflow

```bash
# Install dependencies
pnpm install

# Start dev server with HMR + auto-open browser
pnpm dev              # wxt dev

# Build for production
pnpm build            # wxt build

# Run unit tests
pnpm test:unit        # vitest run

# Run E2E tests (requires build first)
pnpm build && pnpm test:e2e   # playwright test

# Type check
pnpm typecheck        # tsc --noEmit

# Lint
pnpm lint             # eslint .

# Check bundle size
pnpm size-limit       # size-limit

# Package for Chrome Web Store
pnpm zip              # wxt zip
```

### 14.2 Package Scripts

```json
{
  "scripts": {
    "dev": "wxt dev",
    "build": "wxt build",
    "zip": "wxt zip",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "size-limit": "size-limit",
    "prepare": "wxt prepare"
  }
}
```

### 14.3 ESLint Configuration

```javascript
// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      'no-implied-eval': 'error',
      'no-implicit-globals': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
```

---

## 15. Architecture Decision Records (ADRs)

### ADR-001: WXT over Plasmo

**Status:** Accepted
**Context:** Need a Chrome extension framework for MV3 development with TypeScript, side panel support, and modern build tooling.
**Decision:** Use WXT (v0.20.19+) instead of Plasmo.
**Rationale:**
- Plasmo is in maintenance mode with declining community activity
- WXT produces ~40% smaller bundles (400 KB vs 700 KB typical)
- WXT supports Vite 8 with Rolldown bundler (10-30x faster builds)
- Superior HMR across all contexts including background service worker
- Framework-agnostic (not locked to React)
- Built-in storage API with versioning and migrations
- Active maintainer (236 releases, 9.4k stars, 2.7k dependents)
**Consequences:** Must use `@webext-core/messaging` for typed messaging (no built-in). Manual type definitions for message protocol.

### ADR-002: Lit over React

**Status:** Accepted
**Context:** Need a UI component library for the side panel. Side panel has 3 views, ~6 components, step list with CRUD operations.
**Decision:** Use Lit 3.3.2 Web Components in light DOM mode.
**Rationale:**
- ~5.8 KB gzipped vs React's ~40 KB gzipped (85% smaller)
- Web-standards-based: components work in any context, zero lock-in
- CSP-safe (tagged template literals, no string-to-code evaluation)
- TypeScript-first with decorators
- ReactiveController pattern for state management
- Light DOM mode provides PicoCSS compatibility without Shadow DOM complexity
- Side panel UI complexity does not justify React's overhead
**Consequences:** Smaller community than React. Fewer third-party component libraries. Developers may be less familiar with Lit patterns.

### ADR-003: PicoCSS Classless over Tailwind

**Status:** Accepted
**Context:** Need a CSS framework for the side panel UI. Must work with Lit in light DOM mode.
**Decision:** Use PicoCSS classless (~3 KB gzipped) with supplemental custom CSS.
**Rationale:**
- Classless approach: style semantic HTML elements directly, zero class names needed
- ~3 KB gzipped vs Tailwind's ~10 KB (for a real project)
- Tailwind has known issues with Shadow DOM (`:root` custom properties); although we use light DOM, PicoCSS's semantic approach is simpler
- Automatic dark/light mode via `prefers-color-scheme`
- No build-time CSS processing needed
- Side panel UI is simple enough that utility classes add noise without benefit
**Consequences:** Less fine-grained control than Tailwind. Custom CSS needed for extension-specific layouts (drag handles, recording indicator). Cannot use Tailwind UI component library.

### ADR-004: IndexedDB for Screenshots over chrome.storage

**Status:** Accepted
**Context:** Need to store JPEG screenshot Blobs (typically 100-300 KB each). A 50-step recording generates 5-15 MB of screenshot data.
**Decision:** Store screenshot Blobs in IndexedDB. Store recording metadata (step data without blobs) in `chrome.storage.local`.
**Rationale:**
- IndexedDB stores native Blobs without base64 encoding (saves 33% vs data URL strings)
- `chrome.storage.local` has a default 10 MB quota; IndexedDB uses the global quota manager with much higher limits
- IndexedDB is designed for large binary data; chrome.storage is designed for small key-value pairs
- Separation allows listing recordings quickly (metadata only) without loading screenshot data
**Consequences:** Two storage systems to manage. Must coordinate deletion (recording metadata + associated blobs). IndexedDB requires async open/upgrade lifecycle.

### ADR-005: Custom RecordedStep[] over rrweb

**Status:** Accepted
**Context:** Need to capture browser interactions for SOP documentation. rrweb is a mature session replay library. Alternative is custom DOM event listeners.
**Decision:** Use custom event listeners producing `RecordedStep[]` directly. Do not include rrweb in v1.
**Rationale:**
- rrweb adds ~40-50 KB gzipped to content script (our target is < 50 KB total)
- rrweb captures continuous session data; we need discrete steps -- post-processing adds complexity with no benefit
- rrweb does NOT capture screenshots; we need `captureVisibleTab()` regardless
- Custom selectors from live DOM are higher quality than deriving selectors from rrweb's serialized node attributes
- rrweb adds +21-25% CPU overhead; custom listeners are minimal
- All primary exports (Markdown, tour, Claude shortcut) map directly from RecordedStep[] without transformation
**Consequences:** No session replay capability in v1. If needed in v2+, rrweb can be added as an optional supplementary layer alongside RecordedStep[] (which remains the canonical model).

### ADR-006: Adapter Pattern for Core-Shell Separation

**Status:** Accepted
**Context:** Core business logic (state machine, step management, selector generation, export) may need to run in multiple contexts: Chrome extension (v1), MCP server (v2), Claude Code skill (v2+).
**Decision:** Define adapter interfaces (ports) for all external dependencies. Core modules depend only on interfaces, never on Chrome APIs directly.
**Rationale:**
- Enables adding MCP server or Claude Code skill targets by implementing new adapters without touching core logic
- All core modules are fully unit-testable without Chrome API mocks
- Clear dependency direction: adapters depend on core, never the reverse
- Small upfront cost for significant future flexibility
**Consequences:** Slightly more code (interface definitions + implementations). Dependency injection pattern in background service worker initialization. Must resist the temptation to call chrome APIs directly in core modules.

### ADR-007: captureVisibleTab over CDP Screenshots

**Status:** Accepted
**Context:** Need to capture screenshots of the active tab during recording.
**Decision:** Use `chrome.tabs.captureVisibleTab()` API.
**Rationale:**
- Simplest API: single call returns data URL
- Works with `activeTab` permission (no broad host permissions needed)
- No warning bar displayed to user (unlike tabCapture)
- No offscreen document needed (unlike CDP `Page.captureScreenshot`)
- Fast: 50-150ms for JPEG capture
- Captures viewport exactly as user sees it
**Consequences:** Viewport-only screenshots (no full-page capture in v1). Cannot capture content below the fold. Full-page screenshots deferred to v2 (would require CDP or scrolling + stitching).

### ADR-008: JPEG 85 over PNG/WebP

**Status:** Accepted
**Context:** Need to choose screenshot format and quality level. Screenshots are used in SOP documentation where text must be readable.
**Decision:** JPEG at quality 85%.
**Rationale:**
- **Fastest capture** via `captureVisibleTab`: JPEG 50-150ms vs PNG 100-300ms
- **Good size**: ~200 KB per 1920x1080 screenshot (vs PNG 500 KB-2 MB)
- **Text clarity**: Quality 85 preserves text readability for SOP documentation
- **Universal compatibility**: JPEG viewable in any image viewer, browser, or Markdown renderer
- WebP has smaller files but less universal support in Markdown renderers and documentation tools
- PNG is lossless but 2-5x larger with no perceptible quality benefit for SOP screenshots
**Consequences:** Lossy compression artifacts on sharp edges and small text at extreme zoom levels. Acceptable for SOP documentation use case. WebP conversion can be added as an export-time optimization in v2 if needed.

---

## 16. Future Architecture Considerations

### 16.1 MCP Server (v2)

The adapter pattern enables a Node.js MCP server that reuses all core modules:

```
Core Engine (same code)
  + Node.js adapters:
    - FileSystemBlobStore (fs instead of IndexedDB)
    - FileStorageAdapter (JSON files instead of chrome.storage)
    - PuppeteerScreenshotAdapter (headless browser instead of captureVisibleTab)
  + MCP tools: sop_list, sop_read, sop_record, sop_execute
```

### 16.2 Claude Shortcut Export (v2)

RecordedStep[] can be converted to Claude Chrome's SavedPrompt format:

```
RecordedStep[] -> AI summarization -> natural language prompt -> SavedPrompt JSON
```

Export as JSON file for import via Claude Chrome's import feature.

### 16.3 rrweb Integration (v2+)

Optional enhancement for video-like replay:

```
RecordedStep[] (always captured, canonical model)
  + @rrweb/record events (opt-in, supplementary data)
    -> stored alongside steps for replay/video features
```

RecordedStep[] remains the source of truth for all exports. rrweb events are enhancement-only.

### 16.4 Tour Export (v2)

Adapter layer over existing RecordedStep[] data:

```typescript
// Future: src/core/exporters/guidechimp-exporter.ts
class GuideChimpExporter implements ExportAdapter {
  export(recording: Recording): GuideChimpTourJSON {
    // Group steps by URL path
    // Map selectors.css -> element, title -> title, description -> description
    // Derive position from boundingBox
  }
}
```

No changes to recording engine or data model needed.
