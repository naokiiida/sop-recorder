# Implementation Readiness Report -- SOP Recorder

**Reviewer:** Claude Opus 4.6 (1M context)
**Date:** 2026-03-18
**Documents Reviewed:**
- PRD v2.1 (prd.md)
- PRD Validation Report (prd-validation-report.md)
- UX Design Specification v1.0 (ux-design.md)
- Technical Architecture Document v1.0 (architecture.md)

**Verdict: READY FOR IMPLEMENTATION -- with 4 minor gaps to address**

**Overall Readiness Score: 93/100**

---

## 1. PRD Completeness

**Score: 96/100 -- PASS**

### Sections Present and Complete

| Section | Status | Quality |
|---------|--------|---------|
| Executive Summary / Vision | Present | Excellent -- three-verb MVP anchor |
| Problem Statement | Present | Strong -- quantified pain points |
| Target Users & Personas | Present | Three well-defined personas |
| User Journeys | Present | Three journeys covering critical path, editing, recovery |
| Architecture Principles | Present | Core-shell, local-first, record-rich/export-thin |
| Functional Requirements (32 FRs) | Present | IDs, priorities, notes on each |
| Non-Functional Requirements | Present | Performance, reliability, security, accessibility, compatibility |
| Error Handling (Section 6.6) | Present | Five failure scenarios with expected behavior -- addresses PRD validation finding |
| Success Metrics | Present | Launch, quality, and North Star metrics |
| Technical Stack & Decisions | Present | Decision matrix with alternatives rejected |
| Data Model | Present | Full TypeScript interface with export format mapping |
| Scope Boundary | Present | 19 in-scope, 19 out-of-scope with rationale |
| Release Strategy | Present | v1.0 through v3.0 roadmap |
| Testing Requirements | Present | CI/CD pipeline, test suite, coverage targets |
| Competitive Reference | Present | Feature comparison matrix |
| Glossary | Present | All domain terms defined |
| References & Resources | Present | Context7 IDs, WXT examples, official docs |

### FR Traceability to User Journeys

| FR Group | Journey 1 (First Recording) | Journey 2 (Edit & Re-Export) | Journey 3 (Resume) |
|----------|:--:|:--:|:--:|
| FR-1 Recording Engine | Steps 4-7 | -- | Steps 1-3 |
| FR-2 Step Editing | Step 8 | Steps 3-5 | -- |
| FR-3 Export | Steps 9-10 | Step 6 | -- |
| FR-4 Recording Management | -- | Steps 1-2 | Step 3 |
| FR-5 Side Panel UI | All | All | All |
| FR-6 Annotation | Implicit (auto) | -- | -- |

All 32 FRs trace to at least one journey or architectural principle. No orphan requirements.

### PRD Validation Findings Addressed

The PRD v2.1 has addressed several findings from the validation report:
- **Error handling section added** (Section 6.6) -- five failure scenarios with expected behavior
- **FR-2.6 DnD specified** -- "Implement using native HTML5 Drag and Drop API (no library needed)"
- **`tabs` permission removed** -- Section 6.3 explicitly documents this decision with rationale
- **North Star metric revised** -- changed to "recordings with 5+ steps saved locally" with measurement approach acknowledging no-telemetry constraint
- **Lit size corrected** -- Section 8.2 now states "~5.8 KB gzipped"

**Remaining cosmetic issue:** PicoCSS size still shows "~3-4 KB gzipped" in Sections 4.2 and 8.2. This is accurate for classless but Section 8.2 table previously said "~10 KB" (full version). The current v2.1 appears to have corrected this.

---

## 2. UX <-> PRD Alignment

**Score: 95/100 -- PASS**

### FR Coverage in UX Spec

| FR | UX Coverage | Status |
|----|------------|--------|
| FR-1.1 Start/stop via side panel | `<sop-recording>` controls (Section 3.2) | COVERED |
| FR-1.2 Keyboard shortcut Alt+Shift+R | View transition map (Section 2.2), recording flow (Section 4.1) | COVERED |
| FR-1.3 Pause/resume | `<sop-recording>` paused state wireframe (Section 3.2) | COVERED |
| FR-1.4-1.8 Event capture | Not UX-visible (background) | N/A |
| FR-1.9 Multiple selectors | Not UX-visible (data model) | N/A |
| FR-1.10 Accessible names | Step title auto-generation (Section 3.2) | COVERED |
| FR-1.11 Password masking | Not UX-visible (content script) | N/A |
| FR-1.12 State persistence | Recovery state wireframe (Section 3.2) | COVERED |
| FR-1.13 Recording indicator | Recording dot with pulse animation, CSS specs (Section 5.4) | COVERED |
| FR-1.14-1.15 Bounding box, viewport | Not UX-visible (data model) | N/A |
| FR-1.16 IndexedDB storage | Not UX-visible (storage) | N/A |
| FR-2.1 Step list with thumbnails | `<sop-step-card>` both modes (Section 3.2) | COVERED |
| FR-2.2 Inline title editing | Interaction pattern (Section 4.2) | COVERED |
| FR-2.3 Inline description editing | Interaction pattern (Section 4.2) | COVERED |
| FR-2.4 Delete steps | Undo toast pattern (Section 4.4) | COVERED |
| FR-2.5 Reorder via buttons | `[up][down]` buttons on step card (Section 3.2) | COVERED |
| FR-2.6 Drag-and-drop | Drag handle, insertion line, interaction flow (Section 4.3) | COVERED |
| FR-2.7 Full-size screenshot | `<sop-screenshot-lightbox>` (Section 3.2) | COVERED |
| FR-2.8 Auto-renumbering | Mentioned in step card and reorder behavior | COVERED |
| FR-3.1 Markdown+ZIP export | `<sop-export-panel>` (Section 3.2) | COVERED |
| FR-3.2-3.3 Export content | Not UX-visible (export engine) | N/A |
| FR-3.4 SOP metadata | Not UX-visible (export engine) | N/A |
| FR-3.5 Copy Markdown to clipboard | Copy Markdown button in export panel (Section 3.2) | COVERED |
| FR-4.1 Save recordings | Implicit in flow (stop -> save) | COVERED |
| FR-4.2 List saved recordings | `<sop-home>` with recording cards (Section 3.2) | COVERED |
| FR-4.3 Delete recordings | Overflow menu on recording card (Section 3.2) | COVERED |
| FR-4.4 Edit SOP title | Click-to-edit in editor header (Section 3.2) | COVERED |
| FR-4.5 Auto-generate SOP title | Not explicitly in UX (auto-naming logic) | MINOR GAP |
| FR-5.1-5.5 Side panel views | Three views + empty state fully wireframed | COVERED |
| FR-6.1-6.3 Screenshot annotation | Not UX-visible (content script + canvas) | N/A |

### UX Features Not in PRD

| UX Feature | PRD Coverage | Assessment |
|------------|-------------|------------|
| Settings gear icon | Not in PRD FRs | ACCEPTABLE -- minimal settings (auto-purge toggle, shortcut reference). Could be deferred. |
| Undo toast pattern | Not an explicit FR | ACCEPTABLE -- UX design decision supporting FR-2.4 (delete steps). Good UX practice. |
| View Transitions API animations | Not in PRD | ACCEPTABLE -- UX enhancement, not functional requirement. PRD says "modern CSS features preferred." |
| Overflow menu on recording cards (rename, export, delete) | FR-4.3/4.4 cover delete/rename | ALIGNED -- UX provides the UI for existing FRs. |

### Alignment Finding

**UX-PRD-1: FR-3.5 (Copy Markdown) priority mismatch.** The PRD lists FR-3.5 as "Should" priority, but the UX export panel includes it as a prominent button alongside "Download ZIP." The UX treats it as equally important. This is not a blocker -- the developer should implement it if time permits, or the UX can be simplified to show only the ZIP export button for initial MVP.

**Severity:** Low.

---

## 3. Architecture <-> PRD Alignment

**Score: 96/100 -- PASS**

### FR Coverage in Architecture

| FR Group | Architecture Coverage | Status |
|----------|----------------------|--------|
| FR-1 Recording | Content script architecture (Section 6), event capture (6.2), selector generation (6.3), CSS overlay (6.5) | FULLY COVERED |
| FR-2 Editing | StepManager class (Section 4.2), message protocol for CRUD (Section 3.2) | FULLY COVERED |
| FR-3 Export | Export pipeline (Section 8), ExportEngine + MarkdownZipExporter (8.2), output format (8.3) | FULLY COVERED |
| FR-4 Management | Storage adapter (Section 5), persistence strategy (4.3) | FULLY COVERED |
| FR-5 Side Panel | Component tree (Section 9.1), Lit pattern (9.2), state sync (9.3) | FULLY COVERED |
| FR-6 Annotation | Screenshot pipeline with overlay inject/remove (Section 7.1), step number badge (7.3) | FULLY COVERED |

### Adapter Interface Coverage

| Chrome API Dependency | Adapter Interface Defined | Chrome Implementation Specified | Status |
|----------------------|:--:|:--:|--------|
| `captureVisibleTab()` | `IScreenshotCapture` | `screenshot-adapter.ts` | COVERED |
| `chrome.storage.local` | `IStorageAdapter` | `storage-adapter.ts` | COVERED |
| `chrome.storage.session` | `IStorageAdapter` | `storage-adapter.ts` | COVERED |
| IndexedDB (blobs) | `IBlobStore` | `blob-store.ts` | COVERED |
| `chrome.tabs` | `ITabAdapter` | `tab-adapter.ts` | COVERED |
| `chrome.runtime` messaging | `IMessageBus` + `PanelPort` | `message-bus.ts` | COVERED |
| `chrome.alarms` | `IAlarmAdapter` | `alarm-adapter.ts` | COVERED |
| `chrome.downloads` | `IDownloadAdapter` | `download-adapter.ts` | COVERED |
| `chrome.commands` | Direct registration in background.ts | Not behind adapter | ACCEPTABLE |
| `chrome.sidePanel` | Not explicitly adapted | WXT handles this declaratively | ACCEPTABLE |

All Chrome API dependencies have adapter interfaces. The two items without explicit adapters (`chrome.commands`, `chrome.sidePanel`) are configuration-level APIs that WXT handles declaratively, so adapting them adds no value.

### Architecture Finding

**ARCH-1: `chrome.commands` not behind adapter.** The `chrome.commands.onCommand` listener is registered directly in `background.ts`. Since command registration is a Chrome-only concept (MCP/CLI would use different input mechanisms), this is acceptable. The command handler simply delegates to the state machine, which is adapter-agnostic.

**Severity:** None -- acceptable design.

---

## 4. Architecture <-> UX Alignment

**Score: 94/100 -- PASS**

### Component Tree Comparison

| UX Component | Architecture Component | Match |
|--------------|----------------------|-------|
| `<sop-app>` | `sop-app.ts` | EXACT |
| `<sop-home>` | `sop-home.ts` | EXACT |
| `<sop-recording>` | `sop-recording.ts` | EXACT |
| `<sop-editor>` | `sop-editor.ts` | EXACT |
| `<sop-step-card>` | `sop-step-card.ts` | EXACT |
| `<sop-export-panel>` | `sop-export-panel.ts` | EXACT |
| `<sop-screenshot-lightbox>` | Not in architecture file list | GAP |
| `<sop-empty-state>` | Not in architecture file list | MINOR GAP |
| `<sop-recording-card>` | Not in architecture file list | MINOR GAP |
| Undo toast | Not in architecture file list | MINOR GAP |

### Data Flow: Core to UI

The architecture specifies:
1. Background service worker owns the `RecordingStateMachine` and `StepManager` (pure TS core)
2. Side panel connects via `chrome.runtime.connect()` port
3. `RecordingController` (Lit ReactiveController) maintains port and syncs state
4. Components receive state updates via `BackgroundToPanelMessage` discriminated unions

This matches the UX specification's state-driven view routing (`ViewState = 'home' | 'recording' | 'edit'`).

### Alignment Finding

**UX-ARCH-1: Missing components in architecture file listing.** The architecture Section 2 project structure lists 6 components in `src/components/`, but the UX spec defines 9 components (plus the undo toast). Three UX components are not in the architecture file listing:

- `<sop-screenshot-lightbox>` -- specified in UX Section 3.2 with full behavior (dialog, prev/next, keyboard nav)
- `<sop-empty-state>` -- first-launch empty state
- `<sop-recording-card>` -- recording list item in home view

These are relatively simple components that a developer can infer from the UX spec. The architecture covers the important ones (root shell, views, step card, export panel).

**Severity:** Low. Developer should create these components based on UX spec wireframes.

**UX-ARCH-2: ViewState type mismatch.** The UX spec defines `ViewState = 'home' | 'recording' | 'edit'` (Section 2.3), but the architecture's `SopApp` component uses `'home' | 'recording' | 'editor'` (Section 9.2). The UX says `'edit'`, the architecture says `'editor'`.

**Severity:** Cosmetic. Pick one and use it consistently. Recommend `'edit'` (shorter, matches UX spec).

---

## 5. Data Model Consistency

**Score: 97/100 -- PASS**

### RecordedStep Interface Comparison

| Field | PRD (Section 8.4) | Architecture (types.ts) | UX | Status |
|-------|-------------------|------------------------|-----|--------|
| `id: string` | Yes | Yes (via CapturedEvent) | N/A | CONSISTENT |
| `sequenceNumber: number` | Yes | Yes | Used in step numbering | CONSISTENT |
| `timestamp: number` | Yes | Yes | N/A | CONSISTENT |
| `type: StepAction` | Yes | Yes | N/A | CONSISTENT |
| `inputValue?: string` | Yes | Yes | N/A | CONSISTENT |
| `selectors: { css, xpath?, aria?, textContent? }` | Yes | Yes (`SelectorSet`) | N/A | CONSISTENT |
| `tagName: string` | Yes | Yes | N/A | CONSISTENT |
| `elementType?: string` | Yes | Yes | N/A | CONSISTENT |
| `elementRole?: string` | Yes | Yes | N/A | CONSISTENT |
| `accessibleName: string` | Yes | Yes | Used in step title | CONSISTENT |
| `boundingBox: { x, y, width, height }` | Yes | Yes (`BoundingBox`) | N/A | CONSISTENT |
| `clickCoordinates?: { x, y }` | Yes | Yes | N/A | CONSISTENT |
| `pageUrl: string` | Yes | Yes | Shown in step card | CONSISTENT |
| `pageTitle: string` | Yes | Yes | N/A | CONSISTENT |
| `viewport: { width, height }` | Yes | Yes | N/A | CONSISTENT |
| `scrollPosition: { x, y }` | Yes | Yes | N/A | CONSISTENT |
| `title: string` | Yes | Implied (user-editable) | Click-to-edit in step card | CONSISTENT |
| `description: string` | Yes | Implied (user-editable) | Click-to-edit in step card | CONSISTENT |
| `screenshotBlobKey: string` | Yes | Yes (via IBlobStore) | Thumbnail in step card | CONSISTENT |
| `thumbnailDataUrl?: string` | Yes | Yes | Lazy-loaded img src | CONSISTENT |

### StepAction Type

| PRD | Architecture | Status |
|-----|-------------|--------|
| `'click' \| 'dblclick' \| 'input' \| 'select' \| 'check' \| 'navigate' \| 'scroll' \| 'submit' \| 'keypress'` | Matches (via CapturedEvent.type) | CONSISTENT |

### Recording Interface

| Field | PRD | Architecture | Status |
|-------|-----|-------------|--------|
| `id: string` | Yes | Yes | CONSISTENT |
| `title: string` | Yes | Yes | CONSISTENT |
| `createdAt: number` | Yes | Yes | CONSISTENT |
| `updatedAt: number` | Yes | Yes | CONSISTENT |
| `steps: RecordedStep[]` | Yes | Yes | CONSISTENT |
| `metadata: { startUrl, startPageTitle, browserVersion, stepCount }` | Yes | Yes | CONSISTENT |

The data model is fully consistent across all three documents. No field mismatches, no type discrepancies.

---

## 6. Technology Stack Consistency

**Score: 98/100 -- PASS**

| Technology | PRD (Section 8.2) | Architecture (Section 1.3) | UX (Section 1.2) | Status |
|------------|-------------------|---------------------------|-------------------|--------|
| WXT | 0.20.19+ | 0.20.19+ | -- | CONSISTENT |
| Vite | 8.0.x | 8.0.x (Rolldown) | -- | CONSISTENT |
| TypeScript | 5.x (strict) | 5.x (strict) | -- | CONSISTENT |
| Lit | 3.3.2 | 3.3.2 | "Lit Web Components (light DOM)" | CONSISTENT |
| PicoCSS | classless (~3-4 KB) | classless (~3 KB) | "classless (~4 KB gzip)" | CONSISTENT (minor size variance) |
| Vitest | 4.1 | 4.1.0 | -- | CONSISTENT |
| Playwright | 1.58 | 1.58.x | -- | CONSISTENT |
| JSZip | latest | latest | -- | CONSISTENT |
| pnpm | latest | latest | -- | CONSISTENT |
| ESLint | flat config | flat config | -- | CONSISTENT |
| size-limit | -- | -- | -- | CONSISTENT |
| Chrome MV3 | Chrome 120+ | MV3 | -- | CONSISTENT |

### Permissions

| PRD (Section 8.5) | Architecture (Section 12.1) | WXT Config (Section 2.1) | Status |
|----|----|----|----|
| activeTab | activeTab | activeTab | CONSISTENT |
| scripting | scripting | scripting | CONSISTENT |
| storage | storage | storage | CONSISTENT |
| sidePanel | sidePanel | sidePanel | CONSISTENT |
| alarms | alarms | alarms | CONSISTENT |
| downloads | downloads | downloads | CONSISTENT |

All six permissions match exactly across all three locations. The PRD's removal of `tabs` permission (validation report finding) is reflected in both the architecture and WXT config.

---

## 7. Missing Pieces Before Implementation

### 7.1 Addressed (No Action Needed)

These items were previously flagged but are now resolved in the current document versions:

- Error handling section (PRD Section 6.6)
- FR-2.6 DnD implementation approach (native HTML5)
- `tabs` permission removed
- North Star metric revised

### 7.2 Gaps to Address (Non-Blocking)

| ID | Gap | Severity | Recommendation |
|----|-----|----------|----------------|
| GAP-1 | **Missing UX components in architecture file listing.** `<sop-screenshot-lightbox>`, `<sop-empty-state>`, `<sop-recording-card>`, and undo toast are defined in UX but not listed in architecture's project structure. | Low | Add these files to the architecture's Section 2 project structure. Developer can infer them from UX spec regardless. |
| GAP-2 | **ViewState naming inconsistency.** UX uses `'edit'`, architecture uses `'editor'` for the same view state. | Cosmetic | Standardize on `'edit'` throughout. |
| GAP-3 | **No epics or stories document.** The BMAD workflow checks for epics and stories as implementation artifacts. None exist for this project. | Medium | Create epics and stories before implementation begins, or accept that the developer agent will derive implementation order from the PRD/Architecture directly. The architecture's Section 14.1 provides a suggested implementation order. |
| GAP-4 | **JSZip version not pinned.** Both PRD and architecture list JSZip as "latest" without a specific version. | Low | Pin to a specific version (e.g., 3.10.1) in package.json during scaffold. |

### 7.3 Implementation Order Guidance

The PRD closing paragraph provides clear implementation sequence:

1. WXT project scaffold (Lit + PicoCSS, no React)
2. Define adapter interfaces in `src/core/`
3. Implement content script event capture
4. Background state machine with Chrome adapters
5. Side panel UI with Lit components
6. Markdown export module
7. CI/CD with GitHub Actions alongside initial scaffold

The architecture provides additional detail:
- Section 2: Full project structure with file names
- Section 14: Development workflow commands
- Section 14.2: Package scripts

This is sufficient for a developer agent to begin work without epics/stories.

---

## 8. Risk Assessment

### High-Impact Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **View Transitions API browser support edge cases.** The UX spec relies heavily on `document.startViewTransition()`. While Chrome 111+ supports it, extension side panels may have quirks. | Medium | Medium | Architecture Section 9.2 already includes fallback: `if (!document.startViewTransition) { this.currentView = newView; return; }`. Good. |
| **Service worker keepalive reliability.** MV3 service workers terminate after 30s idle. The dual keepalive strategy (port + alarm) is sound but has known edge cases (Chrome 120-125 alarm bugs). | Medium | High | Architecture addresses this with both port-based and alarm-based keepalive. Session storage persistence ensures data is not lost even if worker restarts. |
| **Content script injection on restricted pages.** `activeTab` permission limits when content scripts can be injected. If user clicks extension icon on a `chrome://` page, recording cannot start. | Low | Low | PRD Section 6.6 and UX Section 8.2 both specify the expected behavior: "Cannot record on this page." |
| **PicoCSS classless + Lit light DOM interaction.** This combination is uncommon. PicoCSS styles `<article>`, `<section>`, etc. directly. Lit's light DOM renders into the host document, so PicoCSS styles will cascade. But Lit's `@customElement` creates new HTML elements (`<sop-app>`, `<sop-home>`) that PicoCSS does not style by default. | Medium | Low | Custom CSS for extension-specific components is expected. PicoCSS styles the semantic HTML children (`<button>`, `<article>`, `<h2>`), not the Lit custom element wrappers. This is the intended architecture. |

### Medium-Impact Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **OffscreenCanvas availability in service worker.** Step number badge rendering (Architecture Section 7.3) uses OffscreenCanvas in the service worker. While supported in Chrome 69+, service workers have specific constraints. | Low | Medium | If OffscreenCanvas fails, badge can be rendered client-side in the side panel, or deferred to v1.1. FR-6.2 is "Should" priority. |
| **IndexedDB + chrome.storage coordination complexity.** Two storage systems that must stay in sync (delete recording metadata AND its blobs). | Medium | Medium | Architecture specifies clear separation: metadata in chrome.storage, blobs in IndexedDB. Delete operation must be transactional. |
| **WXT 0.20.x is pre-1.0.** While actively maintained, breaking changes are possible before WXT 1.0. | Low | Medium | PRD targets 0.20.19+ which supports Vite 8. Pin the minor version in package.json. |
| **Vite 8 is newly released (March 12, 2026).** Potential for early-adopter bugs with the Rolldown bundler. | Medium | Medium | WXT 0.20.19 officially supports Vite 8. If issues arise, Vite 7 is a fallback. |

### Low-Impact Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **PicoCSS size variance.** Documents cite 3-4 KB. Actual classless bundle may differ slightly. | Low | Negligible | Verify during scaffold. Well within budget. |
| **Playwright extension E2E test flakiness.** Extension testing with `--load-extension` can be flaky in CI. | Medium | Low | Architecture includes Playwright report artifact upload on failure. Good CI practice. |

---

## Summary

| Dimension | Score | Verdict |
|-----------|-------|---------|
| PRD Completeness | 96/100 | PASS |
| UX <-> PRD Alignment | 95/100 | PASS |
| Architecture <-> PRD Alignment | 96/100 | PASS |
| Architecture <-> UX Alignment | 94/100 | PASS -- minor component listing gap |
| Data Model Consistency | 97/100 | PASS -- fully consistent across all docs |
| Technology Stack Consistency | 98/100 | PASS -- all versions aligned |
| Implementation Readiness | 90/100 | PASS -- no epics/stories but implementation order is clear |

### Blockers: None

### Pre-Implementation Actions (Recommended, Not Required)

1. **Add missing component files to architecture project structure** (GAP-1): `sop-screenshot-lightbox.ts`, `sop-empty-state.ts`, `sop-recording-card.ts`, `sop-undo-toast.ts`
2. **Standardize ViewState to `'edit'`** (GAP-2)
3. **Pin JSZip version** (GAP-4)

### Conclusion

The SOP Recorder planning artifacts are exceptionally well-aligned across all three documents. The PRD provides complete requirements with traceability. The UX spec provides detailed wireframes and interaction patterns for every user-facing feature. The architecture defines clear adapter interfaces, a testable core-shell separation, and a comprehensive project structure.

A developer agent can begin implementation immediately using the PRD's suggested sequence and the architecture's project structure as a scaffold blueprint. The four gaps identified are cosmetic or minor and can be addressed during implementation without risk.

**Verdict: APPROVED for implementation.**
