---
stepsCompleted: [validate-prerequisites, design-epics, create-stories, final-validation]
inputDocuments: [prd.md, ux-design.md, architecture.md]
---

# SOP Recorder - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SOP Recorder, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories. Each story is scoped for 1-3 hours of developer agent implementation time.

## Requirements Inventory

### Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| FR-1.1 | Start/stop recording via side panel button | Must |
| FR-1.2 | Start/stop recording via keyboard shortcut (Alt+Shift+R) | Must |
| FR-1.3 | Pause/resume recording | Must |
| FR-1.4 | Capture click events on interactive elements | Must |
| FR-1.5 | Capture text input events (debounced at 500ms) | Must |
| FR-1.6 | Capture page navigation events | Must |
| FR-1.7 | Auto-screenshot after each captured event (200ms delay) | Must |
| FR-1.8 | Filter non-meaningful events (drag, untrusted, duplicates) | Must |
| FR-1.9 | Generate multiple selector strategies per element | Must |
| FR-1.10 | Extract accessible names following WAI-ARIA spec | Must |
| FR-1.11 | Mask password field values | Must |
| FR-1.12 | Persist recording state to chrome.storage.session | Must |
| FR-1.13 | Show visual recording indicator in side panel | Must |
| FR-1.14 | Capture element bounding box at click time | Must |
| FR-1.15 | Capture viewport dimensions and scroll position | Must |
| FR-1.16 | Store screenshots as Blobs in IndexedDB | Must |
| FR-2.1 | Display step list in side panel with thumbnails | Must |
| FR-2.2 | Inline editing of step title | Must |
| FR-2.3 | Inline editing of step description | Must |
| FR-2.4 | Delete individual steps | Must |
| FR-2.5 | Reorder steps via up/down buttons | Must |
| FR-2.6 | Reorder steps via drag-and-drop | Should |
| FR-2.7 | View full-size screenshot for any step | Must |
| FR-2.8 | Automatic step renumbering after edits | Must |
| FR-3.1 | Export as Markdown + screenshots ZIP | Must |
| FR-3.2 | Markdown includes title, date, step numbers, descriptions, screenshot refs | Must |
| FR-3.3 | Screenshots exported as numbered JPEG files | Must |
| FR-3.4 | SOP metadata in export (title, author, date, step count) | Should |
| FR-3.5 | Copy Markdown to clipboard (without images) | Should |
| FR-4.1 | Save completed recordings with metadata | Must |
| FR-4.2 | List saved recordings with title, date, step count | Must |
| FR-4.3 | Delete saved recordings (metadata + blobs) | Must |
| FR-4.4 | Edit SOP title for saved recordings | Must |
| FR-4.5 | Auto-generate SOP title from first page URL/title | Should |
| FR-5.1 | Three primary views: Home, Recording, Edit | Must |
| FR-5.2 | Recording controls: Start, Stop, Pause/Resume | Must |
| FR-5.3 | Real-time step list during active recording | Must |
| FR-5.4 | Export button accessible from Edit view | Must |
| FR-5.5 | Empty state with clear "Start Recording" CTA | Must |
| FR-6.1 | Highlight clicked element via CSS overlay before screenshot | Should |
| FR-6.2 | Add step number badge at click coordinates post-capture | Should |
| FR-6.3 | Remove CSS overlay after screenshot capture | Should |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-PERF-1 | Extension package < 2 MB | Must |
| NFR-PERF-2 | Content script injected size < 50 KB | Must |
| NFR-PERF-3 | Service worker entry size < 100 KB | Must |
| NFR-PERF-4 | Side panel JS bundle < 200 KB | Must |
| NFR-PERF-5 | Service worker cold start < 200ms | Must |
| NFR-PERF-6 | Content script page load impact < 50ms | Must |
| NFR-PERF-7 | Screenshot capture latency < 300ms | Must |
| NFR-PERF-8 | Export generation (10 steps) < 3s | Must |
| NFR-REL-1 | Service worker restart recovery | Must |
| NFR-REL-2 | Service worker keepalive during recording | Must |
| NFR-REL-3 | Message ordering via sequence numbers | Must |
| NFR-REL-4 | Storage quota management (auto-purge 30 days, warn 80%) | Must |
| NFR-SEC-1 | Zero external network requests | Must |
| NFR-SEC-2 | Password masking (input type="password") | Must |
| NFR-SEC-3 | Minimum permissions manifest | Must |
| NFR-SEC-4 | No user accounts or telemetry | Must |
| NFR-A11Y-1 | Keyboard navigation (Tab/Enter/Escape) | Must |
| NFR-A11Y-2 | Screen reader support (ARIA labels) | Must |
| NFR-A11Y-3 | Color contrast WCAG 2.1 AA | Must |
| NFR-A11Y-4 | Visible focus indicators | Must |
| NFR-A11Y-5 | Respect prefers-reduced-motion | Must |
| NFR-TEST-1 | Unit test coverage >= 80% on core modules | Must |
| NFR-TEST-2 | E2E critical path (record -> edit -> export) | Must |
| NFR-TEST-3 | Bundle size enforcement in CI | Must |
| NFR-TEST-4 | Manifest validation in CI | Must |
| NFR-TEST-5 | WCAG compliance via Playwright + axe-core | Must |

### UX Design Requirements

| ID | Requirement |
|----|------------|
| UX-1 | State-driven view routing (no tab bar/hamburger) |
| UX-2 | View Transitions API for animated view switches |
| UX-3 | Light DOM Lit components for PicoCSS compatibility |
| UX-4 | Empty state with illustration and CTA |
| UX-5 | Recording indicator with red pulse animation |
| UX-6 | Live step feed (newest first during recording) |
| UX-7 | Click-to-edit inline editing for titles/descriptions |
| UX-8 | Screenshot lightbox overlay |
| UX-9 | Undo toast (5s) for destructive actions instead of confirmation dialogs |
| UX-10 | Compact density design for ~400px panel width |
| UX-11 | Dark/light mode via prefers-color-scheme (PicoCSS) |
| UX-12 | Recovery state UI after service worker restart |

### FR Coverage Map

| Epic | Requirements Covered |
|------|---------------------|
| E1: Scaffolding & CI/CD | NFR-PERF-1-4, NFR-TEST-3-4, NFR-SEC-3 |
| E2: Core Engine | FR-1.8, FR-1.9, FR-1.10, FR-1.11, FR-1.12, FR-1.14, FR-1.15, NFR-REL-3 |
| E3: Content Script | FR-1.4, FR-1.5, FR-1.6, FR-1.9, FR-1.10, FR-1.11, FR-1.14, FR-1.15, FR-6.1, FR-6.3 |
| E4: Background Service Worker | FR-1.1, FR-1.2, FR-1.3, FR-1.7, FR-1.12, FR-1.16, FR-6.2, NFR-REL-1-2, NFR-REL-4 |
| E5: Side Panel UI | FR-2.1-2.8, FR-4.1-4.5, FR-5.1-5.5, UX-1-12 |
| E6: Export Engine | FR-3.1-3.5 |
| E7: Polish & Quality | NFR-A11Y-1-5, NFR-PERF-5-8, NFR-TEST-1-2, NFR-TEST-5, FR-1.8 edge cases |
| E8: Release | CWS listing, README, launch prep |

## Epic List

| Epic | Title | Stories | Priority |
|------|-------|---------|----------|
| E1 | Project Scaffolding & CI/CD | 5 | Must |
| E2 | Core Engine (Pure TypeScript) | 6 | Must |
| E3 | Content Script (Event Capture) | 5 | Must |
| E4 | Background Service Worker | 7 | Must |
| E5 | Side Panel UI (Lit + PicoCSS) | 8 | Must |
| E6 | Export Engine (Markdown + ZIP) | 3 | Must |
| E7 | Polish & Quality | 5 | Must |
| E8 | Release Preparation | 3 | Must |

---

## Epic 1: Project Scaffolding & CI/CD

**Goal:** Establish the WXT + Vite 8 project skeleton with all build tooling, testing infrastructure, linting, and CI/CD pipeline so that subsequent epics can focus purely on feature development.

**Dependencies:** None (foundational epic).

### Story 1.1: Initialize WXT Project with Vite 8

As a developer,
I want a WXT project scaffold with Vite 8, TypeScript strict mode, and pnpm,
So that I have a working build system for the Chrome extension.

**Acceptance Criteria:**

**Given** an empty project directory
**When** the WXT project is initialized with `pnpm create wxt`
**Then** the project builds successfully with `pnpm run build`
**And** `wxt.config.ts` configures `srcDir: 'src'`, `manifestVersion: 3`
**And** the manifest declares permissions: `activeTab`, `scripting`, `storage`, `sidePanel`, `alarms`, `downloads`
**And** the `commands` section declares `toggle-recording` with `Alt+Shift+R`
**And** `tsconfig.json` enables `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
**And** the project uses Vite 8 (via WXT 0.20.19+)
**And** `pnpm run dev` starts the development server and loads the extension in Chrome

**Technical notes:**
- Reference: https://github.com/wxt-dev/examples/tree/main/examples/side-panel
- WXT auto-discovers entrypoints under `src/entrypoints/`
- Create placeholder entrypoints: `src/entrypoints/background.ts`, `src/entrypoints/content.ts`, `src/entrypoints/sidepanel/index.html`, `src/entrypoints/sidepanel/main.ts`

### Story 1.2: Configure ESLint and Prettier

As a developer,
I want consistent code formatting and linting,
So that code quality is maintained across all contributions.

**Acceptance Criteria:**

**Given** the initialized WXT project
**When** ESLint flat config and Prettier are configured
**Then** `pnpm run lint` runs without errors on the scaffold code
**And** `pnpm run format:check` validates formatting
**And** the ESLint config extends TypeScript strict rules
**And** `.prettierrc` sets `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`

### Story 1.3: Configure Vitest with WxtVitest Plugin

As a developer,
I want a unit testing setup with Vitest and the WxtVitest plugin,
So that I can write and run unit tests for core modules with polyfilled browser APIs.

**Acceptance Criteria:**

**Given** the WXT project with TypeScript
**When** Vitest is configured with the WxtVitest plugin
**Then** `pnpm run test:unit` runs successfully
**And** `vitest.config.ts` uses `WxtVitest()` plugin and `jsdom` environment
**And** `@webext-core/fake-browser` is available for Chrome API polyfills
**And** a sample test in `tests/unit/sample.test.ts` passes
**And** code coverage reporting is enabled (`--coverage`)

**Technical notes:**
- Reference: https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing

### Story 1.4: Configure Playwright for Extension E2E Testing

As a developer,
I want a Playwright E2E testing setup that loads the built extension,
So that I can test the full extension flow in a real browser.

**Acceptance Criteria:**

**Given** the WXT project with a buildable extension
**When** Playwright is configured for extension testing
**Then** `pnpm run test:e2e` runs successfully with a sample test
**And** `playwright.config.ts` launches Chromium with `--load-extension` pointing to the build output
**And** `tests/e2e/fixtures/extension.ts` provides a test fixture that exposes `context` and `extensionId`
**And** a sample E2E test verifies the extension loads without errors

**Technical notes:**
- Reference: https://github.com/wxt-dev/examples/tree/main/examples/playwright-e2e-testing
- Use `chromium.launchPersistentContext` with `--disable-extensions-except` and `--load-extension` args

### Story 1.5: Set Up GitHub Actions CI Pipeline

As a developer,
I want a CI pipeline that runs on every PR and push to main,
So that code quality and bundle size regressions are caught automatically.

**Acceptance Criteria:**

**Given** the project with linting, unit tests, and build configured
**When** a GitHub Actions workflow is created at `.github/workflows/ci.yml`
**Then** the pipeline runs: lint, type check (`tsc --noEmit`), unit tests, build (`wxt build`), bundle size check
**And** bundle size budgets are enforced via `size-limit` or equivalent: content script < 50 KB, service worker < 100 KB, side panel < 200 KB, total package < 2 MB
**And** `.size-limit.json` defines per-entry-point budgets
**And** manifest validation runs (assert required fields, permissions match declared set)
**And** all checks must pass for PR merge

---

## Epic 2: Core Engine (Pure TypeScript)

**Goal:** Implement all core business logic as pure TypeScript modules with zero Chrome API dependencies. These modules define the adapter interfaces (ports) and provide the recording state machine, step management, selector generation, event filtering, and shared types.

**Dependencies:** E1 (project scaffold, testing infrastructure).

### Story 2.1: Define TypeScript Types and Data Model

As a developer,
I want the complete TypeScript type definitions for RecordedStep, Recording, messages, and adapter interfaces,
So that all modules share a single source of truth for data shapes.

**Acceptance Criteria:**

**Given** the project scaffold from E1
**When** `src/core/types.ts` is created
**Then** it exports `RecordedStep`, `Recording`, `RecordingMetadata`, `StepAction`, `SelectorSet`, `BoundingBox`, `CapturedEvent` interfaces
**And** it exports all message types: `ContentMessage`, `BackgroundToContentMessage`, `PanelMessage`, `BackgroundToPanelMessage`
**And** it exports `RecordingState` type (`'idle' | 'recording' | 'paused'`)
**And** it exports `ExportFormat` type (`'markdown-zip'`)
**And** `StepAction` includes: `click`, `dblclick`, `input`, `select`, `check`, `navigate`, `scroll`, `submit`, `keypress`
**And** all message types use discriminated unions with `type` field
**And** all types pass TypeScript strict mode compilation

### Story 2.2: Define Adapter Interfaces (Ports)

As a developer,
I want adapter interface definitions that decouple core logic from Chrome APIs,
So that the core engine can be reused in MCP server and Claude Code skill contexts without refactoring.

**Acceptance Criteria:**

**Given** the types from Story 2.1
**When** `src/adapters/interfaces/index.ts` is created
**Then** it exports interfaces: `IScreenshotCapture`, `IStorageAdapter`, `IBlobStore`, `ITabAdapter`, `IMessageBus`, `PanelPort`, `IAlarmAdapter`, `IDownloadAdapter`
**And** `IStorageAdapter` defines session state methods (get/set/clear) and recording CRUD methods
**And** `IBlobStore` defines put/get/delete/deleteMany/getUsage for Blob storage
**And** `IScreenshotCapture` defines `captureVisibleTab(): Promise<Blob>`
**And** no interface imports any `chrome.*` types
**And** a unit test validates the interfaces compile correctly

### Story 2.3: Implement Recording State Machine

As a developer,
I want a finite state machine that manages recording states (idle/recording/paused) with transitions and guards,
So that recording lifecycle is controlled by a tested, predictable state machine.

**Acceptance Criteria:**

**Given** the types from Story 2.1
**When** `src/core/recording-state-machine.ts` is implemented
**Then** it supports states: `idle`, `recording`, `paused`
**And** valid transitions: idle->recording (start), recording->paused (pause), paused->recording (resume), recording->idle (stop), paused->idle (stop)
**And** invalid transitions throw an error (e.g., start while already recording)
**And** it provides an `onStateChange` observer/callback mechanism
**And** it supports `recover(state)` for restoring state after service worker restart
**And** it has zero Chrome API dependencies
**And** unit tests cover all valid transitions, all invalid transitions, observer notifications, and recovery

### Story 2.4: Implement Step Manager

As a developer,
I want a StepManager that provides CRUD operations on RecordedStep arrays,
So that steps can be added, deleted, reordered, updated, and renumbered.

**Acceptance Criteria:**

**Given** the RecordedStep type from Story 2.1
**When** `src/core/step-manager.ts` is implemented
**Then** `addStep(event, screenshotBlobKey, thumbnailDataUrl)` creates a RecordedStep with UUID, auto-generated title, and correct sequenceNumber
**And** `deleteStep(stepId)` removes the step and renumbers remaining steps
**And** `reorderSteps(orderedIds)` reorders steps according to the provided ID array and renumbers
**And** `updateStep(stepId, changes)` updates title and/or description
**And** `getSteps()` returns a readonly copy
**And** `loadSteps(steps)` restores steps from persistence (recovery scenario)
**And** auto-generated titles follow the pattern: "{action} {accessibleName}" (e.g., "Clicked 'Save' button")
**And** it has zero Chrome API dependencies
**And** unit tests cover all operations including edge cases (delete last step, reorder with invalid IDs)

### Story 2.5: Implement Selector Generator

As a developer,
I want a multi-strategy selector generator that produces CSS, XPath, and ARIA selectors for DOM elements,
So that recorded steps have robust element identification for future tour/test export.

**Acceptance Criteria:**

**Given** the SelectorSet type from Story 2.1
**When** `src/core/selector-generator.ts` is implemented
**Then** `generateSelectors(element)` returns a `SelectorSet` with `css`, `xpath`, `aria`, and `textContent` fields
**And** CSS selector priority follows: `#id` > `[data-testid]` > `[aria-label]` > `tag[attrs]` > `parent > tag:nth-of-type(n)`
**And** XPath generation produces a valid XPath expression
**And** ARIA extraction follows WAI-ARIA accessible name computation (aria-label > aria-labelledby > alt > title > textContent)
**And** textContent is truncated at 100 characters
**And** unit tests cover elements with: IDs, data-testid, aria-label, no distinguishing attributes, nested elements

### Story 2.6: Implement Event Filter

As a developer,
I want an event filter that removes noise from captured events (debounce, dedup, drag filtering),
So that only meaningful user actions become recorded steps.

**Acceptance Criteria:**

**Given** the CapturedEvent type from Story 2.1
**When** `src/core/event-filter.ts` is implemented
**Then** it debounces input events at 500ms (only the last input value within 500ms is captured)
**And** it deduplicates clicks within 500ms on the same element
**And** it filters drag movements with > 50px displacement
**And** it filters untrusted events (`event.isTrusted === false`)
**And** it returns `true` (pass) or `false` (filter out) for each event
**And** it has zero Chrome API dependencies
**And** unit tests cover each filter type with edge cases

---

## Epic 3: Content Script (Event Capture)

**Goal:** Implement the content script that captures DOM events, generates selectors, extracts element info, and communicates captured events to the background service worker. Uses dynamic loading for minimal page impact.

**Dependencies:** E2 (types, selector generator, event filter).

### Story 3.1: Content Script Bootstrap with Dynamic Loading

As a developer,
I want a minimal content script entrypoint that dynamically imports the recording module only when recording starts,
So that the content script has < 50 KB initial footprint and < 50ms page load impact.

**Acceptance Criteria:**

**Given** the WXT project from E1
**When** `src/entrypoints/content.ts` is implemented using `defineContentScript`
**Then** it registers with `matches: ['<all_urls>']` and `runAt: 'document_idle'`
**And** the bootstrap code registers a `chrome.runtime.onMessage` listener
**And** on `START_CAPTURE` message, it dynamically imports the content recorder module
**And** on `STOP_CAPTURE`, `PAUSE_CAPTURE`, `RESUME_CAPTURE`, `INJECT_OVERLAY`, `REMOVE_OVERLAY` messages, it delegates to the recorder module
**And** it sends `CONTENT_READY` message on initialization
**And** the bootstrap file is < 2 KB (before minification)
**And** uses `ctx.addEventListener()` from WXT for auto-cleanup on context invalidation

### Story 3.2: Implement Content Recorder (Click and Input Capture)

As a developer,
I want the content recorder module that captures click, input, change, and submit events from the page,
So that user interactions are recorded as structured CapturedEvent objects.

**Acceptance Criteria:**

**Given** the content script bootstrap from Story 3.1 and core types/filter from E2
**When** the content recorder module is implemented
**Then** it captures `click` events on interactive elements using `document.addEventListener('click', handler, true)`
**And** it captures `input` events (debounced at 500ms) using `document.addEventListener('input', handler, true)`
**And** it captures `change` events for select/checkbox
**And** it captures `submit` events
**And** each captured event produces a `CapturedEvent` with: sequenceNumber, timestamp, type, selectors, tagName, elementType, elementRole, accessibleName, boundingBox, clickCoordinates, pageUrl, pageTitle, viewport, scrollPosition
**And** password fields (`<input type="password">`) have their values masked as `••••••••`
**And** events are sent to background via `chrome.runtime.sendMessage({ type: 'STEP_CAPTURED', payload })`
**And** the event filter from E2 is applied before sending
**And** `startCapture()`, `stopCapture()`, `pauseCapture()`, `resumeCapture()` control listener state

### Story 3.3: Implement Navigation Detection

As a developer,
I want to detect page navigation events including SPA navigation,
So that URL changes are captured as navigation steps.

**Acceptance Criteria:**

**Given** the content recorder from Story 3.2
**When** navigation detection is added
**Then** it detects traditional page navigations via `window.addEventListener('popstate')`
**And** it detects SPA navigation via URL polling (checking `location.href` changes on a 500ms interval)
**And** navigation events produce a `CapturedEvent` with `type: 'navigate'` and the new URL as `pageUrl`
**And** the navigation event includes the new `pageTitle`
**And** duplicate consecutive navigation events to the same URL are filtered

### Story 3.4: Implement CSS Overlay for Screenshot Annotation

As a developer,
I want a CSS overlay that highlights the clicked element with a red outline before screenshot capture,
So that screenshots visually indicate which element was interacted with.

**Acceptance Criteria:**

**Given** the content script infrastructure from Story 3.1
**When** `injectOverlay(config)` and `removeOverlay()` are implemented
**Then** `injectOverlay` adds a `data-sop-highlight` attribute to the target element
**And** a `<style>` element is injected with `[data-sop-highlight] { outline: 2px solid #e53e3e !important; outline-offset: 2px !important; box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.2) !important; }`
**And** `removeOverlay` removes the attribute and style element within 100ms
**And** the overlay does not trigger MutationObserver-based frameworks or cause layout shift
**And** if the element is not in the viewport, the overlay is still applied (it just won't be visible in the screenshot)

### Story 3.5: Implement Accessible Name Extraction and Element Info

As a developer,
I want robust accessible name extraction and element metadata capture at event time,
So that auto-generated step titles are human-readable and meaningful.

**Acceptance Criteria:**

**Given** the selector generator from E2 and content recorder from Story 3.2
**When** element info extraction is integrated into the capture flow
**Then** accessible name is extracted following WAI-ARIA spec: aria-label > aria-labelledby > alt (for images) > title attribute > label[for] > placeholder > textContent
**And** `boundingBox` is captured via `element.getBoundingClientRect()`
**And** `viewport` is captured as `{ width: window.innerWidth, height: window.innerHeight }`
**And** `scrollPosition` is captured as `{ x: window.scrollX, y: window.scrollY }`
**And** `clickCoordinates` are captured from the MouseEvent (viewport-relative)
**And** `elementRole` is captured from `element.getAttribute('role')` or implicit ARIA role
**And** auto-generated step title format: "Clicked '{accessibleName}' button", "Typed in '{accessibleName}' field", "Navigated to {pageTitle}"

---

## Epic 4: Background Service Worker

**Goal:** Implement the background service worker that orchestrates recording (state machine + adapters), captures screenshots, manages persistence, handles keepalive, and bridges communication between content script and side panel.

**Dependencies:** E2 (core engine), E3 (content script).

### Story 4.1: Implement Chrome Storage Adapter

As a developer,
I want Chrome storage adapter implementations for session state and local recordings,
So that recording data persists across service worker restarts and browser sessions.

**Acceptance Criteria:**

**Given** the `IStorageAdapter` interface from E2
**When** `src/adapters/chrome/storage-adapter.ts` is implemented
**Then** `getSessionState()` reads from `chrome.storage.session`
**And** `setSessionState(state)` writes to `chrome.storage.session` with the active recording state and steps metadata
**And** `clearSessionState()` removes session data
**And** `saveRecording(recording)` writes recording metadata to `chrome.storage.local`
**And** `getRecording(id)` retrieves a recording by ID
**And** `listRecordings()` returns all saved recordings sorted by updatedAt descending
**And** `deleteRecording(id)` removes recording metadata from local storage
**And** `getStorageUsage()` returns bytes used via `navigator.storage.estimate()`
**And** unit tests use `@webext-core/fake-browser` to mock storage APIs

### Story 4.2: Implement IndexedDB Blob Store

As a developer,
I want an IndexedDB wrapper for storing screenshot Blobs,
So that screenshots are stored efficiently as binary blobs without base64 overhead.

**Acceptance Criteria:**

**Given** the `IBlobStore` interface from E2
**When** `src/adapters/chrome/blob-store.ts` is implemented
**Then** it creates/opens an IndexedDB database `sop-recorder-screenshots` with object store `screenshots`
**And** `put(key, blob)` stores a Blob by key
**And** `get(key)` retrieves a Blob by key (returns null if not found)
**And** `delete(key)` removes a single blob
**And** `deleteMany(keys)` removes multiple blobs in a single transaction
**And** `getUsage()` returns total bytes stored
**And** database versioning handles schema upgrades
**And** unit tests verify CRUD operations (using fake-indexeddb or similar)

### Story 4.3: Implement Screenshot Adapter and Thumbnail Generator

As a developer,
I want a screenshot capture adapter and thumbnail generator,
So that screenshots are captured as JPEG blobs and thumbnails are generated for the step list.

**Acceptance Criteria:**

**Given** the `IScreenshotCapture` interface from E2
**When** `src/adapters/chrome/screenshot-adapter.ts` is implemented
**Then** `captureVisibleTab()` calls `chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 85 })`
**And** it converts the data URL response to a Blob
**And** if the viewport is wider than 1920px, the screenshot is scaled down
**And** a `generateThumbnail(blob)` utility creates a 320x180 thumbnail (< 10 KB) using OffscreenCanvas
**And** on `captureVisibleTab` failure (e.g., chrome:// page), it returns null gracefully without throwing
**And** the step number badge is rendered onto the screenshot via Canvas API: red circle with white number at the click coordinates

### Story 4.4: Implement Tab, Message Bus, Alarm, and Download Adapters

As a developer,
I want the remaining Chrome adapter implementations (tab, message bus, alarm, download),
So that the background service worker can interact with tabs, route messages, manage keepalive, and trigger downloads.

**Acceptance Criteria:**

**Given** the adapter interfaces from E2
**When** `tab-adapter.ts`, `message-bus.ts`, `alarm-adapter.ts`, and `download-adapter.ts` are implemented
**Then** `TabAdapter.getCurrentTab()` returns the active tab's id, url, and title
**And** `TabAdapter.sendMessageToTab(tabId, message)` sends typed messages to content scripts
**And** `TabAdapter.injectContentScript(tabId)` uses `chrome.scripting.executeScript` to inject the content script
**And** `MessageBus.onContentMessage(handler)` listens for `chrome.runtime.onMessage` events from content scripts
**And** `MessageBus.onPanelConnect(handler)` listens for `chrome.runtime.onConnect` with port name `sidepanel`
**And** `AlarmAdapter.createKeepalive()` creates a 25-second recurring alarm
**And** `AlarmAdapter.clearKeepalive()` clears the alarm
**And** `DownloadAdapter.downloadBlob(blob, filename)` creates a blob URL, calls `chrome.downloads.download`, and revokes the URL

### Story 4.5: Implement Background Service Worker Orchestrator

As a developer,
I want the background service worker entrypoint that wires adapters to the core engine and handles the recording lifecycle,
So that recording start/stop/pause, screenshot capture, step persistence, and panel communication all work end-to-end.

**Acceptance Criteria:**

**Given** all adapters from Stories 4.1-4.4 and core engine from E2
**When** `src/entrypoints/background.ts` is implemented using `defineBackground`
**Then** it instantiates all Chrome adapters and core modules (state machine, step manager)
**And** event listeners are registered synchronously at top level (Chrome MV3 requirement)
**And** on `START_RECORDING` from panel: transitions state machine, injects content script, starts keepalive alarm
**And** on `STOP_RECORDING`: transitions state machine, stops content script, clears keepalive, saves recording
**And** on `PAUSE_RECORDING` / `RESUME_RECORDING`: transitions state machine, sends pause/resume to content script
**And** on `STEP_CAPTURED` from content script: captures screenshot (with overlay inject/remove), generates thumbnail, stores blob in IndexedDB, creates RecordedStep via StepManager, persists to session storage, notifies panel via port
**And** on `GET_STATE` from panel: responds with current state and steps
**And** on keyboard command `toggle-recording`: toggles recording state
**And** port connections are tracked for panel communication

### Story 4.6: Implement Service Worker State Recovery

As a developer,
I want the service worker to recover recording state after a restart,
So that recording data is not lost when Chrome restarts the service worker.

**Acceptance Criteria:**

**Given** the background orchestrator from Story 4.5
**When** the service worker restarts during an active recording
**Then** `recoverState()` reads session state from `chrome.storage.session`
**And** if the session contains a non-idle state, the state machine recovers to that state
**And** `StepManager.loadSteps()` restores captured steps from session storage
**And** the side panel, when connecting, receives the recovery state and displays "Recording Interrupted - N steps captured. Resume or Save?"
**And** "Resume" re-injects content script and continues recording
**And** "Save" persists current steps as a completed recording

### Story 4.7: Implement Storage Quota Management

As a developer,
I want storage quota monitoring and auto-purge,
So that the extension does not exhaust available storage.

**Acceptance Criteria:**

**Given** the storage adapter from Story 4.1 and blob store from Story 4.2
**When** storage management is implemented
**Then** `navigator.storage.estimate()` is checked before starting a new recording
**And** a warning is surfaced to the side panel when usage exceeds 80% of quota
**And** recordings older than 30 days are auto-purged on extension startup (metadata + blobs)
**And** when a recording is deleted, its associated screenshot blobs are also deleted from IndexedDB
**And** if storage is full, new recordings are prevented with a user-visible message

---

## Epic 5: Side Panel UI (Lit + PicoCSS)

**Goal:** Implement the side panel user interface with Lit Web Components (light DOM), PicoCSS classless styling, state-driven view routing, and all recording/editing/management interactions.

**Dependencies:** E4 (background service worker for real data).

### Story 5.1: Set Up Side Panel Shell and PicoCSS Styling

As a developer,
I want the side panel HTML shell with PicoCSS classless styling and the root Lit component,
So that the side panel renders with proper styling and serves as the component host.

**Acceptance Criteria:**

**Given** the WXT project from E1
**When** `src/entrypoints/sidepanel/index.html` and `src/entrypoints/sidepanel/main.ts` are implemented
**Then** `index.html` loads PicoCSS classless CSS and the `main.ts` entry
**And** `src/styles/global.css` imports `@picocss/pico/css/pico.classless.min.css` and defines custom CSS properties (`--sop-recording-color`, `--sop-step-border`, `--sop-thumbnail-width`)
**And** body has `margin: 0; padding: 0.5rem; font-size: 0.875rem` for compact side panel display
**And** `<sop-app>` root component is registered and rendered
**And** dark/light mode works automatically via `prefers-color-scheme` (PicoCSS default behavior)
**And** the side panel opens when the extension action icon is clicked (configured via `chrome.sidePanel.setPanelBehavior`)

**Technical notes:**
- Reference: https://github.com/wxt-dev/examples/tree/main/examples/side-panel

### Story 5.2: Implement RecordingController (State Sync with Background)

As a developer,
I want a Lit ReactiveController that maintains a port connection to the background and synchronizes state,
So that UI components reactively update when recording state or steps change.

**Acceptance Criteria:**

**Given** the side panel shell from Story 5.1
**When** `RecordingController` is implemented as a `ReactiveController`
**Then** `hostConnected()` establishes a port via `chrome.runtime.connect({ name: 'sidepanel' })`
**And** it listens for `BackgroundToPanelMessage` types: `STATE_UPDATE`, `STEP_ADDED`, `STEP_UPDATED`, `STEP_DELETED`, `STEPS_REORDERED`, `RECORDING_LIST`, `RECORDING_LOADED`, `EXPORT_READY`, `ERROR`
**And** state changes trigger `host.requestUpdate()` for reactive rendering
**And** it exposes methods: `startRecording()`, `stopRecording()`, `pauseRecording()`, `resumeRecording()`, `deleteStep(id)`, `reorderSteps(ids)`, `updateStep(id, changes)`, `exportRecording(id, format)`, `saveRecording()`, `loadRecording(id)`, `deleteRecording(id)`, `listRecordings()`
**And** `hostDisconnected()` cleanly disconnects the port
**And** it sends `GET_STATE` on connect to sync initial state

### Story 5.3: Implement sop-app Root Component with View Routing

As a developer,
I want the root `<sop-app>` component that routes between Home, Recording, and Edit views based on state,
So that view transitions are state-driven and animated.

**Acceptance Criteria:**

**Given** the RecordingController from Story 5.2
**When** `src/components/sop-app.ts` is implemented
**Then** it renders `<sop-home>`, `<sop-recording>`, or `<sop-editor>` based on `currentView` state
**And** view transitions use `document.startViewTransition()` when available (Chrome 111+)
**And** it uses light DOM rendering (`createRenderRoot() { return this; }`)
**And** the header shows "SOP Recorder" as the app title
**And** view changes are driven by recording state: idle -> home, recording/paused -> recording, stopped -> editor
**And** selecting a saved recording from home navigates to editor
**And** the back button in editor navigates to home

### Story 5.4: Implement sop-home Component (Recording List)

As a developer,
I want the Home view that displays saved recordings and a "Start Recording" button,
So that users can start new recordings or open saved ones.

**Acceptance Criteria:**

**Given** the sop-app shell from Story 5.3
**When** `src/components/sop-home.ts` is implemented
**Then** the empty state shows an illustration area, "Record your first SOP" text, and a prominent "Start Recording" button
**And** with saved recordings, it shows "Start Recording" button at top, then a list of recording cards
**And** each recording card shows: title, step count, formatted date
**And** recording cards are sorted by updatedAt descending
**And** clicking a recording card navigates to the editor view for that recording
**And** clicking a recording card navigates to the editor view
**And** long-pressing (500ms) a recording card enters multi-select mode with checkboxes on all cards
**And** in multi-select mode, a toolbar appears with batch Delete and Export actions
**And** delete uses an undo toast (5-second window) instead of a confirmation dialog
**And** the editor view includes a "Delete Recording" button for single-recording deletion
**And** "Start Recording" button dispatches a custom event that sop-app handles
**And** all elements use semantic HTML (PicoCSS `<article>`, `<button>`, `<section>`, `<h2>`)

### Story 5.5: Implement sop-recording Component (Active Recording View)

As a developer,
I want the Recording view that shows recording status, live step feed, and pause/stop controls,
So that users see real-time feedback during recording.

**Acceptance Criteria:**

**Given** the RecordingController from Story 5.2
**When** `src/components/sop-recording.ts` is implemented
**Then** the recording indicator shows a red pulse animation dot with "Recording" text and step count
**And** Pause and Stop buttons are displayed prominently
**And** pausing changes indicator to amber/yellow with "Paused" text; Pause button becomes "Resume"
**And** the live step list shows steps in reverse chronological order (newest first)
**And** each step shows: step number, auto-generated title, truncated page URL (muted), and small thumbnail (80x45px)
**And** newly added steps animate in from the top (View Transitions API or CSS animation)
**And** the most recent step has a brief highlight that fades after 2 seconds
**And** the step list is read-only during recording
**And** clicking "Stop" transitions to the editor view

### Story 5.6: Implement sop-step-card Component

As a developer,
I want a reusable step card component with live and edit mode variants,
So that steps display consistently in both recording and editing views.

**Acceptance Criteria:**

**Given** the RecordedStep type from E2
**When** `src/components/sop-step-card.ts` is implemented
**Then** in live mode (recording view): displays step number, title, truncated URL, and compact thumbnail (80x45px), read-only
**And** in edit mode (editor view): displays step number, editable title (click-to-edit via `<input>`), editable description (click-to-edit via `<textarea>`), larger thumbnail (160x90px, clickable for lightbox), URL (display only), up/down reorder buttons (disabled at boundaries), delete button, drag handle
**And** click-to-edit: clicking title text replaces it with `<input>`, Enter saves, Escape cancels
**And** click-to-edit: clicking description shows `<textarea>`, blur or Save button saves, Escape cancels
**And** the drag handle `≡` is visible only in edit mode
**And** delete dispatches a custom event (parent handles undo toast)
**And** reorder up/down dispatches custom events with step ID and direction
**And** thumbnail click dispatches a custom event for lightbox display
**And** uses semantic HTML for PicoCSS styling

### Story 5.7: Implement sop-editor Component (Edit View)

As a developer,
I want the Editor view for post-recording step editing, reordering, and export,
So that users can refine their recorded SOP before exporting.

**Acceptance Criteria:**

**Given** the sop-step-card from Story 5.6 and RecordingController from Story 5.2
**When** `src/components/sop-editor.ts` is implemented
**Then** the header shows a back arrow, editable SOP title (click-to-edit), and export icon button
**And** the step list renders sop-step-card components in edit mode, in sequential order (step 1 first)
**And** step metadata (step count and creation date) is displayed below the header
**And** step deletion removes the step and shows an undo toast (5-second window)
**And** step reorder via up/down buttons updates step order and renumbers
**And** drag-and-drop reorder is supported via HTML5 Drag and Drop API with visual drop indicators
**And** an "Export as ZIP" button is displayed at the bottom of the step list
**And** clicking export triggers `RecordingController.exportRecording()` and initiates a file download
**And** step auto-renumbering occurs after any delete or reorder operation

### Story 5.8: Implement Screenshot Lightbox

As a developer,
I want a screenshot lightbox overlay for viewing full-size screenshots,
So that users can inspect screenshots in detail.

**Acceptance Criteria:**

**Given** step cards with clickable thumbnails from Story 5.6
**When** `src/components/sop-screenshot-lightbox.ts` is implemented
**Then** clicking a step thumbnail opens a full-size screenshot overlay
**And** the lightbox fills the side panel with the screenshot scaled to fit
**And** clicking outside the image or pressing Escape closes the lightbox
**And** the lightbox has a semi-transparent dark backdrop
**And** the full-size screenshot is fetched from IndexedDB via the blob key
**And** keyboard focus is trapped within the lightbox while open
**And** a close button is accessible via keyboard

---

## Epic 6: Export Engine (Markdown + ZIP)

**Goal:** Implement the Markdown export pipeline that generates a ZIP file containing a formatted SOP Markdown document and numbered JPEG screenshots.

**Dependencies:** E4 (blob store for screenshot retrieval), E5 (export UI trigger).

### Story 6.1: Implement Markdown Generator

As a developer,
I want a Markdown generator that produces formatted SOP documents from Recording data,
So that exported SOPs are professional and readable in any Markdown editor.

**Acceptance Criteria:**

**Given** the Recording and RecordedStep types from E2
**When** the Markdown generation function is implemented in `src/core/export-engine.ts`
**Then** the output includes: `# {title}`, `**Date:** {formatted date}`, `**Steps:** {count}`, `**Starting URL:** {startUrl}`
**And** each step is formatted as: `## Step N: {title}`, `{description}`, `![Step N](screenshots/step-{NN}.jpg)`
**And** steps are separated by horizontal rules `---`
**And** step numbers are zero-padded to 2 digits in filenames (step-01.jpg, step-02.jpg, ...)
**And** SOP metadata section includes title, author (if provided), date, step count
**And** the generator is a pure function with no Chrome API dependencies
**And** unit tests verify output format for recordings with 1, 5, and 50 steps

### Story 6.2: Implement ZIP Export with JSZip

As a developer,
I want ZIP packaging that bundles the Markdown file and screenshots,
So that users get a single downloadable file with all SOP content.

**Acceptance Criteria:**

**Given** the Markdown generator from Story 6.1 and IBlobStore from E2
**When** `MarkdownZipExporter` is implemented in `src/core/export-engine.ts`
**Then** it implements the `ExportAdapter` interface with `format: 'markdown-zip'`
**And** it creates a ZIP with `sop.md` at the root and screenshots in a `screenshots/` subfolder
**And** screenshots are named `step-{NN}.jpg` matching the Markdown image references
**And** steps with no screenshot (capture failure) are included in Markdown with "(Screenshot unavailable)" text
**And** the ZIP filename is sanitized from the recording title (e.g., "My SOP Recording.zip")
**And** export for a 10-step recording completes in < 3 seconds
**And** export for a 50-step recording completes in < 10 seconds
**And** unit tests verify ZIP structure and content

### Story 6.3: Implement Copy Markdown to Clipboard

As a developer,
I want a "Copy Markdown" option that copies the SOP text without images,
So that users can quickly paste SOP content into other tools.

**Acceptance Criteria:**

**Given** the Markdown generator from Story 6.1
**When** clipboard copy is implemented
**Then** clicking "Copy Markdown" generates the Markdown text and writes it to the clipboard via `navigator.clipboard.writeText()`
**And** image references in the copied text use placeholder text: `[Screenshot: Step N]` instead of image paths
**And** a brief success toast is shown: "Markdown copied to clipboard"
**And** if clipboard write fails, an error toast is shown
**And** the export panel in the editor view shows both "Export as ZIP" and "Copy Markdown" options

---

## Epic 7: Polish & Quality

**Goal:** Add error handling, accessibility, performance optimization, and comprehensive testing to bring the extension to release quality.

**Dependencies:** E1-E6 (all features implemented).

### Story 7.1: Implement Comprehensive Error Handling

As a developer,
I want graceful error handling for all failure scenarios identified in the PRD,
So that the extension remains usable even when individual operations fail.

**Acceptance Criteria:**

**Given** the complete extension from E1-E6
**When** error handling is added for all identified failure scenarios
**Then** `captureVisibleTab()` failure: step is recorded without screenshot, side panel shows "Screenshot unavailable for this step", recording continues
**And** IndexedDB quota exhaustion: warning at 80% usage, "Storage full" message prevents new recordings
**And** content script injection failure (chrome:// pages): "Cannot record on this page" message in side panel, recording pauses and resumes on recordable page
**And** message passing failure (SW restart): state recovered from session storage, "Reconnecting..." indicator shown briefly
**And** export failure: "Retry Export" button shown, fallback to Markdown-only export (no screenshots) if retry fails
**And** all errors are logged to browser console with structured error objects
**And** no error causes a white screen or unresponsive UI

### Story 7.2: Implement Accessibility Compliance

As a developer,
I want full WCAG 2.1 AA accessibility in the side panel,
So that the extension is usable by keyboard-only and screen reader users.

**Acceptance Criteria:**

**Given** the side panel UI from E5
**When** accessibility improvements are applied
**Then** all interactive elements are reachable via Tab navigation
**And** Enter activates buttons and links, Escape closes modals/lightbox/inline-edit
**And** all interactive elements have appropriate ARIA labels
**And** the recording indicator has `aria-live="polite"` for step count updates
**And** color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for UI components)
**And** focus indicators are visible on all interactive elements (PicoCSS defaults + custom styles)
**And** `prefers-reduced-motion` disables pulse animation and view transitions
**And** drag-and-drop has a keyboard alternative (up/down buttons from FR-2.5)
**And** Playwright + axe-core tests pass with zero violations

### Story 7.3: Implement Performance Optimization

As a developer,
I want performance optimizations to meet all NFR targets,
So that the extension is fast and lightweight.

**Acceptance Criteria:**

**Given** the complete extension from E1-E6
**When** performance optimizations are applied
**Then** service worker cold start completes in < 200ms (measured via performance.now())
**And** content script page load impact is < 50ms (dynamic import, minimal bootstrap)
**And** screenshot capture latency is < 300ms end-to-end
**And** side panel thumbnails are lazy-loaded (only visible thumbnails are fetched from IndexedDB)
**And** step list uses efficient rendering (Lit's repeat directive with keyed items) for 50+ steps
**And** size-limit checks pass in CI: content script < 50 KB, service worker < 100 KB, side panel < 200 KB, package < 2 MB
**And** memory during recording with 50 steps stays < 80 MB

### Story 7.4: Write Core Module Unit Tests (>= 80% Coverage)

As a developer,
I want comprehensive unit tests for all core modules,
So that the recording engine, state machine, and export logic are thoroughly tested.

**Acceptance Criteria:**

**Given** all core modules from E2 and export engine from E6
**When** unit tests are written/expanded
**Then** `recording-state-machine.ts` has tests for all transitions, guards, observer notifications, and recovery
**And** `step-manager.ts` has tests for add, delete, reorder, update, renumber, load, and edge cases
**And** `selector-generator.ts` has tests for each selector strategy with various DOM structures
**And** `event-filter.ts` has tests for debounce, dedup, drag filter, and untrusted events
**And** `export-engine.ts` has tests for Markdown generation, ZIP structure, and error cases
**And** overall core module coverage is >= 80% as reported by Vitest coverage
**And** manifest validation test asserts correct permissions and required fields

### Story 7.5: Write E2E Tests for Critical Path

As a developer,
I want E2E tests that verify the full record -> edit -> export flow,
So that the critical user journey is validated automatically.

**Acceptance Criteria:**

**Given** the Playwright setup from E1 and the complete extension
**When** E2E tests are written for the critical path
**Then** a test verifies: open side panel -> click Start Recording -> perform clicks on a test page -> steps appear in side panel -> click Stop -> edit a step title -> click Export -> ZIP file is downloaded
**And** a test verifies: side panel shows empty state when no recordings exist
**And** a test verifies: saved recordings appear in the home view
**And** a test verifies: recording can be deleted from the home view
**And** a test verifies: keyboard shortcut Alt+Shift+R toggles recording
**And** tests run in CI via GitHub Actions with headless Chromium
**And** the test page is a local HTML fixture with predictable DOM elements

---

## Epic 8: Release Preparation

**Goal:** Prepare the extension for Chrome Web Store publication and public launch, including CWS assets, README, and final validation.

**Dependencies:** E7 (polish and quality complete).

### Story 8.1: Create Extension Icons and CWS Store Assets

As a developer,
I want extension icons (16px, 48px, 128px) and Chrome Web Store listing assets,
So that the extension has a professional appearance in the browser and store.

**Acceptance Criteria:**

**Given** the complete extension from E1-E7
**When** icons and store assets are created
**Then** `src/assets/` contains `icon-16.png`, `icon-48.png`, `icon-128.png` with consistent branding
**And** the icon clearly conveys "recording" or "documentation" at 16px size
**And** CWS assets include: 440x280 small promo tile, 1280x800 screenshot (side panel in recording state), 1280x800 screenshot (editing steps), 1280x800 screenshot (exported SOP)
**And** CWS description text emphasizes: "100% local, zero data collection", "No account required", "Free, open source, no limits", "Export to Markdown"

### Story 8.2: Create README and Repository Setup

As a developer,
I want a comprehensive README and GitHub repository configuration,
So that the project is accessible and welcoming to users and contributors.

**Acceptance Criteria:**

**Given** the complete extension
**When** `README.md` and repository files are created
**Then** README includes: project description, feature highlights, installation instructions (CWS + manual), usage guide with screenshots, development setup, testing instructions, architecture overview, contributing guidelines, license (MIT)
**And** `.github/ISSUE_TEMPLATE/` contains bug report and feature request templates
**And** `LICENSE` file contains MIT license
**And** `CONTRIBUTING.md` provides guidelines
**And** the repository has appropriate GitHub topics and description

### Story 8.3: Chrome Web Store Submission Validation

As a developer,
I want to validate the extension package passes all CWS requirements,
So that the store submission is accepted on first attempt.

**Acceptance Criteria:**

**Given** the complete, tested extension
**When** CWS submission validation is performed
**Then** the extension ZIP is < 2 MB
**And** manifest.json passes CWS validation (all required fields present, valid permissions)
**And** the extension loads without errors in a clean Chrome profile
**And** no CSP violations occur (`unsafe-eval`, remote code)
**And** the privacy policy accurately reflects zero data collection
**And** the extension works on Chrome 120+ (minimum target)
**And** `wxt build` produces a CWS-ready ZIP in the output directory
**And** all CI checks pass on the release commit
