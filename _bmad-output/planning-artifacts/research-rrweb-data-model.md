# Research: rrweb vs Custom Internal Data Model for Full-Scope SOP Recorder

> **Date**: 2026-03-18
> **Context**: Re-evaluation of rrweb given the SOP Recorder's full aspirations beyond simple step documentation
> **Prior conclusion**: "rrweb is overkill for step-by-step SOPs" (see `technical-research.md` Section 4.1)

---

## 1. rrweb Deep Dive

### 1.1 What rrweb Captures

rrweb records **everything needed to reconstruct a visual session** as strictly-typed JSON events:

| Category | What's Captured | Event Type |
|----------|----------------|------------|
| **Full DOM Snapshot** | Complete serialized DOM tree at session start | `FullSnapshot (2)` |
| **DOM Mutations** | Node additions, removals, attribute changes, text changes | `IncrementalSnapshot (3)` → `Mutation` |
| **Mouse Movement** | Cursor X/Y coordinates (sampled/throttled) | `IncrementalSnapshot` → `MouseMove` |
| **Mouse Interactions** | Click, dblclick, contextmenu, focus, blur, touchstart/end | `IncrementalSnapshot` → `MouseInteraction` |
| **Scroll** | Scroll position changes (throttled) | `IncrementalSnapshot` → `Scroll` |
| **Viewport Resize** | Window dimension changes | `IncrementalSnapshot` → `ViewportResize` |
| **Form Inputs** | All input value changes | `IncrementalSnapshot` → `Input` |
| **Touch Events** | Mobile touch tracking | `IncrementalSnapshot` → `TouchMove` |
| **Media** | Audio/video play/pause/seek | `IncrementalSnapshot` → `MediaInteraction` |
| **CSS Changes** | Stylesheet rule modifications | `IncrementalSnapshot` → `StyleSheetRule`, `StyleDeclaration` |
| **Canvas** | Canvas drawing operations (opt-in) | `IncrementalSnapshot` → `CanvasMutation` |
| **Fonts** | Font resource loading | `IncrementalSnapshot` → `Font` |
| **Console Logs** | Console output (plugin) | `IncrementalSnapshot` → `Log` |
| **Selection** | Text selection ranges | `IncrementalSnapshot` → `Selection` |
| **Page Metadata** | URL, viewport dimensions | `Meta (4)` |

**What rrweb does NOT capture:**
- Network requests/responses
- JavaScript execution or runtime state
- localStorage/sessionStorage changes
- Cookie changes
- Performance metrics
- Element-level screenshots (it reconstructs visuals from DOM)

### 1.2 Data Format / Event Schema

Every rrweb event follows this structure:

```typescript
interface eventWithTime {
  type: EventType;      // 0-6 numeric enum
  data: EventData;      // varies by type
  timestamp: number;    // Unix ms
}

enum EventType {
  DomContentLoaded = 0,
  Load = 1,
  FullSnapshot = 2,
  IncrementalSnapshot = 3,
  Meta = 4,
  Custom = 5,
  Plugin = 6,
}

enum IncrementalSource {
  Mutation = 0,
  MouseMove = 1,
  MouseInteraction = 2,
  Scroll = 3,
  ViewportResize = 4,
  Input = 5,
  TouchMove = 6,
  MediaInteraction = 7,
  StyleSheetRule = 8,
  CanvasMutation = 9,
  Font = 10,
  Log = 11,
  Drag = 12,
  StyleDeclaration = 13,
  Selection = 14,
  AdoptedStyleSheet = 15,
  CustomElement = 16,
}
```

Serialized DOM nodes use a custom format:

```typescript
interface serializedElementNode {
  type: NodeType;       // Document, Element, Text, etc.
  id: number;           // unique identifier for the node
  tagName: string;
  attributes: Record<string, string>;
  childNodes: serializedNode[];
}
```

### 1.3 Bundle Size

rrweb is modular. Packages can be used independently:

| Package | Purpose | Estimated Gzipped Size |
|---------|---------|----------------------|
| `@rrweb/record` | Recording only | ~40-50 KB gzipped |
| `@rrweb/replay` | Playback UI | ~30-40 KB gzipped |
| `rrweb-snapshot` | DOM serialization/rebuild | ~15 KB gzipped (included in record) |
| `@rrweb/packer` | fflate-based compression | ~10 KB gzipped |
| `rrweb` (full) | Record + replay + all | ~80-90 KB gzipped |

**Sentry's experience** (most informative real-world data):
- rrweb 2.0 baseline in their SDK: ~84 KB min+gzip (full SDK including error monitoring)
- After aggressive tree-shaking: ~55 KB (35% reduction)
- Removing iframe/shadow DOM support saves ~5 KB
- Removing compression worker saves ~10 KB
- Canvas recording removal saves additional significant amount

**For our Chrome extension**: We would only need `@rrweb/record` (~40-50 KB gzipped). Compare to our custom event listeners approach: ~0 KB (native APIs).

### 1.4 Selective Use (Record Only, Without Replay)

Yes, rrweb is designed for this:

```bash
npm install @rrweb/record   # record only, no replay
```

```typescript
import { record } from '@rrweb/record';

const stopFn = record({
  emit(event) {
    // Store event — that's it
  },
});
```

The `@rrweb/record` package works independently without `@rrweb/replay`.

### 1.5 rrweb-snapshot

The snapshot module handles two operations:
1. **Snapshot**: Traverses the DOM and produces a serializable tree with unique IDs. During serialization it:
   - Inlines element state (e.g., input values) into attributes
   - Converts `<script>` to `<noscript>` to prevent execution on replay
   - Inlines stylesheets for portability
   - Converts relative paths to absolute paths
   - Assigns unique integer IDs to every node

2. **Rebuild**: Reconstructs DOM from the snapshot data. Adds `data-rrid` attributes for identification.

### 1.6 Performance Overhead

Based on benchmarks from the Highlight.io/LaunchDarkly session replay performance study (using rrweb):

| Metric | Without Recording | With rrweb Recording | Overhead |
|--------|------------------|---------------------|----------|
| **CPU usage** | baseline | +21% to +25% | Scales with DOM complexity |
| **Memory** | baseline | +6 MB (simple) to +60 MB (complex) | Depends on DOM mutation volume |
| **Interaction latency** | baseline | +0.017s (simple) to +0.07s (complex) | Per user interaction |
| **INP** | baseline | Still under 200ms threshold | Not user-perceptible in most cases |

**Key insight**: Overhead scales with DOM complexity and mutation frequency. For SOP recording (user clicking through steps), overhead would be on the lower end since activity is discrete, not continuous.

### 1.7 Storage Requirements

| Data Type | Typical Size |
|-----------|-------------|
| Initial full DOM snapshot | ~100-270 KB (depends on page complexity) |
| Average incremental event payload | ~0.5-13 KB per event batch |
| Mouse movement (sampled) | ~2-3 KB per batch |
| Click event | ~0.5-1 KB |
| DOM mutation | ~1-13 KB (depends on change size) |
| Per minute (active interaction) | ~50-500 KB (highly variable) |
| Per minute (idle page) | ~1-5 KB |

**Compression**: Session-level compression (deflate/gzip) typically achieves 5-10x reduction. The `@rrweb/packer` uses fflate for per-event compression, but session-level compression is more efficient.

**For SOP recording** (discrete steps, not continuous): A typical 20-step SOP would generate roughly:
- 1 initial snapshot: ~200 KB
- 20 click events + surrounding mutations: ~100-200 KB
- Mouse movements (if recorded): ~50-100 KB
- **Total uncompressed: ~350-500 KB** for a complete SOP session
- **Compressed: ~50-100 KB**

Compare to custom approach: 20 steps x (~50 KB screenshot + 1 KB metadata) = ~1 MB (dominated by screenshots).

---

## 2. rrweb for Our Use Cases

### 2.1 Post-Processing into Discrete Steps

**Can rrweb events be filtered to extract "steps"?** Yes.

rrweb's `IncrementalSnapshot` events with `source: MouseInteraction` contain click data with the target node ID. The pipeline would be:

1. Filter events for `type === IncrementalSnapshot && data.source === MouseInteraction`
2. For each click, look up the node ID in the full snapshot tree to get element metadata
3. Extract surrounding mutation events to understand what changed after the click
4. Map timestamps to step sequence

This is exactly what Decipher (getdecipher.com) does — they summarize rrweb sessions using LLMs by extracting click events and correlating them with DOM state.

**Limitation**: rrweb does not capture screenshots. It captures DOM state. To get a visual, you must either:
- Use rrweb's replay to reconstruct the DOM and then screenshot it (headless)
- Capture screenshots separately alongside rrweb events

### 2.2 Generating Screenshots from rrweb Data After the Fact

**Theoretically possible, practically complex.** The approach would be:

1. Record rrweb events during the session
2. Later, use `rrdom-nodejs` + a headless browser to replay events
3. At each "step" point, take a screenshot of the reconstructed DOM

**Challenges**:
- External resources (images, fonts, APIs) may not be available at replay time
- Dynamic content (fetched data, auth-gated content) won't reproduce
- CSS that depends on viewport, media queries, etc. may differ
- This requires a server-side component or offscreen document

**Verdict**: Not reliable for SOP documentation. Screenshots should be captured at recording time using `chrome.tabs.captureVisibleTab()`.

### 2.3 Tour Format Generation

**Can rrweb data feed into GuideChimp/Driver.js/Shepherd.js tour configs?** Yes, with post-processing:

Tour libraries need: `{ element: "selector", title: "...", description: "..." }`

From rrweb data we can extract:
- **Element selector**: rrweb serializes nodes with `tagName`, `attributes` (including `id`, `class`, `data-*`). From these, CSS selectors can be generated. However, rrweb's node format is optimized for replay (integer IDs), not for generating robust CSS selectors. We'd need to reconstruct selectors from the serialized node attributes.
- **Step sequence**: From click event timestamps
- **Page URL**: From meta events

**Gap**: rrweb doesn't generate CSS selectors in the format tour libraries expect. We'd still need our own selector generation logic (the existing priority chain: id → data-testid → aria-label → tag+attributes → nth-of-type).

### 2.4 Playwright/Cypress Test Generation

**The `rrweb-browser-test` npm package exists** for exactly this — it converts rrweb event JSON into test scripts for Playwright, Puppeteer, Cypress, and Selenium.

```typescript
import { generateBrowserTests, TestFramework } from 'rrweb-browser-test';

const testCode = generateBrowserTests(events, {
  framework: TestFramework.PLAYWRIGHT,
}).toCode();
```

**Caveats**:
- The package has low maintenance activity (last release over a year ago)
- Generated selectors may not be robust (rrweb uses node IDs, not CSS selectors)
- Real-world test generation usually requires human refinement
- Our custom `RecordedStep[]` with explicit selectors would produce **better** test scripts because the selectors are purpose-built for element identification

### 2.5 Video-Like Replay

**Yes — this is rrweb's primary strength.** The `@rrweb/replay` package or `rrweb-player` can play back recorded sessions as a video-like experience with:
- Timeline scrubbing
- Playback speed control
- Mouse cursor visualization
- Interaction highlighting

This requires the full replay bundle (~30-40 KB additional) and a DOM container to render into.

**Alternative for our use case**: A screenshot slideshow (using our captured screenshots) is simpler, smaller, and doesn't require rrweb replay infrastructure. It lacks smooth transitions but meets the "video-like" requirement with far less complexity.

### 2.6 Element Metadata for Selector Generation

rrweb serializes elements with:
- `tagName`
- `attributes` (including `id`, `class`, `data-testid`, `aria-label`, `href`, `type`, etc.)
- `childNodes` (full subtree)
- Unique integer `id` (rrweb-internal, not the DOM `id` attribute)

**What's missing for selector generation**:
- No computed CSS selector path
- No XPath
- No `textContent` of the element (only child text nodes)
- No bounding box / position data
- No visibility/display state

**Verdict**: rrweb captures raw material for selector generation but doesn't do it. Our custom approach, where we generate selectors at capture time with access to the live DOM, produces **higher quality selectors** than post-processing rrweb's serialized nodes.

---

## 3. Custom RecordedStep[] Model Analysis

### 3.1 Proposed Model

```typescript
interface RecordedStep {
  timestamp: number;
  action: 'click' | 'input' | 'navigate' | 'select' | 'scroll' | 'submit';
  target: {
    ref: string;            // human-readable reference
    selector: string;       // CSS selector for automation
    name: string;           // element name/label
    tagName: string;        // HTML tag
    attributes?: Record<string, string>;  // relevant attributes
    boundingBox?: DOMRect;  // position for tour overlays
  };
  value?: string;           // input value, selected option, URL
  screenshot: string;       // base64 data URL or blob reference
  pageTitle: string;
  pageUrl: string;
}
```

### 3.2 What Custom Model Captures That rrweb Doesn't

| Feature | Custom Model | rrweb |
|---------|-------------|-------|
| **Screenshot at exact moment** | Yes (via `captureVisibleTab`) | No (reconstructs from DOM) |
| **Pre-computed CSS selector** | Yes (generated at capture time) | No (must derive from node attributes) |
| **Human-readable step name** | Yes (`target.ref`, `target.name`) | No (raw node data only) |
| **Bounding box for overlays** | Yes (via `getBoundingClientRect`) | No |
| **Semantic action type** | Yes (typed union) | Implicit (must interpret from event type) |
| **Step-level granularity** | Native | Must be derived from continuous stream |

### 3.3 What rrweb Captures That Custom Model Doesn't

| Feature | rrweb | Custom Model |
|---------|-------|-------------|
| **Between-step DOM state** | Full mutation log | Nothing |
| **Mouse movement paths** | Continuous tracking | Nothing |
| **Scroll behavior** | Continuous | Only if scroll is a "step" |
| **Full page DOM tree** | Complete serialized DOM | Nothing (only target element) |
| **CSS state over time** | StyleSheet mutations | Nothing |
| **Form input history** | Every keystroke/change | Only final value |
| **Page lifecycle** | Load, DOMContentLoaded | Only navigation events |
| **Visual replay** | Full session reconstruction | Screenshot slideshow only |
| **Canvas content** | Drawing operations (opt-in) | Nothing |

### 3.4 Best-of-Both Assessment

**Can rrweb be the capture engine with RecordedStep[] as derived output?**

Yes, architecturally:

```
[rrweb record] → raw events → [post-processor] → RecordedStep[]
                                                 ↘ raw events (stored for replay)
```

The post-processor would:
1. Filter for `MouseInteraction` (click) and `Input` events
2. Look up target node in snapshot tree → extract tagName, attributes
3. Generate CSS selector from node attributes (still need custom logic)
4. Take screenshot via `captureVisibleTab()` at each step (still needed separately)
5. Derive human-readable name from element attributes

**The uncomfortable truth**: The post-processor would need to do almost everything our custom capture already does, except it would work with rrweb's node representation instead of the live DOM. And we'd STILL need `captureVisibleTab()` for screenshots since rrweb can't provide those.

---

## 4. Hybrid Architecture Analysis

### 4.1 Architecture Options

**Option A: Custom-Only (Recommended for MVP)**
```
Content Script → Event Listeners → RecordedStep[]
                                  → captureVisibleTab() for screenshots
```

**Option B: rrweb-Only**
```
Content Script → @rrweb/record → raw events
                                → post-process to RecordedStep[] (lossy)
                                → still need captureVisibleTab() for screenshots
```

**Option C: Hybrid (both running)**
```
Content Script → Event Listeners → RecordedStep[] (primary)
              → @rrweb/record → raw events (secondary, for replay)
              → captureVisibleTab() for screenshots
```

### 4.2 Cost/Benefit Analysis

| Factor | Custom Only | rrweb Only | Hybrid |
|--------|-----------|-----------|--------|
| **Bundle size** | ~0 KB | ~40-50 KB gzipped | ~40-50 KB gzipped |
| **Memory overhead** | Minimal | +6-60 MB | +6-60 MB |
| **CPU overhead** | Minimal | +21-25% | +21-25% |
| **Implementation complexity** | Low | High (post-processing) | Medium-High |
| **Screenshot quality** | Native (`captureVisibleTab`) | Must add separately | Native |
| **Selector quality** | High (live DOM) | Medium (from serialized attrs) | High |
| **SOP export** | Excellent | Needs processing | Excellent |
| **Tour export** | Excellent | Needs processing | Excellent |
| **Replay/video** | Screenshot slideshow only | Full visual replay | Full visual replay |
| **Test generation** | Good (direct selectors) | Exists (`rrweb-browser-test`) | Best of both |
| **Data storage** | ~1 MB/20 steps (screenshot-dominated) | ~50-500 KB session + screenshots | ~1.5 MB/20 steps |
| **Migration path** | Add rrweb later as opt-in | Hard to simplify later | Already complex |

### 4.3 Is There an "rrweb Lite"?

No official "rrweb lite" exists. However, rrweb's sampling config can minimize data:

```typescript
record({
  sampling: {
    mousemove: false,          // disable mouse tracking
    mouseInteraction: false,   // we handle clicks ourselves
    scroll: 150,               // throttle to 150ms
    media: 800,                // throttle media events
    input: 'last',             // only record final input value
  },
  // ... still records DOM mutations and snapshots
});
```

Even with aggressive sampling, rrweb still records the full initial DOM snapshot (~100-270 KB) and all DOM mutations. There's no way to tell rrweb "only record click events" — that defeats its purpose.

**Alternative minimal approach**: Use `MutationObserver` directly (0 KB, native API) if we need to track DOM changes between steps in the future.

---

## 5. Alternative Recording Libraries

### 5.1 Session Replay Platforms (All Use rrweb Under the Hood)

| Platform | Relationship to rrweb | Relevance |
|----------|----------------------|-----------|
| **PostHog** | Uses rrweb fork internally | Full analytics platform, not embeddable as library |
| **Sentry Replay** | Uses rrweb 2.0 with heavy customization | Error monitoring focused, not for SOP capture |
| **OpenReplay** | Custom recording engine (not rrweb) | Open-source, self-hosted; still a full platform, not a library |
| **Highlight.io** | Used rrweb; acquired by LaunchDarkly (March 2025) | No longer recommended for new deployments |

**Key insight**: All major session replay platforms either use rrweb or build custom equivalents. None provide a "step-based recording" library — they all do continuous session capture.

### 5.2 Step-Based Recording Tools (Closer to Our Use Case)

| Tool | Approach | Open Source? | Relevant? |
|------|----------|-------------|-----------|
| **DeploySentinel Recorder** | Chrome extension that generates Playwright/Cypress/Puppeteer scripts from interactions | Yes (GitHub) | Very relevant — does click-to-test-script |
| **Playwright Codegen** | Records interactions and generates Playwright test scripts | Yes (part of Playwright) | Relevant for test generation, not SOP |
| **Chrome DevTools Recorder** | Records user flows as JSON, exports to Playwright/Puppeteer | Built into Chrome | Relevant pattern but not embeddable |
| **Scribe / Tango** | SOP documentation from browser actions | No (SaaS) | Direct competitors; closed source |

### 5.3 Patterns Worth Borrowing

**From DeploySentinel Recorder**: Their approach is closest to what we need — they listen for DOM events, capture element metadata, and generate test scripts. No rrweb involved. They use:
- Click/input/navigation event listeners
- Element selector generation at capture time
- Step-by-step output (not continuous replay)

**From Chrome DevTools Recorder**: Uses a JSON-based step format:
```json
{
  "type": "click",
  "target": "main",
  "selectors": [["#submit-btn"], ["xpath/...", "pierce/..."]],
  "offsetX": 10,
  "offsetY": 15
}
```
Multiple selector strategies per element — a pattern we should adopt.

---

## 6. Data Model Comparison Table

| Feature | Custom RecordedStep[] | rrweb Raw Events | Hybrid (Both) |
|---------|----------------------|------------------|---------------|
| **Bundle size impact** | 0 KB (native APIs) | ~40-50 KB gzipped | ~40-50 KB gzipped |
| **Data per step** | ~50 KB (screenshot-dominated) | ~1-13 KB (no screenshot) | ~60 KB |
| **Data per session (20 steps)** | ~1 MB | ~350-500 KB + screenshots | ~1.5 MB |
| **SOP markdown export** | Excellent (direct mapping) | Needs post-processing | Excellent |
| **Tour export (GuideChimp etc.)** | Excellent (selectors + boundingBox ready) | Needs selector derivation | Excellent |
| **Interactive replay/video** | Screenshot slideshow only | Full DOM replay | Full DOM replay + screenshots |
| **Test script generation** | Good (selectors ready) | Exists (rrweb-browser-test, low quality) | Best (both approaches) |
| **Claude shortcut export** | Excellent (action + selector direct) | Needs processing | Excellent |
| **Selector quality** | High (live DOM access) | Medium (serialized attributes) | High |
| **Notion/Confluence export** | Excellent (structured steps) | Needs processing | Excellent |
| **Capture complexity** | Low (event listeners) | Low (rrweb handles it) | Medium (two systems) |
| **Processing complexity** | Low (already structured) | High (extract steps from stream) | Medium |
| **Future extensibility** | Add features incrementally | Rich data, extract what you need | Maximum flexibility |
| **Performance overhead** | Minimal | +21-25% CPU, +6-60 MB RAM | Same as rrweb |

---

## 7. Recommendation

### 7.1 For MVP: Custom RecordedStep[] Only

**Strong recommendation.** Rationale:

1. **Every primary export (SOP, tour, Claude shortcut, Notion)** maps directly from `RecordedStep[]` without transformation. rrweb would add a translation layer with no benefit for these use cases.

2. **Screenshots are mandatory** for SOP documentation, and rrweb cannot provide them. We need `captureVisibleTab()` regardless. This means rrweb would be a second recording system running in parallel, not a replacement.

3. **Selector quality matters** for tour export and test generation. Live DOM access at capture time produces superior selectors vs. post-processing rrweb's serialized node attributes.

4. **Bundle size**: 0 KB vs 40-50 KB. In a Chrome extension where every KB affects install/load time, this matters.

5. **Complexity**: One system (event listeners → steps) is simpler to debug, test, and maintain than two parallel recording systems.

### 7.2 For Full Vision: Custom RecordedStep[] + Optional rrweb Layer

When the product needs interactive replay or video-like playback (post-MVP):

1. **Add `@rrweb/record` as an opt-in enhancement** — users who want replay/video features enable it; others keep the lightweight experience.

2. **Architecture**:
   ```
   RecordedStep[] remains the primary data model (always captured)
   rrweb events are supplementary data (opt-in, stored alongside steps)
   ```

3. **rrweb events would only be used for**: Session replay video, smooth transition animations between screenshots, richer debugging context.

4. **rrweb events would NOT replace RecordedStep[]** for: SOP export, tour generation, test scripts, Claude shortcuts, Notion/Confluence export.

### 7.3 Migration Path: Simple to rrweb Without Breaking Changes

The migration path is clean because `RecordedStep[]` is the canonical model:

| Phase | Data Model | rrweb | Impact |
|-------|-----------|-------|--------|
| **MVP** | `RecordedStep[]` only | None | Zero overhead |
| **v2** | `RecordedStep[]` + optional rrweb | `@rrweb/record` added | No changes to existing exports |
| **v3** | `RecordedStep[]` + rrweb + replay | `@rrweb/replay` added for video | New export option, existing exports unchanged |

**Key design principle**: All exports should depend on `RecordedStep[]`, never on rrweb events directly. rrweb is an enhancement layer, not a foundation.

### 7.4 Recommended RecordedStep[] Enhancements

Based on this research, the custom model should be enriched to future-proof it:

```typescript
interface RecordedStep {
  id: string;                  // UUID for stable references
  timestamp: number;
  action: StepAction;
  target: {
    selectors: string[];       // Multiple selector strategies (CSS, XPath, text)
    ref: string;               // Human-readable reference
    tagName: string;
    attributes: Record<string, string>;
    boundingBox: { x: number; y: number; width: number; height: number };
    innerText?: string;        // Visible text content (truncated)
  };
  value?: string;
  screenshot: string;          // base64 or blob reference
  page: {
    url: string;
    title: string;
  };
  metadata?: {
    viewport: { width: number; height: number };
    scrollPosition: { x: number; y: number };
    timing: {
      domSettleDelay: number;  // ms waited before screenshot
    };
  };
}

type StepAction = 'click' | 'dblclick' | 'input' | 'select' | 'check' |
                  'navigate' | 'scroll' | 'submit' | 'hover' | 'dragdrop' |
                  'keypress' | 'upload';
```

Additions vs. the previous model:
- **Multiple selectors** (borrowed from Chrome DevTools Recorder pattern) — improves test generation and tour robustness
- **Bounding box** — required for tour overlay positioning
- **Viewport and scroll position** — needed for accurate replay/tour placement
- **innerText** — useful for human-readable step descriptions and LLM processing
- **Richer action types** — covers more interaction patterns for test generation

---

## Sources

- [rrweb Event Types Documentation](https://github.com/rrweb-io/rrweb/blob/master/docs/recipes/dive-into-event.md)
- [rrweb TypeScript Type Definitions](https://github.com/rrweb-io/rrweb/blob/master/packages/types/src/index.ts)
- [rrweb Guide (API and Configuration)](https://github.com/rrweb-io/rrweb/blob/master/guide.md)
- [rrweb Storage Optimization](https://github.com/rrweb-io/rrweb/blob/master/docs/recipes/optimize-storage.md)
- [rrweb-snapshot Module](https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-snapshot)
- [Sentry: How We Reduced Replay SDK Bundle Size by 35%](https://sentry.engineering/blog/session-replay-sdk-bundle-size-optimizations)
- [Session Replay Performance Benchmark (Highlight.io/LaunchDarkly)](https://launchdarkly.com/docs/tutorials/session-replay-performance)
- [What is rrweb? (Earl Potters)](https://slyracoon23.github.io/blog/posts/2025-03-14_what_is_rrweb.html)
- [How Decipher Summarizes rrweb Sessions Using LLMs](https://getdecipher.com/blog/generating-rrwb-session-summaries)
- [PostHog Session Replay Architecture](https://posthog.com/handbook/engineering/session-replay/session-replay-architecture)
- [rrweb-browser-test (npm)](https://socket.dev/npm/package/rrweb-browser-test)
- [DeploySentinel Recorder (GitHub)](https://github.com/DeploySentinel/Recorder)
- [Exploring rrweb (Medium)](https://medium.com/@idogolan15/exploring-rrweb-a-session-replay-walkthrough-and-best-practices-47a52f0e2447)
- [OpenReplay: Open-Source Session Replay Tools](https://blog.openreplay.com/open-source-session-replay-tools/)
- [PostHog: Session Recording Performance Benchmarks](https://posthog.com/blog/session-recording-performance)
