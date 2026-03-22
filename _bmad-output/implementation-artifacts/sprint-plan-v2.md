# Sprint Plan v2 -- SOP Recorder

**Project:** SOP Recorder
**Date:** 2026-03-22
**Total Sprints:** 8 (Sprints 9-16, continuing from v1)
**Total Stories:** 36
**Developer:** Claude Code agent (one story at a time)

---

## Sprint 9: v1.1 Quick Follow-up (HTML Export)

**Sprint Goal:** Ship HTML export as a fast v1.1 release, giving users a self-contained, offline-viewable export format alongside existing Markdown ZIP.

**Dependencies:** Sprint 6 (existing export engine and zip-exporter pattern).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 9.1 | Implement HTML Exporter Core | No (must be first -- foundation for UI integration) |
| 2 | 9.2 | Add HTML Export Button to Editor UI | No (depends on 9.1) |

### Definition of Done

- `exportAsHtml(recording, fetchBlob)` returns `{ blob: Blob, filename: string }`
- HTML file embeds all screenshots as base64 data URIs
- All user-editable content is HTML-escaped via `escapeHtml()` utility
- Inline CSS includes PicoCSS-inspired styles with dark/light mode via `@media (prefers-color-scheme)`
- `@media print` provides print-friendly styles with page breaks between steps
- "Export as HTML" button appears alongside "Export as ZIP" in editor view
- Export completes in < 500ms for 10 steps, < 2 seconds for 50 steps
- Unit tests verify: output structure, XSS prevention, base64 embedding, print styles
- E2E test verifies HTML export button is visible, clickable, and produces no error

### Risks/Notes

- This is a minimal sprint (2 stories) designed for a quick v1.1 release.
- HTML sanitization (`escapeHtml()`) is security-critical -- XSS prevention must be verified with tests.
- The HTML exporter follows the exact same function signature as `exportAsZip()` for consistency.

---

## Sprint 10: Workspace Refactor + Tour Export

**Sprint Goal:** Restructure the project into a pnpm workspace monorepo (prerequisite for MCP server) and add Driver.js tour export, completing the multi-format export epic.

**Dependencies:** Sprint 8 (v1 release complete), Sprint 9 (HTML export for format selection UI).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 9.3 | Implement Tour Exporter Core | Yes (parallel with 10.1 -- independent pure function) |
| 2 | 10.1 | Extract src/core/ into packages/core Shared Package | Yes (parallel with 9.3) |
| 3 | 10.2 | Update Extension to Consume from packages/core | No (depends on 10.1) |
| 4 | 10.3 | Verify All Existing Tests Pass After Refactor | No (depends on 10.2) |
| 5 | 9.4 | Add Tour Export UI + Format Selection | No (depends on 9.3, 10.2 -- needs tour exporter and updated extension) |

### Definition of Done

- Tour exporter generates a valid Driver.js configuration with correct selectors, tooltip positioning, and cross-page warnings
- Project is a pnpm workspace with `packages/core/` and `packages/extension/`
- `@sop-recorder/core` is importable from workspace packages
- Extension builds and runs identically to pre-refactor
- All existing unit tests and E2E tests pass
- All three export formats (ZIP, HTML, Tour) available in editor UI
- `pnpm run dev`, `pnpm run build`, `pnpm run test:unit`, `pnpm run test:e2e` work from workspace root
- Each workspace package has its own `vitest.config.ts`
- Structural verification test confirms all expected exports from `@sop-recorder/core` are accessible

### Risks/Notes

- The workspace refactor is a large structural change. Test thoroughly before moving to Sprint 11.
- Story 9.3 (tour exporter) is a pure function with no dependencies on the workspace refactor -- it can be worked in parallel with 10.1.
- Story 9.4 (tour UI) depends on both the tour exporter AND the updated extension structure, so it must come last.
- WXT `srcDir` configuration may need adjustment for the new directory layout.
- Driver.js CDN link in the tour export is a runtime dependency for the exported file, not the extension itself.

---

## Sprint 11: MCP Server

**Sprint Goal:** Implement a standalone MCP server that exposes SOP Recorder data to AI assistants via stdio transport, connected to the extension through Chrome Native Messaging.

**Dependencies:** Sprint 10 (pnpm workspace for shared core), Sprint 9 (export formats for `sop_export` tool).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 11.1 | Implement FileStorageAdapter + FileBlobStore | No (must be first -- foundation for all MCP tools) |
| 2 | 11.2 | Implement MCP Server with sop_list + sop_read Tools | No (depends on 11.1) |
| 3 | 11.3 | Implement sop_export + sop_search Tools | No (depends on 11.2) |
| 4 | 11.4 | Implement Native Messaging Host | Yes (after 11.1, parallel with 11.2/11.3) |
| 5 | 11.5 | Add NativeSyncAdapter to Extension Background | No (depends on 11.4) |
| 6 | 11.6 | Create Installation Script + Documentation | No (depends on 11.4) |

### Definition of Done

- MCP server starts and responds to `sop_list`, `sop_read`, `sop_export`, `sop_search` tool calls
- `FileStorageAdapter` and `FileBlobStore` handle CRUD on `~/.sop-recorder/` filesystem
- Extension syncs recordings to filesystem via native messaging on save (non-blocking)
- Installation scripts register the native messaging host on macOS, Windows, and Linux
- MCP server works with Claude Desktop via stdio transport
- Server startup time < 1 second, `sop_list` response < 200ms for 100 recordings
- Unit tests cover all MCP tools, file adapters, message parsing, and error handling
- Integration test spawns MCP server and validates tool responses via SDK client over stdio
- Native messaging codec tests cover endianness, 1MB boundary, malformed headers, partial reads
- NativeSyncAdapter tests verify base64 conversion and message structure

### Risks/Notes

- Heavy backend sprint with 6 stories -- all MCP/filesystem focused, no UI work.
- Stories 11.4-11.6 can be parallelized with 11.2-11.3 since native messaging and MCP tools are independent after 11.1.
- Chrome native messaging uses length-prefixed binary protocol -- careful with stdin/stdout handling.
- The `nativeMessaging` permission must be added to the extension manifest.
- Native host registration differs by OS -- installation scripts must detect platform.
- Sync is fire-and-forget: native host unavailability does not break the extension.

---

## Sprint 12: AI Step Enhancement (BYOK)

**Sprint Goal:** Add optional AI-powered enhancement of step titles and descriptions using user-provided API keys (OpenAI-compatible) or Chrome's built-in Gemini Nano, with a privacy-first consent flow.

**Dependencies:** Sprint 10 (workspace structure for `@sop-recorder/core` imports).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 12.1 | Define IAIProvider Interface + AISettings Types | No (must be first -- all AI modules depend on these types) |
| 2 | 12.2 | Implement OpenAI-Compatible Provider | Yes (after 12.1, parallel with 12.3, 12.4) |
| 3 | 12.3 | Implement Chrome Built-in AI Provider | Yes (after 12.1, parallel with 12.2, 12.4) |
| 4 | 12.4 | Implement AI Enhancement Service + Prompt Builder | Yes (after 12.1, parallel with 12.2, 12.3) |
| 5 | 12.5 | Implement Settings UI Component (sop-settings.ts) | No (depends on 12.1, 12.2, 12.3) |
| 6 | 12.6 | Add Enhance Buttons to Editor + Privacy Consent Flow | No (depends on 12.4, 12.5) |

### Definition of Done

- `IAIProvider` interface defined with `isAvailable()`, `enhanceStep()`, `enhanceBatch()` methods
- `OpenAIProvider` calls configurable API endpoint with structured JSON output
- `ChromeAIProvider` uses Chrome's built-in Gemini Nano for offline enhancement
- `AIEnhancementService` orchestrates provider selection with PII sanitization
- Settings UI allows provider selection, API key entry, and connection testing
- Privacy consent dialog appears before first external API call
- Enhancement diff with per-step accept/reject UI in editor view
- API key is never exported, logged, or included in error messages
- Unit tests cover all providers, prompt building, PII detection, and error handling
- API key leak prevention tests verify key is never present in errors or console output
- Settings UI component tests verify conditional rendering for each provider state
- Consent dialog component tests verify non-dismissability and per-endpoint consent tracking
- E2E test verifies consent flow and enhancement diff accept/reject UI

### Risks/Notes

- Full AI pipeline sprint with 6 stories -- the most complex v2 sprint.
- Stories 12.2, 12.3, and 12.4 can all run in parallel after 12.1 since they implement independent pieces.
- Chrome Built-in AI (Gemini Nano) availability depends on Chrome version 131+ and user hardware -- graceful degradation is essential.
- Privacy consent flow is critical for user trust -- must be modal, non-dismissable, and per-endpoint.
- `optional_host_permissions` required for the configurable API endpoint URL.

---

## Sprint 13: Screenshot Annotation Editor

**Sprint Goal:** Add a non-destructive SVG overlay annotation system that lets users draw arrows, shapes, and text on screenshots, with annotations composited into exports.

**Dependencies:** Sprint 10 (workspace structure), Sprint 9 (export pipeline integration for composited screenshots).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 13.1 | Define Annotation Data Model + Types | No (must be first -- all annotation modules depend on these types) |
| 2 | 13.2 | Implement SVG Annotation Editor Component | No (depends on 13.1 -- editor shell) |
| 3 | 13.3 | Implement Arrow + Rectangle Tools | Yes (after 13.2, parallel with 13.4) |
| 4 | 13.4 | Implement Ellipse + Text + Freehand Tools | Yes (after 13.2, parallel with 13.3) |
| 5 | 13.5 | Implement Annotation Compositor for Export | Yes (after 13.1, parallel with 13.2-13.4) |
| 6 | 13.6 | Integrate Annotations with Export Pipeline + Thumbnails | No (depends on 13.3, 13.4, 13.5) |

### Definition of Done

- Users can add arrows, rectangles, ellipses, text, and freehand annotations to screenshots
- Annotations persist across browser sessions (stored in recording JSON as normalized coordinates)
- Undo/redo stack supports at least 20 actions
- Exported files (ZIP, HTML, Tour) include composited screenshots with annotations
- Annotation editor is usable at 400px side panel width
- Annotation rendering maintains 60fps during drawing
- Backward compatibility: existing recordings without annotations remain valid
- Color picker offers 6 preset colors with red as default
- Unit tests cover coordinate normalization, undo/redo stack, tool-specific geometry (arrow min distance, negative rect normalization, Douglas-Peucker simplification)
- Integration tests verify export pipeline produces composited screenshots for annotated steps
- Compositor fallback path tested when OffscreenCanvas is unavailable

### Risks/Notes

- Heavy UI sprint -- the annotation editor is the most complex v2 UI component.
- Stories 13.3 and 13.4 (drawing tools) can be developed in parallel since they implement independent tool logic.
- Story 13.5 (compositor) can also run in parallel with 13.2-13.4 since it only depends on types, not the editor UI.
- `OffscreenCanvas` availability varies by browser -- Firefox fallback needed if E14 is planned.
- SVG `viewBox="0 0 1 1"` with `preserveAspectRatio="none"` enables normalized coordinates but may cause rendering quirks.
- The annotation editor must work within the 400px side panel width constraint.

---

## Sprint 14: Firefox + Cross-Browser Polish

**Sprint Goal:** Build and validate a Firefox add-on using WXT's cross-browser support, adapting the Side Panel to Firefox's Sidebar API and ensuring full functionality on Firefox 120+.

**Dependencies:** Sprints 1-8 (v1 feature-complete). Ideally after Sprint 9 so Firefox gets multi-format export.

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 14.1 | Firefox Compatibility Audit + WXT Config | No (must be first -- identifies all adaptations needed) |
| 2 | 14.2 | Adapt Side Panel to Firefox Sidebar API | No (depends on 14.1) |
| 3 | 14.3 | Firefox E2E Test Setup + Validation | No (depends on 14.2) |

### Definition of Done

- Full Record -> Edit -> Export flow works in Firefox 120+
- `pnpm run build:firefox` produces a Firefox-compatible extension
- Firefox sidebar displays and functions identically to Chrome side panel
- Screenshots capture correctly via Firefox `browser.tabs.captureVisibleTab()` API
- Browser-detection utility (`isFirefox()` / `isChrome()`) guards all browser-specific API calls
- Playwright E2E tests run on Firefox via `pnpm run test:e2e:firefox`
- CI pipeline includes Firefox test job
- Extension is publishable to AMO (Firefox Add-ons)
- Browser detection utility (`isFirefox()`/`isChrome()`) has unit tests

### Risks/Notes

- Smallest "feature" sprint at 3 stories, but cross-browser testing can be time-consuming.
- Stories are sequential -- each depends on the previous.
- Firefox sidebar API (`browser.sidebarAction`) has a different surface than Chrome side panel (`chrome.sidePanel`).
- Playwright Firefox extension testing may require different setup than Chrome (`firefox.launchPersistentContext`).
- Keyboard shortcuts may conflict with Firefox built-in shortcuts -- `Alt+Shift+R` may need adaptation.
- WXT handles most manifest conversion automatically, which should reduce effort.

---

## Sprint 15: Advanced Features (v2.1)

**Sprint Goal:** Implement PII auto-redaction, Claude shortcut export, and recording import/merge -- polish features that enhance privacy, interoperability, and workflow flexibility.

**Dependencies:** Sprint 12 (AI provider for Claude shortcut export), Sprint 13 (annotation patterns for redaction UI).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 15.1 | PII Detection Engine (Regex-Based) | Yes (parallel with 15.5, 15.6) |
| 2 | 15.5 | Import/Export .sop-recorder.json Format | Yes (parallel with 15.1, 15.6) |
| 3 | 15.6 | Recording Merge Functionality | Yes (parallel with 15.1, 15.5) |
| 4 | 15.2 | CSS Blur Redaction Overlay | No (depends on 15.1) |
| 5 | 15.3 | Redaction Review UI | No (depends on 15.2) |
| 6 | 15.4 | Claude Shortcut Export | Yes (after Sprint 12 -- depends on 12.4, parallel with 15.1-15.3) |

### Definition of Done

- PII patterns (email, phone, SSN, credit card) detected via regex with < 10% false positive rate
- CSS blur applied to PII elements before screenshot capture, removed after
- Redaction review UI shows what was auto-redacted with unredact toggles
- Claude shortcut export produces concise natural language prompts (< 2000 tokens for 20 steps)
- Recordings can be round-tripped via `.sop-recorder.json` format (export + import)
- Two recordings can be merged into one with correct step renumbering
- Redaction is opt-in (disabled by default)
- All features have unit test coverage
- Redaction review UI has component tests for badge count, unredact toggle, and persistence
- Import includes adversarial test cases: deeply nested JSON, missing fields, incompatible version, truncated file, 50MB+ file warning

### Risks/Notes

- Sprint has three independent workstreams: PII (15.1-15.3), import/export (15.5-15.6), and Claude shortcut (15.4).
- Stories 15.1, 15.5, and 15.6 have zero dependencies on each other and can run in parallel.
- Story 15.4 (Claude shortcut) depends on Sprint 12's AI enhancement service -- must be completed after Sprint 12.
- PII detection is regex-only -- no ML/NLP. False positive rate target is < 10% for typical business text.
- Manual redaction (blur rectangles) in Story 15.3 reuses the annotation editor rectangle tool from Sprint 13.
- Large recordings may produce large JSON files on import/export -- warn if > 50 MB.

---

## Sprint 16: Claude Code Integration (v3.0)

**Sprint Goal:** Define Claude Code agent skills and a Playwright test skeleton generator that leverage the MCP server, enabling AI-assisted automation of documented procedures.

**Dependencies:** Sprint 11 (MCP server must be functional), Sprint 9 (tour exporter for `selectBestSelector` reuse), Sprint 10 (workspace structure).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 16.1 | Claude Code Skill Definitions | Yes (parallel with 16.2) |
| 2 | 16.2 | Playwright Test Skeleton Generator | Yes (parallel with 16.1) |

### Definition of Done

- `.claude/skills/sop-recorder.md` describes MCP tools, workflows, and example prompts
- Skill file includes Claude Desktop MCP server configuration snippet
- `generatePlaywrightTest(recording)` produces a valid, compilable Playwright test file
- Each step type (click, input, navigate, select, check) maps to correct Playwright action
- Selector selection reuses `selectBestSelector()` from tour exporter
- "Export as Playwright Test" option available in editor export UI
- Generated test includes step comments and TODO placeholders for assertions
- Unit tests verify generated code structure for various step types
- Compilation verification test confirms generated Playwright test is valid TypeScript via `tsc --noEmit`

### Risks/Notes

- Minimal sprint (2 stories) that can run in parallel since skill definitions and the Playwright generator are independent.
- The Playwright generator produces a starting-point test -- users will need to add assertions and customize values.
- Skill definitions are documentation-focused -- low risk, low complexity.
- The `selectBestSelector()` function is reused from the tour exporter (Story 9.3) -- validates code sharing via workspace.

---

## Sprint Dependency Graph

```
Sprint 8 (Release v1.0)
    |
Sprint 9 (HTML Export - v1.1) ──────────────────────────────┐
    |                                                        |
Sprint 10 (Workspace Refactor + Tour Export) ────────────────┤
    |           |           |           |                    |
Sprint 11   Sprint 12   Sprint 13   Sprint 14               |
(MCP Server) (AI BYOK)  (Annotation) (Firefox)              |
    |           |           |                                |
    |           +───────────+────────────────────────────────┤
    |                                                        |
    +──────────────── Sprint 15 (Advanced v2.1) ─────────────+
                          |
                    Sprint 16 (Claude Code v3.0)
```

Notes:
- Sprints 11, 12, 13, and 14 can be worked in any order after Sprint 10 (they are independent of each other).
- Sprint 15 depends on Sprint 12 (AI provider for Claude shortcut) and Sprint 13 (annotation patterns for redaction UI).
- Sprint 16 depends on Sprint 11 (MCP server) and Sprint 9 (tour exporter reuse).

---

## Developer Agent Context

Each story in the v2 epics-and-stories document (`_bmad-output/planning-artifacts/epics-and-stories-v2.md`) contains:

1. **User story format** -- As a developer, I want X, so that Y
2. **Acceptance criteria** -- Given/When/Then format with specific, testable conditions
3. **Technical notes** -- Implementation hints, key files, and architecture references

The developer agent should:

- Read the full story from `epics-and-stories-v2.md` before starting implementation
- Reference `architecture-v2-addendum.md` for new file paths, adapter interfaces, and workspace structure
- Reference `prd-v2-addendum.md` for functional requirements and feature specifications
- Write tests alongside implementation (not as a separate phase)
- Run `pnpm run lint`, `pnpm run test:unit`, and `pnpm run build` after each story to verify nothing breaks
- After workspace refactor (Sprint 10), run commands from workspace root

### Key Implementation Decisions (from v2 planning artifacts)

- **Workspace structure:** `packages/core/`, `packages/extension/`, `packages/mcp-server/`
- **Core package:** `@sop-recorder/core` -- TypeScript source package, no build step needed
- **MCP SDK:** `@modelcontextprotocol/sdk` with stdio transport
- **AI providers:** OpenAI-compatible via native `fetch()`, Chrome Built-in AI via `LanguageModel` API
- **Annotation coordinates:** Normalized 0-1 for resolution independence
- **Export formats:** `'markdown-zip' | 'html' | 'driverjs-json' | 'claude-shortcut' | 'playwright-test' | 'sop-recorder-json'`
- **PII detection:** Regex-only, no ML/NLP dependencies
- **Native messaging:** Length-prefixed binary protocol (4-byte uint32 LE + JSON)
