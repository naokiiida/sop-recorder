# Architecture v2 Addendum -- SOP Recorder Post-MVP Features

**Author:** Naokiiida
**Date:** 2026-03-22
**Version:** 2.0
**Status:** Draft
**Base Document:** architecture.md v1.0

---

## 1. Architecture Evolution Overview

v2 extends v1 by adding four feature pillars -- HTML/Tour export, MCP server integration, AI enhancement, and screenshot annotation -- without modifying any existing v1 interfaces or breaking the adapter pattern.

**Extension strategy:**

| Principle | How v2 Respects It |
|-----------|-------------------|
| Core-Shell Separation | New exporters, AI service, and annotation compositor live in `src/core/`. No Chrome API imports. |
| Adapter Pattern | Two new adapter interfaces (`IAIProvider`, `INativeSyncAdapter`). Existing `IStorageAdapter` and `IBlobStore` gain filesystem implementations for MCP. |
| Record Rich, Export Thin | `RecordedStep` gains optional `annotations?: AnnotationLayer` field. All new exporters consume the same `Recording` type. |
| Local-First | AI BYOK keeps keys in local storage. MCP sync is localhost-only via native messaging. No cloud services. |

**Backward compatibility guarantee:** All v1 recordings remain valid. New optional fields default to `undefined`. No migrations required for existing data.

```
v2 Extension Points (new modules shown with *)

  src/core/
    export-engine.ts         (unchanged)
    zip-exporter.ts          (unchanged)
  * html-exporter.ts         NEW — self-contained HTML export
  * tour-exporter.ts         NEW — GuideChimp/Driver.js JSON export
  * annotation-compositor.ts NEW — SVG → Canvas compositing
  * ai-enhancement-service.ts NEW — orchestrates AI providers
  * prompt-builder.ts        NEW — constructs AI prompts with PII sanitization
  * html-sanitizer.ts        NEW — escapeHtml() utility

  src/adapters/interfaces/
    index.ts                 EXTENDED — adds IAIProvider, INativeSyncAdapter

  src/adapters/chrome/
  * ai-settings-adapter.ts   NEW — chrome.storage for API keys
  * native-sync-adapter.ts   NEW — native messaging bridge

  src/adapters/ai/
  * openai-provider.ts       NEW — OpenAI-compatible API provider
  * chrome-ai-provider.ts    NEW — Chrome built-in AI provider

  src/components/
  * sop-settings.ts          NEW — AI settings view
  * sop-annotation-editor.ts NEW — SVG annotation overlay
```

---

## 2. Module Dependency Graph (v2)

```
                          ┌─────────────────────────────────────────────┐
                          │              src/core/types.ts              │
                          │  Recording, RecordedStep, AnnotationLayer,  │
                          │  AISettings, ExportFormat (expanded)        │
                          └──────────────┬──────────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
    ┌─────────▼─────────┐    ┌──────────▼──────────┐   ┌──────────▼──────────┐
    │  Export Pipeline   │    │  AI Enhancement     │   │  Annotation System  │
    │                    │    │                     │   │                     │
    │  zip-exporter      │    │  ai-enhancement-    │   │  annotation-        │
    │  html-exporter *   │    │    service *        │   │    compositor *     │
    │  tour-exporter *   │    │  prompt-builder *   │   │                     │
    │  export-engine     │    │                     │   │                     │
    └────────┬───────────┘    └──────────┬──────────┘   └──────────┬──────────┘
             │                           │                          │
             │ BlobFetcher               │ IAIProvider              │ BlobFetcher
             │                           │                          │
    ┌────────▼───────────────────────────▼──────────────────────────▼──────────┐
    │                     src/adapters/interfaces/index.ts                     │
    │  IStorageAdapter  IBlobStore  IScreenshotCapture  IDownloadAdapter       │
    │  IAIProvider *    INativeSyncAdapter *                                   │
    └────────┬───────────────────────────┬────────────────────────────────────-┘
             │                           │
    ┌────────▼──────────┐     ┌──────────▼──────────────────┐
    │  Chrome Adapters  │     │  MCP/Filesystem Adapters *  │
    │  (extension)      │     │  (Node.js process)          │
    │                   │     │                             │
    │  storage-adapter  │     │  FileStorageAdapter *       │
    │  blob-store       │     │  FileBlobStore *            │
    │  screenshot-adpt  │     │                             │
    │  ai-settings *    │     │  @modelcontextprotocol/sdk  │
    │  native-sync *    │     │  sop-mcp-server *           │
    │                   │     │                             │
    │  AI Providers:    │     └─────────────────────────────┘
    │  openai-prov *    │
    │  chrome-ai-prov * │
    └───────────────────┘

    ┌───────────────────────────────────────────────┐
    │              UI Components                     │
    │  sop-settings *         sop-annotation-editor *│
    │  sop-editor (extended)  sop-step-card (ext.)   │
    └───────────────────────────────────────────────┘

  * = new in v2
```

---

## 3. New Adapter Interfaces

Added to `src/adapters/interfaces/index.ts`:

```typescript
// ── AI Provider ─────────────────────────────────────────────────────────────

export interface AIEnhancementResult {
  title: string;
  description: string;
}

export interface IAIProvider {
  readonly id: string;          // 'openai' | 'chrome-ai'
  readonly name: string;        // Human-readable label

  isAvailable(): Promise<boolean>;

  enhanceStep(step: RecordedStep): Promise<AIEnhancementResult>;

  enhanceBatch(steps: RecordedStep[]): Promise<AIEnhancementResult[]>;
}

// ── AI Settings Storage ─────────────────────────────────────────────────────

export interface AISettings {
  provider: 'openai' | 'chrome-ai' | 'none';
  apiKey?: string;              // Encrypted in chrome.storage.local
  model?: string;               // e.g. 'gpt-4o-mini'
  autoEnhance: boolean;         // Auto-enhance on recording stop
  consentGiven: boolean;        // User acknowledged data sharing
}

export interface IAISettingsAdapter {
  getSettings(): Promise<AISettings>;
  saveSettings(settings: AISettings): Promise<void>;
  clearApiKey(): Promise<void>;
}

// ── Native Messaging (Extension <-> MCP Server) ────────────────────────────

export interface NativeSyncMessage {
  type: 'SYNC_RECORDING' | 'DELETE_RECORDING' | 'LIST_RECORDINGS' | 'PING';
  payload?: unknown;
}

export interface NativeSyncResponse {
  type: 'OK' | 'ERROR' | 'RECORDING_LIST';
  payload?: unknown;
  error?: string;
}

export interface INativeSyncAdapter {
  isConnected(): Promise<boolean>;
  send(message: NativeSyncMessage): Promise<NativeSyncResponse>;
  syncRecording(recording: Recording, blobs: Map<string, Blob>): Promise<void>;
  disconnect(): void;
}
```

---

## 4. Extended Data Model

All additions to `src/core/types.ts` are backward-compatible (optional fields or union expansion).

```typescript
// ── ExportFormat (expanded) ────────────────────────────────────────────────

export type ExportFormat =
  | 'markdown-zip'
  | 'html'                    // NEW: self-contained HTML
  | 'guidechimp-json'         // NEW: GuideChimp tour config
  | 'driverjs-json';          // NEW: Driver.js step array

// ── Annotation Types ───────────────────────────────────────────────────────

export type AnnotationTool = 'arrow' | 'rect' | 'ellipse' | 'text' | 'freehand';

export interface AnnotationBase {
  id: string;                   // UUID
  tool: AnnotationTool;
  color: string;                // hex, e.g. '#e53e3e'
  strokeWidth: number;          // in normalized units (0-1 relative to image width)
}

export interface ArrowAnnotation extends AnnotationBase {
  tool: 'arrow';
  x1: number; y1: number;      // Normalized 0-1 coordinates
  x2: number; y2: number;
}

export interface RectAnnotation extends AnnotationBase {
  tool: 'rect';
  x: number; y: number;
  width: number; height: number; // Normalized 0-1
}

export interface EllipseAnnotation extends AnnotationBase {
  tool: 'ellipse';
  cx: number; cy: number;
  rx: number; ry: number;        // Normalized 0-1
}

export interface TextAnnotation extends AnnotationBase {
  tool: 'text';
  x: number; y: number;
  text: string;
  fontSize: number;               // Normalized 0-1 relative to image height
}

export interface FreehandAnnotation extends AnnotationBase {
  tool: 'freehand';
  points: Array<{ x: number; y: number }>;  // Normalized 0-1
}

export type Annotation =
  | ArrowAnnotation
  | RectAnnotation
  | EllipseAnnotation
  | TextAnnotation
  | FreehandAnnotation;

export interface AnnotationLayer {
  annotations: Annotation[];
  version: 1;                   // For future migration
}

// ── RecordedStep Extension ─────────────────────────────────────────────────

// Add to RecordedStep interface:
//   annotations?: AnnotationLayer | undefined;

// ── Tour Export Types ──────────────────────────────────────────────────────

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  element?: string;             // CSS selector (undefined = centered modal)
  title: string;
  description: string;
  position: TooltipPosition;
  url?: string;                 // For multi-page tours
}

export interface GuideChimpTour {
  pages: Array<{
    path: string;
    steps: TourStep[];
  }>;
}

export interface DriverJsConfig {
  steps: Array<{
    element?: string;
    popover: {
      title: string;
      description: string;
      side: TooltipPosition;
    };
  }>;
}
```

---

## 5. Export Pipeline Architecture

### 5.1 Export Dispatch (Extended)

The background service worker dispatches exports based on `ExportFormat`:

```
EXPORT_RECORDING message { recordingId, format }
  |
  +-- 'markdown-zip' --> exportAsZip()          (existing)
  +-- 'html'          --> exportAsHtml()         (NEW)
  +-- 'guidechimp-json' --> exportAsGuideChimp() (NEW)
  +-- 'driverjs-json'   --> exportAsDriverJs()   (NEW)
  |
  v
{ blob, filename } --> downloadAdapter.downloadBlob()
```

### 5.2 HTML Exporter

**File:** `src/core/html-exporter.ts`

```
exportAsHtml(recording, fetchBlob)
  |
  +-- For each step:
  |     +-- fetchBlob(step.screenshotBlobKey)
  |     +-- If step.annotations: compositeAnnotations(blob, annotations)
  |     +-- blobToBase64(blob)  // FileReader.readAsDataURL
  |
  +-- Build HTML string:
  |     +-- escapeHtml() on all user content (title, description)
  |     +-- Inline CSS with @media (prefers-color-scheme) for dark/light
  |     +-- Print styles (@media print) for PDF generation
  |     +-- Base64 images as <img src="data:image/jpeg;base64,...">
  |
  +-- Return { blob: new Blob([html], {type:'text/html'}), filename }
```

**Signature mirrors zip-exporter:**

```typescript
export type BlobFetcher = (key: string) => Promise<Blob | null>;

export async function exportAsHtml(
  recording: Recording,
  fetchBlob: BlobFetcher,
): Promise<{ blob: Blob; filename: string }>;
```

### 5.3 Tour Exporter

**File:** `src/core/tour-exporter.ts`

```typescript
export function exportAsGuideChimpJson(recording: Recording): { blob: Blob; filename: string };
export function exportAsDriverJs(recording: Recording): { blob: Blob; filename: string };

// Helpers (internal):
function inferTooltipPosition(box: BoundingBox, viewport: ViewportSize): TooltipPosition;
function selectBestSelector(step: RecordedStep): string | undefined;
function groupStepsByPath(steps: RecordedStep[]): Map<string, RecordedStep[]>;
```

**Tooltip position inference:**

```
inferTooltipPosition(box, viewport):
  verticalCenter = box.y + box.height / 2
  horizontalCenter = box.x + box.width / 2

  If verticalCenter < viewport.height * 0.3  --> 'bottom'
  If verticalCenter > viewport.height * 0.7  --> 'top'
  If horizontalCenter < viewport.width * 0.3 --> 'right'
  If horizontalCenter > viewport.width * 0.7 --> 'left'
  Default --> 'bottom'
```

**Selector fallback chain:**

```
selectBestSelector(step):
  1. step.selectors.css   (if not positional/nth-of-type)
  2. step.selectors.aria  (if present, format as [aria-label="..."])
  3. undefined            (renders as centered modal with no element highlight)
```

### 5.4 Annotation Integration with Export

When a step has annotations, the export pipeline composites them before including in output:

```
Export Pipeline (any format)
  |
  +-- For each step with step.annotations:
  |     +-- originalBlob = fetchBlob(step.screenshotBlobKey)
  |     +-- compositedBlob = compositeAnnotations(originalBlob, step.annotations)
  |     +-- Use compositedBlob instead of originalBlob
  |
  +-- Steps without annotations: use originalBlob as-is
```

This keeps annotations non-destructive in storage (original screenshot preserved) while baking them into exports.

---

## 6. MCP Integration Architecture

### 6.1 Process Topology

```
+------------------------------------------------------------------+
|                    Chrome Browser                                  |
|                                                                    |
|  +------------------+    +-------------------+    +--------------+ |
|  | Content Script   |--->| Background SW     |--->| Side Panel   | |
|  +------------------+    +--------+----------+    +--------------+ |
|                                   |                                |
|                          chrome.runtime                            |
|                          .connectNative()                          |
|                                   |                                |
+-----------------------------------|--------------------------------+
                                    | stdin/stdout (JSON + length prefix)
                                    |
                     +--------------v---------------+
                     | sop-recorder-host            |
                     | (Native Messaging Host)      |
                     | Node.js process              |
                     |                              |
                     |  FileStorageAdapter           |
                     |  FileBlobStore                |
                     |  Recording JSON files         |
                     +-------------+----------------+
                                   |
                      fs read/write (localhost only)
                                   |
                     +-------------v----------------+
                     | ~/.sop-recorder/              |
                     |   recordings/                 |
                     |     {id}.json                 |
                     |   screenshots/                |
                     |     {recordingId}_step_{n}.jpg |
                     |   index.json                  |
                     +------------------------------+
                                   ^
                                   | stdio transport
                                   |
                     +-------------+----------------+
                     | sop-mcp-server               |
                     | @modelcontextprotocol/sdk     |
                     |                              |
                     | Tools:                       |
                     |   sop_list                   |
                     |   sop_read                   |
                     |   sop_export                 |
                     |   sop_search                 |
                     +------------------------------+
```

### 6.2 Workspace Restructuring

v2 requires a pnpm workspace to share core types and logic between the extension and the MCP server:

```
sop-recorder/                       # workspace root
  pnpm-workspace.yaml
  package.json                      # workspace scripts

  packages/
    core/                           # NEW: shared package
      package.json                  # { "name": "@sop-recorder/core" }
      src/
        types.ts                    # RecordedStep, Recording, etc.
        export-engine.ts
        zip-exporter.ts
        html-exporter.ts
        tour-exporter.ts
        annotation-compositor.ts
        ai-enhancement-service.ts
        prompt-builder.ts
        html-sanitizer.ts
        recording-state-machine.ts
        step-manager.ts
        event-filter.ts
        logger.ts
      tsconfig.json

    extension/                      # Existing extension code (moved)
      package.json                  # { "name": "@sop-recorder/extension" }
      src/
        entrypoints/
        adapters/
        components/
        styles/
      wxt.config.ts
      vitest.config.ts

    mcp-server/                     # NEW: MCP server package
      package.json                  # { "name": "@sop-recorder/mcp-server" }
      src/
        server.ts                   # MCP tool definitions
        adapters/
          file-storage-adapter.ts   # implements IStorageAdapter
          file-blob-store.ts        # implements IBlobStore
      native-host/
        manifest.json               # Chrome native messaging host manifest
        install.sh                   # Registration script
      tsconfig.json
```

**pnpm-workspace.yaml:**

```yaml
packages:
  - 'packages/*'
```

**Migration path:** Extract `src/core/` into `packages/core/` and update imports. The extension package depends on `@sop-recorder/core` via `workspace:*`. This is a refactor step that can be done before any feature work.

### 6.3 FileStorageAdapter Design

```typescript
// packages/mcp-server/src/adapters/file-storage-adapter.ts

import type { IStorageAdapter } from '@sop-recorder/core';

const DATA_DIR = path.join(os.homedir(), '.sop-recorder');
const RECORDINGS_DIR = path.join(DATA_DIR, 'recordings');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

export class FileStorageAdapter implements IStorageAdapter {
  // Session state: not applicable for MCP (returns null always)
  async getSessionState(): Promise<null> { return null; }
  async setSessionState(): Promise<void> { /* no-op */ }
  async clearSessionState(): Promise<void> { /* no-op */ }

  // Local storage: JSON files on disk
  async saveRecording(recording: Recording): Promise<void> {
    // Write to recordings/{id}.json
    // Update index.json with metadata
  }

  async getRecording(id: string): Promise<Recording | null> {
    // Read from recordings/{id}.json
  }

  async listRecordings(): Promise<RecordingMetadata[]> {
    // Read index.json
  }

  async deleteRecording(id: string): Promise<void> {
    // Remove recordings/{id}.json
    // Remove associated screenshots
    // Update index.json
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    // du -s on DATA_DIR, quota = Infinity
  }
}
```

### 6.4 FileBlobStore Design

```typescript
// packages/mcp-server/src/adapters/file-blob-store.ts

import type { IBlobStore } from '@sop-recorder/core';

const SCREENSHOTS_DIR = path.join(os.homedir(), '.sop-recorder', 'screenshots');

export class FileBlobStore implements IBlobStore {
  async put(key: string, blob: Blob): Promise<void> {
    const buffer = Buffer.from(await blob.arrayBuffer());
    await fs.writeFile(path.join(SCREENSHOTS_DIR, `${key}.jpg`), buffer);
  }

  async get(key: string): Promise<Blob | null> {
    try {
      const buffer = await fs.readFile(path.join(SCREENSHOTS_DIR, `${key}.jpg`));
      return new Blob([buffer], { type: 'image/jpeg' });
    } catch { return null; }
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(SCREENSHOTS_DIR, `${key}.jpg`)).catch(() => {});
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(k => this.delete(k)));
  }

  async getUsage(): Promise<number> {
    // Sum file sizes in SCREENSHOTS_DIR
  }
}
```

### 6.5 Native Messaging Protocol

**Framing:** Chrome native messaging uses length-prefixed JSON. Chrome handles the framing automatically via `chrome.runtime.connectNative()`.

**Message types:**

```
Extension --> Host:

  { type: 'SYNC_RECORDING', payload: { recording: Recording, blobs: { [key: string]: base64 } } }
  { type: 'DELETE_RECORDING', payload: { recordingId: string } }
  { type: 'LIST_RECORDINGS' }
  { type: 'PING' }

Host --> Extension:

  { type: 'OK' }
  { type: 'ERROR', error: string }
  { type: 'RECORDING_LIST', payload: RecordingMetadata[] }
```

**Blob transfer:** Screenshots are base64-encoded in the SYNC_RECORDING message payload. This is a trade-off: 33% overhead vs requiring a separate file transfer mechanism. For typical recordings (10 steps, ~200 KB each), the total message is ~2.7 MB -- within Chrome's native messaging 1 GB limit.

### 6.6 Sync Strategy

**Trigger:** On save (user clicks "Save Recording" or recording stops). No continuous sync.

```
User saves recording
  |
  +-- storageAdapter.saveRecording(recording)     // Chrome storage (existing)
  |
  +-- nativeSyncAdapter.isConnected()?
        |
        +-- YES: nativeSyncAdapter.syncRecording(recording, blobs)
        |         |
        |         +-- Success: silent (no UI change)
        |         +-- Failure: log warning, no retry (user can re-export)
        |
        +-- NO: skip sync (extension works standalone)
```

**Conflict resolution:** Last-write-wins. The extension is the source of truth. MCP server never writes back to the extension. If the user edits in the extension after sync, the next save overwrites the MCP copy.

---

## 7. AI Enhancement Pipeline

### 7.1 Provider Abstraction Layer

```
                    AIEnhancementService
                    (src/core/ai-enhancement-service.ts)
                           |
               +-----------+-----------+
               |                       |
        OpenAIProvider           ChromeAIProvider
        (src/adapters/ai/)       (src/adapters/ai/)
               |                       |
     fetch() to endpoint     window.LanguageModel API
     (optional_host_permissions)   (Chrome 131+)
```

```typescript
// src/core/ai-enhancement-service.ts

export class AIEnhancementService {
  constructor(
    private providers: Map<string, IAIProvider>,
    private settingsAdapter: IAISettingsAdapter,
  ) {}

  async enhanceRecording(recording: Recording): Promise<Recording> {
    const settings = await this.settingsAdapter.getSettings();
    if (settings.provider === 'none' || !settings.consentGiven) return recording;

    const provider = this.providers.get(settings.provider);
    if (!provider || !(await provider.isAvailable())) return recording;

    const sanitizedSteps = recording.steps.map(sanitizeStepForAI);
    const results = await provider.enhanceBatch(sanitizedSteps);

    const enhancedSteps = recording.steps.map((step, i) => ({
      ...step,
      title: results[i]?.title ?? step.title,
      description: results[i]?.description ?? step.description,
    }));

    return { ...recording, steps: enhancedSteps };
  }
}
```

### 7.2 Prompt Construction and PII Sanitization

**File:** `src/core/prompt-builder.ts`

```
RecordedStep[]
  |
  +-- sanitizeStepForAI(step):
  |     Remove: screenshotBlobKey, thumbnailDataUrl, boundingBox,
  |             clickCoordinates, scrollPosition, viewport
  |     Redact: inputValue (replace with "[user input]")
  |     Redact: URLs with query params → strip params
  |     Keep:   type, title, description, accessibleName, tagName,
  |             elementType, pageTitle, selectors.aria
  |
  +-- buildBatchPrompt(sanitizedSteps[]):
        System: "You are a technical writer. Improve step titles and
                 descriptions for an SOP document. Be concise.
                 Return JSON array: [{title, description}]"
        User:   JSON.stringify(sanitizedSteps)
```

**PII sanitization rules:**

| Field | Rule |
|-------|------|
| `inputValue` | Always replaced with `"[user input]"` |
| `pageUrl` | Query params stripped: `https://app.com/page?token=xyz` → `https://app.com/page` |
| `selectors.css` | Sent as-is (structural, not PII) |
| `screenshotBlobKey` | Never sent (excluded from sanitization input) |
| `thumbnailDataUrl` | Never sent |
| `boundingBox`, `clickCoordinates` | Never sent (spatial data, not relevant) |

### 7.3 OpenAI Provider

```typescript
// src/adapters/ai/openai-provider.ts

export class OpenAIProvider implements IAIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  constructor(private getApiKey: () => Promise<string | undefined>) {}

  async isAvailable(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== undefined && key.length > 0;
  }

  async enhanceBatch(steps: RecordedStep[]): Promise<AIEnhancementResult[]> {
    const key = await this.getApiKey();
    if (!key) throw new Error('API key not configured');

    const prompt = buildBatchPrompt(steps);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: prompt,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    // Parse and validate response...
  }
}
```

### 7.4 Chrome Built-in AI Provider

```typescript
// src/adapters/ai/chrome-ai-provider.ts

export class ChromeAIProvider implements IAIProvider {
  readonly id = 'chrome-ai';
  readonly name = 'Chrome Built-in AI';

  async isAvailable(): Promise<boolean> {
    // Chrome 131+ exposes window.LanguageModel (was window.ai)
    if (typeof globalThis.LanguageModel === 'undefined') return false;
    const capabilities = await LanguageModel.capabilities();
    return capabilities.available === 'readily';
  }

  async enhanceBatch(steps: RecordedStep[]): Promise<AIEnhancementResult[]> {
    const session = await LanguageModel.create({
      systemPrompt: SYSTEM_PROMPT,
    });

    // Chrome AI may have smaller context windows,
    // so process in chunks of 5 steps
    const results: AIEnhancementResult[] = [];
    for (let i = 0; i < steps.length; i += 5) {
      const chunk = steps.slice(i, i + 5);
      const prompt = buildBatchPrompt(chunk);
      const response = await session.prompt(JSON.stringify(prompt));
      results.push(...parseAIResponse(response));
    }

    session.destroy();
    return results;
  }
}
```

### 7.5 Settings Management and Consent Flow

```
User opens Settings view
  |
  +-- Consent dialog (first time only):
  |     "AI enhancement sends step titles, descriptions, and element names
  |      to {provider}. Screenshots are NEVER sent.
  |      [I understand] [Cancel]"
  |
  +-- Provider selection: None / OpenAI / Chrome Built-in AI
  |
  +-- If OpenAI:
  |     +-- API key input (stored in chrome.storage.local)
  |     +-- Model selection (default: gpt-4o-mini)
  |
  +-- Auto-enhance toggle: "Enhance titles when recording stops"
  |
  +-- Test connection button
```

**API key storage:** `chrome.storage.local` with key `sop_ai_settings`. The API key is stored as a plain string within extension-scoped storage. This storage is:
- Inaccessible to web pages
- Cleared on extension uninstall
- Not synced across devices (uses `local`, not `sync`)

---

## 8. Annotation System Architecture

### 8.1 SVG Overlay Rendering Pipeline

```
sop-annotation-editor.ts (Lit component)
  |
  +-- Renders in the sop-editor view when user clicks "Annotate" on a step
  |
  +-- Structure:
  |     <div class="annotation-container" style="position:relative">
  |       <img src="{screenshot data URL}" />
  |       <svg viewBox="0 0 1 1"            <-- normalized coordinate space
  |            preserveAspectRatio="none"
  |            style="position:absolute; inset:0; width:100%; height:100%">
  |         <!-- Annotation elements rendered here -->
  |         <line .../> <rect .../> <ellipse .../> <text .../> <path .../>
  |       </svg>
  |     </div>
  |
  +-- Toolbar:
        [Arrow] [Rectangle] [Ellipse] [Text] [Freehand] | [Color] [Undo] [Done]
```

**Interaction model:**

| Tool | Gesture | SVG Element |
|------|---------|-------------|
| Arrow | Click-drag start to end | `<line>` with `marker-end="url(#arrowhead)"` |
| Rectangle | Click-drag corner to corner | `<rect>` |
| Ellipse | Click-drag bounding box | `<ellipse>` |
| Text | Click to place, type in input | `<text>` |
| Freehand | Click-drag path | `<path>` with SVG path data |

**Coordinate normalization:** All mouse events are converted to 0-1 normalized coordinates relative to the image dimensions. This makes annotations resolution-independent and valid regardless of display size.

```typescript
function normalizeCoordinates(
  clientX: number, clientY: number,
  containerRect: DOMRect,
): { x: number; y: number } {
  return {
    x: (clientX - containerRect.left) / containerRect.width,
    y: (clientY - containerRect.top) / containerRect.height,
  };
}
```

### 8.2 Annotation Data Model

Annotations are stored in `RecordedStep.annotations` as an `AnnotationLayer`:

```typescript
// Example annotation data for a step
{
  annotations: {
    version: 1,
    annotations: [
      {
        id: 'ann-1',
        tool: 'arrow',
        color: '#e53e3e',
        strokeWidth: 0.003,    // 0.3% of image width
        x1: 0.2, y1: 0.3,
        x2: 0.5, y2: 0.6,
      },
      {
        id: 'ann-2',
        tool: 'text',
        color: '#2563eb',
        strokeWidth: 0,
        x: 0.55, y: 0.58,
        text: 'Click here',
        fontSize: 0.03,        // 3% of image height
      },
    ],
  },
}
```

**Storage:** Annotations are part of the `RecordedStep` object, stored in both `chrome.storage.session` (during recording) and `chrome.storage.local` (saved recordings). They are small (typically < 1 KB per step) and do not require separate blob storage.

### 8.3 Compositor Architecture

**File:** `src/core/annotation-compositor.ts`

The compositor converts annotations from SVG overlay data into rasterized pixels on the screenshot at export time.

```
compositeAnnotations(screenshotBlob, annotationLayer)
  |
  +-- createImageBitmap(screenshotBlob)
  |
  +-- OffscreenCanvas(bitmap.width, bitmap.height)
  |
  +-- ctx.drawImage(bitmap, 0, 0)     // Draw original screenshot
  |
  +-- For each annotation:
  |     +-- Scale normalized coordinates to pixel coordinates:
  |     |     pixelX = annotation.x * bitmap.width
  |     |     pixelY = annotation.y * bitmap.height
  |     |
  |     +-- Draw using Canvas 2D API:
  |           arrow  -> ctx.beginPath(); ctx.moveTo(); ctx.lineTo(); drawArrowhead()
  |           rect   -> ctx.strokeRect()
  |           ellipse -> ctx.ellipse()
  |           text   -> ctx.fillText()
  |           freehand -> ctx.beginPath(); ctx.moveTo(); ctx.lineTo() (for each point)
  |
  +-- canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
  |
  +-- Return composited Blob
```

**Signature:**

```typescript
export async function compositeAnnotations(
  screenshotBlob: Blob,
  annotations: AnnotationLayer,
): Promise<Blob>;
```

This function runs in the service worker context using `OffscreenCanvas` -- the same pattern already established by `renderStepBadge()` in `screenshot-adapter.ts`.

### 8.4 Integration with Export and Thumbnail Pipelines

**Export integration:**

```typescript
// In each exporter (zip, html, tour):
async function getExportBlob(step: RecordedStep, fetchBlob: BlobFetcher): Promise<Blob | null> {
  const blob = await fetchBlob(step.screenshotBlobKey);
  if (!blob) return null;

  if (step.annotations && step.annotations.annotations.length > 0) {
    return compositeAnnotations(blob, step.annotations);
  }

  return blob;
}
```

**Thumbnail regeneration:** When annotations are added/modified, the step's thumbnail should be regenerated. The existing `generateThumbnail()` function is called on the composited blob:

```
User saves annotations
  |
  +-- compositeAnnotations(originalBlob, annotations)
  +-- generateThumbnail(compositedBlob, clickCoordinates, viewport)
  +-- Update step.thumbnailDataUrl
  +-- STEP_UPDATED message to panel
```

Note: The original screenshot blob in IndexedDB is never modified. Annotations are composited on-the-fly for export and thumbnails.

---

## 9. Security Architecture Changes

### 9.1 Manifest Permission Expansion

```typescript
// wxt.config.ts additions for v2

manifest: {
  permissions: [
    'activeTab',
    'scripting',
    'storage',
    'sidePanel',
    'alarms',
    'downloads',
    'nativeMessaging',          // NEW: for MCP sync
  ],
  optional_host_permissions: [
    'https://api.openai.com/*',        // NEW: OpenAI API (user-granted)
    'https://api.anthropic.com/*',     // NEW: future Anthropic API
  ],
}
```

**Permission justification:**

| Permission | Feature | User Impact |
|------------|---------|-------------|
| `nativeMessaging` | MCP server sync | Shown in install dialog. No runtime prompt. |
| `optional_host_permissions` (OpenAI) | AI enhancement | NOT shown at install. User grants at runtime when configuring AI in settings. Uses `chrome.permissions.request()`. |

### 9.2 API Key Storage Approach

| Concern | Approach |
|---------|----------|
| Storage location | `chrome.storage.local` under key `sop_ai_settings` |
| Encryption at rest | Delegated to Chrome's storage encryption (OS-level, automatic on most platforms) |
| Access scope | Extension-only (same-origin policy enforced by Chrome) |
| Sync across devices | Explicitly disabled (`storage.local`, not `storage.sync`) |
| Key rotation | User can overwrite in settings at any time |
| Key deletion | "Clear API Key" button in settings, or automatic on extension uninstall |

**Why not custom encryption:** Chrome's extension storage is already sandboxed and inaccessible to web pages. Adding AES encryption would provide marginal benefit while adding complexity and a key management problem (where to store the encryption key?).

### 9.3 Privacy Boundaries

```
+----------------------------------------------------------------+
|  DEVICE BOUNDARY                                                |
|                                                                  |
|  Extension Storage (Chrome)     Filesystem (~/.sop-recorder/)    |
|  +------------------------+    +----------------------------+   |
|  | Recordings             |    | Recordings (JSON)          |   |
|  | Screenshots (Blobs)    |--->| Screenshots (JPEG files)   |   |
|  | API keys               |    |                            |   |
|  | Annotations            |    | (MCP server reads these)   |   |
|  +------------------------+    +----------------------------+   |
|             |                                                    |
+-------------|----------------------------------------------------+
              | (only when AI enhancement is enabled + consent given)
              v
+----------------------------------------------------------------+
|  NETWORK BOUNDARY                                                |
|                                                                  |
|  Sent to AI provider:          NEVER sent:                       |
|  - Step titles                 - Screenshots / thumbnails        |
|  - Step descriptions           - API keys                        |
|  - Accessible names            - Bounding boxes                  |
|  - Tag names / element types   - Click coordinates               |
|  - Page titles                 - Full URLs (params stripped)     |
|  - Action types                - Input values (redacted)         |
|  - Selectors.aria              - Annotation data                 |
+----------------------------------------------------------------+
```

### 9.4 XSS Prevention in HTML Export

The HTML exporter must escape all user-controlled content injected into the HTML template:

```typescript
// src/core/html-sanitizer.ts

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Fields requiring escaping in HTML export:**
- `recording.title`
- `step.title`
- `step.description`
- `step.pageUrl` (used in `<a href>` -- also validate scheme is `http:` or `https:`)
- `step.accessibleName`

**Fields that are safe (not user-controlled):**
- Base64 image data (from Blob, not user input)
- CSS template (static, bundled with exporter)
- Step numbers (integers)

---

## 10. Performance Considerations

### 10.1 Base64 Encoding at Scale

HTML export converts all screenshots to base64, adding 33% size overhead:

| Steps | Screenshot Size | ZIP Size | HTML Size | Delta |
|-------|----------------|----------|-----------|-------|
| 5 | ~1 MB | ~1 MB | ~1.33 MB | +33% |
| 10 | ~2 MB | ~2 MB | ~2.67 MB | +33% |
| 30 | ~6 MB | ~6 MB | ~8 MB | +33% |
| 50 | ~10 MB | ~10 MB | ~13.3 MB | +33% |

**Mitigation:** For recordings with 30+ steps, display a warning in the UI: "Large HTML export ({size} MB). Consider ZIP export for better compression."

**Encoding performance:** `FileReader.readAsDataURL()` processes ~10 MB/s on modern hardware. A 50-step recording takes ~1s for base64 conversion. This runs in the service worker, so the UI remains responsive.

### 10.2 Annotation Compositing Overhead

Per-step compositing with `OffscreenCanvas`:

| Operation | Time (est.) |
|-----------|------------|
| `createImageBitmap()` | ~5ms |
| Draw original image | ~2ms |
| Draw 5 annotations | ~3ms |
| `convertToBlob()` | ~20ms |
| **Total per step** | **~30ms** |

For a 10-step recording with annotations on every step: ~300ms additional export time. Well within the 3s budget.

### 10.3 AI API Latency

| Provider | Batch Size | Expected Latency | Strategy |
|----------|-----------|-------------------|----------|
| OpenAI (gpt-4o-mini) | 10 steps | 2-4s | Single batch request |
| OpenAI (gpt-4o-mini) | 30 steps | 4-8s | Single batch (fits context) |
| Chrome Built-in AI | 5 steps/chunk | 1-3s per chunk | Sequential chunks |
| Chrome Built-in AI | 30 steps | 6-18s | 6 sequential chunks |

**UI treatment:** AI enhancement runs after recording stops, with a progress indicator:

```
"Enhancing step titles... (3/10)"
[=====>        ] 30%
[Skip]
```

User can skip at any time and keep the auto-generated titles.

### 10.4 Native Messaging Transfer

| Steps | Payload Size (with base64 blobs) | Transfer Time (est.) |
|-------|----------------------------------|---------------------|
| 5 | ~1.5 MB | < 100ms |
| 10 | ~3 MB | < 200ms |
| 50 | ~15 MB | < 1s |

Native messaging operates over stdin/stdout pipes with no network overhead. Chrome's 1 GB message size limit is not a practical concern.

---

## 11. Architecture Decision Records (v2)

### ADR-007: SVG Annotations over Canvas-Based Drawing

**Status:** Accepted
**Context:** Need a screenshot annotation system that allows users to add arrows, rectangles, text, and freehand drawings to step screenshots. Two primary approaches: (a) SVG overlay with compositing at export, (b) direct Canvas 2D drawing with immediate rasterization.
**Decision:** Use SVG overlay for editing, Canvas 2D compositing only at export time.
**Rationale:**
- **Non-destructive editing:** Original screenshot blob is preserved. Annotations can be added, modified, or removed at any time without re-capturing.
- **Resolution independence:** SVG with normalized 0-1 coordinates renders correctly at any display size (side panel, fullscreen lightbox, export).
- **Simpler undo/redo:** SVG elements are discrete objects in an array. Undo = remove last element. Canvas requires storing pixel snapshots or command history.
- **Smaller storage:** Annotation data (JSON array of coordinates) is typically < 1 KB per step vs storing a full rasterized canvas (~200 KB).
- **Accessibility:** SVG elements can carry `aria-label` attributes and are DOM-inspectable.
- **Export quality:** Compositing happens at full screenshot resolution (up to 1920px wide), not at the display resolution of the annotation editor.
**Consequences:**
- Two rendering pipelines: SVG for editing, Canvas for export. The compositor (`annotation-compositor.ts`) must faithfully reproduce the SVG visual appearance using Canvas 2D API calls.
- Freehand annotations generate many SVG path points, which could be large. Mitigation: downsample points with Ramer-Douglas-Peucker algorithm if > 200 points.
- Complex SVG features (filters, gradients) are not supported. Annotations are limited to solid strokes and fills.

---

### ADR-008: Native Messaging over Direct Filesystem Access for MCP Sync

**Status:** Accepted
**Context:** The MCP server needs access to recording data stored in the Chrome extension. Two options: (a) native messaging bridge that pushes data from extension to filesystem, (b) MCP server directly reads Chrome's IndexedDB/LevelDB files.
**Decision:** Use Chrome Native Messaging to sync recordings from the extension to the filesystem.
**Rationale:**
- **Chrome storage is opaque:** IndexedDB and chrome.storage.local use LevelDB internally with Chrome-specific encoding. Direct filesystem reads are fragile and undocumented.
- **Race conditions:** Chrome may have file locks on its storage. Reading while Chrome writes corrupts data.
- **Clean separation:** The extension owns its data and pushes snapshots to the filesystem. The MCP server reads clean JSON + JPEG files.
- **Forward compatibility:** Chrome may change its internal storage format. Native messaging uses a stable, documented API.
- **Security:** Native messaging runs under the user's OS permissions. No elevated access needed.
**Consequences:**
- Requires installing a native messaging host (Node.js binary + manifest). Adds an installation step for MCP users.
- Data is duplicated: once in Chrome storage, once on filesystem. Typical overhead is ~20 MB for a heavy user.
- Sync is one-directional (extension → filesystem). MCP server cannot write back to the extension.

---

### ADR-009: optional_host_permissions over Static host_permissions for AI

**Status:** Accepted
**Context:** AI enhancement requires `fetch()` calls to external APIs (e.g., `api.openai.com`). Chrome MV3 requires host permissions for cross-origin requests. Two options: (a) declare in `host_permissions` (shown at install), (b) declare in `optional_host_permissions` (prompted at runtime).
**Decision:** Use `optional_host_permissions` for all AI provider endpoints.
**Rationale:**
- **User trust:** Showing "Can read and change data on api.openai.com" at install time is alarming for an SOP recorder. Most users will never enable AI features.
- **Minimal permissions principle:** v1 has zero network permissions. Adding host_permissions would break the "Local-First, Zero-Trust" architecture principle for all users.
- **Runtime consent:** `chrome.permissions.request()` shows a clear prompt explaining what the user is granting, in context (when they configure AI in settings).
- **Revocable:** Users can revoke optional permissions via `chrome.permissions.remove()` or chrome://extensions.
**Consequences:**
- Must call `chrome.permissions.request()` before first AI API call. This requires a user gesture (button click).
- Cannot make AI API calls from the background service worker without first having the permission granted in the side panel.
- Must handle the case where permission is revoked between settings save and API call.

---

### ADR-010: Batch AI Enhancement over Individual Step Calls

**Status:** Accepted
**Context:** AI enhancement improves step titles and descriptions. Two approaches: (a) enhance each step individually (N API calls), (b) batch all steps into one prompt (1 API call).
**Decision:** Batch all steps into a single API call (with chunking for Chrome AI's smaller context).
**Rationale:**
- **Cost efficiency:** OpenAI charges per-token. Batch prompt shares the system prompt and context once. Individual calls repeat the system prompt N times.
- **Latency:** One round-trip (~3s) vs N sequential round-trips (~3s x N). For 10 steps: 3s vs 30s.
- **Coherence:** Batch processing sees all steps together, producing more consistent terminology and style across the SOP.
- **Rate limits:** Single call is far less likely to hit API rate limits than N calls in quick succession.
**Consequences:**
- All-or-nothing failure: if the API call fails, no steps are enhanced. Mitigation: fall back to original titles, display error message, allow retry.
- Token limit: very long recordings (50+ steps) may exceed context window. Mitigation: chunk into groups of 20 steps and batch each group.
- Response parsing: must validate that the API returns exactly N results matching the N input steps. Mitigation: strict JSON schema validation with fallback to originals for any mismatched entries.

---

### ADR-011: pnpm Workspace for Core Module Sharing

**Status:** Accepted
**Context:** The MCP server needs to use the same types, export engine, and business logic as the Chrome extension. Two approaches: (a) publish `@sop-recorder/core` as an npm package, (b) use pnpm workspace with `workspace:*` protocol.
**Decision:** Use pnpm workspace monorepo with three packages: `core`, `extension`, `mcp-server`.
**Rationale:**
- **Zero publish friction:** No npm publish step. Changes to core are immediately available to both consumers via workspace protocol.
- **Single version of truth:** One `types.ts`, one `export-engine.ts`. No risk of version skew between extension and MCP server.
- **Existing tooling:** Project already uses pnpm. Workspaces are a native pnpm feature with zero additional dependencies.
- **Independent builds:** Extension uses WXT/Vite, MCP server uses plain `tsc`. Each package has its own `tsconfig.json` and build script.
- **CI simplification:** Single repo, single CI pipeline. Tests for all packages run together.
**Consequences:**
- Migration effort: must extract `src/core/` into `packages/core/` and update all import paths. WXT's `srcDir` config needs adjustment.
- WXT compatibility: WXT expects entrypoints in its `srcDir`. Extension-specific code stays in `packages/extension/src/`, and WXT's `srcDir` points there.
- Slightly more complex root `package.json` with workspace-level scripts (`pnpm -r run build`, `pnpm --filter @sop-recorder/extension dev`).

---

## 12. Implementation Priority

| Feature | Complexity | Dependencies | Suggested Order |
|---------|-----------|-------------|-----------------|
| HTML Export | LOW | html-sanitizer.ts | 1st (standalone, no arch changes) |
| Tour Export | MEDIUM | None | 2nd (standalone, extends ExportFormat) |
| pnpm Workspace | MEDIUM | None | 3rd (prerequisite for MCP) |
| Annotation System | HIGH | annotation-compositor.ts | 4th (UI-heavy, independent of others) |
| MCP Server | MEDIUM-HIGH | pnpm workspace | 5th (needs workspace first) |
| AI BYOK | HIGH | Settings UI, permissions | 6th (most user-facing complexity) |

Each feature can be developed and shipped independently. The workspace restructuring (item 3) is the only hard dependency -- it must precede MCP server work.
