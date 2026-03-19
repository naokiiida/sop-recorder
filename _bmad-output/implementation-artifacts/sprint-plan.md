# Sprint Plan -- SOP Recorder MVP

**Project:** SOP Recorder
**Date:** 2026-03-18
**Total Sprints:** 8 (one per epic)
**Total Stories:** 42
**Developer:** Claude Code agent (one story at a time)

---

## Sprint 1: Project Scaffolding & CI/CD

**Sprint Goal:** Establish the WXT + Vite 8 project skeleton with build tooling, testing infrastructure, linting, and CI/CD so all subsequent sprints can focus on features.

**Dependencies:** None (foundational sprint).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 1.1 | Initialize WXT Project with Vite 8 | No (must be first) |
| 2 | 1.2 | Configure ESLint and Prettier | Yes (after 1.1) |
| 3 | 1.3 | Configure Vitest with WxtVitest Plugin | Yes (after 1.1, parallel with 1.2) |
| 4 | 1.4 | Configure Playwright for Extension E2E Testing | Yes (after 1.1, parallel with 1.2/1.3) |
| 5 | 1.5 | Set Up GitHub Actions CI Pipeline | No (depends on 1.2, 1.3, 1.4) |

### Definition of Done

- `pnpm run dev` starts dev server and loads extension in Chrome
- `pnpm run build` produces a valid MV3 extension
- `pnpm run lint` and `pnpm run format:check` pass
- `pnpm run test:unit` runs with Vitest + WxtVitest plugin
- `pnpm run test:e2e` runs with Playwright loading the built extension
- CI pipeline runs lint, typecheck, unit tests, build, and bundle size checks
- Manifest declares all 6 required permissions: activeTab, scripting, storage, sidePanel, alarms, downloads
- TypeScript strict mode enabled

### Risks/Notes

- WXT 0.20.19+ with Vite 8 is relatively new (Vite 8 released March 12, 2026). If issues arise, Vite 7 is a fallback.
- Playwright extension testing with `--load-extension` can be flaky. The sample test should be minimal to validate the setup works.
- Pin WXT and Vite versions in `package.json` to avoid surprises.

---

## Sprint 2: Core Engine (Pure TypeScript)

**Sprint Goal:** Implement all core business logic as pure TypeScript modules with zero Chrome API dependencies -- types, adapter interfaces, state machine, step manager, selector generator, and event filter.

**Dependencies:** Sprint 1 (project scaffold and test infrastructure).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 2.1 | Define TypeScript Types and Data Model | No (must be first -- all others depend on types) |
| 2 | 2.2 | Define Adapter Interfaces (Ports) | No (depends on 2.1) |
| 3 | 2.3 | Implement Recording State Machine | Yes (after 2.2, parallel with 2.4-2.6) |
| 4 | 2.4 | Implement Step Manager | Yes (after 2.1, parallel with 2.3, 2.5, 2.6) |
| 5 | 2.5 | Implement Selector Generator | Yes (after 2.1, parallel with 2.3, 2.4, 2.6) |
| 6 | 2.6 | Implement Event Filter | Yes (after 2.1, parallel with 2.3, 2.4, 2.5) |

### Definition of Done

- `src/core/types.ts` exports all shared types with discriminated union messages
- `src/adapters/interfaces/index.ts` exports all 8 adapter interfaces with zero `chrome.*` imports
- Recording state machine passes tests for all valid/invalid transitions, observers, and recovery
- Step manager passes tests for CRUD, reorder, renumber, and edge cases
- Selector generator passes tests for ID, data-testid, aria-label, and fallback strategies
- Event filter passes tests for debounce (500ms), dedup, drag filter, and untrusted events
- All modules have zero Chrome API dependencies
- Unit test coverage >= 80% for all core modules

### Risks/Notes

- Types defined here are the single source of truth. Changes later will ripple across all modules.
- The selector generator will be tested with JSDOM. Real browser behavior may differ slightly -- E2E tests in Sprint 7 will catch discrepancies.
- Auto-generated step titles (e.g., "Clicked 'Save' button") are defined in StepManager -- this determines UX quality.

---

## Sprint 3: Content Script (Event Capture)

**Sprint Goal:** Implement the content script that captures DOM events, generates selectors, extracts element info, applies CSS overlay for screenshot annotation, and sends captured events to the background service worker.

**Dependencies:** Sprint 2 (types, selector generator, event filter).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 3.1 | Content Script Bootstrap with Dynamic Loading | No (must be first -- foundation for all content script work) |
| 2 | 3.2 | Implement Content Recorder (Click and Input Capture) | No (depends on 3.1) |
| 3 | 3.3 | Implement Navigation Detection | Yes (after 3.2, parallel with 3.4, 3.5) |
| 4 | 3.4 | Implement CSS Overlay for Screenshot Annotation | Yes (after 3.1, parallel with 3.3, 3.5) |
| 5 | 3.5 | Implement Accessible Name Extraction and Element Info | Yes (after 3.2, parallel with 3.3, 3.4) |

### Definition of Done

- Content script registers with `matches: ['<all_urls>']` and `runAt: 'document_idle'`
- Dynamic import loads recording module only on `START_CAPTURE` message
- Click, input, change, submit events are captured with full element metadata
- SPA navigation detected via URL polling (500ms interval) and popstate
- CSS overlay highlights clicked element with red outline before screenshot
- Accessible names extracted following WAI-ARIA spec priority chain
- Password fields (`<input type="password">`) have values masked as `••••••••`
- Bootstrap file is < 2 KB before minification
- Events sent to background via `chrome.runtime.sendMessage`

### Risks/Notes

- Content scripts run in a different execution context than the page. Access to page JS objects is limited.
- SPA navigation detection via URL polling is a pragmatic approach. MutationObserver on the URL bar is not possible from content scripts.
- The CSS overlay must not trigger MutationObserver-based frameworks (React, Vue) -- using `data-sop-*` attributes and injecting a `<style>` element is the safe approach.
- The content script cannot be fully unit-tested in JSDOM because it depends on Chrome messaging. Integration testing happens in Sprint 4 and E2E testing in Sprint 7.

---

## Sprint 4: Background Service Worker

**Sprint Goal:** Implement the background service worker that orchestrates recording via the state machine and adapters, captures screenshots, manages persistence, handles keepalive, and bridges content script to side panel communication.

**Dependencies:** Sprint 2 (core engine), Sprint 3 (content script).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 4.1 | Implement Chrome Storage Adapter | Yes (parallel with 4.2, 4.3, 4.4) |
| 2 | 4.2 | Implement IndexedDB Blob Store | Yes (parallel with 4.1, 4.3, 4.4) |
| 3 | 4.3 | Implement Screenshot Adapter and Thumbnail Generator | Yes (parallel with 4.1, 4.2, 4.4) |
| 4 | 4.4 | Implement Tab, Message Bus, Alarm, and Download Adapters | Yes (parallel with 4.1, 4.2, 4.3) |
| 5 | 4.5 | Implement Background Service Worker Orchestrator | No (depends on 4.1-4.4 and all of E2/E3) |
| 6 | 4.6 | Implement Service Worker State Recovery | No (depends on 4.5) |
| 7 | 4.7 | Implement Storage Quota Management | No (depends on 4.1, 4.2) |

### Definition of Done

- Chrome storage adapter reads/writes session state and recording CRUD to chrome.storage
- IndexedDB blob store handles screenshot blob CRUD with versioned schema
- Screenshot adapter captures JPEG at quality 85, generates 320x180 thumbnails, renders step number badge
- Tab, message bus, alarm, and download adapters wrap their respective Chrome APIs
- Background orchestrator wires all adapters to core engine and handles full recording lifecycle
- State recovery restores recording state and steps after service worker restart
- Storage quota monitoring warns at 80% usage, auto-purges recordings older than 30 days
- Unit tests use `@webext-core/fake-browser` for Chrome API mocks
- End-to-end flow works: start recording -> capture events -> screenshot -> persist -> stop -> save

### Risks/Notes

- MV3 service workers terminate after 30s idle. The dual keepalive strategy (port + 25s alarm) addresses this.
- `captureVisibleTab` requires `activeTab` permission and fails on `chrome://` pages. Story 4.3 handles this gracefully.
- OffscreenCanvas in the service worker for thumbnail generation is supported in Chrome 69+ but has constraints. If it fails, thumbnail generation can move to the side panel.
- Stories 4.1-4.4 are all adapter implementations and can be worked in parallel since they implement independent interfaces.

---

## Sprint 5: Side Panel UI (Lit + PicoCSS)

**Sprint Goal:** Implement the full side panel UI with Lit Web Components in light DOM mode, PicoCSS classless styling, state-driven view routing, and all recording/editing/management interactions.

**Dependencies:** Sprint 4 (background service worker provides real data via port communication).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 5.1 | Set Up Side Panel Shell and PicoCSS Styling | No (must be first -- HTML host and CSS foundation) |
| 2 | 5.2 | Implement RecordingController (State Sync with Background) | No (depends on 5.1 -- all components depend on this controller) |
| 3 | 5.3 | Implement sop-app Root Component with View Routing | No (depends on 5.2) |
| 4 | 5.4 | Implement sop-home Component (Recording List) | Yes (after 5.3, parallel with 5.5) |
| 5 | 5.5 | Implement sop-recording Component (Active Recording View) | Yes (after 5.3, parallel with 5.4) |
| 6 | 5.6 | Implement sop-step-card Component | No (depends on 5.3 -- used by both 5.5 and 5.7) |
| 7 | 5.7 | Implement sop-editor Component (Edit View) | No (depends on 5.6) |
| 8 | 5.8 | Implement Screenshot Lightbox | No (depends on 5.6 -- triggered by step card thumbnail click) |

### Definition of Done

- Side panel opens when extension icon is clicked
- PicoCSS classless styles render correctly with dark/light mode support
- `<sop-app>` routes between Home, Recording, and Edit views via state-driven transitions
- View Transitions API used for animated view switches (with fallback)
- Home view shows empty state or simple recording list (click to open, long-press 500ms for multi-select batch delete/export)
- Recording view shows red pulse indicator, live step feed (newest first), pause/stop controls
- Step card has live mode (read-only) and edit mode (inline editing, reorder buttons, drag handle, delete)
- Editor view supports step editing, reordering (buttons + DnD), deletion with undo toast, and export trigger
- Screenshot lightbox shows full-size screenshot with keyboard dismiss (Escape)
- All components use light DOM rendering for PicoCSS compatibility
- RecordingController syncs state via chrome.runtime.connect port

### Risks/Notes

- PicoCSS classless + Lit light DOM is an uncommon combination. PicoCSS styles semantic HTML children, not Lit custom element wrappers. Custom CSS will be needed for extension-specific layouts.
- The side panel is constrained to ~300-500px width. Design target is 400px. All components must be compact.
- View Transitions API is Chrome 111+. The architecture includes a fallback for older Chrome versions, but the minimum target is Chrome 120+ so this should be safe.
- Story 5.6 (step card) is a critical shared component used by both recording and editor views. It should be implemented before 5.7.
- Note UX-ARCH-2 from implementation readiness: standardize ViewState on `'edit'` (not `'editor'`).

---

## Sprint 6: Export Engine (Markdown + ZIP)

**Sprint Goal:** Implement the Markdown export pipeline that generates a ZIP file containing a formatted SOP document and numbered JPEG screenshots, plus clipboard copy functionality.

**Dependencies:** Sprint 4 (blob store for screenshot retrieval), Sprint 5 (export UI trigger in editor view).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 6.1 | Implement Markdown Generator | No (must be first -- foundation for ZIP and clipboard) |
| 2 | 6.2 | Implement ZIP Export with JSZip | No (depends on 6.1) |
| 3 | 6.3 | Implement Copy Markdown to Clipboard | Yes (after 6.1, parallel with 6.2) |

### Definition of Done

- Markdown output includes title, date, step count, starting URL, and formatted steps with screenshot references
- Step numbers are zero-padded (step-01.jpg, step-02.jpg)
- ZIP contains `sop.md` at root and `screenshots/` subfolder with JPEG files
- Export for 10 steps completes in < 3 seconds, 50 steps in < 10 seconds
- Steps with failed screenshot capture show "(Screenshot unavailable)"
- ZIP filename sanitized from recording title
- "Copy Markdown" writes text to clipboard with `[Screenshot: Step N]` placeholders instead of image paths
- Success/error toasts shown for clipboard operations
- JSZip version pinned in package.json (not "latest")
- Markdown generator is a pure function with unit tests

### Risks/Notes

- JSZip is the only third-party runtime dependency beyond Lit and PicoCSS. Pin it to a specific version (e.g., 3.10.1).
- FR-3.5 (Copy Markdown) is "Should" priority in the PRD. Implement if time permits; the UX export panel includes it as a button.
- Large recordings (50+ steps) may have significant ZIP generation time. The export should show progress or at minimum a spinner.

---

## Sprint 7: Polish & Quality

**Sprint Goal:** Add comprehensive error handling, accessibility compliance, performance optimization, and thorough test coverage to bring the extension to release quality.

**Dependencies:** Sprints 1-6 (all features implemented).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 7.1 | Implement Comprehensive Error Handling | No (touches all modules -- should be first to stabilize) |
| 2 | 7.2 | Implement Accessibility Compliance | Yes (after 7.1, parallel with 7.3) |
| 3 | 7.3 | Implement Performance Optimization | Yes (after 7.1, parallel with 7.2) |
| 4 | 7.4 | Write Core Module Unit Tests (>= 80% Coverage) | Yes (after 7.1, parallel with 7.5) |
| 5 | 7.5 | Write E2E Tests for Critical Path | No (depends on 7.1, 7.2, 7.3 -- tests the final product) |

### Definition of Done

- All 5 PRD failure scenarios handled gracefully (screenshot fail, quota exhaustion, injection fail, SW restart, export fail)
- No error causes a white screen or unresponsive UI
- Full WCAG 2.1 AA compliance: keyboard navigation, ARIA labels, color contrast, focus indicators
- `prefers-reduced-motion` disables animations
- Playwright + axe-core tests pass with zero accessibility violations
- Service worker cold start < 200ms, content script impact < 50ms, screenshot capture < 300ms
- Bundle sizes within budget: content < 50 KB, SW < 100 KB, panel < 200 KB, total < 2 MB
- Core module unit test coverage >= 80%
- E2E critical path test: record -> edit -> export verified end-to-end
- E2E tests for empty state, saved recordings, delete recording, keyboard shortcut

### Risks/Notes

- Error handling (7.1) should be done first because it stabilizes the app before accessibility and performance work.
- Accessibility testing with axe-core in Playwright may surface issues in PicoCSS defaults. These are likely minor (color contrast tweaks).
- Performance optimization may require lazy-loading thumbnails (only visible ones) and using Lit's `repeat` directive for step lists.
- E2E tests (7.5) depend on the stabilized, accessible, performant app. Run them last.
- Some unit tests may already exist from earlier sprints. Story 7.4 fills gaps to reach 80% coverage.

---

## Sprint 8: Release Preparation

**Sprint Goal:** Prepare the extension for Chrome Web Store publication with store assets, README, repository setup, and final CWS submission validation.

**Dependencies:** Sprint 7 (polish and quality complete).

### Stories

| Order | Story ID | Title | Parallelizable |
|-------|----------|-------|----------------|
| 1 | 8.1 | Create Extension Icons and CWS Store Assets | Yes (parallel with 8.2) |
| 2 | 8.2 | Create README and Repository Setup | Yes (parallel with 8.1) |
| 3 | 8.3 | Chrome Web Store Submission Validation | No (depends on 8.1, 8.2 -- validates final package) |

### Definition of Done

- Extension icons (16px, 48px, 128px) with consistent branding in `src/assets/`
- CWS store assets: promo tile (440x280), 3 screenshots (1280x800) showing recording, editing, and export
- CWS description emphasizes: local-first, no accounts, free/open-source, Markdown export
- README with: description, features, installation (CWS + manual), usage guide, development setup, architecture overview, contributing guidelines, MIT license
- GitHub issue templates for bug reports and feature requests
- `LICENSE` (MIT) and `CONTRIBUTING.md` files
- Extension ZIP < 2 MB, manifest passes CWS validation
- No CSP violations, works on Chrome 120+
- Privacy policy reflects zero data collection
- All CI checks pass on the release commit

### Risks/Notes

- Icon creation requires visual design skills. For MVP, a simple SVG icon (circle with record dot or document icon) is sufficient. Can be improved post-launch.
- CWS review can take 1-3 business days. Submit early and iterate on review feedback.
- The privacy policy is simple (no data collection) but must be hosted at a public URL for CWS submission.

---

## Sprint Dependency Graph

```
Sprint 1 (Scaffolding)
    |
Sprint 2 (Core Engine)
    |
Sprint 3 (Content Script)
    |
Sprint 4 (Background SW) ----+
    |                         |
Sprint 5 (Side Panel UI)     |
    |                         |
Sprint 6 (Export Engine) -----+
    |
Sprint 7 (Polish & Quality)
    |
Sprint 8 (Release)
```

Note: Sprint 6 depends on both Sprint 4 (blob store) and Sprint 5 (export UI trigger). However, the Markdown generator (Story 6.1) is a pure function that can be implemented after Sprint 4 alone. The full integration with the export button in the UI requires Sprint 5.

---

## Developer Agent Context

Each story in the epics-and-stories document (`_bmad-output/planning-artifacts/epics-and-stories.md`) contains:

1. **User story format** -- As a developer, I want X, so that Y
2. **Acceptance criteria** -- Given/When/Then format with specific, testable conditions
3. **Technical notes** -- Implementation hints, references to WXT examples, and architecture section references

The developer agent should:

- Read the full story from `epics-and-stories.md` before starting implementation
- Reference `architecture.md` for file paths, adapter interfaces, and project structure
- Reference `ux-design.md` for component wireframes, interaction patterns, and CSS specs
- Reference `prd.md` for functional requirements and data model definitions
- Write tests alongside implementation (not as a separate phase)
- Run `pnpm run lint`, `pnpm run test:unit`, and `pnpm run build` after each story to verify nothing breaks

### Key Implementation Decisions (from planning artifacts)

- **ViewState:** Use `'edit'` (not `'editor'`) per UX-ARCH-2 finding
- **Missing components:** Create `sop-screenshot-lightbox.ts`, `sop-empty-state.ts`, `sop-recording-card.ts`, `sop-undo-toast.ts` based on UX spec (not listed in architecture project structure)
- **JSZip version:** Pin to specific version (e.g., 3.10.1), not "latest"
- **Light DOM:** All Lit components use `createRenderRoot() { return this; }` for PicoCSS compatibility
- **No `tabs` permission:** Removed per PRD v2.1 decision
