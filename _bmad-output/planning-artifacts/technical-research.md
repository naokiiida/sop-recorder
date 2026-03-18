# SOP Recorder — Technical Research

> **Date**: 2026-03-18
> **Scope**: Chrome extension for recording browser SOPs with annotated screenshots
> **Prior Art**: Previous Plasmo + TypeScript + React implementation (see `docs/project-learnings.md`)

---

## 1. Extension Framework: Plasmo vs Alternatives

### 1.1 Plasmo — Current State (v0.90.5)

**Latest release**: v0.90.5 (May 2025) — no release in ~10 months.

| Aspect | Detail |
|--------|--------|
| Bundler | Parcel (lagging behind Vite ecosystem) |
| Side Panel | Supported via `sidepanel.tsx` file convention |
| Offscreen Document | Supported but undocumented; community examples exist |
| Content Script Injection | Convention-based (`content.tsx`), hashed filenames at build |
| HMR | React-optimized; other frameworks trigger full reload |
| Cross-browser | Chrome, Firefox, Edge, Safari targets |
| Maintenance | **Appears to be in maintenance mode** — WXT docs and community confirm lack of active development |

**Known Issues & Workarounds**:
- **TailwindCSS v4 incompatible** — Parcel dependency lag prevents adoption of modern tooling
- **Dynamic content script filenames** — Plasmo hashes filenames at build; background must read from manifest at runtime to inject correctly
- **Manual refresh required** — New extension pages (side panel, offscreen) may not auto-detect during HMR; manual extension reload needed
- **Bundle size** — ~800 KB baseline, roughly 2x WXT equivalent output
- **Parcel build speed** — Noticeably slower than Vite-based alternatives; developers report "significant improvements" after migration

**Recommendation**: Plasmo is still viable for this project since the previous implementation already uses it, but **WXT should be seriously evaluated** for a fresh start given maintenance concerns.

### 1.2 WXT — Recommended Alternative

| Aspect | Detail |
|--------|--------|
| Bundler | Vite (fast dev, Rollup production builds) |
| Side Panel | Supported via file-based entrypoints |
| Framework | Agnostic — React, Vue, Svelte, SolidJS all first-class |
| Cross-browser | Chrome, Firefox, Edge, Safari |
| Bundle size | ~400 KB (43% smaller than Plasmo) |
| Maintenance | Actively maintained, healthy Discord community, 12.3k+ stars |
| Auto-imports | Built-in; auto-generates manifest from file structure |

**Migration cost**: Moderate. File-based entrypoints differ from Plasmo conventions. Messaging API is different. However, core logic (state machine, event capture, selector generation) is framework-independent and portable.

### 1.3 CRXJS

- Uses Vite; v2.0 released June 2025 after 3+ years in beta
- True HMR for content scripts (differentiator)
- Smaller community (3.5k stars); recent team change raises stability questions
- **Not recommended** for new projects due to track record concerns

### 1.4 Decision Matrix

| Criterion | Plasmo | WXT | CRXJS |
|-----------|--------|-----|-------|
| Maintenance | Low | **High** | Medium |
| Bundle size | Large | **Small** | Small |
| React support | **Excellent** | Good | Good |
| Content script HMR | Reload | Reload | **True HMR** |
| Side panel | Yes | **Yes** | Yes |
| Offscreen docs | Yes (undocumented) | **Yes** | Unknown |
| Migration effort | Zero (existing) | Medium | Medium |

---

## 2. Chrome MV3 APIs for Recording

### 2.1 Screenshot Capture: API Comparison

| API | Use Case | Pros | Cons |
|-----|----------|------|------|
| **`chrome.tabs.captureVisibleTab()`** | Screenshot of visible tab area | Simple, returns data URL (base64 PNG/JPEG), works from service worker, only needs `activeTab` | Visible area only (no full-page), rate-limited, no cross-tab |
| **`chrome.tabCapture.getMediaStreamId()`** | Continuous media stream for video | Full tab stream (audio + video), can capture to MediaRecorder | Requires offscreen document, complex lifecycle, user gesture required |
| **`chrome.desktopCapture`** | Full desktop/window capture | Can capture any window/screen | Requires user picker dialog, over-permissioned for SOP use case |
| **`getDisplayMedia()` (in offscreen)** | Screen/tab recording | Standard Web API, flexible | Requires offscreen document, user prompt each time |

**Recommendation for MVP**: Use **`chrome.tabs.captureVisibleTab()`** exclusively for screenshots.
- Simplest API, no offscreen document needed
- Returns base64 data URL directly usable as image
- `activeTab` permission sufficient (no scary permission prompts)
- 200ms post-event delay (existing pattern) handles DOM settle
- Defer video recording and `tabCapture` to v2

### 2.2 Offscreen Document Lifecycle

**When needed**: Only for video recording (MediaRecorder), audio capture, or DOM-dependent operations that can't run in service worker.

**Key constraints**:
- Only one offscreen document per extension at a time
- Must specify a `reason` when creating (`USER_MEDIA`, `DOM_SCRAPING`, etc.)
- Chrome may close it if idle; extension must check/recreate
- Service worker must coordinate lifecycle: check existence before creating

**Pattern**:
```typescript
async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: "Recording tab media stream"
    });
  }
}
```

**MVP Impact**: Not needed if video recording is deferred. `captureVisibleTab` works directly from service worker.

### 2.3 Service Worker Persistence

**Termination rules**:
- Idle timeout: **30 seconds** without activity
- Max single request: **5 minutes**
- Fetch response timeout: **30 seconds**

**Keepalive strategies (ranked by reliability)**:

1. **Chrome Alarms API** (recommended) — 30-second minimum period (Chrome 120+). Wakes worker even after termination. Previous implementation used 25-minute interval; should reduce to ~25 seconds for active recording sessions.

2. **Long-lived messaging ports** (Chrome 114+) — Side panel ↔ background port connection keeps worker alive while panel is open. Ideal for SOP Recorder since side panel is always visible during recording.

3. **Active WebSocket connections** (Chrome 116+) — Resets idle timer. Not applicable unless streaming to server.

4. **Periodic storage writes** — Writing to `chrome.storage.local` resets idle timer and provides data persistence as a side benefit.

**Recommended approach for SOP Recorder**:
- Primary: Long-lived port from side panel (naturally kept alive while recording)
- Backup: 25-second alarm during active recording
- Data safety: Persist recording state to `chrome.storage.local` after each step capture

### 2.4 Side Panel API Best Practices

- Set via `chrome.sidePanel.setOptions()` in service worker
- Can be scoped per-tab or global
- Side panel persists across tab navigation (unlike popup)
- **Port connection** from side panel to background provides natural keepalive
- Plasmo and WXT both support `sidepanel.tsx` convention
- Important: `captureVisibleTab()` can be called from side panel context with proper permissions

---

## 3. Screenshot Annotation Approaches

### 3.1 Canvas API (In-Browser)

**How it works**: Load screenshot as `Image`, draw to `<canvas>`, overlay annotations (arrows, boxes, highlights), export as PNG.

| Pros | Cons |
|------|------|
| Zero dependencies | Requires UI for annotation tools |
| Works in content script or side panel | Text rendering quality varies |
| Full control over output | Complex for curved arrows/shapes |
| Produces clean PNG output | Must handle DPI/retina scaling |

**Implementation sketch**:
```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = screenshotDataUrl;
img.onload = () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  // Draw red rectangle around clicked element
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
  // Draw step number badge
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(stepNumber, x - 5, y + 5);
  return canvas.toDataURL('image/png');
};
```

**Verdict**: Best approach for MVP. Simple highlight box + step number badge is sufficient.

### 3.2 CSS Overlay (No Image Manipulation)

**How it works**: Inject a CSS overlay (absolute-positioned div) on top of the target element before taking the screenshot.

| Pros | Cons |
|------|------|
| Zero image processing | Must inject before screenshot, remove after |
| Pixel-perfect positioning | Timing-sensitive (race conditions) |
| Lightweight | Overlay may shift page layout |
| Natural retina rendering | Z-index conflicts with page CSS |

**Pattern**: Inject overlay → wait 50ms → `captureVisibleTab()` → remove overlay.

**Verdict**: Viable for a "highlight during capture" approach. Simpler than post-capture annotation but less flexible. Similar to Claude Chrome's `HIDE_FOR_TOOL_USE` pattern.

### 3.3 SVG Overlay on Screenshot

**How it works**: Display screenshot as `<img>`, overlay `<svg>` element with annotation shapes. Export combined result.

| Pros | Cons |
|------|------|
| Scalable annotations | Export requires converting SVG+img to canvas |
| Easy interactive editing | Cross-browser SVG rendering quirks |
| Clean separation of concerns | More complex than pure Canvas |

**Verdict**: Good for interactive editing UI but adds complexity. Consider for v2.

### 3.4 Sharp (Node.js — MCP Server Only)

Only applicable if building a companion local server or MCP server. Offers high-quality image processing (resize, composite, annotate) but adds architectural complexity.

**Verdict**: Relevant only for MCP server integration path (Section 7.2).

### 3.5 Recommendation

**MVP**: CSS overlay (inject highlight box before screenshot) + Canvas API for step number badge post-capture. This gives annotated screenshots with minimal complexity.

**v2**: Interactive SVG-based annotation editor in side panel.

---

## 4. Event Capture Patterns

### 4.1 Event Listeners vs MutationObserver vs rrweb

| Approach | What It Captures | Performance | Complexity | Bundle Size |
|----------|-----------------|-------------|------------|-------------|
| **DOM Event Listeners** | click, input, change, submit, keydown, navigation | Low overhead | Low | 0 KB |
| **MutationObserver** | DOM tree changes (add/remove/modify nodes) | Medium (batch callbacks) | Medium | 0 KB |
| **rrweb** | Full session replay (DOM + events + mutations) | Higher (continuous recording) | Low (library handles it) | ~50 KB |

**Key insight**: rrweb is built on top of MutationObserver + event listeners. It's not an alternative — it's a higher-level abstraction that produces full session replays.

**For SOP Recorder**:
- DOM event listeners are the right tool: we need discrete step capture (click, input, navigation), not continuous replay
- MutationObserver useful only for detecting dynamic content changes (e.g., modal appearing after click) — nice-to-have for v2
- rrweb is overkill for step-by-step SOPs; designed for session replay products like PostHog/LogRocket

**Previous implementation assessment**: The existing event listener approach with debounce + deduplication + drag filtering + trusted-only events is well-designed. Keep it.

### 4.2 Selector Generation

**Previous implementation priority chain** (keep as-is):
1. `id` attribute
2. `data-testid` attribute
3. `aria-label`
4. Tag + meaningful attributes
5. `nth-of-type` fallback

**Enhancements to consider**:

| Library | Approach | Size | Notes |
|---------|----------|------|-------|
| **optimal-select** | Generates shortest unique CSS selector | ~5 KB | Used by CSS Selector Finder extension |
| **finder** (by antonmedv) | Optimized CSS selector generation | ~3 KB | Focuses on shortest, most robust selectors |
| **css-selector-generator** | Configurable selector strategies | ~8 KB | Highly customizable priority |

**Recommendation**: The existing custom implementation is good and avoids a dependency. If robustness issues arise, consider `finder` (~3 KB) as a lightweight improvement.

### 4.3 Cross-Frame / Iframe Challenges

- Content scripts must be injected into iframes separately (`"all_frames": true` in manifest)
- `chrome.scripting.executeScript()` with `allFrames: true` for programmatic injection
- Cross-origin iframes cannot be accessed (browser security model)
- Same-origin iframes: events bubble up to parent; selectors need frame context prefix

**MVP approach**: Capture events in top frame only. Log iframe interactions as "Interacted with embedded frame" without detailed selectors. Full iframe support is v2.

---

## 5. Export Formats

### 5.1 Markdown + Images (ZIP)

**Status**: Already implemented in previous version. Clean format with step numbering, metadata, embedded image references.

| Pros | Cons |
|------|------|
| Universal compatibility | Images are separate files |
| Easy to version control | No inline rendering without viewer |
| Editable in any text editor | ZIP required for distribution |
| Works with Notion import | |

**Recommendation**: Keep as primary export format. Already proven.

### 5.2 Self-Contained HTML

**How**: Generate single HTML file with base64-encoded images inline, CSS for print layout.

| Pros | Cons |
|------|------|
| Single file, no ZIP needed | Large file size (base64 = 33% overhead) |
| Opens in any browser | Not easily editable |
| Print-friendly with `@media print` CSS | |
| Can include interactive elements | |

**Implementation**: Template literal with embedded CSS + base64 images. ~50 lines of code.

**Recommendation**: Add as second export option. Low effort, high value.

### 5.3 PDF Generation

| Library | Approach | Quality | Size |
|---------|----------|---------|------|
| **html2pdf.js** | html2canvas → jsPDF | Image-based (non-selectable text) | ~400 KB |
| **jsPDF** | Programmatic PDF construction | Full control, selectable text | ~300 KB |
| **pdfmake** | Declarative document definition | Good text support | ~800 KB |

**Limitations**: All client-side PDF libraries produce lower quality than server-side (Puppeteer, wkhtmltopdf). Text is often rendered as images, making PDFs non-searchable.

**Recommendation**: Defer to v2. HTML export with `window.print()` provides "Save as PDF" via browser print dialog — zero dependency solution for MVP.

### 5.4 Notion / Confluence API Integration

**Notion API**:
- REST API at `https://api.notion.com/v1/`
- Can create pages with blocks (text, images, headings, numbered lists)
- Images must be externally hosted URLs (cannot upload directly via API) — requires image hosting or base64 workaround
- OAuth 2.0 for user authorization
- Well-documented, stable API

**Confluence API**:
- REST API at `/wiki/rest/api/content`
- Can create/update pages with storage format (XHTML-like)
- Supports inline image attachments
- API token authentication
- More complex markup format than Notion

**Recommendation**: Defer to v2+. Both require OAuth flows, image hosting considerations, and significant UI for configuration. Markdown export with manual import is sufficient for MVP.

---

## 6. AI Integration Architecture

### 6.1 OpenAI-Compatible API (BYOK)

**Previous design** (keep): Generic `/v1/chat/completions` endpoint supporting OpenAI, Azure, Groq, local LLMs.

**Enhancements**:
- Add **streaming support** (`stream: true`) for progress indication
- Add **model selection** dropdown (not just endpoint URL)
- Add **API key validation** on settings save (HEAD request to `/v1/models`)
- Consider **structured output** (JSON mode) for consistent step formatting

**Privacy-respecting providers** (from previous research):
- Groq — no training on user data
- Fireworks — no training on user data
- OpenAI — opt-out available via API (data not used for training by default for API)
- Local LLMs via Ollama/LM Studio — full privacy

### 6.2 Chrome Built-in AI (Gemini Nano)

**Available APIs** (stable or origin trial as of 2026):
- **Prompt API** — General-purpose LLM (available for extensions on Windows/macOS/Linux)
- **Summarizer API** — Content summarization
- **Writer API** — Content creation
- **Rewriter API** — Content rephrasing
- **Language Detector API** — Language identification
- **Translator API** — On-device translation

**Relevance to SOP Recorder**:
- **Prompt API**: Could generate step descriptions from raw event data — zero API key needed
- **Summarizer API**: Could summarize multi-step SOPs into executive summaries
- **Rewriter API**: Could polish user-written step descriptions
- **Writer API**: Could generate introduction/conclusion sections

**Limitations**:
- Gemini Nano is small (~1.5B params); quality may be insufficient for complex SOP generation
- Not all users will have Chrome flags enabled
- Model availability depends on device hardware (needs GPU/NPU)
- Cannot guarantee consistent availability

**Recommendation**: Offer as **optional, zero-config enhancement** alongside BYOK. Use Prompt API for simple tasks (step description cleanup) and fall back gracefully if unavailable.

### 6.3 WebLLM (In-Browser via WebGPU)

**How it works**: Runs quantized LLMs (Llama, Phi, Gemma) directly in browser via WebGPU acceleration.

| Pros | Cons |
|------|------|
| Full privacy — no data leaves device | Large model downloads (100MB–4GB) |
| No API key needed | Requires WebGPU support |
| Works offline | Slow on CPU-only devices |
| Supports OpenAI-compatible API format | First-run download experience is poor |

**WebextLLM**: Chrome extension that embeds LLMs in an isolated extension environment with zero config.

**Recommendation**: Not suitable for MVP. Download size and hardware requirements create friction. Chrome built-in AI provides a better "local AI" experience if available.

### 6.4 Prompt Design for SOP Generation

**Input**: Array of captured steps with metadata:
```json
{
  "steps": [
    {
      "type": "click",
      "target": "button#submit",
      "accessibleName": "Submit Form",
      "pageTitle": "User Registration",
      "pageUrl": "https://example.com/register",
      "timestamp": 1710000000000
    }
  ]
}
```

**Output**: Structured SOP with:
- Clear step titles ("Click the Submit Form button")
- Contextual descriptions ("On the User Registration page, click the Submit Form button to complete registration")
- Numbered steps with screenshots
- Prerequisites section
- Expected results

**System prompt strategy**:
- Role: "You are a technical writer creating Standard Operating Procedures"
- Format: Specify exact Markdown structure expected
- Context: Include page titles, URLs, and element descriptions
- Language: Support bilingual output (Japanese/English based on user preference)
- Temperature: 0.3 for consistency

---

## 7. Alternative Architectures

### 7.1 Pure Extension (Recommended for MVP)

```
┌─────────────────────────────────────────────────────┐
│ Chrome Extension                                     │
│                                                      │
│  Content Script ──msg──▶ Service Worker              │
│  (event capture)         (state machine,             │
│                           screenshot capture,        │
│                           data management)           │
│                              │                       │
│                              ▼                       │
│                         Side Panel UI                │
│                         (step list, editing,         │
│                          export, settings)           │
└─────────────────────────────────────────────────────┘
```

| Pros | Cons |
|------|------|
| Single install, no setup | Limited to browser APIs |
| No external dependencies | No direct filesystem access |
| Works offline | Screenshot annotation limited |
| Simple distribution via CWS | No server-side processing |

**Verdict**: Right choice for MVP. Covers core use case completely.

### 7.2 Extension + MCP Server

```
┌──────────────────────┐     ┌─────────────────────────┐
│ Chrome Extension     │     │ Local MCP Server         │
│                      │────▶│ (Node.js)                │
│  Content Script      │ WS  │                          │
│  Service Worker      │◀────│  - Image processing      │
│  Side Panel          │     │    (Sharp)               │
│                      │     │  - AI enhancement        │
│                      │     │  - File system access    │
│                      │     │  - PDF generation        │
│                      │     │  - Notion/Confluence API │
└──────────────────────┘     └─────────────────────────┘
```

**MCP Integration Points**:
- `record_sop` tool — Start/stop recording from Claude Code / Cursor
- `get_steps` resource — Return captured steps as structured data
- `export_sop` tool — Generate output in specified format
- `annotate_screenshot` tool — Use Sharp for image annotation
- `enhance_with_ai` tool — Process steps through LLM

**Architecture Pattern** (based on existing MCP Chrome servers):
- Extension runs WebSocket server (or uses native messaging)
- MCP server connects to extension via WebSocket
- MCP server exposes tools/resources to Claude Code/Cursor
- All processing can happen locally — full privacy

**Verdict**: Compelling for power users (developers using Claude Code). Defer to v2 but design extension messaging to be MCP-ready (structured JSON, clean tool boundaries).

### 7.3 Extension + Native Messaging Host

- `chrome.runtime.connectNative()` connects to local executable
- Enables direct filesystem access (save without download dialog)
- Requires separate installer (poor UX for non-technical users)
- **Verdict**: Skip. Downloads API is sufficient; MCP server subsumes this use case.

### 7.4 Cross-Browser (WebExtension) Feasibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Side Panel | Yes | Sidebar (different API) | No | Yes |
| `captureVisibleTab` | Yes | Yes | Yes | Yes |
| Offscreen Document | Yes | No (not needed — persistent background) | No | Yes |
| Service Worker | Yes | Yes (MV3) | Yes | Yes |
| `chrome.storage` | Yes | `browser.storage` | `browser.storage` | Yes |
| MV3 Support | Full | Full | Full | Full |

**WXT advantage**: Provides `browser.*` polyfill that normalizes API differences across browsers. Plasmo also supports multi-browser but with less documentation.

**Key challenge**: Side Panel API differs significantly between Chrome and Firefox. Firefox uses `browser.sidebarAction` with different lifecycle. Safari has no equivalent.

**Recommendation**: Build Chrome-first. Use WXT (or Plasmo with `webextension-polyfill`) to keep code portable. Cross-browser support is a v2+ goal with Firefox as the first target.

---

## 8. Risk Assessment & Recommendations

### High Confidence (Proven Patterns)

| Component | Approach | Risk |
|-----------|----------|------|
| Screenshot capture | `captureVisibleTab()` | Low — well-documented, stable API |
| Event capture | DOM event listeners + debounce | Low — proven in previous implementation |
| State management | State machine pattern | Low — working design |
| Markdown export | Template-based generation + JSZip | Low — already implemented |
| Side panel UI | React + Tailwind in sidepanel.tsx | Low — standard pattern |

### Medium Confidence (Research Needed at Implementation)

| Component | Approach | Risk |
|-----------|----------|------|
| Framework choice | Plasmo (keep) vs WXT (migrate) | Medium — migration cost vs long-term maintenance |
| Screenshot annotation | CSS overlay + Canvas badge | Medium — timing/z-index edge cases |
| Service worker keepalive | Port + alarm dual strategy | Medium — Chrome updates may change behavior |
| AI integration | BYOK + Chrome built-in AI | Medium — Chrome AI availability uncertain |

### Lower Priority (Defer to v2)

| Component | Approach | Risk |
|-----------|----------|------|
| Video recording | tabCapture + offscreen + MediaRecorder | High — complex lifecycle, blob management |
| MCP server | Extension + Node.js WebSocket bridge | Medium — additional install/setup |
| Cross-browser | WXT + polyfills | Medium — API differences in side panel |
| Notion/Confluence export | REST API + OAuth | Medium — image hosting, auth flow |
| Interactive annotation | SVG editor in side panel | Medium — UX complexity |

---

## 9. Sources

### Frameworks
- [Plasmo Framework Documentation](https://docs.plasmo.com/framework)
- [Plasmo GitHub Repository](https://github.com/PlasmoHQ/plasmo)
- [Plasmo npm Package (v0.90.5)](https://www.npmjs.com/package/plasmo)
- [WXT — Next-gen Web Extension Framework](https://wxt.dev/)
- [WXT Framework Comparison](https://wxt.dev/guide/resources/compare)
- [2025 State of Browser Extension Frameworks (Plasmo vs WXT vs CRXJS)](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Plasmo to WXT Migration Discussion](https://github.com/wxt-dev/wxt/discussions/782)
- [Jetwriter: Migrating from Plasmo to WXT](https://jetwriter.ai/blog/migrate-plasmo-to-wxt)
- [Chrome Extension Framework Comparison 2025](https://www.devkit.best/blog/mdx/chrome-extension-framework-comparison-2025)

### Chrome APIs
- [chrome.tabs.captureVisibleTab API](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [chrome.tabCapture API](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- [chrome.desktopCapture API](https://developer.chrome.com/docs/extensions/reference/api/desktopCapture)
- [Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [MV3 Service Worker Keepalive Strategies](https://medium.com/@dzianisv/vibe-engineering-mv3-service-worker-keepalive-how-chrome-keeps-killing-our-ai-agent-9fba3bebdc5b)
- [Building Persistent Chrome Extension with MV3](https://rahulnegi20.medium.com/building-persistent-chrome-extension-using-manifest-v3-198000bf1db6)

### AI & On-Device
- [Chrome Built-in AI](https://developer.chrome.com/docs/ai/built-in)
- [WebLLM — In-Browser LLM Inference](https://webllm.mlc.ai/)
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [On-Device GenAI with LiteRT-LM](https://developers.googleblog.com/on-device-genai-in-chrome-chromebook-plus-and-pixel-watch-with-litert-lm/)
- [Running AI Models in the Browser with WebGPU](https://maddevs.io/writeups/running-ai-models-locally-in-the-browser/)

### Event Capture & Selectors
- [rrweb Observer Documentation](https://github.com/rrweb-io/rrweb/blob/master/docs/observer.md)
- [MutationObserver — MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Session Recording Performance Benchmarks (PostHog)](https://posthog.com/blog/session-recording-performance)

### Export & PDF
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- [HTML to PDF in JavaScript: 5 Libraries Compared (2026)](https://www.nutrient.io/blog/html-to-pdf-in-javascript/)
- [Notion API Documentation](https://www.notion.com/help/guides/connect-tools-to-notion-api)

### MCP Integration
- [Chrome MCP Server (hangwin)](https://github.com/hangwin/mcp-chrome)
- [Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp)

### Recording Extensions (Reference)
- [Screenity — Screen Recording Extension](https://github.com/alyssaxuu/screenity)
- [How to Build a Chrome Recording Extension (Recall.ai)](https://www.recall.ai/blog/how-to-build-a-chrome-recording-extension)
