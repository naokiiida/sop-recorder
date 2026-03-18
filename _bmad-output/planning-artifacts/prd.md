---
stepsCompleted: [init, discovery, vision, executive-summary, success, journeys, domain, project-type, scoping, functional, nonfunctional, polish, complete]
inputDocuments: [brainstorming-session.md, domain-research.md, market-research.md, technical-research.md, project-learnings.md, research-wxt-framework.md, research-extension-testing.md]
workflowType: 'prd'
---

# Product Requirements Document — SOP Recorder

**Author:** Naokiiida
**Date:** 2026-03-18
**Version:** 1.0
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
| 9 | Clicks "Export" | Downloads a ZIP containing `sop.md` (Markdown with step numbers, descriptions, and image references) and a `screenshots/` folder with numbered PNG files. |
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

## 4. Functional Requirements

### 4.1 MVP (v1) — In Scope

#### FR-1: Recording Engine

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-1.1 | Start/stop recording via side panel button | Must | Primary control |
| FR-1.2 | Start/stop recording via keyboard shortcut (Alt+Shift+R) | Must | Power user shortcut |
| FR-1.3 | Pause/resume recording | Must | Allows skipping sensitive data entry |
| FR-1.4 | Capture click events on interactive elements | Must | Core capture |
| FR-1.5 | Capture text input events (debounced at 500ms) | Must | Core capture |
| FR-1.6 | Capture page navigation events | Must | Core capture |
| FR-1.7 | Auto-screenshot after each captured event (200ms delay for DOM settle) | Must | `chrome.tabs.captureVisibleTab()` |
| FR-1.8 | Filter non-meaningful events: drag movements (>50px), untrusted events, duplicate clicks within 500ms | Must | Noise reduction |
| FR-1.9 | Generate CSS selectors for captured elements (ID > data-testid > aria-label > tag+attrs > nth-of-type) | Must | Step identification |
| FR-1.10 | Extract accessible names following WAI-ARIA spec | Must | Human-readable step titles |
| FR-1.11 | Mask password field values as `••••••••` | Must | Privacy |
| FR-1.12 | Persist recording state to `chrome.storage.session` after each step | Must | Survive service worker restart |
| FR-1.13 | Show visual recording indicator in side panel | Must | User awareness |

#### FR-2: Step Editing

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-2.1 | Display step list in side panel with thumbnails | Must | Real-time during recording, full view after |
| FR-2.2 | Inline editing of step title | Must | Click-to-edit |
| FR-2.3 | Inline editing of step description | Must | Textarea below title |
| FR-2.4 | Delete individual steps | Must | With confirmation for bulk operations |
| FR-2.5 | Reorder steps via up/down buttons | Must | Simple, accessible |
| FR-2.6 | Reorder steps via drag-and-drop | Should | Enhanced UX |
| FR-2.7 | View full-size screenshot for any step | Must | Click thumbnail to expand |
| FR-2.8 | Automatic step renumbering after edits | Must | Maintain consistent numbering |

#### FR-3: Export

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-3.1 | Export as Markdown + screenshots ZIP | Must | Primary export format |
| FR-3.2 | Markdown includes: SOP title, date, step numbers, step titles, descriptions, screenshot references | Must | Professional format |
| FR-3.3 | Screenshots exported as numbered PNG files in `screenshots/` subfolder | Must | Organized output |
| FR-3.4 | SOP metadata in export: title, author (optional), date, number of steps | Should | Professional-grade output |
| FR-3.5 | Copy Markdown to clipboard (without images) | Should | Quick sharing |

#### FR-4: Recording Management

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-4.1 | Save completed recordings to `chrome.storage.local` | Must | Persistence |
| FR-4.2 | List saved recordings with title, date, step count | Must | Side panel view |
| FR-4.3 | Delete saved recordings | Must | Storage management |
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

### 4.2 Post-MVP (v2+) — Explicitly Out of Scope for v1

| Feature | Target Version | Rationale for Deferral |
|---------|---------------|----------------------|
| Video recording | v2 | Adds 40%+ codebase complexity; offscreen document lifecycle, blob URL expiry, large file handling. Excellent free alternatives exist (Screenity, OS-native). |
| AI step enhancement (BYOK) | v2 | Optional quality-of-life feature; core value is capture + edit + export. Architecture supports it but UI not needed for MVP. |
| Interactive screenshot annotation (arrows, text, shapes) | v2 | SVG editor in side panel adds significant UX complexity. CSS overlay + step badge sufficient for v1. |
| Notion API export | v2 | Requires OAuth flow, image hosting, configuration UI. Markdown import is sufficient. |
| Confluence API export | v2+ | Similar complexity to Notion. Markdown copy-paste works. |
| Self-contained HTML export | v1.1 | Low effort, high value. Deferred to keep MVP scope tight but target for first minor release. |
| PDF export | v2 | Client-side PDF quality is poor. Browser "Print to PDF" from HTML export is better. |
| Tour format export (GuideChimp/Driver.js) | v2+ | Requires mapping steps to tour configs. Architecture supports it via data model. |
| Claude shortcut export | v2+ | Niche use case. |
| MCP server integration | v2+ | Requires separate Node.js process. Design extension messaging to be MCP-ready. |
| Cross-browser support (Firefox) | v2 | Side Panel API differs significantly. WXT migration enables this. |
| WXT framework migration | v2 | Plasmo works for MVP. WXT preferred long-term (smaller bundles, active maintenance). |
| Chrome built-in AI (Gemini Nano) | v2 | Uncertain availability; graceful fallback needed. |
| PII auto-redaction in screenshots | v2 | Complex image processing. Local-first architecture mitigates risk for v1. |
| Import/merge recordings | v2+ | Not needed for initial use case. |
| Collaboration/sharing | Never (v1) | Contradicts local-first philosophy. |
| Cloud sync | Never (v1) | Contradicts local-first philosophy. |
| User accounts | Never | Zero-config start is a core differentiator. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Time from install to first recording start | < 10 seconds | Zero-config start. No onboarding. |
| Time from action to step appearing in side panel | < 500ms | Real-time feel. 200ms screenshot delay + rendering. |
| Screenshot capture latency | < 300ms | 200ms DOM settle + captureVisibleTab execution. |
| Export generation (10-step SOP) | < 3 seconds | ZIP creation with JPEG screenshots. |
| Export generation (50-step SOP) | < 10 seconds | Upper bound for large SOPs. |
| Extension bundle size | < 500 KB | Lean distribution. WXT baseline is ~400 KB. |
| Memory usage during recording | < 50 MB | Screenshots compressed to JPEG 80% quality. |
| Maximum steps per recording | 200 | Cap to prevent storage issues. |

### 5.2 Reliability

| Requirement | Detail |
|-------------|--------|
| Service worker restart recovery | Recording state persisted to `chrome.storage.session` after each step. Side panel detects recovery state and offers resume/save. |
| Service worker keepalive during recording | Primary: long-lived port from side panel. Backup: 25-second Chrome alarm. |
| Data persistence | All completed recordings stored in `chrome.storage.local`. Never lost unless user explicitly deletes. |
| Message ordering | Sequence numbers on captured events to ensure correct step ordering despite async message delivery. |
| Screenshot compression | JPEG at 80% quality to manage storage. Cap at 200 steps per recording. |

### 5.3 Security & Privacy

| Requirement | Detail |
|-------------|--------|
| No external network requests | Extension makes zero network requests in v1. No analytics, no telemetry, no tracking. |
| No data transmission | Screenshots and recording data never leave the user's device unless explicitly exported via download. |
| Password masking | All `<input type="password">` values replaced with `••••••••` in captured data. |
| Sensitive field awareness | Extend masking to `<input type="password">` and fields with `autocomplete="cc-number"` or similar. |
| Minimum permissions | Request only: `activeTab`, `tabs`, `scripting`, `storage`, `sidePanel`, `alarms`, `downloads`. Drop `offscreen`, `tabCapture`, `unlimitedStorage`, `webNavigation` from previous iteration where possible. |
| Content Security Policy | Standard MV3 CSP. No `unsafe-eval`, no remote code loading. |
| No user accounts | No authentication, no session management, no user tracking. |

### 5.4 Accessibility

| Requirement | Detail |
|-------------|--------|
| Keyboard navigation | All side panel controls accessible via Tab/Enter/Escape. |
| Screen reader support | Appropriate ARIA labels on all interactive elements in side panel. |
| Color contrast | WCAG 2.1 AA minimum (4.5:1 for text, 3:1 for UI components). |
| Focus management | Visible focus indicators on all interactive elements. |
| Reduced motion | Respect `prefers-reduced-motion` for any animations. |

### 5.5 Compatibility

| Requirement | Detail |
|-------------|--------|
| Chrome version | Minimum Chrome 120+ (side panel API stabilized, alarm minimum period reduced to 30s). |
| Manifest version | MV3 only. MV2 is fully deprecated. |
| Operating systems | Windows, macOS, Linux (ChromeOS as bonus). |
| Display scaling | Screenshots captured at device pixel ratio. UI renders correctly at 100%-200% zoom. |

---

## 6. Success Metrics

### 6.1 Launch Metrics (First 90 Days)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Chrome Web Store installs | 500 | CWS dashboard |
| Weekly active users | 100 | Cannot measure directly (no telemetry). Proxy: CWS weekly user count. |
| CWS rating | >= 4.0 stars | CWS dashboard |
| GitHub stars | 200 | GitHub |
| GitHub issues (bugs) | < 20 critical/high | GitHub issues |
| Avg. CWS review sentiment | Positive (>80%) | Manual review |

### 6.2 Product Quality Metrics (Internal)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Unit test coverage | >= 80% on core modules (state machine, event capture, selector generation, export) | Vitest coverage report |
| E2E test coverage | Critical path (record → edit → export) covered | Playwright test suite |
| Bundle size | < 500 KB | Build output |
| Zero-crash recording sessions | > 99% (< 1 in 100 recordings fails due to extension error) | E2E tests + manual testing |
| Export format correctness | 100% of exports produce valid Markdown with correct image references | Automated validation in tests |

### 6.3 North Star Metric

**Number of SOPs exported per week.** This measures actual value delivery — the user successfully completed the full Record → Edit → Export journey.

---

## 7. Technical Constraints & Decisions

### 7.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│ Chrome Extension (MV3)                               │
│                                                      │
│  Content Script (event-capture.ts)                   │
│    - DOM event listeners (click, input, navigation)  │
│    - Selector generation                             │
│    - Accessible name extraction                      │
│    - Password masking                                │
│    - CSS overlay injection for screenshots            │
│         │                                            │
│         │ chrome.runtime.sendMessage                 │
│         ▼                                            │
│  Background Service Worker (background.ts)           │
│    - RecordingStateMachine (state management)        │
│    - Screenshot capture (captureVisibleTab)          │
│    - Recording persistence (chrome.storage)          │
│    - Service worker keepalive (alarms + ports)       │
│         │                                            │
│         │ chrome.runtime messages / port             │
│         ▼                                            │
│  Side Panel (sidepanel/)                             │
│    - Recording controls (start/stop/pause)           │
│    - Step list with thumbnails                       │
│    - Inline editing (title, description)             │
│    - Export UI                                       │
│    - Recording management                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | WXT (v0.20.x) | Actively maintained, Vite-based, ~400 KB bundles (43% smaller than Plasmo), file-based entrypoints, excellent TS support. Plasmo is in maintenance mode. |
| **Language** | TypeScript 5.x (strict mode) | Type safety for message passing, state machine, and Chrome API usage. |
| **UI Framework** | React 18+ | Familiar, well-supported in WXT, adequate for side panel UI. |
| **Styling** | Tailwind CSS 4 | Utility-first, small output, WXT + Vite supports it natively. |
| **State Management** | Custom state machine (RecordingStateMachine) | Proven pattern from previous iteration. Observer pattern for reactivity. |
| **Testing** | Vitest (unit) + Playwright (E2E with `--load-extension`) | Vitest for fast unit tests. Playwright for full extension E2E testing. |
| **Package Manager** | pnpm | Fast, disk-efficient, workspace support. |
| **ZIP Export** | JSZip | Lightweight, browser-compatible ZIP generation. |
| **Build** | Vite (via WXT) | Fast dev server, optimized production builds. |

### 7.3 Key Technical Decisions

| Decision | Choice | Alternatives Rejected | Rationale |
|----------|--------|----------------------|-----------|
| Screenshot API | `chrome.tabs.captureVisibleTab()` | CDP `Page.captureScreenshot`, `tabCapture` stream | Simplest, no warning bar, no offscreen document, `activeTab` permission sufficient. Full-page screenshots deferred to v2. |
| Framework | WXT | Plasmo (maintenance mode), CRXJS (stability concerns), raw MV3 | Active maintenance, smaller bundles, Vite ecosystem, better DX. |
| Extension UI | Side Panel | Popup, DevTools panel, new tab | Persists across navigation, visible during recording, adequate space for step list. |
| Data storage | `chrome.storage.local` + `chrome.storage.session` | IndexedDB, localStorage | Chrome API-native, syncs with extension lifecycle, session storage for in-progress recordings. |
| Export format | Markdown + ZIP | HTML, PDF, proprietary JSON | Universal, version-controllable, readable in any editor, importable to Notion/Confluence. |
| Video recording | Deferred to v2 | Include in MVP | 40%+ complexity increase. Top source of bugs in previous iteration. |
| AI enhancement | Deferred to v2 | Include in MVP | Not core value proposition. Architecture designed to support it (BYOK, OpenAI-compatible API). |
| Event capture | DOM event listeners | rrweb, MutationObserver | Discrete step capture, not session replay. Lower overhead, proven pattern. |
| Selector generation | Custom implementation | `optimal-select`, `finder` | Existing priority chain (ID > testid > aria > tag) works well. External lib adds unnecessary dependency. |

### 7.4 Internal Data Model

```typescript
interface RecordedStep {
  id: string;                    // UUID
  sequenceNumber: number;        // For ordering
  type: 'click' | 'input' | 'navigation';
  timestamp: number;             // Unix ms
  pageUrl: string;
  pageTitle: string;
  // Element identification
  selector: string;              // Generated CSS selector
  accessibleName: string;        // Human-readable element name
  tagName: string;
  elementType?: string;          // input type, button, link, etc.
  // Action data
  inputValue?: string;           // Masked for password fields
  clickCoordinates?: { x: number; y: number }; // Viewport-relative
  // Generated content
  title: string;                 // Auto-generated, user-editable
  description: string;           // User-editable
  // Screenshot
  screenshotDataUrl: string;     // Base64 JPEG
}

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
  };
}
```

This model is designed to support future export formats (tour configs, test scripts, Claude shortcuts) without schema changes.

### 7.5 Permissions Justification

| Permission | Why Needed | User Impact |
|-----------|-----------|-------------|
| `activeTab` | Inject content script and capture screenshots of the active tab | Low — scoped to current tab only |
| `scripting` | Programmatically inject event capture content script | Low — standard for extensions that interact with pages |
| `storage` | Save recordings and settings to `chrome.storage.local` and `chrome.storage.session` | None — local only |
| `sidePanel` | Display the recording UI in Chrome's side panel | None |
| `alarms` | Service worker keepalive during active recording (25-second interval) | None |
| `downloads` | Save exported ZIP files to user's filesystem | Low — only triggers on explicit export action |

Permissions removed from previous iteration: `offscreen` (no video), `tabCapture` (no video), `unlimitedStorage` (JPEG compression keeps size manageable), `webNavigation` (can use content script navigation detection instead).

---

## 8. MVP Scope Boundary

### In Scope (v1.0)

- [x] Start/stop/pause recording via side panel and keyboard shortcut
- [x] Capture click, input, and navigation events in the active tab
- [x] Auto-screenshot after each captured event (200ms delay)
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

### Out of Scope (v1.0)

- [ ] Video recording
- [ ] AI enhancement (BYOK or built-in)
- [ ] Interactive screenshot annotation (arrows, shapes, text)
- [ ] Import/merge recordings
- [ ] Notion/Confluence API export
- [ ] Self-contained HTML export (target v1.1)
- [ ] PDF export
- [ ] MCP server integration
- [ ] Cross-browser support (Firefox, Safari)
- [ ] Collaboration/sharing features
- [ ] Cloud sync
- [ ] User accounts or authentication
- [ ] Analytics or telemetry
- [ ] Iframe content capture (logged as "Interacted with embedded frame")
- [ ] Full-page screenshots (viewport only in v1)
- [ ] Multi-language UI (English only in v1)
- [ ] Tour format export

---

## 9. Release Strategy

### 9.1 v1.0 — MVP Launch

**Target:** Functional Record → Edit → Export flow with Chrome Web Store listing.

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

### 9.2 v1.1 — Quick Follow-Up

- Self-contained HTML export (single file, base64 images)
- Copy Markdown to clipboard
- Improved step auto-titling heuristics
- Bug fixes from initial user feedback

### 9.3 v2.0 — AI & Integrations

- BYOK AI enhancement (OpenAI-compatible API)
- Chrome built-in AI (Gemini Nano) as zero-config option
- Notion API export
- WXT migration (from Plasmo if MVP ships on Plasmo)
- Screenshot annotation editor
- PII auto-redaction
- Firefox support

### 9.4 Monetization

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
| Auto screenshots | Yes | Yes | Yes | Yes |
| Step editing | Full (reorder, delete, edit) | Limited (upgrade to edit) | Limited | Basic |
| Export formats | Markdown + ZIP | None (upgrade for PDF/HTML) | None (upgrade for PDF) | MD, JSON, Word, PDF |
| Price | Free | Free (10 guides max) | Free (15 workflows max) | Free |
| Privacy | Local-first, zero data sent | Server-side processing | Server-side processing | Local |
| Open source | Yes (MIT) | No | No | Yes |
| Accounts required | No | Yes | Yes | No |
| Artificial limits | None | 10 guides, no export | 15 workflows, no PDF | None |
| AI enhancement | v2 (BYOK) | Yes (cloud) | No | No |
| Side panel UI | Yes | Yes | No | No (popup) |

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

---

*This PRD is implementation-ready. The developer agent should begin with the WXT project scaffold, implement the content script event capture, then the background state machine, then the side panel UI, and finally the export module.*
