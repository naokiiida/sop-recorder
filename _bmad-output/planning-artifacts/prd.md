---
stepsCompleted: [init, discovery, vision, executive-summary, success, journeys, domain, project-type, scoping, functional, nonfunctional, polish, complete]
inputDocuments: [brainstorming-session.md, domain-research.md, market-research.md, technical-research.md, project-learnings.md, research-wxt-framework.md, research-extension-testing.md, research-extension-performance.md, research-extension-scaffolding.md, research-rrweb-data-model.md, research-guidechimp-tours.md, research-claude-teach-skills.md, research-minimal-frontend.md, research-latest-lib-versions.md]
workflowType: 'prd'
---

# Product Requirements Document — SOP Recorder

**Author:** Naokiiida
**Date:** 2026-03-18
**Version:** 2.1
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Vision Statement

SOP Recorder is a local-first, open-source Chrome extension that records browser interactions and produces Standard Operating Procedures (SOPs) with annotated screenshots. It enables knowledge workers to document repeatable browser-based workflows in seconds, with full editing capability and Markdown export — all without accounts, servers, or subscriptions.

### 1.2 Problem Statement

Knowledge workers spend approximately 50% of their day preparing materials including documentation. Fortune 500 companies lose ~$12 billion annually due to inefficient document management. Employees spend 2.5 hours/day searching for company information and 1.7 hours/week providing duplicate information.

Existing automated SOP tools (Scribe at $35/user/mo, Tango at $24/user/mo) are cloud-first SaaS products that:
- Send all captured data (including screenshots of sensitive workflows) to third-party servers
- Paywall basic editing and export features
- Require accounts and subscriptions for core functionality
- Create vendor lock-in with proprietary formats

No local-first, open-source, privacy-focused Chrome extension exists for professional SOP capture. This is the gap SOP Recorder fills.

### 1.3 Product Summary

**Three verbs define the MVP: Record, Edit, Export.**

- **Record**: Click the record button (or press Alt+Shift+R). The extension captures clicks, typed inputs, and page navigations with automatic screenshots after each action.
- **Edit**: Review the step list in the side panel. Edit titles and descriptions inline, delete unwanted steps, reorder steps via drag or buttons.
- **Export**: Generate a Markdown document with numbered steps and embedded screenshots, packaged as a ZIP file. Zero post-processing needed.

### 1.4 Key Differentiators

| Differentiator | What It Means |
|---------------|---------------|
| **Privacy by architecture** | No server, no accounts, no data transmission. Screenshots never leave the user's device unless explicitly exported. This is a technical guarantee, not a privacy policy promise. |
| **Full editing, always free** | Step reordering, title editing, deletion, description editing — the features Scribe paywalls are SOP Recorder's core. No artificial limits. |
| **Open source** | Full transparency, auditability, community contributions. MIT license. |
| **Markdown-native** | Universal format compatible with Notion, Confluence, Obsidian, GitHub, and any text editor. |
| **Zero-config start** | Install from Chrome Web Store, click Record, done. No accounts, no onboarding wizard, no settings required. |
| **Record once, deploy everywhere** | Internal data model designed from day 1 to export as Markdown SOPs, interactive tours (GuideChimp/Driver.js), Claude shortcuts, and Notion API pages. One recording, many outputs. |

---

## 2. Target Users & Personas

### 2.1 Primary Persona: IT Operations Specialist (Beachhead Market)

**Name:** Sarah, IT Support Lead
**Context:** Manages a team of 5 supporting internal SaaS tools (Salesforce, Jira, HR systems) at a mid-size company (200-500 employees).
**Pain:** Spends 3-4 hours per week manually creating runbooks with screenshots for recurring IT procedures. New team members repeatedly ask "how do I do X?" for undocumented processes.
**Current tools:** Snipping Tool + Google Docs. Evaluated Scribe but rejected due to cost ($35/user/mo x 5 = $2,100/year) and privacy concerns (IT admin workflows contain sensitive data).
**What she needs:** Record an IT procedure once, share the resulting document via internal wiki, never answer the same question again.
**Decision factors:** Free, works immediately, screenshots are automatic, output goes into Confluence or Google Docs.

### 2.2 Secondary Persona: Privacy-Conscious Knowledge Worker

**Name:** Kenji, Compliance Officer
**Context:** Works at a financial services firm in Tokyo. Documents browser-based compliance procedures involving sensitive customer data.
**Pain:** Cannot use SaaS SOP tools because company policy prohibits sending screenshots of customer data to third-party servers. Currently creates documentation manually.
**What he needs:** A tool that captures browser workflows without any data leaving his machine. Markdown export that he can import into the company's internal documentation system.
**Decision factors:** Local-first architecture (non-negotiable), no cloud dependencies, Japanese language support (v2).

### 2.3 Tertiary Persona: Developer/Technical User

**Name:** Alex, Senior Software Engineer
**Context:** Documents internal tool workflows for the engineering team. Prefers open-source tools and Markdown-based workflows.
**Pain:** Existing tools are closed-source, SaaS-only, and produce proprietary formats. Wants to version-control SOPs alongside code.
**What he needs:** Open-source extension with Markdown output, extensible architecture, and no vendor lock-in.
**Decision factors:** Open source, Markdown export, CLI/API potential, no tracking or telemetry.

### 2.4 User Segments Summary

| Segment | Size Estimate | Decision Factor | MVP Priority |
|---------|--------------|----------------|-------------|
| IT operations & support | Large | Free + automatic screenshots + easy export | Primary |
| Privacy-conscious / regulated | Growing (EU AI Act, GDPR) | Local-first, no cloud | Primary |
| Developer/technical | Medium | Open source, Markdown, extensibility | Primary |
| Cost-sensitive small teams | Large | Free alternative to Scribe/Tango | Secondary |
| Non-English markets (Japan) | Underserved | Localization, local-first | Secondary (v2) |

---

## 3. User Journeys

### 3.1 Journey 1: First-Time Recording (Critical Path)

**Persona:** Sarah (IT Support Lead)
**Goal:** Document a Salesforce workflow for a new team member.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Installs SOP Recorder from Chrome Web Store | Extension icon appears in toolbar. No account creation, no onboarding modal. |
| 2 | Navigates to Salesforce | Normal browsing. Extension is idle. |
| 3 | Clicks extension icon or presses Alt+Shift+R | Side panel opens showing "Ready to Record" state with a prominent Start button. |
| 4 | Clicks "Start Recording" | Side panel shows "Recording..." with a red indicator. Step counter shows "0 steps". |
| 5 | Performs the Salesforce workflow (clicks, types, navigates) | Each meaningful action is captured as a step. Side panel updates in real-time showing step titles (e.g., "Clicked 'New Contact' button"). Screenshot captured automatically after each action. |
| 6 | Reviews steps in side panel during recording | Can see step list building. Can click a step to see its screenshot thumbnail. |
| 7 | Clicks "Stop Recording" | Recording ends. Side panel transitions to Edit mode showing all captured steps. |
| 8 | Edits step titles and descriptions | Inline editing. Changes a title from "Clicked input field" to "Enter the customer's email address". Deletes an accidental double-click step. |
| 9 | Clicks "Export" | Downloads a ZIP containing `sop.md` (Markdown with step numbers, descriptions, and image references) and a `screenshots/` folder with numbered JPEG files. |
| 10 | Opens `sop.md` in any Markdown editor | Sees a complete, formatted SOP ready to paste into Confluence or Google Docs. |

**Success criteria:** Steps 1-10 complete in under 5 minutes for a 10-step procedure. Zero configuration required.

### 3.2 Journey 2: Edit and Re-Export

**Persona:** Sarah
**Goal:** Fix a mistake in a previously recorded SOP before sharing.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Opens side panel | Sees list of saved recordings with titles and dates. |
| 2 | Selects a recording | Steps load in edit view with thumbnails. |
| 3 | Drags step 5 above step 4 (order was wrong) | Steps reorder smoothly. Step numbers update automatically. |
| 4 | Edits description for step 3 | Inline text editing, no modal. |
| 5 | Deletes step 7 (unnecessary screenshot) | Step removed, subsequent steps renumber. |
| 6 | Clicks "Export" | Downloads updated ZIP. |

### 3.3 Journey 3: Resume After Browser Restart

**Persona:** Alex (Developer)
**Goal:** Continue documenting a procedure after Chrome restarts.

| Step | User Action | System Response |
|------|------------|----------------|
| 1 | Was recording a 15-step procedure. Chrome crashes or service worker restarts. | Recording state persisted to `chrome.storage.session`. |
| 2 | Reopens Chrome, clicks extension icon | Side panel shows "Recording interrupted — 12 steps captured. Resume or Save?" |
| 3 | Clicks "Save" | Steps saved as a new recording. Can edit and export. |

---

## 4. Architecture Principles

### 4.1 Core-Shell Separation (Adapter Pattern)

All core business logic MUST be implemented as pure TypeScript with NO dependencies on Chrome extension APIs or any browser-specific APIs. Chrome APIs are accessed exclusively through adapter/port interfaces.

```
┌───────────────────────────────────────────────────────────────┐
│                      Core (Pure TypeScript)                    │
│                                                                │
│  RecordingStateMachine    StepManager    SelectorGenerator     │
│  ExportEngine             DataModel      EventFilter           │
│                                                                │
│  ─────────── Adapter Interfaces (Ports) ───────────────────── │
│                                                                │
│  IScreenshotCapture   IStorageAdapter   ITabAdapter            │
│  IMessageBus          IAlarmAdapter     IDownloadAdapter       │
│                                                                │
└───────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Chrome       │    │ MCP Server      │    │ Claude Code   │
│ Extension    │    │ Adapter (v2)    │    │ Skill (v2)   │
│ Adapters     │    │                 │    │              │
└─────────────┘    └─────────────────┘    └──────────────┘
```

**Rationale:** This architecture enables the same recording engine, state machine, step management, and export logic to be reused across:

1. **Chrome Extension** (MVP) — adapters wrap `chrome.*` APIs
2. **MCP Server** (v2) — adapters wrap Node.js filesystem and IPC
3. **Claude Code Agent Skills** (v2) — adapters wrap CLI I/O

While MCP and Claude Code integration are out of MVP scope, the adapter interfaces MUST be defined from day 1 so that adding these targets requires only new adapter implementations, not refactoring of core logic.

### 4.2 Minimal JS, No Framework Bloat

The UI layer uses Lit Web Components (light DOM mode, not Shadow DOM) and plain TypeScript + HTML rather than React. This keeps bundle sizes small, avoids framework lock-in, and aligns with the browser platform rather than fighting it. Light DOM is required so that PicoCSS classless styles can cascade into Lit components without Shadow DOM boundary issues. PicoCSS classless (~3-4 KB gzipped) provides a semantic HTML baseline with zero class names needed; custom styles extend it where needed. Modern CSS features (View Transitions API, CSS Container Queries) are preferred over JavaScript-driven layout and animation.

### 4.3 Record Rich, Export Thin

The internal `RecordedStep[]` data model captures maximum context at recording time — multiple selector strategies, bounding boxes, viewport metadata, scroll position, accessible names. Export adapters then select only the fields relevant to each output format. This avoids re-recording to support new export targets.

### 4.4 Local-First, Zero-Trust

No network requests. No accounts. No telemetry. Data leaves the device only through explicit user-initiated export (file download). This is enforced architecturally (no network permissions in manifest), not by policy.

---

## 5. Functional Requirements

### 5.1 MVP (v1) — In Scope

#### FR-1: Recording Engine

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-1.1 | Start/stop recording via side panel button | Must | Primary control |
| FR-1.2 | Start/stop recording via keyboard shortcut (Alt+Shift+R) | Must | Power user shortcut |
| FR-1.3 | Pause/resume recording | Must | Allows skipping sensitive data entry |
| FR-1.4 | Capture click events on interactive elements | Must | Core capture |
| FR-1.5 | Capture text input events (debounced at 500ms) | Must | Core capture |
| FR-1.6 | Capture page navigation events | Must | Core capture |
| FR-1.7 | Auto-screenshot after each captured event (200ms delay for DOM settle) | Must | `chrome.tabs.captureVisibleTab()`, JPEG quality 85 |
| FR-1.8 | Filter non-meaningful events: drag movements (>50px), untrusted events, duplicate clicks within 500ms | Must | Noise reduction |
| FR-1.9 | Generate multiple selector strategies per element (CSS, XPath, aria-label) with priority chain: ID > data-testid > aria-label > tag+attrs > nth-of-type | Must | Step identification, tour/test export compatibility |
| FR-1.10 | Extract accessible names following WAI-ARIA spec | Must | Human-readable step titles |
| FR-1.11 | Mask password field values as `••••••••` | Must | Privacy |
| FR-1.12 | Persist recording state to `chrome.storage.session` after each step | Must | Survive service worker restart |
| FR-1.13 | Show visual recording indicator in side panel | Must | User awareness |
| FR-1.14 | Capture element bounding box (`getBoundingClientRect`) at click time | Must | Future tour overlay positioning |
| FR-1.15 | Capture viewport dimensions and scroll position per step | Must | Accurate replay/tour placement |
| FR-1.16 | Store screenshots as Blobs in IndexedDB (not base64 strings in chrome.storage) | Must | 33% storage savings vs data URL strings |

#### FR-2: Step Editing

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-2.1 | Display step list in side panel with thumbnails | Must | Real-time during recording, full view after |
| FR-2.2 | Inline editing of step title | Must | Click-to-edit |
| FR-2.3 | Inline editing of step description | Must | Textarea below title |
| FR-2.4 | Delete individual steps | Must | With confirmation for bulk operations |
| FR-2.5 | Reorder steps via up/down buttons | Must | Simple, accessible |
| FR-2.6 | Reorder steps via drag-and-drop | Should | Implement using native HTML5 Drag and Drop API (no library needed). Provide keyboard-accessible alternative via FR-2.5 up/down buttons. |
| FR-2.7 | View full-size screenshot for any step | Must | Click thumbnail to expand |
| FR-2.8 | Automatic step renumbering after edits | Must | Maintain consistent numbering |

#### FR-3: Export

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-3.1 | Export as Markdown + screenshots ZIP | Must | Primary export format |
| FR-3.2 | Markdown includes: SOP title, date, step numbers, step titles, descriptions, screenshot references | Must | Professional format |
| FR-3.3 | Screenshots exported as numbered JPEG files in `screenshots/` subfolder | Must | JPEG quality 85, organized output |
| FR-3.4 | SOP metadata in export: title, author (optional), date, number of steps | Should | Professional-grade output |
| FR-3.5 | Copy Markdown to clipboard (without images) | Should | Quick sharing |

#### FR-4: Recording Management

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-4.1 | Save completed recordings with metadata in `chrome.storage.local`, screenshot blobs in IndexedDB | Must | Persistence with efficient storage |
| FR-4.2 | List saved recordings with title, date, step count | Must | Side panel view |
| FR-4.3 | Delete saved recordings (metadata + associated blobs) | Must | Storage management |
| FR-4.4 | Edit SOP title for saved recordings | Must | Naming |
| FR-4.5 | Auto-generate SOP title from first page URL/title | Should | Default naming |

#### FR-5: Side Panel UI

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-5.1 | Three primary views: Home (recording list), Recording (active capture), Edit (step management) | Must | Core navigation |
| FR-5.2 | Recording controls: Start, Stop, Pause/Resume | Must | Clear primary actions |
| FR-5.3 | Real-time step list during active recording | Must | Immediate feedback |
| FR-5.4 | Export button accessible from Edit view | Must | Clear export path |
| FR-5.5 | Empty state with clear "Start Recording" CTA | Must | First-time UX |

#### FR-6: Screenshot Annotation (Automatic)

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-6.1 | Highlight clicked element via CSS overlay (red outline) before screenshot capture | Should | Visual indicator of action target |
| FR-6.2 | Add step number badge at click coordinates post-capture via Canvas API | Should | Step identification in screenshots |
| FR-6.3 | Remove CSS overlay after screenshot capture (within 100ms) | Should | No lingering visual artifacts |

### 5.2 Post-MVP (v2+) — Explicitly Out of Scope for v1

| Feature | Target Version | Rationale for Deferral |
|---------|---------------|----------------------|
| Video recording | v2 | Adds 40%+ codebase complexity; offscreen document lifecycle, blob URL expiry, large file handling. Excellent free alternatives exist (Screenity, OS-native). |
| AI step enhancement (BYOK) | v2 | Optional quality-of-life feature; core value is capture + edit + export. Architecture supports it but UI not needed for MVP. |
| Interactive screenshot annotation (arrows, text, shapes) | v2 | SVG editor in side panel adds significant UX complexity. CSS overlay + step badge sufficient for v1. |
| Notion API export | v2 | Requires OAuth flow, image hosting, configuration UI. Markdown import is sufficient. Data model supports it from day 1. |
| Confluence API export | v2+ | Similar complexity to Notion. Markdown copy-paste works. |
| Self-contained HTML export | v1.1 | Low effort, high value. Deferred to keep MVP scope tight but target for first minor release. |
| PDF export | v2 | Client-side PDF quality is poor. Browser "Print to PDF" from HTML export is better. |
| Tour format export (GuideChimp/Driver.js) | v2 | Requires adapter layer over RecordedStep[]. Data model captures all needed fields (selectors, bounding boxes, viewport) from day 1. Low-cost, high-impact feature add. |
| Claude shortcut export | v2 | Export steps as natural language prompt formatted for Claude Chrome import. Data model supports it; requires AI summarization. |
| MCP server integration | v2 | Core-shell architecture with adapter interfaces enables this without refactoring. Requires separate Node.js process and new adapter implementations. |
| Claude Code agent skills | v2+ | Same core logic reused via adapter pattern. Requires skill definition format. |
| Cross-browser support (Firefox) | v2 | Side Panel API differs significantly. WXT supports it natively. |
| Chrome built-in AI (Gemini Nano) | v2 | Uncertain availability; graceful fallback needed. |
| PII auto-redaction in screenshots | v2 | Complex image processing. Local-first architecture mitigates risk for v1. |
| Import/merge recordings | v2+ | Not needed for initial use case. |
| rrweb session replay layer | v2+ | Optional enhancement for video-like replay. RecordedStep[] remains canonical; rrweb events supplementary. |
| Collaboration/sharing | Never (v1) | Contradicts local-first philosophy. |
| Cloud sync | Never (v1) | Contradicts local-first philosophy. |
| User accounts | Never | Zero-config start is a core differentiator. |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Must-Have Target | Nice-to-Have Target | Rationale |
|--------|-----------------|--------------------:|-----------|
| Extension package (ZIP) | < 2 MB | < 1 MB | Scribe is 1.93 MB. WXT baseline ~400 KB gives headroom. |
| Content script injected size | < 50 KB | < 20 KB | Chrome does NOT cache compiled extension scripts; every KB multiplies across tabs. Use dynamic imports to load recording logic on demand. |
| Service worker entry size | < 100 KB | < 50 KB | Small entry point with synchronous listener registration, lazy-load everything else. |
| Side panel JS bundle | < 200 KB | < 100 KB | Achievable without React. Lit + PicoCSS is inherently smaller. |
| Service worker cold start | < 200ms | < 100ms | User perceives < 200ms as instantaneous. |
| Content script page load impact | < 50ms | < 10ms | Inject minimal observer; dynamically import recording logic only when active. |
| Screenshot capture latency | < 300ms | < 150ms | JPEG quality 85 via `captureVisibleTab` is fastest format. |
| Screenshot format/quality | JPEG quality 85 | -- | Best balance of capture speed, file size (~200 KB/shot), and text clarity for SOPs. |
| Screenshot storage | Blobs in IndexedDB | -- | Avoids 33% base64 overhead. Not subject to 10 MB `chrome.storage.local` default quota. |
| Side panel FCP | < 1000ms | < 500ms | Standard web vitals. |
| Side panel TTI | < 2000ms | < 1000ms | Achievable with small bundles + lazy-loaded step list. |
| Memory idle | < 20 MB | < 10 MB | Well below heavy extension range. |
| Memory per recording step | < 1 MB | < 500 KB | Supports 50+ steps without degradation. |
| Memory during recording (50 steps) | < 80 MB | < 40 MB | Lazy-load thumbnails, store full screenshots in IndexedDB not memory. |
| Time from install to first recording | < 10 seconds | -- | Zero-config start. No onboarding. |
| Time from action to step in side panel | < 500ms | -- | Real-time feel. 200ms screenshot delay + rendering. |
| Export generation (10-step SOP) | < 3 seconds | < 1 second | ZIP creation with JPEG screenshots. |
| Export generation (50-step SOP) | < 10 seconds | < 5 seconds | Upper bound for large SOPs. |
| Maximum steps per recording | 200 | -- | Cap to prevent storage issues. |

### 6.2 Reliability

| Requirement | Detail |
|-------------|--------|
| Service worker restart recovery | Recording state persisted to `chrome.storage.session` after each step. Side panel detects recovery state and offers resume/save. |
| Service worker keepalive during recording | Primary: long-lived port from side panel. Backup: 25-second Chrome alarm. |
| Data persistence | All completed recordings stored in `chrome.storage.local` (metadata) + IndexedDB (screenshot blobs). Never lost unless user explicitly deletes. |
| Message ordering | Sequence numbers on captured events to ensure correct step ordering despite async message delivery. |
| Screenshot compression | JPEG at 85% quality. Max 1920px width (scale down larger viewports). Thumbnails at 320x180 (< 10 KB each). |
| Storage quota management | Auto-purge recordings older than 30 days. Warn at 80% of storage budget. Manual "clear all data" option. Monitor with `navigator.storage.estimate()`. |

### 6.3 Security & Privacy

| Requirement | Detail |
|-------------|--------|
| No external network requests | Extension makes zero network requests in v1. No analytics, no telemetry, no tracking. |
| No data transmission | Screenshots and recording data never leave the user's device unless explicitly exported via download. |
| Password masking | All `<input type="password">` values replaced with `••••••••` in captured data. |
| Sensitive field awareness | Extend masking to `<input type="password">` and fields with `autocomplete="cc-number"` or similar. |
| Minimum permissions | Request only: `activeTab`, `scripting`, `storage`, `sidePanel`, `alarms`, `downloads`. No `tabs`, `offscreen`, `tabCapture`, `unlimitedStorage`, `webNavigation`. **Note:** `tabs` permission removed — `activeTab` is sufficient for injecting content scripts and calling `captureVisibleTab()` on the current tab. The `tabs` permission would expose `tab.url`/`tab.title` on *all* tabs, which is unnecessary since SOP Recorder only operates on the active tab. Removing it reduces the CWS permission prompt and strengthens the privacy positioning. |
| Content Security Policy | Standard MV3 CSP. No `unsafe-eval`, no remote code loading. |
| No user accounts | No authentication, no session management, no user tracking. |

### 6.4 Accessibility

| Requirement | Detail |
|-------------|--------|
| Keyboard navigation | All side panel controls accessible via Tab/Enter/Escape. |
| Screen reader support | Appropriate ARIA labels on all interactive elements in side panel. |
| Color contrast | WCAG 2.1 AA minimum (4.5:1 for text, 3:1 for UI components). |
| Focus management | Visible focus indicators on all interactive elements. |
| Reduced motion | Respect `prefers-reduced-motion` for any animations. |

### 6.5 Compatibility

| Requirement | Detail |
|-------------|--------|
| Chrome version | Minimum Chrome 120+ (side panel API stabilized, alarm minimum period reduced to 30s). |
| Manifest version | MV3 only. MV2 is fully deprecated. |
| Operating systems | Windows, macOS, Linux (ChromeOS as bonus). |
| Display scaling | Screenshots captured at device pixel ratio. UI renders correctly at 100%-200% zoom. |

### 6.6 Error Handling

| Failure Scenario | Expected Behavior |
|-----------------|-------------------|
| `captureVisibleTab()` failure (protected pages like `chrome://`, `chrome-extension://`, rate limiting, tab not focused) | Skip screenshot for the affected step. Log the step without an image. Show a non-blocking warning in the side panel: "Screenshot unavailable for this step." Recording continues uninterrupted. |
| IndexedDB quota exhaustion | Detect via `navigator.storage.estimate()` and warn when usage exceeds 80% of available quota. On write failure, show a persistent warning: "Storage full — export or delete old recordings to continue." Prevent new recordings from starting until space is available. |
| Content script injection failure (restricted pages such as `chrome://`, `chrome-extension://`, Chrome Web Store, browser internal pages) | Show a non-blocking message in the side panel: "Cannot record on this page." If injection fails mid-recording, pause recording and notify the user. Resume automatically when the user navigates to a recordable page. |
| Message passing failure (service worker restart during active recording) | Recover recording state from `chrome.storage.session`, which persists across service worker restarts within the same browser session. On reconnection, replay any buffered steps from the content script. Show a brief "Reconnecting..." indicator if the interruption is user-visible. |
| Export failure (ZIP generation error, blob read failure) | Show an error message with a "Retry Export" button. If retry fails, offer fallback: export Markdown text only (without screenshots). Log the error details to the browser console for debugging. |

---

## 7. Success Metrics

### 7.1 Launch Metrics (First 90 Days)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Chrome Web Store installs | 500 | CWS dashboard |
| Weekly active users | 100 | Cannot measure directly (no telemetry). Proxy: CWS weekly user count. |
| CWS rating | >= 4.0 stars | CWS dashboard |
| GitHub stars | 200 | GitHub |
| GitHub issues (bugs) | < 20 critical/high | GitHub issues |
| Avg. CWS review sentiment | Positive (>80%) | Manual review |

### 7.2 Product Quality Metrics (Internal)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Unit test coverage | >= 80% on core modules (state machine, event capture, selector generation, export) | Vitest coverage report |
| E2E test coverage | Critical path (record -> edit -> export) covered | Playwright test suite |
| Bundle size | < 2 MB (package), < 50 KB (content script) | `size-limit` in CI |
| Zero-crash recording sessions | > 99% (< 1 in 100 recordings fails due to extension error) | E2E tests + manual testing |
| Export format correctness | 100% of exports produce valid Markdown with correct image references | Automated validation in tests |
| Manifest validation | Pass all Chrome Web Store validation checks | CI automated check |
| WCAG compliance | Side panel passes WCAG 2.1 AA audit | Playwright + axe-core in CI |

### 7.3 North Star Metric

**Number of recordings with 5+ steps saved locally.** This measures actual value delivery — the user completed a meaningful recording session (not just a test click). A recording with 5+ steps indicates a real workflow was captured, signaling the product delivered its core promise.

**Measurement approach (no telemetry):** This metric cannot be measured directly in production without user data collection, which is architecturally prohibited. Instead, it is validated through:
- **E2E test scenarios** that assert the full Record -> Edit -> Export flow produces multi-step recordings
- **CWS review sentiment** — reviews mentioning successful documentation of real workflows
- **GitHub issue patterns** — feature requests for editing/export improvements imply active multi-step usage
- **User-reported feedback** via GitHub discussions

---

## 8. Technical Constraints & Decisions

### 8.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│ Chrome Extension (MV3)                               │
│                                                      │
│  Content Script (event-capture.ts)                   │
│    - DOM event listeners (click, input, navigation)  │
│    - Multi-strategy selector generation              │
│    - Bounding box capture (getBoundingClientRect)    │
│    - Accessible name extraction                      │
│    - Password masking                                │
│    - CSS overlay injection for screenshots            │
│    - Viewport/scroll metadata capture                │
│         │                                            │
│         │ chrome.runtime.sendMessage                 │
│         ▼                                            │
│  Background Service Worker (background.ts)           │
│    - RecordingStateMachine (pure TS, no Chrome deps) │
│    - Chrome adapter: screenshot capture              │
│    - Chrome adapter: storage (IndexedDB + storage)   │
│    - Chrome adapter: alarms + ports (keepalive)      │
│         │                                            │
│         │ chrome.runtime messages / port             │
│         ▼                                            │
│  Side Panel (sidepanel/)                             │
│    - Lit Web Components for reactive UI              │
│    - PicoCSS base + custom styles                    │
│    - Recording controls (start/stop/pause)           │
│    - Step list with lazy-loaded thumbnails           │
│    - Inline editing (title, description)             │
│    - Export UI                                       │
│    - Recording management                            │
│                                                      │
│  Core Engine (src/core/) — NO Chrome API deps        │
│    - RecordingStateMachine                           │
│    - StepManager                                     │
│    - SelectorGenerator                               │
│    - ExportEngine (Markdown, future: tour, etc.)     │
│    - Adapter interfaces (ports)                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Extension Framework** | WXT (v0.20.19, RC for v1.0) | Actively maintained (236 releases), Vite 8 support (as of March 14, 2026), ~400 KB bundles (43% smaller than Plasmo), file-based entrypoints, excellent TS support, MIT license. Plasmo is in maintenance mode. |
| **Language** | TypeScript 5.x (strict mode) | Type safety for message passing, state machine, and Chrome API usage. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` enabled. |
| **UI Components** | Lit 3.3.2 Web Components (light DOM mode) | Lightweight (~5.8 KB gzipped), web-standards-based, no virtual DOM overhead, excellent for side panel UI. Avoids React's ~40 KB baseline. Web components are natively understood by browsers. Light DOM mode used for PicoCSS classless compatibility. |
| **Styling** | PicoCSS classless + custom CSS | Classless CSS framework (~3-4 KB gzipped) provides semantic HTML defaults with zero class names needed — pure semantic HTML. Custom properties for theming. Modern CSS features (View Transitions API, Container Queries) for layout and animation. No build-time CSS processing needed. |
| **State Management** | Custom state machine (RecordingStateMachine) in pure TS | Proven pattern from previous iteration. Observer pattern for reactivity. No Chrome API deps — fully testable. |
| **Testing** | Vitest 4.1 (unit) + Playwright 1.58 (E2E with `--load-extension` + MV3 support) | Vitest for fast unit tests with `WxtVitest()` plugin + `@webext-core/fake-browser`. Playwright for full extension E2E. |
| **Package Manager** | pnpm | Fast, disk-efficient, workspace support. |
| **ZIP Export** | JSZip | Lightweight, browser-compatible ZIP generation. |
| **Build** | Vite 8 (via WXT) | Vite 8 (released March 12, 2026) with Rolldown bundler for 10-30x faster builds. Fast dev server, optimized production builds, excellent tree-shaking. |
| **Linting** | ESLint (flat config) + Prettier | Industry standard code quality. |
| **CI/CD** | GitHub Actions | Lint, unit tests, E2E tests, bundle size checks, manifest validation on every PR. |
| **Bundle Monitoring** | size-limit | Per-entry-point budget enforcement in CI. |

### 8.3 Key Technical Decisions

| Decision | Choice | Alternatives Rejected | Rationale |
|----------|--------|----------------------|-----------|
| Screenshot API | `chrome.tabs.captureVisibleTab()` | CDP `Page.captureScreenshot`, `tabCapture` stream | Simplest, no warning bar, no offscreen document, `activeTab` permission sufficient. Full-page screenshots deferred to v2. |
| Screenshot format | JPEG quality 85 | PNG (2-5x larger, slower), WebP (less universal support) | Best balance of speed (~50-150ms), size (~200 KB), and text readability for SOP documentation. |
| Screenshot storage | Blobs in IndexedDB | Base64 data URLs in `chrome.storage.local` | Saves 33% vs base64 encoding. Not subject to 10 MB default storage quota. Proper binary blob handling. |
| Framework | WXT | Plasmo (maintenance mode), CRXJS (stability concerns), raw MV3 | Active maintenance, smaller bundles, Vite ecosystem, better DX. |
| UI framework | Lit Web Components + plain TS | React (40 KB+ overhead), Vue, Svelte, Datastar (architected around backend SSE, not suitable for extension message-passing), Alpine.js (CSP risks in MV3 extensions due to expression evaluation) | Minimal footprint, web-standards-based, no framework lock-in. Side panel UI is simple enough to not need a heavy framework. Aligns with minimal-JS philosophy. |
| Styling | PicoCSS classless | Tailwind CSS (requires build tooling, utility classes), plain CSS only | Classless approach with pure semantic HTML — no `.classes` needed. Provides excellent defaults without class proliferation. ~3-4 KB gzipped. Custom CSS for extension-specific needs. |
| Extension UI | Side Panel | Popup, DevTools panel, new tab | Persists across navigation, visible during recording, adequate space for step list. |
| Data storage | IndexedDB (blobs) + `chrome.storage.local` (metadata) + `chrome.storage.session` (active recording) | `chrome.storage.local` for everything | IndexedDB for large binary data (screenshots). chrome.storage for structured metadata and session state. |
| Export format | Markdown + ZIP | HTML, PDF, proprietary JSON | Universal, version-controllable, readable in any editor, importable to Notion/Confluence. |
| Video recording | Deferred to v2 | Include in MVP | 40%+ complexity increase. Top source of bugs in previous iteration. |
| AI enhancement | Deferred to v2 | Include in MVP | Not core value proposition. Architecture designed to support it (BYOK, OpenAI-compatible API). |
| Event capture | DOM event listeners | rrweb, MutationObserver | Discrete step capture, not session replay. Zero bundle size impact (native APIs). Lower overhead. rrweb adds 40-50 KB gzipped + 21-25% CPU overhead. Custom approach produces higher quality selectors from live DOM. |
| Selector strategy | Multiple selectors per element (CSS, XPath, aria) | Single CSS selector, rrweb node IDs | Multiple strategies improve robustness for tour export and test generation. Borrowed from Chrome DevTools Recorder pattern. |
| Core architecture | Pure TS with adapter interfaces | Chrome API calls throughout codebase | Enables future reuse as MCP server and Claude Code skills without refactoring. All core logic testable without Chrome API mocks. |

### 8.4 Internal Data Model

```typescript
interface RecordedStep {
  id: string;                    // UUID
  sequenceNumber: number;        // For ordering
  timestamp: number;             // Unix ms

  // Action
  type: StepAction;
  inputValue?: string;           // Masked for password fields

  // Target element — multiple selector strategies
  selectors: {
    css: string;                 // Primary CSS selector (ID > data-testid > aria > tag > nth-of-type)
    xpath?: string;              // XPath fallback for tour/test robustness
    aria?: string;               // aria-label or accessible name
    textContent?: string;        // Visible text of element (truncated)
  };
  tagName: string;
  elementType?: string;          // input type, button, link, etc.
  elementRole?: string;          // ARIA role
  accessibleName: string;        // Human-readable element name (WAI-ARIA spec)

  // Spatial data — for tour overlays and replay
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  clickCoordinates?: {           // Viewport-relative
    x: number;
    y: number;
  };

  // Page context
  pageUrl: string;
  pageTitle: string;
  viewport: {
    width: number;
    height: number;
  };
  scrollPosition: {
    x: number;
    y: number;
  };

  // User-editable content
  title: string;                 // Auto-generated, user-editable
  description: string;           // User-editable

  // Screenshot — stored as Blob in IndexedDB, referenced by key
  screenshotBlobKey: string;     // IndexedDB key for screenshot Blob
  thumbnailDataUrl?: string;     // Small inline thumbnail for list view (320x180, < 10 KB)
}

type StepAction = 'click' | 'dblclick' | 'input' | 'select' | 'check' |
                  'navigate' | 'scroll' | 'submit' | 'keypress';

interface Recording {
  id: string;                    // UUID
  title: string;                 // User-editable SOP title
  createdAt: number;             // Unix ms
  updatedAt: number;             // Unix ms
  steps: RecordedStep[];
  metadata: {
    startUrl: string;
    startPageTitle: string;
    browserVersion: string;
    stepCount: number;
  };
}
```

This model is designed to support all planned export formats without schema changes:

| Export Format | Fields Used |
|--------------|-------------|
| **Markdown SOP** | title, description, screenshotBlobKey, sequenceNumber, pageUrl |
| **HTML SOP** | All SOP fields + inline screenshots |
| **GuideChimp tour JSON** | selectors.css, title, description, boundingBox, pageUrl (path grouping) |
| **Driver.js tour config** | selectors.css, title, description, boundingBox |
| **Claude shortcut prompt** | type, accessibleName, inputValue, pageUrl, title (AI-summarized into natural language) |
| **Playwright test skeleton** | selectors (css/aria), type, inputValue, pageUrl |
| **Notion API blocks** | title, description, screenshotBlobKey, sequenceNumber |

### 8.5 Permissions Justification

| Permission | Why Needed | User Impact |
|-----------|-----------|-------------|
| `activeTab` | Inject content script and capture screenshots of the active tab | Low — scoped to current tab only |
| `scripting` | Programmatically inject event capture content script | Low — standard for extensions that interact with pages |
| `storage` | Save recordings and settings to `chrome.storage.local` and `chrome.storage.session` | None — local only |
| `sidePanel` | Display the recording UI in Chrome's side panel | None |
| `alarms` | Service worker keepalive during active recording (25-second interval) | None |
| `downloads` | Save exported ZIP files to user's filesystem | Low — only triggers on explicit export action |

Permissions removed from previous iteration: `offscreen` (no video), `tabCapture` (no video), `unlimitedStorage` (JPEG compression + IndexedDB keeps size manageable), `webNavigation` (content script navigation detection instead).

---

## 9. Testing Requirements

### 9.1 Baseline Test Suite (Ship with MVP)

| Category | Tool | What to Test |
|----------|------|-------------|
| **Static analysis** | TypeScript strict mode | Type safety across all modules. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. |
| **Manifest validation** | Custom Vitest test | Validate `manifest.json` structure, required fields, permissions match declared usage. |
| **Permissions audit** | Custom Vitest test | Assert no unexpected permissions. Verify minimum permission set. |
| **Unit tests** | Vitest + WxtVitest plugin + `@webext-core/fake-browser` | Core state machine, selector generation, event filtering, export engine, step management. All core modules at >= 80% coverage. |
| **Service worker startup** | Vitest | Verify service worker initializes within 200ms budget. Verify event listeners registered synchronously. |
| **Side panel rendering** | Vitest + DOM testing | Lit components render correctly. All views (Home, Recording, Edit) render. |
| **WCAG compliance** | Playwright + axe-core | Side panel passes automated accessibility audit (WCAG 2.1 AA). |
| **E2E critical path** | Playwright with `--load-extension` | Full record -> edit -> export flow on a test page. |
| **Bundle size** | size-limit in CI | Per-entry-point budgets: content script < 50 KB, service worker < 100 KB, side panel < 200 KB, total package < 2 MB. |

### 9.2 CI/CD Pipeline (GitHub Actions)

```
PR opened / push to main
    ├── Lint (ESLint + Prettier check)
    ├── Type check (tsc --noEmit)
    ├── Unit tests (Vitest)
    ├── Build (wxt build)
    ├── Bundle size check (size-limit)
    ├── Manifest validation
    └── E2E tests (Playwright, headless Chromium + --load-extension)
```

All checks must pass before merge. Bundle size regressions block the PR.

---

## 10. MVP Scope Boundary

### In Scope (v1.0)

- [x] Start/stop/pause recording via side panel and keyboard shortcut
- [x] Capture click, input, and navigation events in the active tab
- [x] Auto-screenshot after each captured event (JPEG quality 85, 200ms delay)
- [x] Store screenshots as Blobs in IndexedDB
- [x] Multiple selector strategies per element (CSS, XPath, aria)
- [x] Element bounding box and viewport/scroll metadata capture
- [x] Live step list in side panel during recording
- [x] Edit step title and description inline
- [x] Delete steps
- [x] Reorder steps (buttons, optionally drag-and-drop)
- [x] Export as Markdown + screenshots ZIP
- [x] Password/sensitive field masking
- [x] Recording state persistence (survive service worker restart)
- [x] Save/load multiple recordings
- [x] Automatic element highlighting in screenshots (CSS overlay)
- [x] Step number badge on screenshots (Canvas API)
- [x] Keyboard shortcut (Alt+Shift+R) for record toggle
- [x] Core-shell architecture with adapter interfaces (pure TS core)
- [x] Lit Web Components + PicoCSS for side panel UI
- [x] CI/CD with manifest validation, bundle size checks, unit + E2E tests

### Out of Scope (v1.0)

- [ ] Video recording
- [ ] AI enhancement (BYOK or built-in)
- [ ] Interactive screenshot annotation (arrows, shapes, text)
- [ ] Import/merge recordings
- [ ] Notion/Confluence API export
- [ ] Self-contained HTML export (target v1.1)
- [ ] PDF export
- [ ] Tour format export (GuideChimp/Driver.js) — data model ready, adapter not built
- [ ] Claude shortcut export — data model ready, adapter not built
- [ ] MCP server integration — adapter interfaces defined, implementation deferred
- [ ] Claude Code agent skills
- [ ] rrweb session replay layer
- [ ] Cross-browser support (Firefox, Safari)
- [ ] Collaboration/sharing features
- [ ] Cloud sync
- [ ] User accounts or authentication
- [ ] Analytics or telemetry
- [ ] Iframe content capture (logged as "Interacted with embedded frame")
- [ ] Full-page screenshots (viewport only in v1)
- [ ] Multi-language UI (English only in v1)

---

## 11. Release Strategy

### 11.1 v1.0 — MVP Launch

**Target:** Functional Record -> Edit -> Export flow with Chrome Web Store listing.

**Distribution:**
1. **Chrome Web Store** — Primary channel. Clear privacy messaging: "100% local, zero data collection."
2. **GitHub repository** — Source code, build instructions, issue tracking.

**Launch channels:**
- GitHub release with clear README and screenshots
- Reddit r/selfhosted, r/sysadmin, r/chrome_extensions
- Hacker News "Show HN" post
- Product Hunt listing

**CWS listing emphasis:**
- "No account required"
- "No data sent to servers — ever"
- "Free, open source, no limits"
- "Export to Markdown"
- Screenshots showing: recording in progress, step editing, exported SOP

### 11.2 v1.1 — Quick Follow-Up

- Self-contained HTML export (single file, base64 images)
- Copy Markdown to clipboard
- Improved step auto-titling heuristics
- Bug fixes from initial user feedback

### 11.3 v2.0 — Multi-Format Export & AI

- **Tour export**: GuideChimp JSON + Driver.js config adapters (data model already supports it)
- **Claude shortcut export**: AI-summarized natural language prompt, importable via Claude Chrome
- **MCP server**: `sop_list`, `sop_read`, `sop_execute` tools using same core engine via Node.js adapters
- **BYOK AI enhancement**: OpenAI-compatible API for step title/description improvement
- **Notion API export**: Structured page creation from RecordedStep[]
- Chrome built-in AI (Gemini Nano) as zero-config AI option
- Screenshot annotation editor
- PII auto-redaction
- Firefox support (WXT enables this natively)

### 11.4 v3.0 — Platform

- Claude Code agent skills (reuse core engine)
- rrweb session replay layer (opt-in, supplementary to RecordedStep[])
- Playwright test skeleton export
- Interactive tutorial mode with Shepherd.js `advanceOn` support
- Multi-language UI

### 11.5 Monetization

**v1:** None. Free and open source. Build user base and trust.

**Future (post-1,000 active users):**
- GitHub Sponsors / "Buy me a coffee" (voluntary support)
- Premium export templates (compliance-formatted SOPs) — one-time purchase
- Premium export formats (Confluence wiki, branded HTML) — one-time unlock

**Explicitly avoided:** Monthly subscriptions, cloud upsells, ads, data monetization.

---

## Appendix A: Competitive Reference

| Feature | SOP Recorder (v1) | Scribe (Free) | Tango (Free) | Workmap |
|---------|-------------------|---------------|--------------|---------|
| Auto screenshots | Yes (JPEG q85, IndexedDB) | Yes | Yes | Yes |
| Step editing | Full (reorder, delete, edit) | Limited (upgrade to edit) | Limited | Basic |
| Export formats | Markdown + ZIP | None (upgrade for PDF/HTML) | None (upgrade for PDF) | MD, JSON, Word, PDF |
| Price | Free | Free (10 guides max) | Free (15 workflows max) | Free |
| Privacy | Local-first, zero data sent | Server-side processing | Server-side processing | Local |
| Open source | Yes (MIT) | No | No | Yes |
| Accounts required | No | Yes | Yes | No |
| Artificial limits | None | 10 guides, no export | 15 workflows, no PDF | None |
| AI enhancement | v2 (BYOK) | Yes (cloud) | No | No |
| Side panel UI | Yes (Lit + PicoCSS) | Yes | No | No (popup) |
| Tour export | v2 (data model ready) | No | No | No |
| Multiple selectors | Yes (CSS + XPath + aria) | No | No | No |
| Adapter architecture | Yes (MCP/CLI ready) | No | No | No |

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **SOP** | Standard Operating Procedure — a documented set of step-by-step instructions for completing a routine operation. |
| **BYOK** | Bring Your Own Key — users provide their own API credentials for AI services. |
| **Local-first** | Architecture where all data processing and storage happens on the user's device, with no server dependency. |
| **MV3** | Manifest V3 — Chrome's current extension platform, replacing MV2. Uses service workers instead of persistent background pages. |
| **WXT** | Web Extension Tools — a Vite-based framework for building cross-browser extensions. |
| **Side Panel** | Chrome's built-in panel that slides out from the right side of the browser, persistent across tab navigation. |
| **Content Script** | JavaScript injected into web pages by the extension to capture DOM events. |
| **Service Worker** | Background script in MV3 that handles extension logic, with limited lifetime (30s idle timeout). |
| **Lit** | A lightweight library for building web components (~5.8 KB gzipped), maintained by Google. Uses standard Web Component APIs. Used in light DOM mode for CSS compatibility. |
| **PicoCSS** | A classless CSS framework (~3-4 KB gzipped) that styles semantic HTML elements with no class names required. Using the classless variant specifically. |
| **Adapter Pattern** | A design pattern where core logic depends on interfaces (ports), and platform-specific implementations (adapters) are injected at runtime. |
| **MCP** | Model Context Protocol — a standard for connecting AI models to external tools and data sources. |
| **RecordedStep** | The internal data model representing a single captured user action with all metadata needed for any export format. |
| **IndexedDB** | A browser-native database for storing large amounts of structured data, including blobs. Not subject to `chrome.storage.local` quota limits. |

---

*This PRD is implementation-ready. The developer agent should begin with the WXT project scaffold (Lit + PicoCSS, no React), define the adapter interfaces in `src/core/`, implement the content script event capture, then the background state machine with Chrome adapters, then the side panel UI with Lit components, and finally the Markdown export module. CI/CD with GitHub Actions should be configured alongside the initial scaffold.*

---

## 12. References & Resources

### Official Documentation
- WXT Framework: https://wxt.dev/
- Lit Web Components: https://lit.dev/
- PicoCSS: https://picocss.com/
- Chrome Extensions MV3: https://developer.chrome.com/docs/extensions/
- Playwright Extension Testing: https://playwright.dev/docs/chrome-extensions

### WXT Examples (Reference Implementations)
- Side Panel: https://github.com/wxt-dev/examples/tree/main/examples/side-panel
- Playwright E2E Testing: https://github.com/wxt-dev/examples/tree/main/examples/playwright-e2e-testing
- Vitest Unit Testing: https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing
- Vanilla i18n: https://github.com/wxt-dev/examples/tree/main/examples/vanilla-i18n
- WXT i18n: https://github.com/wxt-dev/examples/tree/main/examples/wxt-i18n

### Competitive & Architectural References
- Screenity (OSS screen recorder): https://github.com/alyssaxuu/screenity
- GuideChimp (interactive tours): https://github.com/Labs64/GuideChimp
- GuideChimp Tour Examples: https://github.com/Labs64/GuideChimp-tours/tree/master/guidechimp/tours
- React Grab (element selection): https://www.react-grab.com/
- Workmap (OSS SOP recorder): https://github.com/Ajkolaganti/workmap

### Context7 Library IDs (for latest docs lookup)
| Library | Context7 ID |
|---------|------------|
| WXT | `/wxt-dev/wxt` |
| Vite | `/vitejs/vite` |
| Lit | `/lit/lit` |
| Vitest | `/vitest-dev/vitest` |
| Playwright | `/microsoft/playwright` |
| Tailwind CSS | `/tailwindlabs/tailwindcss` |
| PicoCSS | `/picocss/pico` |
