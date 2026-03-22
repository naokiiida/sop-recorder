# Product Requirements Document — SOP Recorder v2 Addendum

**Author:** Naokiiida
**Date:** 2026-03-22
**Version:** 1.0
**Status:** Draft
**Parent Document:** PRD v2.1 (2026-03-18)

---

## 1. v2 Vision

SOP Recorder v1.0 delivers the core promise: **Record, Edit, Export** — entirely local, entirely free. v2 transforms SOP Recorder from a single-format documentation tool into a **multi-format export platform** with developer integration and optional AI enhancement:

- **Multi-format export** — One recording produces Markdown SOPs, self-contained HTML documents, interactive product tours, and Claude-ready prompts. Record once, deploy everywhere.
- **AI enhancement** — Optional, privacy-respecting AI improves step titles and descriptions using user-provided API keys (BYOK) or Chrome's built-in Gemini Nano. No data leaves the device unless the user explicitly configures an external API.
- **Developer integration** — MCP server and Claude Code agent skills expose SOP Recorder's core engine to AI assistants and automation tools, completing the adapter architecture designed from day 1.
- **Screenshot annotation** — Non-destructive SVG overlays let users add arrows, shapes, and text to screenshots without re-recording.
- **Cross-platform reach** — Firefox support via WXT, broadening the user base.

The guiding principle remains unchanged: **local-first, zero-config, no accounts, no subscriptions.**

---

## 2. Feature Prioritization Matrix

| # | Feature | Impact | Effort | Dependencies | Release | Rationale |
|---|---------|--------|--------|-------------|---------|-----------|
| F1 | Self-contained HTML export | High | Low (2-4h) | None | **v1.1** | Near-zero effort, high user value. Mirrors existing zip-exporter.ts pattern. |
| F2 | Tour export (Driver.js) | High | Medium (8-12h) | None | **v2.0** | Data model already captures all needed fields. High differentiation. |
| F3 | MCP server integration | High | Medium-High (3-5d) | pnpm workspace refactor | **v2.0** | Completes adapter architecture. Key differentiator for developer persona. |
| F4 | AI step enhancement (BYOK) | Medium | High (8-10d) | None | **v2.0** | Quality-of-life feature. Privacy consent flow adds complexity. |
| F5 | Screenshot annotation editor | Medium | High (5-7 stories) | None | **v2.0** | User-requested feature. SVG overlay approach is non-destructive. |
| F6 | Cross-browser support (Firefox) | Medium | Medium (3-5d) | WXT compatibility audit | **v2.0** | WXT provides native support. Expands addressable market. |
| F7 | PII auto-redaction | High | High (5-8d) | None | **v2.1** | Complex image processing. Privacy differentiator for regulated industries. |
| F8 | Claude shortcut export | Medium | Medium (2-3d) | F4 (AI provider) | **v2.1** | Requires AI summarization for natural language output. |
| F9 | Import/merge recordings | Low | Medium (2-3d) | None | **v2.1** | Nice-to-have for power users. Not core workflow. |
| F10 | Claude Code agent skills | Medium | Medium (3-5d) | F3 (MCP server) | **v3.0** | Builds on MCP infrastructure. Requires skill definition format. |

### Priority rationale

**v1.1 (quick follow-up):** Ship HTML export within days of v1.0. Near-zero risk, high perceived value. Users can share SOPs without requiring Markdown-capable viewers.

**v2.0 (multi-format + developer):** Tour export, MCP server, AI enhancement, annotation editor, and Firefox support form the major release. These features collectively transform SOP Recorder from a documentation tool into a platform.

**v2.1 (polish + advanced):** PII redaction, Claude shortcut export, and import/merge are refinements that benefit from v2.0 infrastructure (AI provider for Claude shortcuts, annotation system for redaction UI patterns).

**v3.0 (platform):** Claude Code agent skills build on the MCP server foundation and represent the full realization of the adapter architecture vision.

---

## 3. Detailed Feature Requirements

### 3.1 Feature F1: Self-Contained HTML Export (v1.1)

#### 3.1.1 User Stories

| ID | Story |
|----|-------|
| US-F1.1 | As Sarah (IT Support Lead), I want to export an SOP as a single HTML file so I can share it via email or Slack without requiring recipients to have Markdown tools. |
| US-F1.2 | As Kenji (Compliance Officer), I want the HTML export to include all screenshots inline so the document is fully self-contained with no external dependencies. |
| US-F1.3 | As Sarah, I want the HTML export to be print-friendly so I can produce a physical copy for the IT procedures binder. |

#### 3.1.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-7.1 | Export recording as a single `.html` file with all content self-contained | Must | No external CSS, JS, or image references |
| FR-7.2 | Embed screenshot images as base64-encoded JPEG data URIs | Must | Inline in `<img>` tags |
| FR-7.3 | Include inline CSS styling matching PicoCSS aesthetic | Must | Minimal, semantic HTML structure |
| FR-7.4 | Support dark/light mode via `@media (prefers-color-scheme)` | Should | Match user's OS preference |
| FR-7.5 | Include print-friendly styles via `@media print` | Must | Proper page breaks between steps, no dark backgrounds |
| FR-7.6 | HTML-escape all user-editable content (title, description) | Must | XSS prevention |
| FR-7.7 | Include SOP metadata header (title, date, step count) | Must | Consistent with Markdown export |
| FR-7.8 | Add "Export as HTML" option alongside existing "Export as ZIP" in the export UI | Must | Non-breaking addition to existing UI |

#### 3.1.3 Acceptance Criteria

- Exported HTML file opens correctly in Chrome, Firefox, Safari, and Edge
- All screenshots visible without network access (fully offline-capable)
- Print preview shows clean, paginated output with step breaks
- File size approximately 270 KB per step (base64 JPEG overhead)
- No JavaScript in exported file (static HTML + CSS only)
- User-provided content with `<script>` tags renders as escaped text, not executable code

#### 3.1.4 Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Export generation time (10 steps) | < 500ms |
| Export generation time (50 steps) | < 2 seconds |
| File size (10 steps) | ~2.7 MB |
| File size (50 steps) | ~13.5 MB |

#### 3.1.5 Technical Constraints

- Implementation mirrors `zip-exporter.ts` as `html-exporter.ts` in `src/core/export/`
- No new dependencies required
- Reads screenshot blobs from IndexedDB via existing `IBlobStore` interface
- Template uses string interpolation (no template engine dependency)

---

### 3.2 Feature F2: Tour Export — Driver.js (v2.0)

#### 3.2.1 User Stories

| ID | Story |
|----|-------|
| US-F2.1 | As Sarah, I want to export a recording as an interactive tour so new team members can follow along step-by-step directly in the application. |
| US-F2.2 | As Alex (Developer), I want the tour export to use Driver.js so I can customize the tour behavior and integrate it into our internal tools. |
| US-F2.3 | As Sarah, I want the tour to highlight the correct element on the page and show the step description as a tooltip. |

#### 3.2.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-8.1 | Export recording as a Driver.js configuration file (`.js` or `.json`) | Must | Primary tour format |
| FR-8.2 | Map `RecordedStep.selectors` to Driver.js `element` property using best available selector | Must | Priority: ID > data-testid > aria-label > CSS |
| FR-8.3 | Map `RecordedStep.title` and `RecordedStep.description` to Driver.js popover `title` and `description` | Must | Direct field mapping |
| FR-8.4 | Infer tooltip position from `RecordedStep.boundingBox` and `RecordedStep.viewport` | Must | Position tooltip where there is most available space |
| FR-8.5 | Group steps by `pageUrl` and emit comments/warnings for cross-page transitions | Should | Driver.js does not natively support cross-page tours |
| FR-8.6 | Include Driver.js CDN link and initialization boilerplate in exported file | Must | Ready-to-use output |
| FR-8.7 | Export as GuideChimp-compatible JSON as secondary format | Could | Lower priority due to EUPL-1.2 license concerns |
| FR-8.8 | Provide selector fallback chain: if primary selector not found at runtime, try alternatives | Should | Improve tour robustness |

#### 3.2.3 Acceptance Criteria

- Exported Driver.js config produces a functional tour when loaded on the same page
- Tooltips appear adjacent to the correct element without overlapping it
- Steps with missing or broken selectors show a graceful warning (not a crash)
- Cross-page transitions are documented in comments with manual navigation instructions
- Export file includes version comment indicating SOP Recorder origin

#### 3.2.4 Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Export generation time | < 200ms for any recording size |
| Exported file size | < 50 KB (no images, config only) |

#### 3.2.5 UI/UX Specification

- Add "Export as Tour (Driver.js)" option to the export menu
- Show a brief explanation: "Creates an interactive walkthrough overlay. Paste into your app to guide users step-by-step."
- If recording spans multiple pages, show a warning: "This recording covers multiple pages. The tour will work best when loaded on the starting page."

#### 3.2.6 Technical Constraints

- No new runtime dependencies — exported file references Driver.js via CDN
- `selectBestSelector()` helper function selects the most robust selector from `RecordedStep.selectors`
- `inferTooltipPosition()` calculates optimal popover placement based on bounding box position relative to viewport
- Implementation in `src/core/export/tour-exporter.ts`

---

### 3.3 Feature F3: MCP Server Integration (v2.0)

#### 3.3.1 User Stories

| ID | Story |
|----|-------|
| US-F3.1 | As Alex (Developer), I want to access my SOPs from Claude Desktop or any MCP-compatible AI assistant so I can reference procedures during development. |
| US-F3.2 | As Alex, I want an AI assistant to list and search my SOPs by title or content so I can find the right procedure quickly. |
| US-F3.3 | As Alex, I want to export an SOP to any format directly from my AI assistant without opening the browser extension. |

#### 3.3.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-9.1 | Provide a standalone Node.js MCP server process (`sop-recorder-mcp`) | Must | Separate package in pnpm workspace |
| FR-9.2 | Implement `sop_list` tool — list all SOPs with title, date, step count | Must | Reads from `~/.sop-recorder/` filesystem |
| FR-9.3 | Implement `sop_read` tool — return full SOP content including step details | Must | Returns structured JSON |
| FR-9.4 | Implement `sop_export` tool — export SOP to specified format (markdown, html, tour) | Must | Reuses core export engine |
| FR-9.5 | Implement `sop_search` tool — full-text search across SOP titles, descriptions, and step content | Should | Simple substring/regex matching |
| FR-9.6 | Sync extension data to filesystem via Chrome Native Messaging | Must | Extension → `~/.sop-recorder/recordings/` |
| FR-9.7 | Implement `FileStorageAdapter` conforming to existing `IStorageAdapter` interface | Must | Filesystem-backed storage |
| FR-9.8 | Implement `FileBlobStore` conforming to existing `IBlobStore` interface | Must | Screenshot files on disk |
| FR-9.9 | Provide installation script for native messaging host registration | Must | `install.sh` / `install.ps1` |
| FR-9.10 | Refactor project to pnpm workspace to share `src/core/` between extension and MCP server | Must | Prerequisite for code reuse |

#### 3.3.3 Acceptance Criteria

- MCP server starts and responds to tool calls via stdio transport
- `sop_list` returns all synced recordings with correct metadata
- `sop_read` returns complete step data including screenshot file paths
- `sop_export` generates valid Markdown, HTML, and tour exports
- Recordings sync from extension to filesystem within 5 seconds of save
- Native messaging host installs correctly on macOS, Windows, and Linux
- MCP server works with Claude Desktop, Cline, and Continue.dev

#### 3.3.4 Non-Functional Requirements

| Metric | Target |
|--------|--------|
| MCP server startup time | < 1 second |
| `sop_list` response time | < 200ms for 100 recordings |
| `sop_read` response time | < 500ms including screenshot paths |
| `sop_export` response time | < 3 seconds for 50-step SOP |
| Filesystem sync latency | < 5 seconds after extension save |

#### 3.3.5 Technical Constraints

- Dependencies: `@modelcontextprotocol/sdk`, `zod` (for tool input validation)
- Data directory: `~/.sop-recorder/` with subdirectories `recordings/`, `screenshots/`
- Each recording stored as `{id}.json` with screenshots as `{id}/{step-sequence}.jpg`
- Native messaging host manifest registered at OS-specific location
- MCP server reads filesystem only — never writes back to extension storage (one-way sync)

#### 3.3.6 Architecture

```
┌─────────────────────┐     Native Messaging      ┌──────────────────────┐
│  Chrome Extension   │ ──────────────────────────>│  Native Host         │
│  (chrome.runtime.   │     JSON messages          │  (Node.js process)   │
│   connectNative)    │                            │                      │
└─────────────────────┘                            │  Writes to:          │
                                                   │  ~/.sop-recorder/    │
                                                   └──────────────────────┘
                                                              │
                                                   ┌──────────┴───────────┐
                                                   │  MCP Server          │
                                                   │  (stdio transport)   │
                                                   │                      │
                                                   │  FileStorageAdapter  │
                                                   │  FileBlobStore       │
                                                   │  Core ExportEngine   │
                                                   └──────────────────────┘
                                                              │
                                                   ┌──────────┴───────────┐
                                                   │  AI Assistants       │
                                                   │  (Claude Desktop,    │
                                                   │   Cline, etc.)       │
                                                   └──────────────────────┘
```

#### 3.3.7 Risk: Native Messaging Installation Friction

Native messaging requires OS-specific host registration (registry on Windows, JSON manifest in `~/Library/...` on macOS, `~/.config/...` on Linux). This creates installation friction that could discourage non-technical users.

**Mitigation:**
- Provide platform-specific installer scripts with clear instructions
- Include a "Test Connection" button in extension settings
- Document troubleshooting steps for common failure modes
- Consider a future "extension-only" mode that syncs via extension storage export (no native messaging needed) for users who only want basic MCP functionality

---

### 3.4 Feature F4: AI Step Enhancement — BYOK (v2.0)

#### 3.4.1 User Stories

| ID | Story |
|----|-------|
| US-F4.1 | As Sarah, I want AI to improve my step titles from "Clicked input field" to "Enter the customer email address in the Contact Form" so my SOPs read more professionally. |
| US-F4.2 | As Kenji, I want to use Chrome's built-in AI (Gemini Nano) so I can enhance steps without sending any data to external servers. |
| US-F4.3 | As Alex, I want to provide my own OpenAI-compatible API key so I can use my preferred AI provider. |
| US-F4.4 | As Kenji, I want to see exactly what data will be sent to the AI before it happens so I can verify no sensitive information is transmitted. |

#### 3.4.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-10.1 | Define `IAIProvider` adapter interface with `enhance(steps: RecordedStep[]): Promise<EnhancedStep[]>` | Must | Adapter pattern consistent with architecture |
| FR-10.2 | Implement `OpenAICompatibleProvider` supporting any OpenAI-compatible API endpoint | Must | Works with OpenAI, Anthropic (via proxy), OpenRouter, local LLMs |
| FR-10.3 | Implement `ChromeBuiltInAIProvider` using Chrome's Gemini Nano | Should | Zero-config fallback, fully offline |
| FR-10.4 | Batch enhancement: send all steps in a single API call | Must | Reduces latency and API costs |
| FR-10.5 | Store API key in `chrome.storage.local` | Must | Persists across sessions |
| FR-10.6 | Settings UI for API configuration (endpoint URL, API key, model selection) | Must | New `sop-settings` Lit component |
| FR-10.7 | Privacy consent flow before first AI API call | Must | User must acknowledge what data is sent |
| FR-10.8 | "Enhance All Steps" button in Edit view | Must | Primary AI trigger |
| FR-10.9 | Show enhancement diff (before/after) with accept/reject per step | Should | User control over AI output |
| FR-10.10 | Automatic PII warning if step data contains patterns matching email, phone, SSN | Should | Pre-send privacy check |

#### 3.4.3 Acceptance Criteria

- User can configure an OpenAI-compatible API endpoint and key in settings
- "Enhance All Steps" produces improved titles and descriptions for all steps
- Enhancement completes within 10 seconds for a 20-step recording
- Privacy consent dialog appears before the first API call and does not appear again unless settings change
- Chrome built-in AI works without any configuration when available
- If AI provider is unavailable or fails, the original step data is preserved unchanged
- API key is never included in exported files

#### 3.4.4 Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Enhancement latency (20 steps, external API) | < 10 seconds |
| Enhancement latency (20 steps, Gemini Nano) | < 30 seconds |
| API key storage | `chrome.storage.local` (not encrypted for v2, UX guardrails instead) |
| Network permissions | `optional_host_permissions` — user grants per-endpoint |

#### 3.4.5 UI/UX Specification

**Settings Panel (`sop-settings`):**
- Card-based layout consistent with existing UI vocabulary
- API Provider selector: "Chrome Built-in AI (Gemini Nano)" / "OpenAI-Compatible API"
- When "OpenAI-Compatible API" selected:
  - API Endpoint URL input (default: `https://api.openai.com/v1`)
  - API Key input (password-masked, with show/hide toggle)
  - Model name input (default: `gpt-4o-mini`)
  - "Test Connection" button
- Connection status indicator (untested / success / failed)

**Privacy Consent Dialog:**
- Modal overlay (not dismissable by clicking outside)
- Shows exactly what data will be sent: step titles, descriptions, element names, page URLs
- Shows what will NOT be sent: screenshots, API keys of other services
- Checkbox: "I understand that step text data will be sent to [endpoint URL]"
- "Allow" / "Cancel" buttons

**Enhancement Flow in Edit View:**
- "Enhance with AI" button (Lucide `sparkles` icon) in Edit view toolbar
- Progress indicator during enhancement
- Results shown as inline diff: original text with strikethrough, enhanced text highlighted
- Per-step "Accept" / "Reject" buttons
- "Accept All" / "Reject All" bulk actions

#### 3.4.6 Technical Constraints

- Zero new runtime dependencies — uses native `fetch()` for API calls
- `IAIProvider` interface defined in `src/core/ai/types.ts`
- Providers implemented in `src/core/ai/providers/`
- Chrome built-in AI availability detected via `self.ai?.languageModel` check
- API key never logged, never included in error messages sent to console

#### 3.4.7 `IAIProvider` Interface

```typescript
interface IAIProvider {
  readonly name: string;
  readonly isAvailable: () => Promise<boolean>;
  enhance(steps: StepEnhancementInput[]): Promise<StepEnhancementOutput[]>;
}

interface StepEnhancementInput {
  sequenceNumber: number;
  title: string;
  description: string;
  type: StepAction;
  accessibleName: string;
  tagName: string;
  pageUrl: string;        // URL only, no page content
  pageTitle: string;
}

interface StepEnhancementOutput {
  sequenceNumber: number;
  enhancedTitle: string;
  enhancedDescription: string;
}
```

---

### 3.5 Feature F5: Screenshot Annotation Editor (v2.0)

#### 3.5.1 User Stories

| ID | Story |
|----|-------|
| US-F5.1 | As Sarah, I want to draw arrows pointing to specific UI elements in my screenshots so the SOP is clearer for readers. |
| US-F5.2 | As Sarah, I want to add text callouts to screenshots to explain what each area does. |
| US-F5.3 | As Sarah, I want to highlight areas with rectangles or circles to draw attention to important sections. |
| US-F5.4 | As Kenji, I want my annotations to be preserved when I re-export the SOP. |

#### 3.5.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-11.1 | SVG overlay annotation layer on top of screenshot image | Must | Non-destructive, resolution-independent |
| FR-11.2 | Arrow tool: click start point, drag to end point | Must | Most-requested annotation type |
| FR-11.3 | Rectangle tool: drag to draw outlined rectangle | Must | Area highlighting |
| FR-11.4 | Ellipse tool: drag to draw outlined ellipse | Should | Alternative highlighting shape |
| FR-11.5 | Text tool: click to place, type to add text label | Must | Callout text |
| FR-11.6 | Freehand drawing tool | Could | Lower priority, complex implementation |
| FR-11.7 | Store annotations as normalized (0-1) coordinates in `RecordedStep.annotations[]` | Must | Resolution-independent persistence |
| FR-11.8 | Composite annotations onto screenshot for export via `OffscreenCanvas` | Must | Exported images include annotations |
| FR-11.9 | Undo/redo for annotation actions | Must | Essential for editing UX |
| FR-11.10 | Delete individual annotations | Must | Error correction |
| FR-11.11 | Annotation color selection (red, blue, green, yellow, white, black) | Should | Customization |

#### 3.5.3 Acceptance Criteria

- User can add arrows, rectangles, and text to any screenshot
- Annotations persist across browser sessions (stored with recording)
- Exported Markdown ZIP and HTML exports include composited screenshots with annotations
- Annotations render correctly at any zoom level (normalized coordinates)
- Undo/redo stack supports at least 20 actions
- Side panel annotation editor is usable at 400px width

#### 3.5.4 Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Annotation rendering latency | < 16ms (60fps during drawing) |
| Composite generation (per screenshot) | < 200ms |
| Annotation data size per step | < 5 KB (JSON) |
| Maximum annotations per step | 50 |

#### 3.5.5 UI/UX Specification

**Annotation Mode:**
- Activated by clicking "Annotate" button (Lucide `pen-tool` icon) on a step's screenshot
- Screenshot expands to fill available side panel width
- Toolbar appears above screenshot: Arrow, Rectangle, Ellipse, Text, Freehand, Color picker, Undo, Redo, Done
- Tools use `--sop-recording-color` (red) as default annotation color
- `@media (hover: none)` fallback: larger touch targets for tablet users

**Constraints:**
- Side panel width (~400px) limits annotation precision for complex drawings
- Annotation tools must be usable with both mouse and touch input
- Consider offering "Open in larger view" for detailed annotation work (future enhancement)

#### 3.5.6 Data Model Extension

```typescript
interface AnnotationElement {
  id: string;
  type: 'arrow' | 'rect' | 'ellipse' | 'text' | 'freehand';
  // Normalized coordinates (0-1 relative to image dimensions)
  points: { x: number; y: number }[];  // Start/end for arrow, corners for rect, etc.
  color: string;                         // Hex color
  strokeWidth: number;                   // In normalized units
  text?: string;                         // For text annotations
  fontSize?: number;                     // Normalized font size
}

// Added to RecordedStep:
interface RecordedStep {
  // ... existing fields ...
  annotations?: AnnotationElement[];     // Optional, undefined = no annotations
}
```

#### 3.5.7 Technical Constraints

- SVG overlay approach — annotations rendered as SVG elements positioned over the screenshot `<img>`
- `annotation-compositor.ts` uses `OffscreenCanvas` to render SVG annotations onto screenshot bitmap for export
- No external drawing library — custom SVG manipulation with pointer events
- Annotations stored in recording JSON, not as separate files

---

### 3.6 Feature F6: Cross-Browser Support — Firefox (v2.0)

#### 3.6.1 User Stories

| ID | Story |
|----|-------|
| US-F6.1 | As a Firefox user, I want to use SOP Recorder to document my browser workflows. |
| US-F6.2 | As Sarah, I want my team to use SOP Recorder regardless of whether they use Chrome or Firefox. |

#### 3.6.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-12.1 | Build and publish Firefox add-on using WXT's built-in Firefox support | Must | WXT handles manifest conversion |
| FR-12.2 | Adapt side panel to Firefox's Sidebar API | Must | Different API surface from Chrome Side Panel |
| FR-12.3 | Use `browser.tabs.captureVisibleTab()` for screenshots in Firefox | Must | Firefox equivalent API |
| FR-12.4 | Verify all core functionality works in Firefox 120+ | Must | Minimum version for sidebar API stability |
| FR-12.5 | Publish to Firefox Add-ons (AMO) marketplace | Must | Distribution channel |
| FR-12.6 | Adapt keyboard shortcuts to Firefox conventions | Should | May differ from Chrome defaults |

#### 3.6.3 Acceptance Criteria

- Full Record -> Edit -> Export flow works in Firefox
- Side panel/sidebar displays correctly in Firefox's sidebar implementation
- Screenshots capture correctly via Firefox API
- Extension passes AMO review process
- All existing E2E tests pass on Firefox (via Playwright Firefox support)

#### 3.6.4 Technical Constraints

- WXT's `defineConfig({ browser: 'firefox' })` handles most manifest differences
- Firefox Sidebar API uses `browser.sidebarAction` vs Chrome's `chrome.sidePanel`
- Firefox may require `browser_specific_settings` in manifest for AMO listing
- Service worker differences: Firefox still uses event pages in some contexts
- Test matrix expands: CI must run tests on both Chrome and Firefox

---

### 3.7 Feature F7: PII Auto-Redaction in Screenshots (v2.1)

#### 3.7.1 User Stories

| ID | Story |
|----|-------|
| US-F7.1 | As Kenji, I want screenshots to automatically blur or redact personally identifiable information so I can share SOPs without exposing sensitive data. |
| US-F7.2 | As Sarah, I want to review and adjust redaction areas before exporting so legitimate data is not accidentally hidden. |

#### 3.7.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-13.1 | Detect PII patterns in captured DOM text before screenshot: email addresses, phone numbers, SSN patterns, credit card numbers | Must | Regex-based detection |
| FR-13.2 | Apply CSS blur overlay to detected PII regions before screenshot capture | Must | Pre-capture redaction |
| FR-13.3 | Mark detected PII regions in step metadata for user review | Should | Allow user to unredact false positives |
| FR-13.4 | User toggle: enable/disable auto-redaction in settings | Must | Opt-in feature |
| FR-13.5 | Manual redaction tool: user can draw blur rectangles on screenshots | Should | Complement auto-detection |

#### 3.7.3 Acceptance Criteria

- Email addresses matching `*@*.*` pattern are detected and blurred in 95%+ of cases
- Phone numbers in common formats (US, international) are detected
- Credit card number patterns (4 groups of 4 digits) are detected
- False positive rate is below 10% for typical business application screenshots
- User can review and adjust all redactions before export
- Redaction is applied to the screenshot bitmap — original pixel data is destroyed (not just overlaid)

#### 3.7.4 Technical Constraints

- PII detection operates on DOM text content at capture time, not on the screenshot image (OCR would be too slow and complex)
- Blur applied via CSS `filter: blur(10px)` on matching elements before `captureVisibleTab()`
- CSS blur removed after capture (same pattern as existing highlight overlay)
- This approach cannot catch PII rendered as images or in canvas elements (documented limitation)

---

### 3.8 Feature F8: Claude Shortcut Export (v2.1)

#### 3.8.1 User Stories

| ID | Story |
|----|-------|
| US-F8.1 | As Alex, I want to export an SOP as a Claude-ready prompt so I can import it as a Claude shortcut for quick reference. |

#### 3.8.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-14.1 | Export recording as a natural language prompt suitable for Claude Chrome shortcut import | Must | Text-based export |
| FR-14.2 | Use AI provider (F4) to summarize steps into coherent natural language instructions | Must | Depends on F4 infrastructure |
| FR-14.3 | Include page context (URLs, application names) in the generated prompt | Should | Contextual instructions |
| FR-14.4 | Format output as a numbered procedure with clear action verbs | Must | Professional prompt format |

#### 3.8.3 Acceptance Criteria

- Exported prompt reads as coherent natural language instructions (not raw step data)
- Prompt can be copy-pasted into Claude Chrome as a shortcut
- Output length is under 2000 tokens for a 20-step SOP
- Export works with both external AI and Chrome built-in AI providers

---

### 3.9 Feature F9: Import/Merge Recordings (v2.1)

#### 3.9.1 User Stories

| ID | Story |
|----|-------|
| US-F9.1 | As Sarah, I want to import a previously exported SOP back into SOP Recorder so I can edit and re-export it. |
| US-F9.2 | As Sarah, I want to merge two recordings into one so I can combine related procedures. |

#### 3.9.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-15.1 | Import a `.sop-recorder.json` file containing recording data and screenshots | Must | New export format for round-tripping |
| FR-15.2 | Export recordings in `.sop-recorder.json` format (lossless, includes all metadata + base64 screenshots) | Must | Prerequisite for import |
| FR-15.3 | Merge two recordings: append steps from recording B after recording A | Should | Simple concatenation with renumbering |
| FR-15.4 | Validate imported data against `Recording` schema before import | Must | Prevent malformed data |

#### 3.9.3 Acceptance Criteria

- Exported `.sop-recorder.json` can be imported back with zero data loss
- Imported recording appears in the recording list with original metadata
- Merged recording maintains correct step ordering and numbering
- Import of malformed files shows a clear error message (not a crash)

---

### 3.10 Feature F10: Claude Code Agent Skills (v3.0)

#### 3.10.1 User Stories

| ID | Story |
|----|-------|
| US-F10.1 | As Alex, I want Claude Code to be able to read and reference my SOPs so it can help me automate documented procedures. |
| US-F10.2 | As Alex, I want Claude Code to generate Playwright test skeletons from my recorded SOPs. |

#### 3.10.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| FR-16.1 | Define Claude Code skill configuration for SOP access | Must | `.claude/skills/sop-recorder.md` |
| FR-16.2 | Expose SOP data via MCP server (F3) to Claude Code | Must | Depends on F3 |
| FR-16.3 | Provide skill prompts for common SOP operations: read, search, export, generate-test | Should | Skill templates |
| FR-16.4 | Generate Playwright test skeleton from `RecordedStep[]` data | Should | Maps selectors + actions to Playwright commands |

#### 3.10.3 Acceptance Criteria

- Claude Code can list and read SOPs via MCP tools
- Generated Playwright test skeleton compiles and runs against the original page
- Skill documentation clearly describes available capabilities

---

## 4. Updated Roadmap

### v1.1 — Quick Follow-Up (1-2 weeks after v1.0)

| Feature | Effort | Status |
|---------|--------|--------|
| Self-contained HTML export (F1) | 2-4 hours | Planned |
| Improved step auto-titling heuristics | 4-8 hours | Planned |
| Bug fixes from v1.0 user feedback | Variable | Ongoing |

### v2.0 — Multi-Format Export & Developer Integration (6-8 weeks)

| Feature | Effort | Dependencies |
|---------|--------|-------------|
| pnpm workspace refactor | 2-3 days | None (prerequisite for F3) |
| Tour export — Driver.js (F2) | 8-12 hours | None |
| MCP server integration (F3) | 3-5 days | Workspace refactor |
| AI step enhancement — BYOK (F4) | 8-10 days | None |
| Screenshot annotation editor (F5) | 5-7 stories (~2 weeks) | None |
| Cross-browser support — Firefox (F6) | 3-5 days | None |

### v2.1 — Polish & Advanced Features (4-6 weeks after v2.0)

| Feature | Effort | Dependencies |
|---------|--------|-------------|
| PII auto-redaction (F7) | 5-8 days | None |
| Claude shortcut export (F8) | 2-3 days | F4 (AI provider) |
| Import/merge recordings (F9) | 2-3 days | None |
| Notion API export | 3-5 days | None |

### v3.0 — Platform (8-12 weeks after v2.1)

| Feature | Effort | Dependencies |
|---------|--------|-------------|
| Claude Code agent skills (F10) | 3-5 days | F3 (MCP server) |
| Playwright test skeleton export | 2-3 days | None |
| rrweb session replay layer (opt-in) | 5-8 days | None |
| Multi-language UI (i18n) | 3-5 days | None |

---

## 5. Privacy Impact Assessment

### 5.1 Privacy Principles (Unchanged from v1)

SOP Recorder's privacy architecture is a **technical guarantee**, not a policy promise. v2 features must preserve this guarantee for all features that do not explicitly require network access.

### 5.2 Feature-by-Feature Privacy Analysis

| Feature | Network Access | Data Transmitted | User Consent | Risk Level |
|---------|---------------|-----------------|-------------|------------|
| HTML export (F1) | None | None | N/A | None |
| Tour export (F2) | None | None | N/A | None |
| MCP server (F3) | Local only (stdio) | SOP data to local filesystem | Implicit (user installs native host) | Low |
| AI BYOK (F4) | External API | Step text (titles, descriptions, page URLs) | Explicit consent dialog | **Medium** |
| Chrome Built-in AI (F4) | None (on-device) | None | N/A | None |
| Annotation editor (F5) | None | None | N/A | None |
| Firefox support (F6) | None | None | N/A | None |
| PII redaction (F7) | None | None | N/A | None (privacy-positive) |
| Claude shortcut (F8) | Same as F4 | Same as F4 | Same as F4 | **Medium** |
| Import/merge (F9) | None | None | N/A | None |
| Claude Code skills (F10) | Local only (MCP) | SOP data to local process | Implicit (user configures MCP) | Low |

### 5.3 AI BYOK Privacy Safeguards (F4)

The AI enhancement feature is the only v2 feature that may transmit data to external servers. The following safeguards are mandatory:

1. **Explicit consent flow** — First-time use triggers a modal dialog showing exactly what data will be sent and to which endpoint. User must affirmatively consent.
2. **Data minimization** — Only step text data (titles, descriptions, accessible names, page URLs) is sent. Screenshots are NEVER sent to external APIs.
3. **Consent reset on endpoint change** — If the user changes the API endpoint, consent must be re-obtained.
4. **No default endpoint** — The user must explicitly configure an API endpoint. There is no default that "just works" with an external service.
5. **Pre-send PII scan** — Before sending data, scan step text for PII patterns (email, phone, SSN). If found, warn the user with specific matches highlighted.
6. **API key isolation** — API key stored in `chrome.storage.local`, never included in exported files, never logged to console.
7. **Chrome Built-in AI preferred** — When available, Chrome's Gemini Nano is promoted as the recommended option (fully offline, no data transmission).

### 5.4 MCP Server Privacy Considerations (F3)

- SOP data synced to `~/.sop-recorder/` is readable by any local process with user-level filesystem access
- This is consistent with the "local-first" promise — data stays on the device
- The sync is one-way (extension → filesystem) — the MCP server cannot modify extension data
- Users who install the native messaging host have implicitly accepted filesystem access

---

## 6. Manifest Permission Changes

### 6.1 v1.0 Permissions (Current)

```json
{
  "permissions": ["activeTab", "scripting", "storage", "sidePanel", "alarms", "downloads"]
}
```

### 6.2 v2.0 Permission Additions

| Permission | Feature | Why Needed | User Impact |
|-----------|---------|-----------|-------------|
| `nativeMessaging` | F3 (MCP) | Chrome Native Messaging for filesystem sync | Medium — CWS shows "Communicate with cooperating native applications" |
| `optional_host_permissions` (dynamic) | F4 (AI BYOK) | User-specified API endpoints for AI enhancement | Low — granted per-endpoint on demand via `permissions.request()` |

### 6.3 Updated Manifest (v2.0)

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "sidePanel",
    "alarms",
    "downloads",
    "nativeMessaging"
  ],
  "optional_host_permissions": [
    "https://*/*"
  ]
}
```

### 6.4 Permission Justification for CWS Review

- `nativeMessaging`: Required for syncing SOP data to local filesystem for MCP server integration. No network communication — only local IPC with a co-installed native application.
- `optional_host_permissions` with `https://*/*`: Required for user-configured AI API endpoints (BYOK). Permission is requested dynamically when the user configures a specific endpoint, not granted at install time. This minimizes the permission footprint while supporting arbitrary API providers.

### 6.5 Firefox Permissions (v2.0)

Firefox uses `browser_specific_settings` and the `sidebar` permission instead of `sidePanel`:

```json
{
  "permissions": ["activeTab", "scripting", "storage", "alarms", "downloads", "nativeMessaging"],
  "sidebar_action": {
    "default_panel": "sidepanel.html",
    "default_title": "SOP Recorder"
  },
  "optional_permissions": ["<all_urls>"],
  "browser_specific_settings": {
    "gecko": {
      "id": "sop-recorder@naokiiida",
      "strict_min_version": "120.0"
    }
  }
}
```

---

## 7. Success Metrics for v2

### 7.1 v2.0 Launch Metrics (90 Days Post-Launch)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Chrome Web Store installs (cumulative) | 2,000 | CWS dashboard |
| Firefox Add-ons installs | 200 | AMO dashboard |
| Weekly active users | 400 | CWS + AMO dashboards |
| CWS rating | >= 4.2 stars | CWS dashboard |
| GitHub stars | 500 | GitHub |
| MCP server npm downloads | 100 | npm registry |

### 7.2 Feature Adoption Metrics (Proxy)

Since SOP Recorder collects no telemetry, feature adoption is measured through proxy signals:

| Feature | Proxy Metric | Source |
|---------|-------------|--------|
| HTML export | CWS reviews mentioning "HTML" or "sharing" | Manual review |
| Tour export | GitHub issues/discussions about Driver.js integration | GitHub |
| MCP server | npm downloads of `sop-recorder-mcp` package | npm registry |
| AI enhancement | GitHub issues about AI providers, API configuration | GitHub |
| Annotation editor | CWS reviews mentioning "annotation", "arrows", "drawing" | Manual review |
| Firefox support | AMO install count and reviews | AMO dashboard |

### 7.3 v2 North Star Metric

**Number of recordings exported in 2+ formats.** This measures the "record once, deploy everywhere" value proposition. A user who exports the same recording as both Markdown and HTML (or Markdown and tour) has realized the multi-format promise.

### 7.4 Product Quality Metrics (v2)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Unit test coverage | >= 80% on all modules (including new v2 modules) | Vitest coverage report |
| E2E test coverage | All export formats tested end-to-end | Playwright test suite |
| Cross-browser E2E | Chrome + Firefox critical path passing | Playwright multi-browser |
| Bundle size (Chrome) | < 2.5 MB total package | size-limit in CI |
| Bundle size (Firefox) | < 2.5 MB total package | size-limit in CI |
| MCP server response time | All tools respond in < 3 seconds | Integration tests |
| Zero-crash recording sessions | > 99.5% | E2E tests |

---

## 8. Risk Register for v2

| ID | Risk | Likelihood | Impact | Feature | Mitigation |
|----|------|-----------|--------|---------|------------|
| R1 | Native messaging installation friction deters non-technical users from MCP setup | High | Medium | F3 | Provide platform-specific installer scripts. Document troubleshooting. Consider extension-only sync fallback. |
| R2 | Chrome built-in AI (Gemini Nano) availability is limited or API changes before v2 launch | Medium | Low | F4 | Gemini Nano is a "nice-to-have" fallback. BYOK with external API is the primary path. Feature-detect at runtime. |
| R3 | Side panel width (~400px) makes annotation editor unusable for precise work | Medium | Medium | F5 | Start with basic tools (arrow, rect, text). Provide "open larger" option as follow-up. Test with real users early. |
| R4 | `optional_host_permissions` with `https://*/*` triggers stricter CWS review | Medium | High | F4 | Justify clearly in CWS review notes. Permission is optional and user-initiated. Prepare detailed privacy documentation. |
| R5 | Firefox Sidebar API behavior differences cause unexpected bugs | Medium | Medium | F6 | Run full E2E suite on Firefox in CI. Dedicate testing time to Firefox-specific edge cases. |
| R6 | Driver.js cross-page tour limitation confuses users who recorded multi-page workflows | High | Low | F2 | Show clear warning during export. Document limitation. Group steps by page with navigation instructions. |
| R7 | AI enhancement produces low-quality or incorrect step descriptions | Medium | Medium | F4 | Show diff with accept/reject per step. Never auto-apply without user review. Allow model selection for quality tuning. |
| R8 | pnpm workspace refactor introduces build regressions | Low | High | F3 | Comprehensive CI coverage before refactor. Incremental migration with passing tests at each step. |
| R9 | PII detection regex produces excessive false positives in business applications | Medium | Medium | F7 | Configurable sensitivity levels. User review before export. Conservative default patterns. |
| R10 | MCP server security — local filesystem access to SOP data | Low | Medium | F3 | Data stored in user-scoped directory (`~/`). Standard filesystem permissions apply. Document security model. |
| R11 | Bundle size exceeds 2.5 MB with annotation editor and AI settings UI | Medium | Low | F4, F5 | Lazy-load annotation editor and settings components. Monitor with size-limit in CI. |
| R12 | EUPL-1.2 copyleft concerns if GuideChimp is included as secondary tour format | Low | High | F2 | Default to Driver.js (MIT) only. GuideChimp support deferred unless license concerns are resolved. |

---

## 9. Dependencies Between Features

```
F1 (HTML Export)          ──── No dependencies (v1.1)
F2 (Tour Export)          ──── No dependencies
F3 (MCP Server)           ──── Requires pnpm workspace refactor
F4 (AI BYOK)              ──── No dependencies
F5 (Annotation Editor)    ──── No dependencies
F6 (Firefox)              ──── No dependencies
F7 (PII Redaction)        ──── No dependencies
F8 (Claude Shortcut)      ──── Requires F4 (AI provider for summarization)
F9 (Import/Merge)         ──── No dependencies
F10 (Claude Code Skills)  ──── Requires F3 (MCP server as transport)
```

---

## 10. Data Model Changes Summary

### 10.1 RecordedStep Extensions

```typescript
interface RecordedStep {
  // ... all existing v1 fields unchanged ...

  // v2.0: Screenshot annotations (F5)
  annotations?: AnnotationElement[];

  // v2.0: AI enhancement metadata (F4)
  enhancedAt?: number;          // Unix ms, when AI last enhanced this step
  originalTitle?: string;       // Pre-enhancement title (for revert)
  originalDescription?: string; // Pre-enhancement description (for revert)
}
```

### 10.2 New Types

```typescript
// F5: Annotation data
interface AnnotationElement {
  id: string;
  type: 'arrow' | 'rect' | 'ellipse' | 'text' | 'freehand';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
}

// F4: AI provider configuration
interface AIProviderConfig {
  type: 'openai-compatible' | 'chrome-builtin';
  endpoint?: string;     // For openai-compatible
  apiKey?: string;        // For openai-compatible (stored encrypted ref, not plaintext)
  model?: string;         // For openai-compatible
  consentGranted: boolean;
  consentTimestamp?: number;
}

// F3: MCP tool schemas (Zod-defined at runtime)
// sop_list: {} → { recordings: { id, title, date, stepCount }[] }
// sop_read: { id: string } → { recording: Recording }
// sop_export: { id: string, format: 'markdown' | 'html' | 'tour' } → { filePath: string }
// sop_search: { query: string } → { results: { id, title, matchContext }[] }
```

### 10.3 Backward Compatibility

All new fields are optional (`?` suffix). Existing v1 recordings load without migration. New fields are populated only when the corresponding v2 feature is used.

---

## Appendix C: Competitive Landscape Update (v2)

| Feature | SOP Recorder (v2) | Scribe (Pro) | Tango (Pro) | Workmap |
|---------|-------------------|-------------|-------------|---------|
| HTML export | Yes (self-contained) | Yes (paid) | No | No |
| Interactive tour export | Yes (Driver.js) | No | No | No |
| MCP server | Yes | No | No | No |
| AI enhancement | Yes (BYOK + Gemini Nano) | Yes (cloud, paid) | No | No |
| Screenshot annotations | Yes (SVG overlay) | Yes (paid) | Limited | No |
| Firefox support | Yes | Yes | No | No |
| PII redaction | Yes (auto + manual) | No | No | No |
| Import/export recordings | Yes (lossless) | No | No | Yes |
| Claude integration | Yes (shortcut + MCP + skills) | No | No | No |
| Price | Free | $23-33/user/mo | $20/user/mo | Free |
| Privacy | Local-first | Cloud | Cloud | Local |

---

*This addendum extends the original PRD (v2.1, 2026-03-18) with detailed requirements for post-MVP features. Implementation should proceed in the version order specified: v1.1 first (HTML export), then v2.0 (multi-format + developer integration), v2.1 (polish + advanced), and v3.0 (platform). The adapter architecture defined in v1 enables all v2+ features without refactoring core logic.*
