---
stepsCompleted: [validate-prerequisites, design-epics, create-stories, final-validation]
inputDocuments: [prd-v2-addendum.md, architecture-v2-addendum.md, epics-and-stories.md]
---

# SOP Recorder v2 — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SOP Recorder v2, decomposing the v2 PRD addendum and architecture addendum into implementable stories. Each story is scoped for 1-3 hours of developer agent implementation time. Epics continue numbering from v1 (Epics 1-8, 42 stories).

## Requirements Inventory (v2)

### Functional Requirements

| ID | Requirement | Priority | Feature |
|----|------------|----------|---------|
| FR-7.1 | Export as single self-contained `.html` file | Must | F1 |
| FR-7.2 | Embed screenshots as base64 JPEG data URIs | Must | F1 |
| FR-7.3 | Include inline CSS matching PicoCSS aesthetic | Must | F1 |
| FR-7.4 | Support dark/light mode via `@media (prefers-color-scheme)` | Should | F1 |
| FR-7.5 | Include print-friendly styles via `@media print` | Must | F1 |
| FR-7.6 | HTML-escape all user-editable content | Must | F1 |
| FR-7.7 | Include SOP metadata header | Must | F1 |
| FR-7.8 | Add "Export as HTML" alongside existing export UI | Must | F1 |
| FR-8.1 | Export as Driver.js configuration file | Must | F2 |
| FR-8.2 | Map selectors to Driver.js `element` property | Must | F2 |
| FR-8.3 | Map title/description to Driver.js popover | Must | F2 |
| FR-8.4 | Infer tooltip position from bounding box + viewport | Must | F2 |
| FR-8.5 | Group steps by `pageUrl` with cross-page warnings | Should | F2 |
| FR-8.6 | Include Driver.js CDN link and initialization boilerplate | Must | F2 |
| FR-8.7 | Export as GuideChimp-compatible JSON (secondary) | Could | F2 |
| FR-8.8 | Selector fallback chain for tour robustness | Should | F2 |
| FR-9.1 | Standalone Node.js MCP server process | Must | F3 |
| FR-9.2 | `sop_list` tool | Must | F3 |
| FR-9.3 | `sop_read` tool | Must | F3 |
| FR-9.4 | `sop_export` tool | Must | F3 |
| FR-9.5 | `sop_search` tool | Should | F3 |
| FR-9.6 | Sync extension data to filesystem via Native Messaging | Must | F3 |
| FR-9.7 | `FileStorageAdapter` implementing `IStorageAdapter` | Must | F3 |
| FR-9.8 | `FileBlobStore` implementing `IBlobStore` | Must | F3 |
| FR-9.9 | Installation script for native messaging host | Must | F3 |
| FR-9.10 | Refactor to pnpm workspace for code sharing | Must | F3 |
| FR-10.1 | `IAIProvider` adapter interface | Must | F4 |
| FR-10.2 | `OpenAICompatibleProvider` | Must | F4 |
| FR-10.3 | `ChromeBuiltInAIProvider` | Should | F4 |
| FR-10.4 | Batch enhancement (all steps in single call) | Must | F4 |
| FR-10.5 | Store API key in `chrome.storage.local` | Must | F4 |
| FR-10.6 | Settings UI for API configuration | Must | F4 |
| FR-10.7 | Privacy consent flow before first AI call | Must | F4 |
| FR-10.8 | "Enhance All Steps" button in Edit view | Must | F4 |
| FR-10.9 | Enhancement diff with accept/reject per step | Should | F4 |
| FR-10.10 | Automatic PII warning before AI send | Should | F4 |
| FR-11.1 | SVG overlay annotation layer | Must | F5 |
| FR-11.2 | Arrow tool | Must | F5 |
| FR-11.3 | Rectangle tool | Must | F5 |
| FR-11.4 | Ellipse tool | Should | F5 |
| FR-11.5 | Text tool | Must | F5 |
| FR-11.6 | Freehand drawing tool | Could | F5 |
| FR-11.7 | Store annotations as normalized coordinates | Must | F5 |
| FR-11.8 | Composite annotations via OffscreenCanvas for export | Must | F5 |
| FR-11.9 | Undo/redo for annotation actions | Must | F5 |
| FR-11.10 | Delete individual annotations | Must | F5 |
| FR-11.11 | Annotation color selection | Should | F5 |
| FR-12.1 | Build Firefox add-on via WXT | Must | F6 |
| FR-12.2 | Adapt side panel to Firefox Sidebar API | Must | F6 |
| FR-12.3 | Use `browser.tabs.captureVisibleTab()` for Firefox screenshots | Must | F6 |
| FR-12.4 | Verify core functionality in Firefox 120+ | Must | F6 |
| FR-12.5 | Publish to Firefox Add-ons (AMO) | Must | F6 |
| FR-12.6 | Adapt keyboard shortcuts to Firefox conventions | Should | F6 |
| FR-13.1 | Detect PII patterns in DOM text | Must | F7 |
| FR-13.2 | Apply CSS blur overlay for PII redaction | Must | F7 |
| FR-13.3 | Mark PII regions in step metadata for review | Should | F7 |
| FR-13.4 | User toggle for auto-redaction | Must | F7 |
| FR-13.5 | Manual redaction tool (blur rectangles) | Should | F7 |
| FR-14.1 | Export as Claude-ready prompt for shortcut import | Must | F8 |
| FR-14.2 | Use AI provider to summarize steps | Must | F8 |
| FR-14.3 | Include page context in generated prompt | Should | F8 |
| FR-14.4 | Format as numbered procedure with action verbs | Must | F8 |
| FR-15.1 | Import `.sop-recorder.json` file | Must | F9 |
| FR-15.2 | Export in `.sop-recorder.json` format | Must | F9 |
| FR-15.3 | Merge two recordings | Should | F9 |
| FR-15.4 | Validate imported data against schema | Must | F9 |
| FR-16.1 | Claude Code skill configuration | Must | F10 |
| FR-16.2 | Expose SOP data via MCP server to Claude Code | Must | F10 |
| FR-16.3 | Skill prompts for common SOP operations | Should | F10 |
| FR-16.4 | Generate Playwright test skeleton from RecordedStep[] | Should | F10 |

### FR Coverage Map (v2)

| Epic | Requirements Covered |
|------|---------------------|
| E9: Multi-Format Export | FR-7.1–7.8, FR-8.1–8.8 |
| E10: pnpm Workspace Refactor | FR-9.10 |
| E11: MCP Server Integration | FR-9.1–9.9 |
| E12: AI Step Enhancement | FR-10.1–10.10 |
| E13: Screenshot Annotation | FR-11.1–11.11 |
| E14: Cross-Browser Support | FR-12.1–12.6 |
| E15: Advanced Features (v2.1) | FR-13.1–13.5, FR-14.1–14.4, FR-15.1–15.4 |
| E16: Claude Code Integration | FR-16.1–16.4 |

## Epic List

| Epic | Title | Stories | Release | Priority |
|------|-------|---------|---------|----------|
| E9 | Multi-Format Export | 4 | v1.1 / v2.0 | Must |
| E10 | pnpm Workspace Refactor | 3 | v2.0 | Must |
| E11 | MCP Server Integration | 6 | v2.0 | Must |
| E12 | AI Step Enhancement (BYOK) | 6 | v2.0 | Must |
| E13 | Screenshot Annotation Editor | 6 | v2.0 | Should |
| E14 | Cross-Browser Support (Firefox) | 3 | v2.0 | Should |
| E15 | Advanced Features | 6 | v2.1 | Should |
| E16 | Claude Code Integration | 2 | v3.0 | Could |

**Total: 8 epics, 36 stories**

---

## Epic 9: Multi-Format Export (v1.1 + v2.0)

**Goal:** Extend the export pipeline with self-contained HTML export (v1.1 quick follow-up) and interactive Driver.js tour export (v2.0), enabling "record once, deploy everywhere."

**Dependencies:** E6 (existing export engine and zip-exporter pattern).

**Definition of Done:**
- HTML export produces a fully self-contained file viewable offline in any browser
- Tour export produces a functional Driver.js configuration
- Both export options available in the editor UI alongside existing ZIP export
- Unit tests cover all exporter functions
- Export generation meets performance targets (HTML < 2s for 10 steps, Tour < 200ms)

### Story 9.1: Implement HTML Exporter Core

As a developer,
I want an `exportAsHtml()` function that generates a self-contained HTML file from a Recording,
So that users can share SOPs as standalone HTML documents viewable in any browser.

**Acceptance Criteria:**

**Given** the existing export pipeline pattern (`zip-exporter.ts`)
**When** `src/core/export/html-exporter.ts` is implemented
**Then** `exportAsHtml(recording, fetchBlob)` returns `{ blob: Blob, filename: string }`
**And** the HTML file embeds all screenshots as `<img src="data:image/jpeg;base64,...">` data URIs
**And** all user-editable content (title, description) is HTML-escaped via `escapeHtml()` utility
**And** inline CSS includes PicoCSS-inspired semantic styles (no external stylesheet references)
**And** `@media (prefers-color-scheme: dark)` provides dark mode styling
**And** `@media print` provides print-friendly styles with page breaks between steps
**And** the HTML includes a metadata header: title, date, step count
**And** the exported file contains zero `<script>` tags (static HTML + CSS only)
**And** `escapeHtml()` is extracted to `src/core/export/html-sanitizer.ts` for reuse
**And** unit tests verify: output structure, XSS prevention (`<script>` in title renders as text), base64 embedding, print styles present
**And** export completes in < 500ms for 10 steps, < 2 seconds for 50 steps

**Technical notes:**
- Mirror the `exportAsZip()` function signature: `(recording: Recording, fetchBlob: BlobFetcher) => Promise<{ blob: Blob; filename: string }>`
- Use `FileReader.readAsDataURL()` or `btoa()` for base64 conversion
- Template via string interpolation, no template engine dependency
- Key files: `src/core/export/html-exporter.ts`, `src/core/export/html-sanitizer.ts`

**Estimated effort:** S (1-2 hours)

**Dependencies:** None (uses existing patterns)

---

### Story 9.2: Add HTML Export Button to Editor UI

As a developer,
I want an "Export as HTML" option alongside the existing "Export as ZIP" in the editor view,
So that users can choose their preferred export format.

**Acceptance Criteria:**

**Given** the `sop-editor.ts` component with existing ZIP export
**When** HTML export is added to the export UI
**Then** the export area shows both "Export as ZIP" and "Export as HTML" buttons
**And** clicking "Export as HTML" dispatches `EXPORT_RECORDING` with `format: 'html'`
**And** the background service worker handles the `'html'` format by calling `exportAsHtml()`
**And** the download adapter triggers a file download with the generated `.html` file
**And** the `ExportFormat` type in `src/core/types.ts` is extended to include `'html'`
**And** the export dispatch in `background.ts` routes `'html'` format to the html-exporter
**And** E2E test in `export-formats.spec.ts` verifies: HTML export button is visible, clickable, and produces no error alert (mirrors existing ZIP export E2E pattern)

**Technical notes:**
- Extend `ExportFormat` type union: `'markdown-zip' | 'html'`
- Add export dispatch case in background service worker
- Use Lucide `file-text` icon for HTML export button
- E2E test pattern: see `critical-path.spec.ts:46-52` for the ZIP export button verification approach
- Key files: `src/core/types.ts`, `src/components/sop-editor.ts`, `src/entrypoints/background.ts`, `tests/e2e/export-formats.spec.ts`

**Estimated effort:** S (1 hour)

**Dependencies:** Story 9.1

---

### Story 9.3: Implement Tour Exporter Core

As a developer,
I want `exportAsDriverJs()` and helper functions that generate a Driver.js tour configuration from a Recording,
So that users can create interactive product tours from their recorded SOPs.

**Acceptance Criteria:**

**Given** the Recording type with selectors, bounding box, and viewport data
**When** `src/core/export/tour-exporter.ts` is implemented
**Then** `exportAsDriverJs(recording)` returns `{ blob: Blob, filename: string }`
**And** each `RecordedStep` maps to a Driver.js step with `element`, `popover.title`, `popover.description`, and `popover.side`
**And** `selectBestSelector(step)` selects the most robust selector: `#id` > `[data-testid]` > `[aria-label]` CSS attribute selector > positional CSS selector > `undefined` (centered modal)
**And** `inferTooltipPosition(boundingBox, viewport)` calculates optimal popover placement:
  - Element in top 30% of viewport: `'bottom'`
  - Element in bottom 30%: `'top'`
  - Element in left 30%: `'right'`
  - Element in right 30%: `'left'`
  - Default: `'bottom'`
**And** `groupStepsByPath(steps)` groups steps by `pageUrl` pathname
**And** cross-page transitions include JS comments warning that Driver.js does not support multi-page tours
**And** the exported file includes Driver.js CDN `<script>` and `<link>` tags plus initialization boilerplate
**And** the exported file includes a version comment: `/* Generated by SOP Recorder */`
**And** unit tests cover: selector priority, tooltip positioning for all quadrants, cross-page grouping, empty recording

**Technical notes:**
- Driver.js CDN: `https://cdn.jsdelivr.net/npm/driver.js/dist/driver.js.min.js`
- Exported file is a ready-to-paste HTML snippet with `<script>` initializing the tour
- No runtime dependency added to the extension — Driver.js is referenced via CDN in the export
- Key files: `src/core/export/tour-exporter.ts`, `src/core/types.ts` (add `TourStep`, `DriverJsConfig`, `TooltipPosition` types)

**Estimated effort:** M (2-3 hours)

**Dependencies:** None

---

### Story 9.4: Add Tour Export UI + Format Selection

As a developer,
I want a "Export as Tour (Driver.js)" option in the editor export area with an explanatory tooltip,
So that users can generate interactive tours and understand what the format does.

**Acceptance Criteria:**

**Given** the `sop-editor.ts` component with ZIP and HTML export options
**When** tour export UI is added
**Then** the export area shows three options: "Export as ZIP", "Export as HTML", "Export as Tour (Driver.js)"
**And** the tour export button includes a brief description: "Creates an interactive walkthrough overlay. Paste into your app to guide users step-by-step."
**And** if the recording spans multiple pages (distinct `pageUrl` values), a warning is shown: "This recording covers multiple pages. The tour will work best when loaded on the starting page."
**And** clicking the tour button dispatches `EXPORT_RECORDING` with `format: 'driverjs-json'`
**And** the `ExportFormat` type includes `'driverjs-json'`
**And** the background service worker routes `'driverjs-json'` to `exportAsDriverJs()`

**Technical notes:**
- Use Lucide `play-circle` icon for tour export
- Multi-page detection: `new Set(recording.steps.map(s => new URL(s.pageUrl).pathname)).size > 1`
- Key files: `src/components/sop-editor.ts`, `src/core/types.ts`, `src/entrypoints/background.ts`

**Estimated effort:** S (1 hour)

**Dependencies:** Story 9.2, Story 9.3

---

## Epic 10: pnpm Workspace Refactor

**Goal:** Restructure the project into a pnpm workspace monorepo so that `src/core/` can be shared between the Chrome extension and the MCP server as `@sop-recorder/core`.

**Dependencies:** E1-E8 (all v1 code complete).

**Definition of Done:**
- Project is a pnpm workspace with `packages/core/`, `packages/extension/`, and workspace root
- Extension builds and runs identically to pre-refactor
- All existing unit tests pass
- All existing E2E tests pass
- `@sop-recorder/core` is importable from other workspace packages

### Story 10.1: Extract src/core/ into packages/core Shared Package

As a developer,
I want to extract all pure TypeScript core modules into a `packages/core/` workspace package,
So that the core logic can be consumed by both the extension and the MCP server.

**Acceptance Criteria:**

**Given** the current project with core modules in `src/core/`
**When** the workspace restructure is performed
**Then** `pnpm-workspace.yaml` is created with `packages: ['packages/*']`
**And** `packages/core/package.json` defines `"name": "@sop-recorder/core"` with `"type": "module"`
**And** `packages/core/tsconfig.json` extends a shared base config
**And** all files from `src/core/` are moved to `packages/core/src/`: `types.ts`, `recording-state-machine.ts`, `step-manager.ts`, `event-filter.ts`, `selector-generator.ts`, `logger.ts`, `export-engine.ts`, `zip-exporter.ts`
**And** adapter interfaces (`src/adapters/interfaces/index.ts`) are moved to `packages/core/src/adapters/interfaces/index.ts`
**And** `packages/core/src/index.ts` re-exports all public API
**And** `packages/core/` compiles with `tsc --noEmit` with zero errors
**And** a structural verification test (`packages/core/tests/exports.test.ts`) imports from `@sop-recorder/core` and asserts all expected public exports are defined (types, functions, adapter interfaces)
**And** each workspace package has its own `vitest.config.ts` configured for its test directory

**Technical notes:**
- Keep `packages/core/` as a TypeScript source package (no build step needed — consumers compile it)
- Use `"exports"` field in package.json pointing to `"./src/index.ts"` for workspace consumers
- Adapter interfaces are part of core because they define the ports, not the implementations
- The structural verification test prevents silent breakage of re-exports during refactoring
- Key files: `pnpm-workspace.yaml`, `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/index.ts`, `packages/core/vitest.config.ts`, `packages/core/tests/exports.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** None

---

### Story 10.2: Update Extension to Consume from packages/core

As a developer,
I want the extension code to import from `@sop-recorder/core` instead of relative `../core/` paths,
So that the extension package is decoupled and ready for the workspace architecture.

**Acceptance Criteria:**

**Given** the core package from Story 10.1
**When** the extension is migrated to `packages/extension/`
**Then** `packages/extension/package.json` declares `"@sop-recorder/core": "workspace:*"` as a dependency
**And** all imports of `../core/...` and `../../core/...` are updated to `@sop-recorder/core`
**And** all imports of `../adapters/interfaces/...` are updated to `@sop-recorder/core`
**And** `wxt.config.ts` is updated with correct paths for the new directory structure
**And** `vitest.config.ts` alias configuration is updated if needed
**And** `pnpm run dev` starts the extension successfully from the workspace root
**And** `pnpm run build` produces a working extension build

**Technical notes:**
- Run `pnpm install` after package.json changes to link workspace packages
- WXT `srcDir` may need adjustment depending on new directory layout
- Consider keeping `wxt.config.ts` at `packages/extension/` level
- Key files: `packages/extension/package.json`, `packages/extension/wxt.config.ts`, all `*.ts` files with core imports

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 10.1

---

### Story 10.3: Verify All Existing Tests Pass After Refactor

As a developer,
I want to confirm that all unit tests and E2E tests pass in the new workspace structure,
So that the refactor introduces zero regressions.

**Acceptance Criteria:**

**Given** the workspace refactor from Stories 10.1-10.2
**When** all test suites are executed
**Then** `pnpm run test:unit` passes with the same test count as before refactor
**And** `pnpm run test:e2e` passes with the same test count as before refactor
**And** `pnpm run lint` passes with zero new warnings
**And** `pnpm run build` produces extension output with identical manifest
**And** workspace root `package.json` includes convenience scripts: `"test:unit"`, `"test:e2e"`, `"build"`, `"dev"`, `"lint"`
**And** CI pipeline (`.github/workflows/ci.yml`) is updated for workspace structure if needed

**Technical notes:**
- May need to update test path configurations in `vitest.config.ts` and `playwright.config.ts`
- Ensure coverage paths are correct after file moves
- Key files: root `package.json`, `packages/extension/vitest.config.ts`, `packages/extension/playwright.config.ts`, `.github/workflows/ci.yml`

**Estimated effort:** S (1-2 hours)

**Dependencies:** Story 10.2

---

## Epic 11: MCP Server Integration

**Goal:** Implement a standalone MCP server that exposes SOP Recorder data to AI assistants (Claude Desktop, Cline, etc.) via the Model Context Protocol, connected to the extension through Chrome Native Messaging.

**Dependencies:** E10 (pnpm workspace for shared core), E9 (export formats for `sop_export` tool).

**Definition of Done:**
- MCP server starts and responds to `sop_list`, `sop_read`, `sop_export`, `sop_search` tool calls
- Extension syncs recordings to `~/.sop-recorder/` via native messaging on save
- Installation script registers the native messaging host on macOS, Windows, and Linux
- MCP server works with Claude Desktop via stdio transport
- Unit tests cover all MCP tools and file adapters

### Story 11.1: Implement FileStorageAdapter + FileBlobStore

As a developer,
I want filesystem-backed implementations of `IStorageAdapter` and `IBlobStore`,
So that the MCP server can read SOP recordings from `~/.sop-recorder/` on disk.

**Acceptance Criteria:**

**Given** the adapter interfaces from `@sop-recorder/core`
**When** `packages/mcp-server/src/adapters/file-storage-adapter.ts` and `file-blob-store.ts` are implemented
**Then** `FileStorageAdapter` reads/writes recording JSON to `~/.sop-recorder/recordings/{id}.json`
**And** `FileStorageAdapter.listRecordings()` reads from `~/.sop-recorder/index.json` and returns metadata sorted by date
**And** `FileStorageAdapter.saveRecording()` writes the JSON file and updates `index.json`
**And** `FileStorageAdapter.deleteRecording()` removes the JSON file, associated screenshots, and updates `index.json`
**And** `FileStorageAdapter.getSessionState()` returns `null` (not applicable for MCP)
**And** `FileBlobStore.put(key, blob)` writes to `~/.sop-recorder/screenshots/{key}.jpg`
**And** `FileBlobStore.get(key)` reads from disk and returns a `Blob` (or `null` if missing)
**And** `FileBlobStore.delete(key)` removes the file
**And** `FileBlobStore.getUsage()` sums file sizes in the screenshots directory
**And** both adapters auto-create directories if they do not exist
**And** unit tests cover all CRUD operations, missing file handling, and directory creation

**Technical notes:**
- Use `node:fs/promises` for async file I/O
- Use `node:path` and `node:os` for cross-platform paths: `path.join(os.homedir(), '.sop-recorder')`
- `Blob` is available in Node 18+ — no polyfill needed
- Key files: `packages/mcp-server/src/adapters/file-storage-adapter.ts`, `packages/mcp-server/src/adapters/file-blob-store.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 10.1

---

### Story 11.2: Implement MCP Server with sop_list + sop_read Tools

As a developer,
I want an MCP server that exposes `sop_list` and `sop_read` tools via stdio transport,
So that AI assistants can discover and read SOP recordings.

**Acceptance Criteria:**

**Given** `FileStorageAdapter` from Story 11.1
**When** `packages/mcp-server/src/server.ts` is implemented
**Then** the server uses `@modelcontextprotocol/sdk` with stdio transport
**And** `sop_list` tool accepts no arguments and returns all recordings with: id, title, createdAt, updatedAt, stepCount
**And** `sop_read` tool accepts `{ recordingId: string }` (validated with `zod`) and returns full recording data as structured JSON including step details and screenshot file paths
**And** `sop_read` returns a clear error if the recording ID is not found
**And** the server starts with `node packages/mcp-server/dist/server.js` (or `npx sop-recorder-mcp`)
**And** `packages/mcp-server/package.json` defines `"name": "@sop-recorder/mcp-server"`, `"bin"` entry, and dependencies on `@modelcontextprotocol/sdk` and `zod`
**And** server startup time is < 1 second
**And** `sop_list` response time is < 200ms for 100 recordings
**And** unit tests mock the filesystem and verify tool responses
**And** an integration test (`packages/mcp-server/tests/integration/server.test.ts`) spawns the server as a child process, connects via `@modelcontextprotocol/sdk` client, and validates `sop_list` and `sop_read` responses end-to-end over stdio transport
**And** `packages/mcp-server/vitest.config.ts` is configured with separate unit and integration test paths

**Technical notes:**
- Use `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- Use `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- Tool inputs validated with zod schemas
- Integration test: use `child_process.spawn()` + MCP SDK `Client` with `StdioClientTransport` to exercise the real server binary
- Key files: `packages/mcp-server/src/server.ts`, `packages/mcp-server/package.json`, `packages/mcp-server/tsconfig.json`, `packages/mcp-server/vitest.config.ts`, `packages/mcp-server/tests/integration/server.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 11.1

---

### Story 11.3: Implement sop_export + sop_search Tools

As a developer,
I want `sop_export` and `sop_search` MCP tools,
So that AI assistants can export SOPs to any format and search across recordings.

**Acceptance Criteria:**

**Given** the MCP server from Story 11.2
**When** `sop_export` and `sop_search` tools are added
**Then** `sop_export` accepts `{ recordingId: string, format: 'markdown-zip' | 'html' | 'driverjs-json' }` and returns the exported file path on disk
**And** `sop_export` uses the core export engine (`exportAsZip`, `exportAsHtml`, `exportAsDriverJs`) from `@sop-recorder/core`
**And** exported files are written to `~/.sop-recorder/exports/{filename}`
**And** `sop_search` accepts `{ query: string }` and performs case-insensitive substring matching across recording titles, step titles, and step descriptions
**And** `sop_search` returns matching recordings with highlighted match context
**And** `sop_export` response time is < 3 seconds for a 50-step SOP
**And** unit tests cover export format routing, search matching, and edge cases (empty query, no results)

**Technical notes:**
- Reuse `exportAsHtml`, `exportAsZip`, `exportAsDriverJs` from `@sop-recorder/core` — this validates the workspace sharing strategy
- Search is simple substring/regex, not full-text search engine
- Key files: `packages/mcp-server/src/server.ts` (add tools), `packages/mcp-server/src/search.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 11.2, Story 9.1, Story 9.3

---

### Story 11.4: Implement Native Messaging Host

As a developer,
I want a Node.js native messaging host that receives recordings from the Chrome extension and writes them to the filesystem,
So that the MCP server can access extension data without direct Chrome API access.

**Acceptance Criteria:**

**Given** the `FileStorageAdapter` and `FileBlobStore` from Story 11.1
**When** `packages/mcp-server/src/native-host/host.ts` is implemented
**Then** the host process reads length-prefixed JSON from stdin (Chrome native messaging protocol)
**And** on `SYNC_RECORDING` message: extracts recording JSON and base64-encoded screenshot blobs, writes to filesystem via `FileStorageAdapter.saveRecording()` and `FileBlobStore.put()`
**And** on `DELETE_RECORDING` message: removes recording and screenshots via adapter methods
**And** on `LIST_RECORDINGS` message: returns recording metadata list
**And** on `PING` message: responds with `{ type: 'OK' }`
**And** responses are written to stdout using length-prefixed JSON
**And** errors respond with `{ type: 'ERROR', error: string }` without crashing the host process
**And** `packages/mcp-server/src/native-host/manifest.json` defines the native messaging host configuration
**And** unit tests cover message parsing, each message type, and error handling
**And** unit tests specifically verify: little-endian uint32 length encoding, messages at the 1MB Chrome limit boundary, malformed length headers (truncated, zero-length, negative), partial stdin reads (chunked delivery), and UTF-8 multi-byte characters in JSON payloads

**Technical notes:**
- Chrome native messaging: 4-byte length prefix (little-endian uint32) + JSON payload
- Use `process.stdin` (binary mode) and `process.stdout` for I/O
- Base64 screenshot blobs: decode with `Buffer.from(base64, 'base64')` and wrap in `Blob`
- Host manifest `"type": "stdio"`, `"allowed_origins"` must include the extension ID
- Extract message framing logic into a pure `NativeMessageCodec` class for isolated unit testing
- Key files: `packages/mcp-server/src/native-host/host.ts`, `packages/mcp-server/src/native-host/codec.ts`, `packages/mcp-server/src/native-host/manifest.json`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 11.1

---

### Story 11.5: Add NativeSyncAdapter to Extension Background

As a developer,
I want a `NativeSyncAdapter` in the extension that syncs recordings to the native host on save,
So that the filesystem is kept up-to-date for MCP server access.

**Acceptance Criteria:**

**Given** the native messaging host from Story 11.4
**When** `packages/extension/src/adapters/chrome/native-sync-adapter.ts` is implemented
**Then** `NativeSyncAdapter` implements `INativeSyncAdapter` from `@sop-recorder/core`
**And** `isConnected()` attempts `chrome.runtime.connectNative('sop_recorder_host')` and returns `true` if the port opens without error
**And** `syncRecording(recording, blobs)` sends a `SYNC_RECORDING` message with recording JSON and base64-encoded blobs
**And** `disconnect()` disconnects the native messaging port
**And** the background service worker calls `nativeSyncAdapter.syncRecording()` after `storageAdapter.saveRecording()` (non-blocking — sync failure does not block the save)
**And** sync failure logs a warning but does not surface an error to the user
**And** if native host is not installed, `isConnected()` returns `false` and sync is silently skipped
**And** the extension manifest declares `"nativeMessaging"` permission
**And** unit tests verify: base64 blob conversion produces correct output, `SYNC_RECORDING` message structure matches native host expectations, `isConnected()` returns `false` when `connectNative` throws, sync failure does not propagate errors to callers

**Technical notes:**
- `chrome.runtime.connectNative()` throws if the native host is not registered — catch and return `false`
- Blobs converted to base64 via `FileReader.readAsDataURL()` before sending
- Sync is fire-and-forget from the user's perspective
- Extract blob-to-base64 conversion and message formatting into testable pure functions
- Key files: `packages/extension/src/adapters/chrome/native-sync-adapter.ts`, `packages/extension/src/entrypoints/background.ts`, `packages/extension/wxt.config.ts` (add permission)

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 11.4

---

### Story 11.6: Create Installation Script + Documentation

As a developer,
I want installation scripts that register the native messaging host on macOS, Windows, and Linux,
So that users can set up the MCP server integration with a single command.

**Acceptance Criteria:**

**Given** the native messaging host from Story 11.4
**When** `packages/mcp-server/scripts/install.sh` and `packages/mcp-server/scripts/install.ps1` are created
**Then** `install.sh` (macOS/Linux):
  - Copies the native messaging host manifest to `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/` (macOS) or `~/.config/google-chrome/NativeMessagingHosts/` (Linux)
  - Updates the manifest `"path"` field to the absolute path of the host executable
  - Verifies the registration by checking the manifest file exists
  - Prints success message with next steps
**And** `install.ps1` (Windows):
  - Writes a registry key at `HKCU\Software\Google\Chrome\NativeMessagingHosts\sop_recorder_host`
  - Copies the manifest to the appropriate location
  - Prints success message
**And** a "Test Connection" button concept is documented for future UI integration
**And** Claude Desktop configuration snippet is provided: `{ "mcpServers": { "sop-recorder": { "command": "node", "args": ["path/to/server.js"] } } }`
**And** README in `packages/mcp-server/README.md` documents installation steps, troubleshooting, and usage

**Technical notes:**
- Native host manifest path varies by OS — script must detect platform
- Extension ID must be known at install time — script can accept it as argument or use wildcard for development
- Key files: `packages/mcp-server/scripts/install.sh`, `packages/mcp-server/scripts/install.ps1`, `packages/mcp-server/README.md`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 11.4

---

## Epic 12: AI Step Enhancement (BYOK)

**Goal:** Add optional AI-powered enhancement of step titles and descriptions using user-provided API keys (OpenAI-compatible) or Chrome's built-in Gemini Nano, with a privacy-first consent flow.

**Dependencies:** None (can be developed in parallel with other v2 epics, uses existing adapter interfaces pattern).

**Definition of Done:**
- Users can configure an OpenAI-compatible API endpoint and key in settings
- "Enhance All Steps" produces improved titles and descriptions
- Privacy consent dialog appears before first external API call
- Chrome built-in AI works without configuration when available
- API key is never exported or logged
- Enhancement diff with accept/reject UI is functional
- Unit tests cover all providers, prompt building, and PII sanitization

### Story 12.1: Define IAIProvider Interface + AISettings Types

As a developer,
I want the AI-related type definitions and adapter interfaces,
So that all AI modules share a single source of truth for data shapes and provider contracts.

**Acceptance Criteria:**

**Given** the existing adapter interfaces in `@sop-recorder/core`
**When** AI-related types are added
**Then** `IAIProvider` interface is defined with: `readonly id: string`, `readonly name: string`, `isAvailable(): Promise<boolean>`, `enhanceStep(step): Promise<AIEnhancementResult>`, `enhanceBatch(steps): Promise<AIEnhancementResult[]>`
**And** `AIEnhancementResult` is defined with: `title: string`, `description: string`
**And** `AISettings` is defined with: `provider: 'openai' | 'chrome-ai' | 'none'`, `apiKey?: string`, `apiEndpoint?: string`, `model?: string`, `autoEnhance: boolean`, `consentGiven: boolean`
**And** `IAISettingsAdapter` is defined with: `getSettings(): Promise<AISettings>`, `saveSettings(settings): Promise<void>`, `clearApiKey(): Promise<void>`
**And** `StepEnhancementInput` type strips sensitive fields: includes only `sequenceNumber`, `title`, `description`, `type`, `accessibleName`, `tagName`, `pageUrl`, `pageTitle`
**And** all types are exported from `@sop-recorder/core`
**And** types compile with zero errors in strict mode

**Technical notes:**
- Add types to `packages/core/src/types.ts` or create `packages/core/src/ai-types.ts`
- `IAIProvider` and `IAISettingsAdapter` go in `packages/core/src/adapters/interfaces/index.ts`
- Key files: `packages/core/src/types.ts`, `packages/core/src/adapters/interfaces/index.ts`

**Estimated effort:** S (1 hour)

**Dependencies:** Story 10.1

---

### Story 12.2: Implement OpenAI-Compatible Provider

As a developer,
I want an `OpenAIProvider` that calls any OpenAI-compatible API endpoint to enhance step titles and descriptions,
So that users can use OpenAI, OpenRouter, local LLMs, or any compatible endpoint.

**Acceptance Criteria:**

**Given** the `IAIProvider` interface from Story 12.1
**When** `packages/extension/src/adapters/ai/openai-provider.ts` is implemented
**Then** `OpenAIProvider` implements `IAIProvider` with `id: 'openai'`
**And** `isAvailable()` returns `true` if an API key is configured (non-empty)
**And** `enhanceBatch(steps)` calls the configured endpoint using native `fetch()` with:
  - `POST` to `{apiEndpoint}/chat/completions`
  - `Authorization: Bearer {apiKey}` header
  - `response_format: { type: 'json_object' }` for structured output
  - `temperature: 0.3` for consistent results
  - System prompt: "You are a technical writer. Improve step titles and descriptions for an SOP document. Be concise. Return JSON array: [{title, description}]"
**And** the user prompt includes sanitized step data (via `prompt-builder.ts` from Story 12.4)
**And** response is parsed and validated — malformed responses fall back to original step data
**And** API key is never logged to console or included in error messages
**And** network errors surface a user-friendly message: "AI enhancement failed. Your steps are unchanged."
**And** unit tests mock `fetch()` and verify request format, response parsing, and error handling
**And** unit tests verify API key is never present in: error messages thrown, error objects caught, or console output (mock `console.error`/`console.warn` and assert API key string is absent from all logged arguments)

**Technical notes:**
- No new dependencies — uses native `fetch()`
- Default model: `gpt-4o-mini`, configurable via `AISettings.model`
- Default endpoint: `https://api.openai.com/v1`, configurable via `AISettings.apiEndpoint`
- Extension requires `optional_host_permissions` for the configured endpoint URL
- API key leak test: set API key to a unique sentinel string, trigger error paths, assert sentinel never appears in caught errors or console spy call args
- Key files: `packages/extension/src/adapters/ai/openai-provider.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 12.1

---

### Story 12.3: Implement Chrome Built-in AI Provider

As a developer,
I want a `ChromeAIProvider` that uses Chrome's built-in Gemini Nano for fully offline AI enhancement,
So that users can enhance step quality without sending any data to external servers.

**Acceptance Criteria:**

**Given** the `IAIProvider` interface from Story 12.1
**When** `packages/extension/src/adapters/ai/chrome-ai-provider.ts` is implemented
**Then** `ChromeAIProvider` implements `IAIProvider` with `id: 'chrome-ai'`
**And** `isAvailable()` checks `typeof globalThis.LanguageModel !== 'undefined'` and `LanguageModel.capabilities().available === 'readily'`
**And** `enhanceBatch(steps)` creates a language model session and processes steps in chunks of 5 (Chrome AI has smaller context windows)
**And** each chunk uses the same system prompt as the OpenAI provider
**And** the session is destroyed after use: `session.destroy()`
**And** if Chrome AI is not available, `isAvailable()` returns `false` gracefully
**And** enhancement errors for individual chunks do not block other chunks — failed chunks keep original step data
**And** unit tests mock `globalThis.LanguageModel` and verify chunked processing

**Technical notes:**
- Chrome 131+ exposes `LanguageModel` API (previously `window.ai`)
- Chrome AI may be slow — enhancement latency target is < 30 seconds for 20 steps
- No network permissions needed
- Key files: `packages/extension/src/adapters/ai/chrome-ai-provider.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 12.1

---

### Story 12.4: Implement AI Enhancement Service + Prompt Builder

As a developer,
I want an `AIEnhancementService` that orchestrates provider selection and a `PromptBuilder` that sanitizes step data before sending to AI,
So that AI enhancement is provider-agnostic and PII is never sent to external APIs.

**Acceptance Criteria:**

**Given** the providers from Stories 12.2-12.3
**When** `packages/core/src/ai-enhancement-service.ts` and `packages/core/src/prompt-builder.ts` are implemented
**Then** `AIEnhancementService.enhanceRecording(recording)` reads settings via `IAISettingsAdapter`, selects the configured provider, and calls `enhanceBatch()`
**And** if provider is `'none'` or consent is not given, returns the recording unchanged
**And** if the provider is unavailable, returns the recording unchanged (graceful degradation)
**And** `sanitizeStepForAI(step)` strips: `screenshotBlobKey`, `thumbnailDataUrl`, `boundingBox`, `clickCoordinates`, `scrollPosition`, `viewport`
**And** `sanitizeStepForAI(step)` redacts: `inputValue` replaced with `"[user input]"`, `pageUrl` query params stripped
**And** `buildBatchPrompt(sanitizedSteps)` constructs an OpenAI-compatible messages array with system and user messages
**And** `detectPII(text)` returns matches for email, phone, SSN, and credit card patterns via regex
**And** PII detection results are surfaced to the caller (for UI warning), but do not block enhancement
**And** unit tests cover: sanitization (verify excluded fields), PII detection (true positives and negatives), prompt structure, and full enhancement flow

**Technical notes:**
- Core module — no Chrome API dependencies
- PII patterns: email `/\S+@\S+\.\S+/`, phone `/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/`, SSN `/\b\d{3}-\d{2}-\d{4}\b/`, credit card `/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/`
- Key files: `packages/core/src/ai-enhancement-service.ts`, `packages/core/src/prompt-builder.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 12.1

---

### Story 12.5: Implement Settings UI Component (sop-settings.ts)

As a developer,
I want a `<sop-settings>` Lit component for AI provider configuration,
So that users can set up their API key, select a provider, and test the connection.

**Acceptance Criteria:**

**Given** the UI patterns from existing components and `AISettings` types
**When** `packages/extension/src/components/sop-settings.ts` is implemented
**Then** the component renders a card-based settings panel consistent with existing UI vocabulary
**And** a provider selector shows: "None (disabled)", "Chrome Built-in AI (Gemini Nano)", "OpenAI-Compatible API"
**And** "Chrome Built-in AI" is shown only if `ChromeAIProvider.isAvailable()` returns `true`
**And** when "OpenAI-Compatible API" is selected:
  - API Endpoint URL input (default: `https://api.openai.com/v1`)
  - API Key input (password-masked, with show/hide toggle via Lucide `eye` / `eye-off` icons)
  - Model name input (default: `gpt-4o-mini`)
  - "Test Connection" button that sends a minimal request and shows success/failure
**And** connection status indicator: untested (gray), success (green check), failed (red X)
**And** "Auto-enhance on recording stop" toggle
**And** settings are persisted via `IAISettingsAdapter.saveSettings()`
**And** a "Clear API Key" button with confirmation
**And** navigation to settings is accessible from a gear icon in the `sop-app` header
**And** back button returns to the previous view
**And** the component uses light DOM, `--sop-*` CSS variables, and Lucide icons
**And** unit tests (using `@open-wc/testing` or equivalent Lit test harness) verify:
  - Component renders provider selector with correct options
  - "Chrome Built-in AI" option is hidden when `ChromeAIProvider.isAvailable()` returns `false`
  - Selecting "OpenAI-Compatible API" reveals API key, endpoint, and model inputs
  - API key input is `type="password"` by default, toggles to `type="text"` on show/hide click
  - "Test Connection" button calls the provider and displays success (green check) or failure (red X) indicator
  - "Clear API Key" button requires confirmation before clearing
  - Settings are persisted via adapter mock on form submission

**Technical notes:**
- Follow existing component patterns: `createRenderRoot() { return this; }`, PicoCSS semantic HTML
- Use `<article>` for card containers, `<fieldset>` for form groups
- AI settings adapter: `packages/extension/src/adapters/chrome/ai-settings-adapter.ts` (stores in `chrome.storage.local` under key `sop_ai_settings`)
- Lit component testing: use `fixture(html`<sop-settings></sop-settings>`)` + `@open-wc/testing` for rendering, or use vitest + jsdom with manual element creation
- Key files: `packages/extension/src/components/sop-settings.ts`, `packages/extension/src/adapters/chrome/ai-settings-adapter.ts`, `packages/extension/src/components/sop-app.ts` (add settings navigation), `tests/unit/components/sop-settings.test.ts`

**Estimated effort:** L (3 hours)

**Dependencies:** Story 12.1, Story 12.2, Story 12.3

---

### Story 12.6: Add Enhance Buttons to Editor + Privacy Consent Flow

As a developer,
I want an "Enhance with AI" button in the editor view with a privacy consent modal that appears before the first AI call,
So that users can improve their step descriptions with AI while being fully informed about data sharing.

**Acceptance Criteria:**

**Given** the `AIEnhancementService` from Story 12.4 and settings from Story 12.5
**When** AI enhancement UI is added to `sop-editor.ts`
**Then** an "Enhance with AI" button (Lucide `sparkles` icon) appears in the editor toolbar when a provider is configured
**And** clicking the button for the first time triggers a privacy consent modal:
  - Modal is not dismissable by clicking outside
  - Shows what data WILL be sent: step titles, descriptions, element names, page URLs
  - Shows what will NOT be sent: screenshots, API keys
  - Checkbox: "I understand that step text data will be sent to [endpoint URL]"
  - "Allow" / "Cancel" buttons
  - Consent is stored in `AISettings.consentGiven`
**And** if consent was previously given for the same endpoint, the modal does not appear
**And** if the endpoint changes, consent must be re-obtained
**And** during enhancement, a progress indicator replaces the button
**And** results are shown as inline diff: original text with strikethrough, enhanced text highlighted
**And** per-step "Accept" (check) / "Reject" (X) buttons with Lucide icons
**And** "Accept All" / "Reject All" bulk action buttons
**And** if PII is detected in step data, a warning appears before sending: "Potential PII detected: {matches}. Proceed anyway?"
**And** enhancement failure preserves original step data with an error toast
**And** unit tests for `sop-consent-dialog.ts` verify:
  - Dialog is non-dismissable (clicking outside does not close it)
  - "Allow" button is disabled until the consent checkbox is checked
  - Consent stores the endpoint URL so re-consent is required on endpoint change
**And** E2E test in `ai-enhancement.spec.ts` verifies:
  - "Enhance with AI" button is visible when provider is configured
  - Consent dialog appears on first click (mock AI endpoint)
  - After consent, enhancement diff view renders with accept/reject buttons
  - "Accept All" applies changes, "Reject All" preserves originals

**Technical notes:**
- Privacy consent modal: use `<dialog>` element (native modal behavior)
- Diff view: `<del>` for original, `<ins>` for enhanced (PicoCSS styles these)
- Wire up `AIEnhancementService` via the background service worker — enhancement runs in background context for `fetch()` access
- E2E test: use Playwright route interception to mock the AI API endpoint response
- Key files: `packages/extension/src/components/sop-editor.ts`, `packages/extension/src/components/sop-consent-dialog.ts` (new), `packages/extension/src/entrypoints/background.ts`, `tests/unit/components/sop-consent-dialog.test.ts`, `tests/e2e/ai-enhancement.spec.ts`

**Estimated effort:** L (3 hours)

**Dependencies:** Story 12.4, Story 12.5

---

## Epic 13: Screenshot Annotation Editor

**Goal:** Add a non-destructive SVG overlay annotation system that lets users draw arrows, shapes, and text on screenshots, with annotations composited into exports.

**Dependencies:** None (self-contained feature, integrates with export pipeline at the end).

**Definition of Done:**
- Users can add arrows, rectangles, ellipses, text, and freehand annotations to screenshots
- Annotations persist across browser sessions (stored in recording JSON)
- Undo/redo stack supports at least 20 actions
- Exported files (ZIP, HTML, Tour) include composited screenshots with annotations
- Annotation editor is usable at 400px side panel width
- Annotation rendering maintains 60fps during drawing

### Story 13.1: Define Annotation Data Model + Types

As a developer,
I want the annotation-related type definitions added to the core data model,
So that all annotation-related modules share consistent types and annotations are persisted with recordings.

**Acceptance Criteria:**

**Given** the existing `RecordedStep` type in `@sop-recorder/core`
**When** annotation types are added to `packages/core/src/types.ts`
**Then** `AnnotationTool` type is defined: `'arrow' | 'rect' | 'ellipse' | 'text' | 'freehand'`
**And** `AnnotationBase` interface includes: `id: string` (UUID), `tool: AnnotationTool`, `color: string` (hex), `strokeWidth: number` (normalized 0-1)
**And** `ArrowAnnotation` extends base with: `x1, y1, x2, y2` (normalized 0-1 coordinates)
**And** `RectAnnotation` extends base with: `x, y, width, height` (normalized 0-1)
**And** `EllipseAnnotation` extends base with: `cx, cy, rx, ry` (normalized 0-1)
**And** `TextAnnotation` extends base with: `x, y, text: string, fontSize: number` (normalized 0-1)
**And** `FreehandAnnotation` extends base with: `points: Array<{ x: number; y: number }>` (normalized 0-1)
**And** `Annotation` is a discriminated union of all annotation types
**And** `AnnotationLayer` interface: `{ annotations: Annotation[]; version: 1 }`
**And** `RecordedStep` gains optional `annotations?: AnnotationLayer` field
**And** all types compile with zero errors
**And** backward compatibility: existing recordings without annotations remain valid

**Technical notes:**
- Normalized coordinates (0-1) make annotations resolution-independent
- `version: 1` on `AnnotationLayer` enables future migration
- The optional field means no data migration is needed for existing recordings
- Key files: `packages/core/src/types.ts`

**Estimated effort:** S (1 hour)

**Dependencies:** Story 10.1

---

### Story 13.2: Implement SVG Annotation Editor Component

As a developer,
I want a `<sop-annotation-editor>` Lit component that renders an SVG overlay on a screenshot and handles tool selection, undo/redo, and annotation persistence,
So that users have a fully functional annotation editing interface.

**Acceptance Criteria:**

**Given** the annotation types from Story 13.1
**When** `packages/extension/src/components/sop-annotation-editor.ts` is implemented
**Then** the component renders a screenshot `<img>` with an absolutely-positioned `<svg viewBox="0 0 1 1">` overlay
**And** a toolbar appears above the screenshot: Arrow, Rectangle, Ellipse, Text, Freehand, Color picker, Undo, Redo, Done
**And** toolbar buttons use Lucide icons: `arrow-right` (arrow), `square` (rect), `circle` (ellipse), `type` (text), `pencil` (freehand)
**And** the active tool is visually highlighted
**And** existing annotations from `step.annotations` are rendered as SVG elements on component load
**And** pointer events on the SVG are captured and converted to normalized (0-1) coordinates via `normalizeCoordinates(clientX, clientY, containerRect)`
**And** undo/redo stack maintains at least 20 actions via an array of `AnnotationLayer` snapshots
**And** "Done" dispatches a custom event with the updated `AnnotationLayer`
**And** color picker offers: red (`#e53e3e`), blue (`#2563eb`), green (`#16a34a`), yellow (`#eab308`), white (`#ffffff`), black (`#000000`)
**And** default color is `--sop-recording-color` (red)
**And** `@media (hover: none)` provides larger touch targets for toolbar buttons
**And** the component fills available side panel width and is usable at 400px
**And** unit tests verify:
  - `normalizeCoordinates(clientX, clientY, containerRect)` correctly converts pixel coords to 0-1 range for various container sizes and scroll offsets
  - Undo/redo stack: adding 25 annotations then undoing 20 produces correct state; redo after undo restores; new annotation after undo clears redo stack
  - Tool switching: selecting a tool updates `activeTool` property; switching mid-draw discards incomplete annotation
  - "Done" event dispatches with the current `AnnotationLayer` including all annotations

**Technical notes:**
- Light DOM rendering with `createRenderRoot() { return this; }`
- `<svg viewBox="0 0 1 1" preserveAspectRatio="none">` for normalized coordinate space
- Tool-specific drawing logic is delegated to Stories 13.3-13.4
- This story sets up the shell, toolbar, undo/redo, and coordinate system
- Extract `normalizeCoordinates()` and undo/redo stack logic into pure utility functions for isolated unit testing
- Key files: `packages/extension/src/components/sop-annotation-editor.ts`, `packages/extension/src/components/annotation-utils.ts`, `tests/unit/components/annotation-editor.test.ts`

**Estimated effort:** L (3 hours)

**Dependencies:** Story 13.1

---

### Story 13.3: Implement Arrow + Rectangle Tools

As a developer,
I want the arrow and rectangle drawing tools in the annotation editor,
So that users can point to elements and highlight areas in screenshots.

**Acceptance Criteria:**

**Given** the annotation editor shell from Story 13.2
**When** arrow and rectangle tools are implemented
**Then** **Arrow tool:**
  - `pointerdown` sets start point `(x1, y1)`
  - `pointermove` updates end point `(x2, y2)` with live preview
  - `pointerup` finalizes the arrow and adds to annotation layer
  - SVG renders as `<line>` with `marker-end="url(#arrowhead)"` (arrowhead defined in `<defs>`)
  - Minimum drag distance of 10px (normalized) to avoid accidental dots
**And** **Rectangle tool:**
  - `pointerdown` sets first corner `(x, y)`
  - `pointermove` updates width/height with live preview (outline only, no fill)
  - `pointerup` finalizes the rectangle and adds to annotation layer
  - SVG renders as `<rect>` with stroke color and `fill="none"`
  - Supports drawing in any direction (handles negative width/height)
**And** both tools respect the currently selected color and stroke width
**And** drawing maintains 60fps (no layout thrashing during `pointermove`)
**And** each completed annotation is pushed to the undo stack
**And** individual annotations can be deleted: click on an annotation to select it (dashed outline), then press Delete key or click a delete button
**And** unit tests verify:
  - Arrow: minimum drag distance filter prevents accidental dots; start/end coordinates are correctly normalized
  - Rectangle: negative dimensions (drag up-left) are normalized to positive width/height with adjusted origin
  - Both tools: produced annotation objects have correct `tool` type, `color`, and coordinate fields

**Technical notes:**
- Use `setPointerCapture()` on `pointerdown` for smooth drawing outside the SVG bounds
- Arrowhead marker: `<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" /></marker>`
- Negative rect dimensions: normalize by swapping origin and using absolute width/height
- Key files: `packages/extension/src/components/sop-annotation-editor.ts`, `tests/unit/components/annotation-tools.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 13.2

---

### Story 13.4: Implement Ellipse + Text + Freehand Tools

As a developer,
I want the ellipse, text, and freehand drawing tools in the annotation editor,
So that users have a complete set of annotation tools for different use cases.

**Acceptance Criteria:**

**Given** the annotation editor from Story 13.2
**When** ellipse, text, and freehand tools are implemented
**Then** **Ellipse tool:**
  - `pointerdown` sets bounding box origin
  - `pointermove` updates `rx` and `ry` with live preview (outline only)
  - `pointerup` finalizes and adds to annotation layer
  - SVG renders as `<ellipse>` with stroke color and `fill="none"`
**And** **Text tool:**
  - Click on the SVG places a text cursor at the click position
  - An `<input>` appears over the click position for typing
  - Enter or blur finalizes the text annotation
  - SVG renders as `<text>` at the specified position with the selected color
  - Font size is proportional to the annotation area (default: `0.03` normalized)
**And** **Freehand tool:**
  - `pointerdown` starts path recording
  - `pointermove` appends points to the path (throttled to every 3rd event for performance)
  - `pointerup` finalizes the path and adds to annotation layer
  - SVG renders as `<path>` with SVG path data (`M x1,y1 L x2,y2 L x3,y3 ...`)
  - Path simplification: Douglas-Peucker algorithm with tolerance of 0.002 (normalized) to reduce point count
**And** all tools respect the currently selected color
**And** each completed annotation is pushed to the undo stack
**And** unit tests verify:
  - Freehand: Douglas-Peucker simplification reduces a 100-point straight line to 2 points; preserves corners on an L-shaped path
  - Freehand: point throttling (every 3rd event) reduces recorded point count
  - Text: annotation stores correct normalized position and text content
  - Ellipse: bounding box to `cx, cy, rx, ry` conversion is correct for any drag direction

**Technical notes:**
- Text input overlay: position an `<input>` absolutely over the SVG at the click coordinates
- Freehand point throttling: use a counter rather than `requestAnimationFrame` for simplicity
- Douglas-Peucker: simple recursive implementation, ~20 lines — extract into `packages/core/src/douglas-peucker.ts` for pure unit testing
- Key files: `packages/extension/src/components/sop-annotation-editor.ts`, `packages/core/src/douglas-peucker.ts`, `tests/unit/core/douglas-peucker.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 13.2

---

### Story 13.5: Implement Annotation Compositor for Export

As a developer,
I want an `annotation-compositor.ts` module that composites SVG annotations onto screenshot bitmaps,
So that exported files include screenshots with baked-in annotations.

**Acceptance Criteria:**

**Given** the annotation types from Story 13.1
**When** `packages/core/src/export/annotation-compositor.ts` is implemented
**Then** `compositeAnnotations(screenshotBlob: Blob, annotations: AnnotationLayer): Promise<Blob>` renders annotations onto the screenshot
**And** the compositor uses `OffscreenCanvas` (or `Canvas` in Node.js) to:
  1. Draw the screenshot image
  2. Render each annotation element on top (arrows, rects, ellipses, text, freehand paths)
  3. Export the composited result as a JPEG blob
**And** arrow annotations render with arrowhead at the end point
**And** text annotations render with the correct font size (calculated from normalized size * image height)
**And** normalized coordinates (0-1) are scaled to actual image pixel dimensions
**And** output JPEG quality matches existing screenshot quality (85)
**And** compositing completes in < 200ms per screenshot
**And** if `OffscreenCanvas` is not available (Firefox, Node), fall back to `Canvas` or skip compositing gracefully
**And** unit tests verify compositing produces valid JPEG output with correct dimensions

**Technical notes:**
- `OffscreenCanvas` available in Chrome service worker context and modern Node.js
- Arrow rendering: draw line with `ctx.moveTo/lineTo` + calculate arrowhead triangle at end point using angle math
- Consider providing a Canvas-based fallback for environments without OffscreenCanvas
- Key files: `packages/core/src/export/annotation-compositor.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 13.1

---

### Story 13.6: Integrate Annotations with Export Pipeline + Thumbnails

As a developer,
I want the export pipeline to composite annotations onto screenshots before including them in exports, and the annotation editor to be accessible from the step card,
So that exported SOPs show annotated screenshots and users can reach the editor naturally.

**Acceptance Criteria:**

**Given** the compositor from Story 13.5 and the annotation editor from Stories 13.2-13.4
**When** annotations are integrated into the export pipeline and UI
**Then** `exportAsZip()`, `exportAsHtml()`, and `exportAsDriverJs()` check `step.annotations` for each step
**And** if annotations exist, `compositeAnnotations()` is called on the screenshot blob before including in export
**And** steps without annotations use the original screenshot blob (no compositing overhead)
**And** `sop-step-card.ts` in edit mode shows an "Annotate" button (Lucide `pen-tool` icon) on each step's screenshot thumbnail
**And** clicking "Annotate" opens the `<sop-annotation-editor>` for that step
**And** saving annotations updates the `RecordedStep.annotations` field and persists via the storage adapter
**And** thumbnails in the step card show annotation previews (re-render thumbnail with annotations overlaid)
**And** the editor stores annotation changes immediately (no separate save step)
**And** integration tests verify:
  - `exportAsZip()` with annotated step produces a ZIP where the screenshot file size is larger than the original (composited)
  - `exportAsHtml()` with annotated step produces base64 data URI that differs from the original screenshot
  - Steps without annotations produce identical output to pre-annotation behavior (no regression)
  - Compositor fallback: when `OffscreenCanvas` is unavailable, export gracefully includes original un-composited screenshots with a warning

**Technical notes:**
- Export pipeline modification: wrap `fetchBlob` to intercept steps with annotations and composite before returning
- Thumbnail annotation preview: render SVG annotations inline in the step card thumbnail (reuse the SVG overlay approach from the editor)
- Integration tests can use the existing `makeRecording`/`makeStep` helpers with annotations added
- Key files: `packages/core/src/export/export-engine.ts`, `packages/extension/src/components/sop-step-card.ts`, `packages/extension/src/components/sop-editor.ts`, `tests/unit/core/annotation-export.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 13.3, Story 13.4, Story 13.5, Story 9.1

---

## Epic 14: Cross-Browser Support (Firefox)

**Goal:** Build and validate a Firefox add-on using WXT's built-in cross-browser support, adapting the Side Panel to Firefox's Sidebar API.

**Dependencies:** E1-E8 (v1 feature-complete), ideally after E9 (so Firefox gets multi-format export too).

**Definition of Done:**
- Full Record -> Edit -> Export flow works in Firefox 120+
- Sidebar displays correctly in Firefox
- Screenshots capture correctly via Firefox API
- All existing E2E tests pass on Firefox
- Extension is publishable to AMO

### Story 14.1: Firefox Compatibility Audit + WXT Config

As a developer,
I want a comprehensive compatibility audit of all Chrome-specific APIs used in the extension and WXT build configuration for Firefox,
So that I know exactly what needs adaptation and can build a working Firefox extension.

**Acceptance Criteria:**

**Given** the v1 Chrome extension codebase
**When** a Firefox compatibility audit is performed
**Then** all Chrome-specific APIs are cataloged with their Firefox equivalents:
  - `chrome.sidePanel` -> `browser.sidebarAction`
  - `chrome.tabs.captureVisibleTab` -> `browser.tabs.captureVisibleTab`
  - `chrome.storage.session` -> `browser.storage.session` (Firefox 115+)
  - `chrome.scripting.executeScript` -> `browser.scripting.executeScript`
  - `chrome.downloads.download` -> `browser.downloads.download`
**And** `wxt.config.ts` is updated with Firefox-specific configuration using `defineConfig` browser targeting
**And** `manifest.json` differences are documented (Firefox requires `browser_specific_settings` with `gecko.id`)
**And** any APIs not supported in Firefox are identified with planned workarounds
**And** `pnpm run build:firefox` produces a Firefox-compatible extension
**And** the Firefox build loads successfully in Firefox Developer Edition

**Technical notes:**
- WXT handles most manifest conversion automatically via `--browser firefox`
- Add script: `"build:firefox": "wxt build --browser firefox"`
- Firefox keyboard shortcuts may differ — `Alt+Shift+R` may conflict with built-in shortcuts
- Key files: `packages/extension/wxt.config.ts`, `packages/extension/package.json`, root `package.json`

**Estimated effort:** M (2-3 hours)

**Dependencies:** None

---

### Story 14.2: Adapt Side Panel to Firefox Sidebar API

As a developer,
I want the side panel to work as a Firefox sidebar,
So that Firefox users have the same side-by-side SOP recording experience.

**Acceptance Criteria:**

**Given** the compatibility audit from Story 14.1
**When** sidebar adaptation is implemented
**Then** WXT's `defineSidebar()` or equivalent is used for Firefox sidebar registration
**And** the sidebar HTML entry point is shared with the Chrome side panel (`sidepanel/index.html`)
**And** `chrome.sidePanel.setPanelBehavior()` calls are wrapped in a browser-detection guard
**And** `browser.sidebarAction.setPanel()` is used for Firefox sidebar configuration
**And** the sidebar opens when the extension icon is clicked in Firefox
**And** all UI components render correctly in the Firefox sidebar at 400px width
**And** recording state sync between content script and sidebar works identically to Chrome
**And** a browser-detection utility is created: `isFirefox()` / `isChrome()` for conditional API calls
**And** `chrome.tabs.captureVisibleTab` is wrapped with Firefox-compatible behavior
**And** unit tests verify `isFirefox()` and `isChrome()` return correct values when `globalThis.browser` / `globalThis.chrome` are present/absent

**Technical notes:**
- Firefox sidebar uses `browser.sidebarAction` — different API surface but same concept
- WXT may handle this via its cross-browser abstraction — check WXT docs first
- Browser detection: `typeof browser !== 'undefined'` (Firefox) vs `typeof chrome !== 'undefined'` (Chrome)
- Extract browser detection into `packages/core/src/browser-detect.ts` for easy unit testing
- Key files: `packages/extension/src/entrypoints/sidepanel/`, `packages/extension/src/adapters/chrome/` (may need renaming to `browser/`), `packages/core/src/browser-detect.ts`, `tests/unit/core/browser-detect.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 14.1

---

### Story 14.3: Firefox E2E Test Setup + Validation

As a developer,
I want E2E tests running on Firefox via Playwright,
So that I can validate the full extension flow works correctly on Firefox.

**Acceptance Criteria:**

**Given** the Firefox-compatible extension from Stories 14.1-14.2
**When** Firefox E2E testing is configured
**Then** `playwright.config.ts` includes a Firefox project configuration
**And** the Firefox project uses Playwright's `firefox` browser type with web extension loading (if supported) or manual installation
**And** the core E2E test suite (record -> edit -> export) runs on Firefox
**And** Firefox-specific tests validate: sidebar opening, screenshot capture, keyboard shortcuts
**And** CI pipeline includes a Firefox test job (can be a separate workflow to avoid slowing Chrome tests)
**And** any Firefox-specific failures are documented with workarounds
**And** `pnpm run test:e2e:firefox` runs the Firefox test suite

**Technical notes:**
- Playwright Firefox extension testing may require different setup than Chrome
- Firefox uses `web-ext` tool for loading extensions in development
- May need `firefox.launchPersistentContext` with extension loading approach
- Key files: `packages/extension/playwright.config.ts`, `packages/extension/tests/e2e/`, `.github/workflows/ci.yml`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 14.2

---

## Epic 15: Advanced Features (v2.1)

**Goal:** Implement PII auto-redaction, Claude shortcut export, and recording import/merge — polish features that benefit from v2.0 infrastructure.

**Dependencies:** E12 (AI provider for Claude shortcut export), E13 (annotation patterns for redaction UI).

**Definition of Done:**
- PII patterns are detected and blurred in screenshots with user review
- Claude shortcut export produces coherent natural language prompts
- Recordings can be exported and imported via `.sop-recorder.json` format
- Two recordings can be merged into one
- All features have unit test coverage

### Story 15.1: PII Detection Engine (Regex-Based)

As a developer,
I want a PII detection module that identifies email addresses, phone numbers, SSN patterns, and credit card numbers in DOM text,
So that PII can be automatically flagged for redaction before screenshot capture.

**Acceptance Criteria:**

**Given** the content script capture flow
**When** `packages/core/src/pii-detector.ts` is implemented
**Then** `detectPII(text: string)` returns an array of `{ type: 'email' | 'phone' | 'ssn' | 'creditCard', value: string, startIndex: number, endIndex: number }`
**And** email detection matches `\S+@\S+\.\S+` pattern
**And** phone detection matches US formats: `(555) 123-4567`, `555-123-4567`, `5551234567`, `+1-555-123-4567`
**And** SSN detection matches `\d{3}-\d{2}-\d{4}` pattern
**And** credit card detection matches 4 groups of 4 digits with optional separators
**And** `scanDOMForPII(element: Element)` traverses visible text nodes and returns PII matches with their DOM positions (element + offset)
**And** false positive rate is below 10% for typical business application text
**And** the module has zero Chrome API dependencies (core module)
**And** unit tests cover: true positives for each PII type, false negatives, common false positives (e.g., order numbers that look like phone numbers), empty input

**Technical notes:**
- Regex-only approach — no ML or NLP libraries
- DOM scanning uses `TreeWalker` with `NodeFilter.SHOW_TEXT` for efficient traversal
- `scanDOMForPII` runs in the content script context
- Key files: `packages/core/src/pii-detector.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** None

---

### Story 15.2: CSS Blur Redaction Overlay

As a developer,
I want a CSS blur mechanism that redacts detected PII in the DOM before screenshot capture,
So that screenshots do not contain readable PII.

**Acceptance Criteria:**

**Given** the PII detector from Story 15.1
**When** PII redaction is integrated into the screenshot capture flow
**Then** before `captureVisibleTab()`, detected PII elements receive `filter: blur(10px)` via injected CSS
**And** the blur is applied to the nearest block-level ancestor of the PII text node (to avoid layout issues with inline blur)
**And** after `captureVisibleTab()`, the blur CSS is removed (same pattern as existing highlight overlay)
**And** `RecordedStep` gains an optional `redactedRegions?: Array<{ type: string, elementSelector: string }>` field for tracking what was redacted
**And** the redaction can be toggled on/off in settings via `IAISettingsAdapter` (or a separate settings key)
**And** redaction is opt-in (disabled by default)
**And** PII blur is destructive in the screenshot bitmap — the blurred pixels are the actual capture (not an overlay)
**And** unit tests verify blur application and removal lifecycle

**Technical notes:**
- Pattern mirrors the existing `injectOverlay` / `removeOverlay` flow from Story 3.4
- Apply blur before screenshot, remove after — timing is critical
- `filter: blur(10px)` on inline elements may not work well — wrap in `<span style="filter:blur(10px); display:inline-block">`
- Key files: `packages/extension/src/entrypoints/content.ts`, `packages/core/src/types.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 15.1

---

### Story 15.3: Redaction Review UI

As a developer,
I want a redaction review interface that shows users what was auto-redacted and lets them unredact false positives,
So that legitimate data is not accidentally hidden in SOPs.

**Acceptance Criteria:**

**Given** the PII detection and blur from Stories 15.1-15.2
**When** redaction review UI is added to the step card
**Then** steps with redacted regions show a "Redacted areas" badge with the count of redacted items
**And** clicking the badge expands a list showing each redacted region: type (email, phone, etc.) and the element context
**And** each redacted region has an "Unredact" toggle — toggling it marks the region as approved (not re-redacted on re-export)
**And** "Unredact" does not restore the original screenshot (pixels are already blurred) — it only prevents re-application if the step were re-captured
**And** a manual "Add Redaction" button lets users draw blur rectangles on screenshots (reuses annotation editor rectangle tool with blur fill instead of stroke)
**And** redaction decisions persist with the recording metadata
**And** unit tests verify:
  - Redaction badge renders with correct count of redacted items
  - "Unredact" toggle updates the redacted region's `approved` flag
  - Persisted redaction decisions survive component re-render (mock storage adapter)
  - Manual "Add Redaction" button only appears when annotation editor dependency is available

**Technical notes:**
- Redaction review is informational for screenshots already captured — the blur is baked into the bitmap
- Manual redaction uses the annotation compositor to apply blur rectangles on export
- Consider integrating with the annotation editor: a "Blur" tool alongside Arrow, Rectangle, etc.
- Key files: `packages/extension/src/components/sop-step-card.ts`, `packages/extension/src/components/sop-editor.ts`, `tests/unit/components/redaction-review.test.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 15.2, Story 13.2

---

### Story 15.4: Claude Shortcut Export

As a developer,
I want to export a recording as a Claude-ready natural language prompt,
So that users can import it as a Claude Chrome shortcut for quick reference.

**Acceptance Criteria:**

**Given** the AI enhancement infrastructure from Epic 12
**When** `packages/core/src/export/claude-shortcut-exporter.ts` is implemented
**Then** `exportAsClaudeShortcut(recording, aiProvider)` returns `{ text: string, filename: string }`
**And** the AI provider is used to summarize steps into coherent natural language instructions
**And** the prompt format follows: title, brief context (URLs, app names), numbered procedure steps with clear action verbs
**And** output length is under 2000 tokens for a 20-step SOP
**And** the prompt is structured for copy-paste into Claude Chrome as a shortcut
**And** if no AI provider is configured, fall back to template-based generation (no AI summarization): "Step 1: {title}. {description}"
**And** an "Export as Claude Shortcut" button is added to the editor export area (Lucide `message-square` icon)
**And** clicking export copies the prompt to clipboard and shows a success toast
**And** `ExportFormat` type is extended with `'claude-shortcut'`
**And** unit tests cover: AI-enhanced output, template fallback, prompt length constraints

**Technical notes:**
- Claude shortcut is text-only — no file download, just clipboard copy
- AI summarization prompt: "Summarize these SOP steps into a concise, coherent natural language procedure. Use clear action verbs. Format as a numbered list."
- Key files: `packages/core/src/export/claude-shortcut-exporter.ts`, `packages/extension/src/components/sop-editor.ts`, `packages/core/src/types.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 12.4

---

### Story 15.5: Import/Export .sop-recorder.json Format

As a developer,
I want to export and import recordings in a `.sop-recorder.json` format,
So that users can back up, share, and round-trip their SOPs.

**Acceptance Criteria:**

**Given** the existing `Recording` type and `IBlobStore`
**When** import/export for `.sop-recorder.json` is implemented
**Then** `exportAsJson(recording, fetchBlob)` produces a JSON file containing:
  - Full `Recording` metadata and steps
  - Base64-encoded screenshots for each step (inline)
  - Format version number for future compatibility
  - File extension: `.sop-recorder.json`
**And** `importFromJson(file: File)` reads the JSON file and:
  - Validates against the `Recording` schema using runtime type checks
  - Decodes base64 screenshots back to Blobs
  - Creates a new recording in storage with new IDs (to avoid conflicts)
  - Returns the imported `Recording` for display
**And** invalid/malformed files produce a clear error message (not a crash)
**And** an "Export as JSON (Backup)" button is added to the editor export area
**And** an "Import SOP" button is added to the home view
**And** the import button opens a file picker (`<input type="file" accept=".sop-recorder.json">`)
**And** unit tests cover: round-trip (export then import), malformed input, missing screenshots
**And** adversarial import tests specifically verify: deeply nested JSON (prototype pollution guard), missing required fields at each level, incompatible `version` number (future version), truncated file (incomplete JSON), empty file, wrong MIME type, file exceeding 50MB produces warning (not crash), and `recording.id` collision with existing recording generates a new ID

**Technical notes:**
- Export format version: `{ format: 'sop-recorder', version: 1, recording: {...}, screenshots: { [key]: base64 } }`
- Runtime validation: check required fields exist and have correct types (no zod dependency in extension)
- Large recordings may produce large JSON files — warn if file size exceeds 50 MB
- Adversarial tests: create fixture files or use `new File([jsonString], 'test.sop-recorder.json')` in vitest
- Key files: `packages/core/src/export/json-exporter.ts`, `packages/core/src/import/json-importer.ts`, `packages/extension/src/components/sop-home.ts`, `packages/extension/src/components/sop-editor.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** None

---

### Story 15.6: Recording Merge Functionality

As a developer,
I want to merge two recordings into one,
So that users can combine related procedures into a single SOP.

**Acceptance Criteria:**

**Given** the recording list on the home view
**When** merge functionality is added
**Then** in multi-select mode (long-press), selecting exactly 2 recordings enables a "Merge" button
**And** clicking "Merge" prompts the user to choose the order: "Recording A, then Recording B" or "Recording B, then Recording A"
**And** the merged recording:
  - Concatenates steps from the first recording followed by the second
  - Renumbers all steps sequentially (1, 2, 3, ...)
  - Uses the first recording's title with " + {second title}" appended
  - Preserves all screenshots from both recordings
  - Gets a new recording ID and `createdAt` timestamp
**And** the original recordings are preserved (merge creates a new recording, does not modify originals)
**And** the user is navigated to the editor view for the merged recording
**And** merging two recordings with 25 steps each produces a 50-step recording
**And** unit tests cover: step ordering, renumbering, metadata merging, screenshot key preservation

**Technical notes:**
- Merge logic lives in core: `packages/core/src/recording-merger.ts`
- Screenshot blob keys from both recordings are preserved — no need to copy blobs since they use unique keys
- Multi-select mode already exists from Story 5.4 — add "Merge" to the toolbar alongside "Delete" and "Export"
- Key files: `packages/core/src/recording-merger.ts`, `packages/extension/src/components/sop-home.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** None

---

## Epic 16: Claude Code Integration (v3.0)

**Goal:** Define Claude Code agent skills and a Playwright test skeleton generator that leverage the MCP server, enabling AI-assisted automation of documented procedures.

**Dependencies:** E11 (MCP server must be functional).

**Definition of Done:**
- Claude Code skill configuration enables SOP access via MCP tools
- Playwright test skeleton generator produces compilable test files
- Skill documentation clearly describes available capabilities

### Story 16.1: Claude Code Skill Definitions

As a developer,
I want Claude Code skill configuration files that describe how to use SOP Recorder's MCP tools,
So that Claude Code can discover and use SOP data for development tasks.

**Acceptance Criteria:**

**Given** the MCP server from Epic 11 with `sop_list`, `sop_read`, `sop_export`, `sop_search` tools
**When** `.claude/skills/sop-recorder.md` is created
**Then** the skill file describes:
  - Available MCP tools and their parameters
  - Common workflows: "List all SOPs", "Read a specific SOP", "Export SOP to Markdown", "Search SOPs by keyword"
  - Example prompts users can give Claude Code: "Show me the SOP for deploying to production", "Generate a test from the login SOP"
**And** the skill file includes the MCP server configuration snippet for `claude_desktop_config.json`
**And** a separate skill prompt for test generation is included: "Given an SOP with recorded steps, generate a Playwright test that replays the procedure"
**And** skill documentation is concise and follows Claude Code skill format conventions
**And** the skill file is included in the npm package for easy discovery

**Technical notes:**
- Claude Code skills are markdown files in `.claude/skills/`
- Skill format: title, description, available tools, example prompts
- Include in package: add to `"files"` in `packages/mcp-server/package.json`
- Key files: `.claude/skills/sop-recorder.md`, `packages/mcp-server/package.json`

**Estimated effort:** S (1-2 hours)

**Dependencies:** Story 11.2, Story 11.3

---

### Story 16.2: Playwright Test Skeleton Generator

As a developer,
I want a function that generates a Playwright test file from a Recording's step data,
So that users can quickly scaffold E2E tests based on their recorded SOPs.

**Acceptance Criteria:**

**Given** the `RecordedStep` type with selectors, actions, and page URLs
**When** `packages/core/src/export/playwright-generator.ts` is implemented
**Then** `generatePlaywrightTest(recording)` returns a string containing a valid Playwright test file
**And** the test file includes `import { test, expect } from '@playwright/test'`
**And** each step maps to a Playwright action:
  - `click` -> `await page.locator(selector).click()`
  - `input` -> `await page.locator(selector).fill(inputValue)`
  - `navigate` -> `await page.goto(url)`
  - `select` -> `await page.locator(selector).selectOption(value)`
  - `check` -> `await page.locator(selector).check()`
**And** selector selection uses `selectBestSelector()` from the tour exporter (reuse)
**And** page navigation steps insert `await page.goto(url)`
**And** the test is wrapped in `test('{recording.title}', async ({ page }) => { ... })`
**And** comments are added for each step: `// Step N: {step.title}`
**And** the generated test compiles with `tsc` (valid TypeScript)
**And** an "Export as Playwright Test" option is added to the export UI (Lucide `test-tube` icon)
**And** unit tests verify generated code structure for various step types
**And** a compilation verification test writes the generated test to a temp file and runs `tsc --noEmit` with `@playwright/test` types to confirm the output is valid TypeScript

**Technical notes:**
- Playwright selector preference: `data-testid` > `aria-label` > CSS selector
- Input values should use placeholder: `'TODO: replace with test value'` unless the step has non-masked input
- Generated test is a starting point — users will need to customize assertions
- Compilation test: use `child_process.execSync('npx tsc --noEmit tempFile.ts')` in vitest with a temp directory
- Key files: `packages/core/src/export/playwright-generator.ts`, `packages/extension/src/components/sop-editor.ts`

**Estimated effort:** M (2-3 hours)

**Dependencies:** Story 9.3 (reuse `selectBestSelector`), Story 10.1

---

## Summary

| Epic | Stories | Total Effort | Release |
|------|---------|-------------|---------|
| E9: Multi-Format Export | 4 | ~6 hours (2S + 1M + 1S) | v1.1 / v2.0 |
| E10: pnpm Workspace Refactor | 3 | ~6 hours (1M + 1M + 1S) | v2.0 |
| E11: MCP Server Integration | 6 | ~15 hours (6M) | v2.0 |
| E12: AI Step Enhancement | 6 | ~16 hours (1S + 3M + 2L) | v2.0 |
| E13: Screenshot Annotation | 6 | ~15 hours (1S + 1L + 4M) | v2.0 |
| E14: Cross-Browser (Firefox) | 3 | ~8 hours (3M) | v2.0 |
| E15: Advanced Features | 6 | ~15 hours (6M) | v2.1 |
| E16: Claude Code Integration | 2 | ~4 hours (1S + 1M) | v3.0 |
| **Total** | **36** | **~85 hours** | |

### Dependency Graph

```
E9.1 (HTML exporter) ─── E9.2 (HTML UI) ───┐
                                            ├── E9.4 (Tour UI)
E9.3 (Tour exporter) ──────────────────────┘

E10.1 (Extract core) ── E10.2 (Update ext) ── E10.3 (Verify tests)
                    │
                    ├── E11.1 (File adapters) ── E11.2 (MCP list/read) ── E11.3 (MCP export/search)
                    │                         ├── E11.4 (Native host) ── E11.5 (NativeSyncAdapter)
                    │                         │                       └── E11.6 (Install scripts)
                    │
                    ├── E12.1 (AI types) ── E12.2 (OpenAI provider)
                    │                    ├── E12.3 (Chrome AI provider)
                    │                    ├── E12.4 (AI service + prompt builder)
                    │                    ├── E12.5 (Settings UI) ── E12.6 (Enhance UI + consent)
                    │
                    └── E13.1 (Annotation types) ── E13.2 (Editor shell) ── E13.3 (Arrow + Rect)
                                                                          ├── E13.4 (Ellipse + Text + Freehand)
                                                 ── E13.5 (Compositor) ── E13.6 (Export integration)

E14.1 (Firefox audit) ── E14.2 (Sidebar adapt) ── E14.3 (Firefox E2E)

E15.1 (PII detector) ── E15.2 (Blur overlay) ── E15.3 (Review UI)
E12.4 ── E15.4 (Claude shortcut export)
E15.5 (Import/export JSON) — standalone
E15.6 (Recording merge) — standalone

E11.2 + E11.3 ── E16.1 (Skill definitions)
E9.3 + E10.1 ── E16.2 (Playwright generator)
```
