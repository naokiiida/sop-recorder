# GuideChimp Tour Format & Interactive Onboarding/Tutorial Research

> **Date**: 2026-03-18
> **Scope**: Tour format analysis, library comparison, SOP-to-tour conversion feasibility
> **Sources**: GuideChimp Chrome Extension source (local clone), GuideChimp-tours repo, library docs

---

## 1. GuideChimp Tour JSON Format

### 1.1 Tour File Structure

GuideChimp tours are JSON files keyed by **URL path pattern** (regex-capable). The Chrome extension fetches `{BASE_URL}/{hostname}.json` for the current site, falling back to `_default.json`.

```json
{
    "/path-regex/.*": [
        {
            "element": "#css-selector",
            "title": "Step Title",
            "description": "HTML content <b>supported</b>",
            "position": "bottom"
        },
        {
            "title": "No element = floating center tooltip",
            "description": "Steps without 'element' show as centered overlays"
        }
    ],
    "/another-path/": [
        { "element": ".class-selector", "title": "...", "description": "..." }
    ]
}
```

**Key architectural detail**: The outer keys are path regexes tested against `urlPieces.pathname`. Multiple paths can have different tours within a single hostname file.

### 1.2 Complete Step Schema

Extracted from GuideChimp v5.0.0 source code (`start.js`):

```typescript
interface GuideChimpStep {
    // --- Core ---
    element?: string | HTMLElement;     // CSS selector or DOM element
    step?: number;                       // Step ordering number (auto-assigned if omitted)
    title?: string;                      // Step heading (default: '')
    description?: string;                // Step body, supports HTML (default: '')

    // --- Positioning ---
    position?: 'top' | 'bottom' | 'left' | 'right' | 'floating';
    // 'floating' = centered overlay (auto-selected if element not found)

    // --- Behavior ---
    interaction?: boolean;              // Allow clicking highlighted element (default: true)
    scrollPadding?: number;             // Override global scroll padding
    scrollBehavior?: 'auto' | 'smooth'; // Override global scroll behavior

    // --- Pagination ---
    pagination?: {
        theme: 'circles' | 'numbers';
        circles: { maxItems: number };
        numbers: { delimiter: string; visibleSteps: number };
    };

    // --- Custom Buttons ---
    buttons?: Array<{
        title?: string;                 // Button label
        tagName?: string;               // HTML tag (default: 'button')
        class?: string;                 // CSS class
        onClick?: (event: Event) => void;  // Click handler
    }>;

    // --- Lifecycle Callbacks (JS only, not JSON) ---
    onBeforeChange?: (toStep, fromStep, ...args) => void | Promise<boolean>;
    onAfterChange?: (toStep, fromStep, ...args) => void;
}
```

### 1.3 Global Options Schema

```typescript
interface GuideChimpOptions {
    position: 'top' | 'bottom' | 'left' | 'right';  // default: 'bottom'
    useKeyboard: boolean;           // default: true
    exitEscape: boolean;            // default: true
    exitOverlay: boolean;           // default: true
    showPagination: boolean;        // default: true
    showNavigation: boolean;        // default: true
    showProgressbar: boolean;       // default: true
    interaction: boolean;           // default: true (allow clicking highlighted element)
    padding: number;                // default: 8 (px between element and tooltip)
    scrollPadding: number;          // default: 10
    scrollBehavior: 'auto' | 'smooth';  // default: 'auto'
    templates: {                    // Override HTML templates for every UI part
        overlay, tooltip, progressbar, title, description,
        customButtons, pagination, notification, fakeStep,
        control, interaction, preloader, close, copyright,
        previous, next
    };
}
```

### 1.4 Element Targeting

From source analysis:

- **CSS selectors**: `document.querySelector(selector)` -- any valid CSS selector
- **HTML elements**: Direct DOM element references (JS API only)
- **Data attributes**: `data-guidechimp-tour="tourName"` on HTML elements for declarative tours
- **No XPath support**
- **No custom attribute targeting** (beyond CSS attribute selectors like `[data-key='value']`)
- **Fallback behavior**: If element not found, hidden, or `display:none`, a "fake step" (centered overlay) is mounted

### 1.5 Multi-Page Tours

GuideChimp handles multi-page tours via two mechanisms:

1. **Extension approach (JSON)**: Each hostname JSON file maps path patterns to step arrays. Different pages get different tours automatically. This is per-page, not cross-page navigation.

2. **MultiPage plugin (commercial)**: Enables defining page URLs within step definitions for single tours that span pages. The plugin handles navigation between pages and tour state persistence.

3. **VueJS Router plugin**: For SPAs, triggers tour steps on route changes.

### 1.6 Events System

```
onStart          -- Tour begins
onStop           -- Tour terminated (by user or programmatically)
onComplete       -- Tour finished (reached last step)
onBeforeChange   -- Before step transition (return false to cancel)
onAfterChange    -- After step transition complete
onPrevious       -- Before going to previous step
onNext           -- Before going to next step
```

Event listener priorities: `low`, `medium`, `high`, `critical`

### 1.7 Plugin Architecture

```javascript
GuideChimp.extend = function(plugin, ...args) {
    if (!GuideChimp.plugins.has(plugin)) {
        GuideChimp.plugins.add(plugin);
        plugin(GuideChimp, guideChimp, ...args);
    }
};
```

Available plugins:
| Plugin | Type | Description |
|--------|------|-------------|
| Beacons | Open Source | Add hotspots/hints to elements |
| Blurred Overlay | Open Source | Blurred background effect |
| Lazy Loading | Open Source | Wait for delayed elements |
| VueJS Router | Open Source | Tour on Vue.js route changes |
| MultiPage | Commercial | Cross-page tour navigation |
| Placeholders | Commercial | Dynamic content in step definitions |
| Triggers | Commercial | Fire events on DOM element events |
| Google Analytics | Commercial | Track tour events |
| IFrames | Commercial | Highlight elements in nested iframes |
| Remove Attribution | Commercial | Remove "Made with GuideChimp" |

---

## 2. Competing Tour Libraries — Format Comparison

### 2.1 Driver.js

**GitHub**: 25.5k stars | **License**: MIT | **Size**: ~5kb gzipped | **Zero dependencies**

```typescript
interface DriveStep {
    element?: Element | string | (() => Element);
    popover?: {
        title?: string;
        description?: string;
        side?: 'top' | 'right' | 'bottom' | 'left';
        align?: 'start' | 'center' | 'end';
        showButtons?: ('next' | 'previous' | 'close')[];
        disableButtons?: ('next' | 'previous' | 'close')[];
        nextBtnText?: string;
        prevBtnText?: string;
        doneBtnText?: string;
        showProgress?: boolean;
        progressText?: string;
        popoverClass?: string;
        onPopoverRender?: (popover, options) => void;
        onNextClick?: (element, step, options) => void;
        onPrevClick?: (element, step, options) => void;
        onCloseClick?: (element, step, options) => void;
    };
    disableActiveInteraction?: boolean;
    onDeselected?: (element, step, options) => void;
    onHighlightStarted?: (element, step, options) => void;
    onHighlighted?: (element, step, options) => void;
}
```

**Global config**: `animate`, `overlayColor`, `overlayOpacity`, `stagePadding`, `stageRadius`, `popoverOffset`, `allowKeyboardControl`, `overlayClickBehavior`

**Strengths**: Smallest, fastest, MIT license, TypeScript-first, most modern API. Excellent for lightweight tours.

### 2.2 Shepherd.js

**License**: AGPL-3.0 / Commercial dual-license

```typescript
interface ShepherdStep {
    id?: string;
    title?: string;
    text?: string;                      // Body content (HTML or string)
    attachTo?: {
        element: string;                // CSS selector
        on: 'top' | 'bottom' | 'left' | 'right';
    };
    buttons?: Array<{
        text: string;
        action: () => void;
        classes?: string;
    }>;
    scrollTo?: {
        behavior: 'smooth' | 'auto';
        block: 'center' | 'start' | 'end' | 'nearest';
    };
    when?: {                            // Lifecycle hooks
        show?: () => void;
        hide?: () => void;
    };
    advanceOn?: {                       // Auto-advance trigger
        selector: string;
        event: string;                  // e.g., 'click'
    };
    cancelIcon?: { enabled: boolean };
    classes?: string;
}
```

**Strengths**: Most full-featured, `advanceOn` enables interactive tutorials (advance when user clicks specific elements), framework wrappers for React/Vue/Angular/Ember. DAP (Digital Adoption Platform) positioning.

**Weakness**: AGPL license for open-source use; commercial license for revenue-generating products.

### 2.3 Intro.js

**License**: AGPLv3 / Commercial | **GitHub**: 8.4k+ dependents

```html
<!-- Declarative approach -->
<div data-intro="Step description" data-step="1">Target element</div>
```

```javascript
// Programmatic approach
introJs().setOptions({
    steps: [{
        element: '#step1',
        intro: 'Description text',
        position: 'bottom'
    }]
}).start();
```

**Strengths**: Simplest API, well-established. **Weakness**: AGPLv3, older architecture, less flexible than modern alternatives.

### 2.4 Format Comparison Matrix

| Feature | GuideChimp | Driver.js | Shepherd.js | Intro.js |
|---------|-----------|-----------|-------------|----------|
| Step element | `element` (CSS) | `element` (CSS/DOM/fn) | `attachTo.element` (CSS) | `element` (CSS) |
| Title | `title` | `popover.title` | `title` | N/A |
| Description | `description` | `popover.description` | `text` | `intro` |
| Position | `position` | `popover.side` + `popover.align` | `attachTo.on` | `position` |
| Custom buttons | `buttons[]` | `showButtons[]` | `buttons[]` | Limited |
| Interaction control | `interaction` | `disableActiveInteraction` | N/A | N/A |
| Auto-advance | N/A (Triggers plugin) | `onNextClick` override | `advanceOn` | N/A |
| HTML data attrs | Yes | No | No | Yes |
| JSON-serializable | Partial (no callbacks) | Partial | Partial | Partial |
| Multi-page | Plugin (commercial) | N/A | N/A | N/A |
| Overlay | SVG path cutout | SVG overlay | Floating UI | CSS overlay |
| License | EUPL-1.2/Commercial | MIT | AGPL/Commercial | AGPL/Commercial |

### 2.5 SaaS Equivalents

| Platform | Model | Tour Format | Key Differentiator |
|----------|-------|-------------|-------------------|
| Appcues | SaaS ($249+/mo) | Proprietary visual builder | No-code, targeting by URL + selectors |
| Pendo | SaaS (custom pricing) | Proprietary | Analytics-first, retroactive tagging |
| Product Fruits | SaaS ($79+/mo) | Proprietary visual builder | Checklist + tour combos |
| WalkMe | Enterprise SaaS | Proprietary DAP | Enterprise-grade, accessibility focus |
| Whatfix | Enterprise SaaS | Proprietary DAP | Content + analytics platform |

All SaaS platforms use proprietary formats with visual builders. None expose a standard interchange format.

---

## 3. SOP-to-Tour Format Conversion

### 3.1 Can an SOP Recording Be Converted to a Tour?

**Yes, with high fidelity.** An SOP recording captures most data needed for a tour:

| SOP Data Point | Tour Equivalent | Gap? |
|---------------|----------------|------|
| Clicked element selector | `element` / `attachTo` | No gap |
| Step title/description | `title` / `description` | No gap (AI-enhanced) |
| Screenshot | Not used in tours (but could be shown in description as `<img>`) | Different use |
| Page URL | Path-based tour routing | No gap |
| Action type (click/input/nav) | Could drive `advanceOn` or `interaction` | Minor enrichment needed |
| Input value | Could pre-fill form guidance | Needs capture of field context |

### 3.2 Additional Data Needed for Tour Support

To enable SOP-to-tour conversion, the recorder should additionally capture:

1. **Element bounding rect** — For positioning hints (`position` field)
2. **Viewport dimensions** — For responsive tour positioning
3. **Element visibility state** — Whether element is in viewport, scrolled, lazy-loaded
4. **Scroll position** — For `scrollTo` configuration
5. **DOM context** — Parent container, whether element is in iframe, shadow DOM
6. **Action intent** — Is this a "look at" step or a "do this" step? (determines `interaction` flag)
7. **Wait conditions** — Did the page load new content? (for `onBeforeChange` wait logic)
8. **Multiple selectors** — Fallback selectors for robustness (ID, class, nth-child, data-attr)

### 3.3 Universal Tour Interchange Format

**No universal interchange format exists.** Each library and SaaS platform uses its own schema. However, the step structures are remarkably similar across all libraries — the core is always:

```typescript
interface UniversalTourStep {
    target: string;       // CSS selector
    title: string;        // Heading
    content: string;      // Body (text or HTML)
    placement: string;    // top/bottom/left/right
    order: number;        // Sequence position
}
```

This minimal common denominator maps cleanly to every library's format. An SOP recorder that captures these fields can export to any tour format with a thin adapter layer.

### 3.4 Relationship to Claude Chrome's Shortcuts Format

The Claude Chrome extension (examined in local clone) uses minified code that doesn't expose the shortcuts format clearly. However, based on the MCP tool interface (`shortcuts_list`, `shortcuts_execute`), Claude's shortcuts appear to be:

- **Action-oriented** — Execute sequences of browser actions (click, type, navigate)
- **Selector-based** — Target elements by CSS selectors
- **Sequential** — Ordered steps with conditions

This is structurally identical to an SOP recording's step list. A recorded SOP could potentially be exported as a Claude shortcut definition, enabling AI-driven replay of recorded procedures.

---

## 4. Proposed Internal Data Model

### 4.1 Design Principle: Record Rich, Export Thin

The internal recording format should capture maximum context. Export adapters then select relevant fields per output format.

### 4.2 Universal Step Schema (Internal)

```typescript
interface RecordedStep {
    // --- Identity ---
    id: string;                         // UUID
    order: number;                      // Sequence position
    timestamp: number;                  // Unix ms when captured

    // --- Action ---
    actionType: 'click' | 'input' | 'navigate' | 'scroll' | 'select' | 'hover' | 'wait';
    actionValue?: string;               // Typed text, selected value, URL navigated to

    // --- Target Element ---
    selectors: {
        css: string;                    // Primary CSS selector
        xpath?: string;                 // XPath fallback
        textContent?: string;           // Visible text of element
        ariaLabel?: string;             // Accessibility label
        dataAttributes?: Record<string, string>;  // data-* attributes
    };
    elementTag: string;                 // 'button', 'input', 'a', etc.
    elementRole?: string;               // ARIA role
    elementRect: DOMRect;              // Bounding box at capture time
    isInViewport: boolean;
    isInIframe: boolean;
    iframePath?: string[];             // Nested iframe selectors

    // --- Page Context ---
    pageUrl: string;
    pageTitle: string;
    viewportWidth: number;
    viewportHeight: number;
    scrollX: number;
    scrollY: number;

    // --- Content (for SOP export) ---
    title: string;                      // AI-generated or user-edited
    description: string;                // Detailed step description
    screenshotDataUrl?: string;         // Base64 screenshot

    // --- Tour Hints (for tour export) ---
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    interactionRequired?: boolean;      // Should user perform the action?
    waitForSelector?: string;           // Wait for element before showing step
    waitTimeout?: number;               // Max wait time (ms)
}
```

### 4.3 Export Adapter Architecture

```
RecordedStep[]
    |
    |-- MarkdownExporter      --> SOP document (Markdown + screenshots)
    |-- HTMLExporter           --> Self-contained HTML SOP viewer
    |-- GuideChimpExporter     --> GuideChimp tour JSON
    |-- DriverJsExporter       --> Driver.js step array
    |-- ShepherdExporter       --> Shepherd.js tour config
    |-- ClaudeShortcutExporter --> Claude Chrome shortcut format
    |-- JSONExporter           --> Raw universal format (for import/API)
```

### 4.4 GuideChimp Export Example

```typescript
function toGuideChimpTour(steps: RecordedStep[]): Record<string, any[]> {
    const pathGroups = groupBy(steps, s => new URL(s.pageUrl).pathname);
    const result: Record<string, any[]> = {};

    for (const [path, pathSteps] of Object.entries(pathGroups)) {
        result[path] = pathSteps.map(step => ({
            element: step.selectors.css,
            title: step.title,
            description: step.description,
            position: step.tooltipPosition || 'bottom',
            interaction: step.interactionRequired ?? true,
        }));
    }
    return result;
}
```

### 4.5 Driver.js Export Example

```typescript
function toDriverJsSteps(steps: RecordedStep[]): DriveStep[] {
    return steps.map(step => ({
        element: step.selectors.css,
        popover: {
            title: step.title,
            description: step.description,
            side: step.tooltipPosition || 'bottom',
            align: 'center',
        },
        disableActiveInteraction: !step.interactionRequired,
    }));
}
```

---

## 5. Use Cases Beyond SOPs

### 5.1 Onboarding Tours

**Scenario**: Record an admin completing initial setup. Export as a GuideChimp tour for new users.

**Value**: Zero authoring cost. Record once in staging, deploy as onboarding tour in production. The SOP screenshots serve as reference, while the tour provides interactive guidance.

**Requirements**: Selector stability between environments (staging vs. production).

### 5.2 Interactive Tutorials

**Scenario**: Record a teacher performing a multi-step task. Export as a Shepherd.js tour with `advanceOn` — the tutorial only progresses when the student performs each action.

**Additional data needed**: `advanceOn` event mapping (`click` on which selector), validation conditions (did the user fill the field correctly?).

**Complexity**: Medium. Requires capturing which elements should be "advance triggers" vs. "informational highlights."

### 5.3 Feature Announcements ("What's New")

**Scenario**: PM records themselves using a new feature. Export as a lightweight Driver.js tour highlighting the 3-4 new UI elements.

**Value**: Eliminates the gap between feature development and user communication. The recording IS the announcement content.

### 5.4 Accessibility Audits

**Scenario**: QA specialist records a guided path through the application. Export includes element ARIA roles, labels, and tab order. Generate an accessibility checklist from the recorded elements.

**Additional data needed**: `aria-*` attributes, tab index, color contrast ratios, focus states.

### 5.5 QA Test Scripts

**Scenario**: QA records a manual test case. The SOP serves as documentation. The tour format serves as a semi-automated test script that guides another tester through the same steps.

**Value**: Bridges manual and automated testing. A recorded SOP is both the test documentation and the test script.

### 5.6 Compliance Documentation

**Scenario**: Compliance officer records a regulated process. The SOP with screenshots serves as audit evidence. The tour serves as training material for new employees.

---

## 6. Architecture for Multi-Format Support

### 6.1 Core Question: Tour-Oriented vs. Document-Oriented?

| Approach | Pros | Cons |
|----------|------|------|
| **Document-oriented** (SOP first) | Natural for the primary use case; screenshots central | Tours feel like an afterthought |
| **Tour-oriented** (steps first) | Natural for interactive output; element targeting central | Documents require assembling from step data |
| **Action-oriented** (recording first) | Captures maximum raw data; both formats are exports | More complex internal model |

**Recommendation: Action-oriented.** The recording is the source of truth. Both SOPs and tours are export formats derived from the same recording. This is the most flexible approach and avoids privileging one output format over another.

### 6.2 Minimal Internal Representation

The absolute minimum fields that serve ALL output formats:

```typescript
interface MinimalStep {
    selector: string;          // CSS selector (tours need this)
    pageUrl: string;           // Multi-page routing (tours need this)
    title: string;             // Both SOP headings and tour tooltips
    description: string;       // Both SOP body text and tour content
    screenshot?: string;       // SOP-specific but useful everywhere
    actionType: string;        // Determines tour interaction behavior
    order: number;             // Sequence
}
```

These 7 fields are sufficient to generate: Markdown SOP, HTML tutorial, GuideChimp tour, Driver.js tour, and Claude shortcut.

### 6.3 Recommended Architecture

```
[Content Script] -- captures --> [Raw Recording]
                                      |
                                 [State Machine]
                                      |
                                [Internal Store]  <-- RecordedStep[]
                                      |
                               [Export Manager]
                                /    |    \     \
                          Markdown  HTML  Tour   Claude
                           SOP    Viewer  JSON  Shortcut
```

The Export Manager is a plugin system. Each exporter:
1. Receives `RecordedStep[]`
2. Transforms to target format
3. Returns serialized output (string, JSON, or file blob)

New export formats can be added without modifying the core recording logic.

---

## 7. Strategic Analysis

### 7.1 Market Expansion

**SOP-only market**: Technical writers, ops teams, trainers, compliance officers.
**Tour/onboarding market**: Product managers, UX designers, customer success, growth teams.

These are **adjacent but distinct** buyer personas. Supporting tours expands the addressable market significantly:

| Segment | SOP Only | SOP + Tours |
|---------|----------|-------------|
| Documentation teams | Yes | Yes |
| Product teams | No | Yes |
| Customer Success | Partial | Yes |
| Sales enablement | Partial | Yes |
| Developer relations | Partial | Yes |

### 7.2 "Record Once, Deploy Everywhere" Positioning

This is a compelling narrative:

> "Record your workflow once. Get an SOP document, an interactive onboarding tour, an HTML tutorial, and a test script. No re-authoring."

No existing tool offers this. Scribe exports to Markdown/PDF. Tango exports to PDF/HTML. GuideChimp requires manual JSON authoring. The gap is clear.

### 7.3 Competitive Moat

| Differentiator | Defensibility |
|---------------|--------------|
| Local-first / no cloud | Easy to copy, but incumbents won't (their business model requires cloud) |
| Multi-format export | Medium — requires good architecture but is reproducible |
| SOP + Tour from same recording | High — no one does this; requires deep understanding of both domains |
| BYOK AI enhancement | Medium — API key management is straightforward |
| Open-source + MIT | Community moat if adopted |

### 7.4 Who Would Use This?

1. **Solo developers / indie hackers** — Document their SaaS onboarding for free
2. **Small product teams** — Create onboarding tours without buying Appcues ($249/mo)
3. **Technical writers** — Primary SOP use case with tour as bonus
4. **QA engineers** — Test documentation that doubles as guided test scripts
5. **Internal tools teams** — Document and train on custom internal applications
6. **Consultants / agencies** — Deliver SOPs AND interactive training to clients

### 7.5 MVP Recommendation

**Phase 1 (MVP)**: SOP recording + Markdown/HTML export. This is the core value prop.

**Phase 2 (v1.1)**: Add GuideChimp JSON and Driver.js export adapters. The internal data model already captures what's needed. This is a low-cost, high-impact feature add.

**Phase 3 (v1.2)**: Interactive tutorial mode with Shepherd.js `advanceOn` support. Requires UI for marking steps as "must-do" vs. "informational."

**Phase 4 (v2.0)**: Tour playback within the extension itself (embed a tour engine). No external library dependency needed.

### 7.6 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Selector instability across environments | High | Medium | Capture multiple selector strategies; let user pick |
| Tour format fragmentation | Medium | Low | Target Driver.js (MIT, most popular) as primary |
| Feature creep from tour support | High | High | Strict phase gating; tours are EXPORT ONLY in Phase 2 |
| Users expect visual tour builder | Medium | Medium | Position as "recording IS the builder" — no drag-and-drop needed |

---

## 8. Real Tour File Examples (from GuideChimp-tours repo)

### netlicensing.io.json
```json
{
    "/": [
        {
            "element": "#live-demo a",
            "title": "NetLicensing FREE Demo",
            "description": "Get a closer look at NetLicensing...",
            "position": "bottom"
        },
        {
            "element": "#getting-started a",
            "title": "As easy as one, two, three!",
            "description": "NetLicensing makes setup and integration fast...",
            "position": "bottom"
        },
        {
            "element": "#simplify-license-activation",
            "title": "Simplify license activation",
            "description": "NetLicensing allows you to deliver and activate...",
            "position": "left"
        }
    ]
}
```

### app.hubspot.com.json
```json
{
    "/reports-dashboard/.*/view/.*": [
        {
            "element": "button>[data-key='dashboard-actions.createDashboard.name']",
            "title": "Create Dashboard",
            "description": "Create Dashboard."
        }
    ]
}
```

### _default.json (fallback for all sites)
```json
{
    "/.*": [
        {
            "title": "Improve GuideChimp Public Tours",
            "description": "Missing GuideChimp tour on this page?!<br><br>..."
        }
    ]
}
```

**Key observations from real tour files**:
- Steps are minimal: just `element`, `title`, `description`, `position`
- No callbacks or complex logic in JSON tours (callbacks are JS-only)
- Path patterns use regex: `/reports-dashboard/.*/view/.*`
- Steps without `element` become floating centered tooltips
- HTML is freely used in `description` fields
- Selectors use IDs, classes, and child combinators with data attributes

---

## 9. Key Findings Summary

1. **Tour formats are highly convergent.** All libraries use: element selector + title + description + position. The differences are in API surface, not data model.

2. **SOP recordings contain ~80% of tour data.** The main gaps are tooltip positioning preferences and interaction flags, both of which can be auto-inferred or set via simple post-recording UI.

3. **No universal interchange format exists.** This is an opportunity. An SOP recorder that defines a well-documented internal format becomes the de facto interchange layer.

4. **Driver.js is the strongest export target.** MIT license, smallest footprint (5kb), 25.5k GitHub stars, zero dependencies, TypeScript-first. GuideChimp is valuable for its Chrome extension ecosystem.

5. **The "record once, deploy everywhere" narrative is unoccupied.** No tool bridges SOP documentation and interactive tours from a single recording. This is a genuine whitespace.

6. **Tour support requires minimal architectural overhead** if the internal data model is designed for it from the start. The `RecordedStep` schema proposed above costs nothing extra to capture but enables all tour export formats.

7. **Phase 2 tour export is low-risk, high-reward.** It's an adapter layer over existing data — no changes to the recording engine, capture logic, or core UX.
