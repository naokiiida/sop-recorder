# Chrome Extension Performance Research: Package Size & Performance Targets

> Research Date: 2026-03-18
> Purpose: Establish concrete performance budgets and measurement strategies for SOP Recorder extension

---

## 1. Package Size Benchmarks

### Chrome Web Store Limits

| Constraint | Limit |
|---|---|
| Maximum ZIP upload | 2 GB (hard reject above this) |
| Single script file | 500 MB |
| All content scripts combined | 1 GB |
| `chrome.storage.local` default | 10 MB (5 MB in Chrome 113 and earlier) |
| `chrome.storage.local` with `unlimitedStorage` | No cap (disk-bound) |
| `chrome.storage.sync` | ~100 KB total, 8 KB per item |
| IndexedDB | No explicit cap; uses global quota manager, subject to eviction |

### Comparable Extension Sizes

| Extension | Size | Users | Category |
|---|---|---|---|
| Scribe (AI Documentation & SOPs) | 1.93 MB | 1,000,000+ | SOP / screenshot recorder |
| Screenity (Screen Recorder) | 18.58 MB | 400,000+ | Screen + camera recorder |
| Loom (Screen Recorder) | ~17 MB | 5,000,000+ | Video screen recorder |
| Guidde (Video Documentation) | 3.15 MB | 100,000+ | Video documentation |
| Typical WXT-built extension | ~400 KB | -- | Framework baseline |
| Typical Plasmo-built extension | ~700-800 KB | -- | Framework baseline |

**Key Observations:**
- Pure screenshot/SOP recorders (Scribe) are under 2 MB
- Video recorders (Loom, Screenity) are 15-20 MB due to bundled codecs/media libraries
- 87% of all Chrome extensions use under 10 MB of storage
- 27 extensions on the Web Store use over 100 MB of storage (outliers)

### Target for SOP Recorder

Our extension captures screenshots (not video) and stores them temporarily. It should align closer to Scribe than Loom:

- **Package ZIP target: < 1.5 MB** (aggressive but achievable with WXT + Vite tree-shaking)
- **Stretch goal: < 800 KB** (framework-only baseline with WXT is ~400 KB)
- Screenshot data is runtime storage, not part of the package

---

## 2. Performance Metrics & Benchmarks

### 2.1 Service Worker Startup Time

**Chrome's Service Worker Lifecycle:**
- Idle timeout: **30 seconds** (resets on any event or API call)
- Max single request: **5 minutes**
- `fetch()` response deadline: **30 seconds**
- Cold start overhead: **~50ms** (process creation) + **1-1000ms** (script load/compile/run)

**Recommendations:**
- Keep the background script small; use a tiny event router that dynamically imports modules
- Register event listeners at the top level of the script (synchronously) so Chrome can find handlers immediately
- Persist state to `chrome.storage.local` or IndexedDB, not global variables
- Target: **< 100ms cold start** (achievable with a < 50 KB service worker entry point)

### 2.2 Content Script Injection Overhead

**Research findings on content script impact:**
- Loading a simple page without extensions: ~40ms CPU time
- Heavy extensions (Grammarly, Evernote): +500ms CPU time
- Worst offenders (MaxAI): +2.3 seconds per page visit
- Academic study: 51% of extensions increase page load time; average increase is +18%
- Chrome does NOT cache compiled extension scripts (`chrome-extension://` URLs excluded from compilation cache), so large scripts recompile in every tab

**Best Practices:**
- Use `document_idle` (default) for `run_at` -- injects after page load completes
- Use specific URL match patterns, not `<all_urls>` when possible
- For SOP recorder: inject a minimal observer script; dynamically import recording logic only when recording starts
- Target: **< 20 KB content script** injected into pages, **< 10ms additional page load overhead**

### 2.3 Memory Usage

**General benchmarks:**
- Service worker idle: **< 1 MB RAM**
- Typical well-behaved extension: **5-30 MB** during active use
- Security/privacy extensions with heavy interception: **100-200 MB each**
- Ad blockers with large filter lists: **50-150 MB**

**For SOP Recorder:**
- Each screenshot (1920x1080 JPEG quality 80): ~100-300 KB compressed
- Each screenshot in memory as data URL: ~400 KB - 1 MB (base64 encoding inflates ~33%)
- 50-step recording: ~15-50 MB in screenshot data alone

### 2.4 Screenshot Capture Latency

**`chrome.tabs.captureVisibleTab` performance:**
- JPEG capture: **50-150ms** typical
- PNG capture: **100-300ms** (slower compression)
- WebP quality 80: **100-200ms**
- Post-processing (resize, compress): additional **50-200ms**
- Users report needing **100+ ms delay** before capture to ensure page state is current

**Format comparison for 1920x1080 screenshot:**

| Format | Typical Size | Capture Speed | Quality |
|---|---|---|---|
| PNG (lossless) | 500 KB - 2 MB | Slowest | Perfect |
| JPEG quality 92 (default) | 150-400 KB | Fastest | Good |
| JPEG quality 80 | 100-250 KB | Fastest | Acceptable |
| WebP lossless | 300 KB - 1.2 MB | Medium | Perfect |
| WebP quality 80 | 80-200 KB | Medium | Good |

**Recommendation:** Use JPEG quality 85 for speed during capture, optionally compress to WebP for export/storage. WebP lossless is 26% smaller than PNG; WebP lossy is 25-34% smaller than JPEG at equivalent quality.

### 2.5 Side Panel Render Time

No Chrome-specific side panel benchmarks exist, but standard web performance targets apply:

- **First Contentful Paint (FCP):** < 500ms
- **Time to Interactive (TTI):** < 1000ms
- **Largest Contentful Paint (LCP):** < 1000ms

These are achievable with:
- Small initial bundle (< 100 KB JS for the side panel)
- Lazy-loaded step list and screenshot thumbnails
- Skeleton UI / loading states

---

## 3. Measurable Targets for SOP Recorder

### Performance Budget Table

| Metric | Must-Have Threshold | Nice-to-Have Target | How to Measure |
|---|---|---|---|
| **Extension package (ZIP)** | < 2 MB | < 1 MB | `size-limit` in CI, `du -sh dist/` |
| **Content script size** | < 50 KB | < 20 KB | `size-limit` per entry point |
| **Service worker entry** | < 100 KB | < 50 KB | `size-limit` per entry point |
| **Side panel JS bundle** | < 200 KB | < 100 KB | `size-limit` per entry point |
| **Service worker cold start** | < 200ms | < 100ms | `performance.mark()` in SW, DevTools Performance tab |
| **Content script page load impact** | < 50ms | < 10ms | DevTools Performance tab, `edge://tracing` |
| **Screenshot capture time** | < 300ms | < 150ms | `performance.now()` around `captureVisibleTab` |
| **Side panel FCP** | < 1000ms | < 500ms | `PerformanceObserver` for paint timing |
| **Side panel TTI** | < 2000ms | < 1000ms | DevTools Lighthouse |
| **Memory idle** | < 20 MB | < 10 MB | Chrome Task Manager (Shift+Esc) |
| **Memory during recording (per step)** | < 1 MB/step | < 500 KB/step | Chrome Task Manager delta |
| **Memory during recording (50 steps)** | < 80 MB | < 40 MB | Chrome Task Manager |
| **Export generation (10 steps)** | < 3s | < 1s | `performance.now()` around export |
| **Export generation (50 steps)** | < 10s | < 5s | `performance.now()` around export |

---

## 4. Tools for Measuring

### 4.1 Bundle Size in CI

| Tool | Purpose | Integration |
|---|---|---|
| [size-limit](https://github.com/ai/size-limit) | Performance budget checks per entry point | CI (GitHub Actions), supports ES modules + tree-shaking |
| bundlewatch | Monitor bundle size changes across PRs | GitHub PR comments |
| `vite-plugin-inspect` | Analyze Vite build output | Dev-time |
| WXT built-in bundle analysis | Analyze final extension bundle | `wxt build --analyze` |
| `rollup-plugin-visualizer` | Treemap of bundle contents | Dev-time |

**Recommended setup:** Use `size-limit` with per-entry-point budgets:
```json
[
  { "path": "dist/content-scripts/*.js", "limit": "50 KB" },
  { "path": "dist/background.js", "limit": "100 KB" },
  { "path": "dist/side-panel/*.js", "limit": "200 KB" }
]
```

### 4.2 Runtime Performance

| Tool | What It Measures | How to Use |
|---|---|---|
| Chrome DevTools Performance tab | CPU, memory, paint timing, script execution | Record profile during extension operations |
| Chrome Task Manager (Shift+Esc) | Per-process memory (extension, SW, side panel) | Monitor during recording sessions |
| `chrome://extensions` | Extension errors, SW lifecycle | Check for startup failures |
| `edge://tracing` / `chrome://tracing` | Fine-grained v8.compile, ScriptInjection timing | Filter by extension process ID |
| `performance.mark()` / `performance.measure()` | Custom timing in SW and content scripts | Add marks around key operations |
| `PerformanceObserver` | FCP, LCP in side panel | Standard web vitals API |

### 4.3 Storage Analysis

```javascript
// Check extension storage usage
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log(`Storage used: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
});

// Check IndexedDB usage (for screenshot blobs)
navigator.storage.estimate().then(estimate => {
  console.log(`IndexedDB quota: ${(estimate.quota / 1024 / 1024).toFixed(0)} MB`);
  console.log(`IndexedDB used: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB`);
});
```

### 4.4 Profiling Service Worker Startup

```javascript
// In service worker (background.ts)
const swStartTime = performance.now();

// At end of top-level initialization
console.log(`[perf] SW init: ${(performance.now() - swStartTime).toFixed(1)}ms`);

// After first event handler fires
chrome.runtime.onInstalled.addListener(() => {
  console.log(`[perf] SW ready: ${(performance.now() - swStartTime).toFixed(1)}ms`);
});
```

---

## 5. Optimization Strategies

### 5.1 Tree Shaking with WXT/Vite

- WXT uses Vite (Rollup for production), which provides excellent tree-shaking
- Real-world: WXT produces ~40-50% smaller bundles than Plasmo (700 KB -> 400 KB)
- Ensure all imports use ES module syntax (`import { specific } from 'lib'`, not `import * as lib`)
- Avoid barrel files (`index.ts` re-exports) that defeat tree-shaking
- Use `sideEffects: false` in `package.json` for libraries

### 5.2 Code Splitting for Extension Entry Points

WXT naturally creates separate entry points per extension context:
- `background.ts` -> service worker bundle
- `content.ts` -> content script bundle (keep minimal)
- `sidepanel/index.tsx` -> side panel bundle (can be larger)
- `popup/index.tsx` -> popup bundle (if used)

**Strategy for content script:**
```typescript
// content.ts - MINIMAL entry point (< 20 KB)
// Only sets up mutation observer and click listener
// Dynamically imports recording logic when recording starts

let recordingModule: typeof import('./recording') | null = null;

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === 'START_RECORDING') {
    recordingModule = await import('./recording');
    recordingModule.start();
  }
});
```

### 5.3 Screenshot Compression Strategy

**Capture pipeline:**
1. Capture: `chrome.tabs.captureVisibleTab(tabId, { format: 'jpeg', quality: 85 })`
   - Returns data URL (~150-400 KB per screenshot)
   - JPEG is fastest; quality 85 balances size and clarity
2. Process: Resize if viewport > 1920px wide (cap at 1920px width)
3. Store: Convert data URL to Blob, store in IndexedDB
   - Blob storage avoids base64 overhead (saves ~33% vs data URL strings)
4. Export: Optionally re-encode to WebP for smaller export files

**Resolution limits:**
- Max capture: 1920 x 1080 (scale down larger viewports)
- Thumbnail for side panel: 320 x 180 (< 10 KB each)
- Full resolution only loaded on demand (lazy loading)

### 5.4 Lazy Loading in Side Panel

- Initial render: show skeleton UI + recording controls only
- Step list: virtualized list (only render visible steps)
- Thumbnails: lazy-load with `IntersectionObserver`, use tiny placeholders
- Full screenshots: load on click/expand only
- Editor components (rich text, etc.): dynamic import on first use

### 5.5 Storage Quota Management

| Data | Storage | Retention | Limit |
|---|---|---|---|
| Active recording steps | IndexedDB (blobs) | Until export/discard | 200 steps max (~60 MB) |
| Recent recordings (metadata) | `chrome.storage.local` | 30 days | 10 MB default quota |
| User preferences | `chrome.storage.sync` | Permanent | 100 KB sync quota |
| Exported documents | User's filesystem (download) | N/A | No limit |

**Cleanup strategy:**
- Auto-purge recordings older than 30 days
- Warn user when approaching 80% of storage budget
- Provide manual "clear all data" option
- Monitor with `navigator.storage.estimate()` and `chrome.storage.local.getBytesInUse()`

---

## 6. Proposed Performance Budget for PRD

### Tier 1: Hard Requirements (Must Ship With)

| Metric | Target | Rationale |
|---|---|---|
| Extension package size | < 2 MB | Comparable to Scribe (1.93 MB); fast install |
| Content script injected size | < 50 KB | Minimal page load impact (< 50ms overhead) |
| Service worker cold start | < 200ms | User perceives < 200ms as instantaneous |
| Screenshot capture latency | < 300ms | Responsive feel during recording |
| Side panel initial load | < 1.5s FCP | Acceptable for panel open interaction |
| Memory idle | < 20 MB | Well below heavy extension range |
| Memory per recording step | < 1 MB | Supports 50+ steps without degradation |
| Export time (10 steps) | < 5s | User waits for result |

### Tier 2: Quality Targets (Should Achieve)

| Metric | Target | Rationale |
|---|---|---|
| Extension package size | < 1 MB | Top-tier lightweight extension |
| Content script injected size | < 20 KB | Near-zero page load impact |
| Service worker cold start | < 100ms | Imperceptible startup |
| Screenshot capture latency | < 150ms | Feels instant |
| Side panel FCP | < 500ms | Snappy UI |
| Memory idle | < 10 MB | Negligible footprint |
| Memory per recording step | < 500 KB | Supports 100+ steps |
| Export time (50 steps) | < 5s | Professional workflow speed |

### Tier 3: Aspirational (Differentiation)

| Metric | Target | Rationale |
|---|---|---|
| Extension package size | < 500 KB | Framework-only baseline |
| Content script page load impact | < 5ms | Undetectable |
| Zero-config lazy recording | Only inject content script when recording | No overhead on non-recorded pages |

---

## Key Takeaways

1. **Package size under 2 MB is the realistic target** -- Scribe achieves 1.93 MB with similar functionality. WXT's efficient bundling (400 KB baseline) gives us headroom.

2. **Content script must be tiny** -- Chrome recompiles extension scripts in every tab (no compilation cache). Every KB injected multiplies across all open tabs. Use dynamic imports to load recording logic on demand.

3. **JPEG quality 85 is the sweet spot for screenshots** -- fast capture, reasonable size (~200 KB per screenshot), good enough for SOPs with text.

4. **Store screenshots as Blobs in IndexedDB**, not as data URL strings in `chrome.storage.local` -- saves 33% from base64 encoding and avoids the 10 MB default storage quota.

5. **Service worker startup under 200ms is achievable** with a small entry point (< 50 KB) that registers listeners synchronously and lazy-loads everything else.

6. **Use `size-limit` in CI** to enforce per-entry-point budgets and catch regressions before they ship.

---

## Sources

- [Chrome Extension Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome Extension Performance Impact (DebugBear)](https://www.debugbear.com/blog/chrome-extensions-website-performance)
- [Academic Study: Impact of Extensions on Browser Performance (arXiv)](https://arxiv.org/html/2404.06827v1)
- [Minimize Extension Impact on Page Load (Microsoft Edge)](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/minimize-page-load-time-impact)
- [chrome.storage API Documentation](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [size-limit -- Performance Budget Tool](https://github.com/ai/size-limit)
- [WebP Image Format (Google)](https://developers.google.com/speed/webp)
- [WXT Framework Comparison (2025)](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Measuring Chrome Extension Performance (DebugBear)](https://www.debugbear.com/blog/measuring-the-performance-impact-of-chrome-extensions)
- [Chrome Extension Size Limits Discussion (GitHub)](https://github.com/GoogleChrome/developer.chrome.com/issues/5060)
- [Scribe Extension (crx4chrome)](https://www.crx4chrome.com/extensions/okfkdaglfjjjfefdcppliegebpoegaii/)
- [Screenity Extension (crx4chrome)](https://www.crx4chrome.com/crx/225305/)
