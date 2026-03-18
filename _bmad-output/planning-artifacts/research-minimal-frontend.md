# Research: Minimal Frontend Approaches for Chrome Extension Side Panels

**Date**: 2026-03-18
**Status**: Complete

---

## 1. Lit Web Components in Chrome Extensions

### How Well Does Lit Work in Extension Side Panels?

Lit works excellently in Chrome extension side panels. Since a side panel is just a standard HTML page loaded within the extension context, Lit components render without restrictions. Google itself uses Lit extensively (it originated from the Polymer team), and Chrome's own internal pages use web components. Lit 4.0 has become the leading library for building web components as of 2025.

Key advantages in extension context:
- Native web components work anywhere HTML works - no framework runtime negotiation
- Side panels are isolated documents, so Lit's Shadow DOM encapsulation is straightforward
- Chrome DevTools has dedicated Web Component DevTools for inspecting Lit components
- No CSP (Content Security Policy) conflicts since Lit uses tagged template literals, not eval-style dynamic code

### Bundle Size

| Package | Minified | Min+Gzip |
|---------|----------|----------|
| `lit` (full) | ~16.5 KB | ~5.8 KB |
| `lit-html` only | ~7 KB | ~2.7 KB |
| `@lit/reactive-element` | ~6 KB | ~2.3 KB |

The complete Lit package adds approximately **5-6 KB gzipped** to your bundle - extremely small for a full reactive component system.

### WXT + Lit Support

WXT does **not** have an official Lit module. The four officially supported frameworks are:

| Framework | Module |
|-----------|--------|
| React | `@wxt-dev/module-react` |
| Vue | `@wxt-dev/module-vue` |
| Svelte | `@wxt-dev/module-svelte` |
| SolidJS | `@wxt-dev/module-solid` |

However, **Lit does not need a WXT module**. Since Lit compiles to standard web components and uses standard ES module imports, it works directly with WXT's vanilla template and Vite's built-in TypeScript support. No special Vite plugin is needed for Lit (unlike React's JSX transform or Vue's SFC compiler). You simply:

1. Use `wxt init` with the vanilla template
2. `pnpm add lit`
3. Import and use Lit components in your HTML entrypoints

### Shadow DOM Considerations

**Shadow DOM + Tailwind conflict**: Tailwind CSS does not work inside Shadow DOM by default because the Shadow DOM isolates styles. Solutions:

1. **Disable Shadow DOM** (recommended for extension UIs): Override `createRenderRoot()` to return `this` instead of a shadow root. This lets Lit components inherit global styles. Best for application-level components that don't need encapsulation.
   ```ts
   class MyPanel extends LitElement {
     createRenderRoot() { return this; }
   }
   ```
2. **Adopted StyleSheets**: Import CSS as a string and inject into shadow root via `adoptedStyleSheets`. Works but duplicates styles per component.
3. **Use PicoCSS instead of Tailwind**: PicoCSS styles semantic HTML elements directly, which works with or without Shadow DOM since it targets element selectors, not utility classes.

**Recommendation**: For an extension side panel, use Lit in **light DOM mode** (no Shadow DOM). The side panel is already isolated from the host page, so Shadow DOM's CSS isolation is redundant. This gives full Tailwind/PicoCSS compatibility.

### Lit vs Vanilla Custom Elements

| Factor | Vanilla Custom Elements | Lit |
|--------|------------------------|-----|
| Bundle size | 0 KB | ~5.8 KB gzipped |
| Reactive properties | Manual `attributeChangedCallback` | Declarative `@property()` |
| Templating | Manual DOM manipulation or innerHTML | Tagged template literals with efficient diffing |
| Event handling | `addEventListener` boilerplate | `@click` in templates |
| Update batching | Manual | Automatic microtask batching |
| Learning curve | Web standards only | Small API surface |

**When Lit is worth it**: As soon as you have more than 2-3 components with reactive state, or need efficient list rendering. For a recording extension with a step list, recording controls, and export panel, Lit's reactive templating pays for itself immediately.

---

## 2. PicoCSS for Extension UI

### How PicoCSS Works

PicoCSS styles semantic HTML elements directly - no utility classes needed. It applies styles to raw HTML tags (`<button>`, `<input>`, `<nav>`, `<article>`, `<dialog>`, etc.) to make them look polished out of the box.

```html
<!-- This is styled by PicoCSS automatically - no classes needed -->
<article>
  <header>Recording Steps</header>
  <ul>
    <li>Clicked "Login" button</li>
    <li>Typed in username field</li>
  </ul>
  <footer>
    <button>Export</button>
    <button class="secondary">Clear</button>
  </footer>
</article>
```

Key features:
- Fewer than 10 `.classes` in the entire framework
- A fully classless version exists for pure semantic HTML
- 130+ CSS custom properties for customization
- 20 handcrafted color themes
- Automatic dark/light mode via `prefers-color-scheme`
- Responsive font sizing and spacing built in
- 30+ modular components

### Size Comparison

| Framework | Minified | Min+Gzip | Classes Needed |
|-----------|----------|----------|----------------|
| PicoCSS (full) | ~72 KB | ~10 KB | < 10 |
| PicoCSS (classless) | ~28 KB | ~4 KB | 0 |
| Tailwind (typical purged) | ~10-30 KB | ~3-8 KB | Many |
| Tailwind (kitchen sink) | ~3.7 MB | ~300 KB | Many |

For an extension side panel, PicoCSS classless at **~4 KB gzipped** provides excellent default styling with zero cognitive overhead.

### PicoCSS + Tailwind Coexistence

They **can** coexist but **should not** in most cases:
- PicoCSS applies opinionated base styles to elements; Tailwind's Preflight reset does the same, causing conflicts
- PicoCSS's semantic styling philosophy contradicts Tailwind's utility-class approach
- You'd fight specificity battles

**Pick one**:
- Choose **PicoCSS** if you want minimal markup, fast development, and accept its design opinions
- Choose **Tailwind** if you want pixel-perfect custom designs and don't mind verbose class lists

### Sufficiency for Side Panel UI

PicoCSS is **sufficient** for a side panel with:
- **Step list**: `<article>` with `<ol>` or `<ul>` - styled automatically
- **Buttons**: `<button>`, `<button class="secondary">`, `<button class="outline">` - three variants built in
- **Export panel**: `<dialog>` element - PicoCSS styles modals natively
- **Settings**: `<form>` with `<input>`, `<select>`, `<fieldset>` - all styled
- **Recording indicator**: CSS custom properties for accent colors
- **Dark/light mode**: Automatic, zero JavaScript

Where PicoCSS falls short:
- No drag-and-drop reorder styling (needs custom CSS)
- Limited animation utilities (supplement with View Transitions API)
- No icon system (add a lightweight icon font/SVG set)
- Custom layouts beyond basic flow may need supplemental CSS

---

## 3. Datastar / Alpine.js / Alpine-AJAX

### Datastar (data-star.dev)

**What it is**: A hypermedia framework (11.39 KB total, likely ~4-5 KB gzipped) that provides both backend reactivity (like htmx) and frontend reactivity (like Alpine.js) through HTML `data-*` attributes.

**How it works**:
- State is managed through **signals** (reactive variables prefixed with `$`)
- DOM updates happen through HTML attributes: `data-text`, `data-show`, `data-bind`, `data-class`, `data-on`, `data-computed`, `data-attr`, `data-signals`
- Backend sends HTML fragments or SSE streams to patch the DOM
- Uses morphing for efficient DOM updates

**Key data-* attributes**:
| Attribute | Purpose |
|-----------|---------|
| `data-signals` | Declare/patch reactive state |
| `data-bind` | Two-way data binding on inputs |
| `data-text` | Set element text from expression |
| `data-show` | Conditional visibility |
| `data-class` | Dynamic CSS classes |
| `data-on` | Event listeners with expressions |
| `data-computed` | Derived reactive values |
| `data-attr` | Dynamic HTML attributes |

**Chrome extension suitability**: **Poor fit**. Datastar is designed around backend-server communication (SSE streams, HTML fragment responses). A Chrome extension has no backend server - it communicates between background script, content script, and side panel via `chrome.runtime.sendMessage()`. While Datastar's client-side signals work standalone, you'd be using only a fraction of the framework and fighting its architecture. Datastar deliberately avoids npm packages and the JS build ecosystem, which conflicts with WXT's Vite-based build system.

**Verdict**: Skip Datastar for this project.

### Alpine.js

**What it is**: A lightweight (~10 KB gzipped) JavaScript framework for adding reactivity to HTML via directives. Often called "jQuery for the modern web" or "Tailwind for JavaScript."

**How it works**:
```html
<div x-data="{ recording: false, steps: [] }">
  <button @click="recording = !recording"
          x-text="recording ? 'Stop' : 'Record'">
  </button>
  <template x-for="step in steps">
    <div x-text="step.description"></div>
  </template>
</div>
```

**Chrome extension considerations**:
- There is an existing starter kit for Chrome extensions with Alpine.js + Tailwind (tailwind-alpine-chrome-extension on GitHub)
- Alpine.js uses `x-` directives which may trigger CSP warnings in strict extension contexts
- Alpine evaluates expression strings as JavaScript, which could conflict with extension CSP if `unsafe-eval` isn't allowed. **This is a significant concern** - MV3 extensions restrict eval-style dynamic code execution
- State management is scoped to `x-data` containers, not globally reactive

**Alpine-AJAX**: A plugin for Alpine.js that adds htmx-like HTML fragment fetching. Not relevant for extensions (no server to fetch from).

### Comparison Table

| Feature | Lit | Alpine.js | Datastar |
|---------|-----|-----------|----------|
| Bundle size (gzip) | ~5.8 KB | ~10 KB | ~4-5 KB |
| Reactivity model | Properties + templates | Directives on HTML | Signals + attributes |
| Component model | Web Components | None (directives) | None (attributes) |
| CSP compatible (MV3) | Yes | **Potentially problematic** | Unknown |
| TypeScript support | Excellent (decorators) | Limited | None (no npm) |
| Build system | Standard ES modules | Script tag or build | CDN only |
| Reusable components | Native web components | Alpine.data() | No |
| Extension message handling | Class methods | Awkward | Not designed for it |

### Can They Handle Recording Extension State?

The recording extension needs:
1. **Recording state** (idle/recording/paused) - All three handle this
2. **Step list** (add/remove/reorder items) - Lit's `repeat()` directive is best for keyed list updates; Alpine's `x-for` works but is less efficient; Datastar would need backend signals
3. **Cross-context messaging** (background -> side panel) - Lit components can have message handlers as class methods. Alpine requires reaching into the Alpine store or dispatching custom events.
4. **Persistence** (chrome.storage sync) - All equally capable since this is just API calls

**Winner: Lit** - TypeScript-first, component-based, CSP-safe, best for structured state management.

---

## 4. View Transitions API

### Browser Support

| Browser | Same-Doc Transitions | Cross-Doc Transitions |
|---------|---------------------|----------------------|
| Chrome | 111+ (March 2023) | 126+ (June 2024) |
| Edge | 111+ | 126+ |
| Safari | 18+ (Sep 2024) | 18+ |
| Firefox | 133+ (Oct 2024) | Not yet |

**Baseline Newly Available** as of October 2025. Since our target is Chrome 120+, full support is guaranteed.

### 2025 Enhancements

- **`view-transition-name: match-element`**: Auto-generates transition names based on element identity, eliminating manual naming
- **Nested view transition groups** (Chrome 140+): Enables hierarchical transitions with clipping and 3D transforms
- **Scoped view transitions** (Chrome 140+, experimental): Call `element.startViewTransition()` on subtrees instead of the whole document - ideal for side panel UIs
- **Enhanced animation inheritance**: Transition pseudo-elements inherit more animation properties
- **`document.activeViewTransition`** (Chrome 142): Direct access to the active transition instance

### Using View Transitions in a Side Panel

Since a side panel is a standard HTML document, `document.startViewTransition()` works directly.

**Adding a step to a list**:
```ts
function addStep(step: Step) {
  if (!document.startViewTransition) {
    renderStep(step);
    return;
  }
  document.startViewTransition(() => {
    renderStep(step);
  });
}
```

**CSS for step list transitions**:
```css
/* Each step item gets a unique transition name */
.step-item {
  view-transition-name: match-element; /* Chrome 140+ auto-naming */
}

/* Animate new items sliding in */
::view-transition-new(.step-item) {
  animation: slide-in 200ms ease-out;
}

::view-transition-old(.step-item) {
  animation: fade-out 150ms ease-in;
}

@keyframes slide-in {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

**Panel switching** (e.g., recording view -> export view):
```ts
async function switchPanel(newPanel: string) {
  const transition = document.startViewTransition(() => {
    document.querySelector('.active-panel')?.classList.remove('active-panel');
    document.querySelector(`#${newPanel}`)?.classList.add('active-panel');
  });
  await transition.finished;
}
```

### Extension Context Compatibility

View Transitions work in extension contexts because:
- Side panels, popups, and options pages are standard HTML documents
- The API is purely DOM-based, no server interaction needed
- No CSP conflicts - it's a browser-native API
- No dynamic code execution required

**Scoped view transitions** (Chrome 140+) will be particularly useful for transitioning individual components within the side panel without affecting the whole document.

---

## 5. WXT Without React

### Does WXT Require a UI Framework?

**No.** WXT has a vanilla template that works with plain HTML + TypeScript. Framework modules are optional add-ons.

### WXT with Plain HTML + TypeScript

**Side panel entrypoint** (`entrypoints/sidepanel.html`):
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="./style.css" />
  <title>SOP Recorder</title>
</head>
<body>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

WXT automatically:
- Adds the `sidePanel` permission to the manifest
- Handles cross-browser differences (Chrome `side_panel` API vs Firefox `sidebar_action`)
- Processes the HTML through Vite (bundling, TypeScript compilation, CSS processing)

**File structure**:
```
entrypoints/
  sidepanel/
    index.html      # HTML entrypoint
    main.ts         # TypeScript entry
    style.css       # Styles
    components/     # Lit components (optional)
  background.ts     # Background script
  content.ts        # Content script
```

Or simpler:
```
entrypoints/
  sidepanel.html    # Single-file entrypoint
  background.ts
  content.ts
```

### WXT with Lit

No official community examples exist specifically for WXT + Lit, but the integration is trivial because:
1. Lit uses standard ES module imports (no Vite plugin needed)
2. Lit's TypeScript decorators work with Vite's built-in TS support
3. Web components register globally via `customElements.define()` - no special framework bootstrapping

**Example integration** (`entrypoints/sidepanel/main.ts`):
```ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('step-list')
class StepList extends LitElement {
  // Use light DOM for PicoCSS compatibility
  createRenderRoot() { return this; }

  @state() steps: Step[] = [];

  connectedCallback() {
    super.connectedCallback();
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'step-recorded') {
        this.steps = [...this.steps, msg.step];
      }
    });
  }

  render() {
    return html`
      <ol>
        ${this.steps.map(step => html`
          <li>${step.description}</li>
        `)}
      </ol>
    `;
  }
}
```

Then in `sidepanel.html`:
```html
<body>
  <step-list></step-list>
  <script type="module" src="./main.ts"></script>
</body>
```

---

## 6. Practical Architecture

### Side Panel Structure

```
sidepanel/
  index.html                 # Shell HTML with script module import
  main.ts                    # Import components, initialize app
  style.css                  # PicoCSS import + custom styles
  components/
    app-shell.ts             # Root component (nav, routing)
    recording-controls.ts    # Record/Pause/Stop buttons
    step-list.ts             # Live step list with edit/delete
    step-item.ts             # Individual step display
    export-panel.ts          # Export format selection + preview
    settings-panel.ts        # Extension settings
  lib/
    messages.ts              # Typed message handlers
    storage.ts               # chrome.storage wrapper
    state.ts                 # Shared reactive state
```

### Message Handling: Background -> Side Panel (Without React)

**With Lit components using ReactiveController**:
```ts
// lib/state.ts - Simple reactive store using Lit's ReactiveController
import { ReactiveController, ReactiveControllerHost } from 'lit';

class RecordingStore implements ReactiveController {
  host: ReactiveControllerHost;
  steps: Step[] = [];
  state: RecordingState = 'idle';

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }

  hostDisconnected() {
    chrome.runtime.onMessage.removeListener(this.handleMessage);
  }

  private handleMessage = (msg: Message) => {
    switch (msg.type) {
      case 'step-recorded':
        this.steps = [...this.steps, msg.step];
        this.host.requestUpdate();
        break;
      case 'recording-state':
        this.state = msg.state;
        this.host.requestUpdate();
        break;
    }
  };
}
```

This pattern replaces React's useState/useEffect/context with Lit's ReactiveController - a composable, reusable state pattern that integrates with Lit's update lifecycle.

### DOM Updates: Lit vs Alpine vs Manual

**Manual DOM manipulation** (no library):
```ts
// Verbose, error-prone, no diffing
function addStep(step: Step) {
  const li = document.createElement('li');
  li.textContent = step.description;
  li.dataset.id = step.id;
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => removeStep(step.id);
  li.appendChild(deleteBtn);
  document.querySelector('#step-list')!.appendChild(li);
}
```

**Lit** (declarative, efficient):
```ts
render() {
  return html`
    <ol>
      ${repeat(this.steps, s => s.id, (step) => html`
        <li>
          ${step.description}
          <button @click=${() => this.removeStep(step.id)}>Delete</button>
        </li>
      `)}
    </ol>
  `;
}
```

**Alpine.js** (declarative, but CSP concerns):
```html
<ol x-data="stepStore">
  <template x-for="step in steps" :key="step.id">
    <li>
      <span x-text="step.description"></span>
      <button @click="removeStep(step.id)">Delete</button>
    </li>
  </template>
</ol>
```

### Event Delegation for Step List

Lit supports both direct binding and event delegation:

```ts
// Direct binding (simpler, fine for small lists)
render() {
  return html`
    <ol>
      ${repeat(this.steps, s => s.id, (step) => html`
        <step-item
          .step=${step}
          @step-edit=${this.handleEdit}
          @step-delete=${this.handleDelete}
        ></step-item>
      `)}
    </ol>
  `;
}

// Event delegation (better for large lists)
render() {
  return html`
    <ol @click=${this.handleListClick}>
      ${repeat(this.steps, s => s.id, (step) => html`
        <li data-step-id=${step.id}>
          ${step.description}
          <button data-action="edit">Edit</button>
          <button data-action="delete">Delete</button>
        </li>
      `)}
    </ol>
  `;
}

handleListClick(e: Event) {
  const target = e.target as HTMLElement;
  const action = target.dataset.action;
  const stepId = target.closest('[data-step-id]')?.dataset.stepId;
  if (!action || !stepId) return;

  if (action === 'delete') this.removeStep(stepId);
  if (action === 'edit') this.editStep(stepId);
}
```

**Reordering**: Use the native HTML Drag and Drop API or a lightweight library like SortableJS (~5 KB gzip). Lit integrates well with third-party DOM libraries since it renders to real DOM elements.

---

## 7. Recommendation

### Best Combination for This Project

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Build system** | WXT (vanilla template) | Framework-agnostic, handles extension boilerplate |
| **UI components** | Lit (light DOM mode) | 5.8 KB, TypeScript-first, CSP-safe, reactive templating |
| **Base styles** | PicoCSS (classless) | ~4 KB, semantic HTML, zero-class overhead |
| **Custom styles** | CSS custom properties + minimal custom CSS | Lean, no build step for styles |
| **Animations** | View Transitions API | Native browser API, zero bundle cost |
| **Reordering** | SortableJS (if needed) | ~5 KB, proven, framework-agnostic |

**Total UI budget: ~10-15 KB gzipped** (Lit + PicoCSS + optional SortableJS)

### Why Not the Alternatives

| Option | Why Not |
|--------|---------|
| **React** | User explicitly excluded; ~40 KB gzipped; overkill |
| **Tailwind** | Shadow DOM conflicts with Lit; utility classes add markup noise; PicoCSS is simpler for this scope |
| **Alpine.js** | CSP concerns with MV3 expression evaluation; no component model; larger than Lit |
| **Datastar** | Backend-server architecture doesn't fit extensions; no npm/build system integration |
| **Vanilla custom elements** | Too much boilerplate for reactive step list; Lit eliminates ~80% of the ceremony |
| **Alpine-AJAX** | Requires server endpoints; not applicable |

### Specific Versions and Budget

```json
{
  "dependencies": {
    "lit": "^4.1.0"
  },
  "devDependencies": {
    "wxt": "^0.20.0",
    "@picocss/pico": "^2.1.0"
  }
}
```

PicoCSS is a dev dependency because it's imported as CSS and bundled, not a runtime JS dependency.

Bundle size budget:
- **JavaScript**: < 20 KB gzipped (Lit + application code)
- **CSS**: < 10 KB gzipped (PicoCSS + custom styles)
- **Total**: < 30 KB gzipped for the entire side panel

### Migration Path If We Outgrow Minimal

1. **Need more styling control?** Add Tailwind CSS (switch from PicoCSS, use Lit in light DOM mode). Or add targeted custom CSS on top of PicoCSS.

2. **Need complex state management?** Lit's ReactiveController pattern scales well. If truly complex, add a tiny state library like Zustand (~1 KB) or use a simple pub/sub pattern.

3. **Need routing?** Add @vaadin/router (~8 KB) which is designed for web components. Or use simple conditional rendering with view-transition-name for animated panel switches.

4. **Need a full framework?** Lit components are standard web components. They work inside React, Vue, or Svelte without modification. You can incrementally adopt a framework around existing Lit components without rewriting them.

5. **Need server-side rendering?** Lit supports SSR via @lit-labs/ssr. Not relevant for extensions but useful if the technology is reused in a web app.

The key advantage of the Lit approach: **web components are the escape hatch**. Unlike framework-specific components, Lit components work in any context, so there's zero lock-in and no costly migration.

---

## Sources

- [Lit - Simple. Fast. Web Components.](https://lit.dev/)
- [WXT - Next-gen Web Extension Framework](https://wxt.dev/guide/essentials/entrypoints.html)
- [WXT Framework Integrations (DeepWiki)](https://deepwiki.com/wxt-dev/wxt/7-framework-integrations)
- [Pico CSS - Minimal CSS Framework for semantic HTML](https://picocss.com/)
- [Datastar - Hypermedia Framework](https://data-star.dev/)
- [Datastar Reactive Signals Guide](https://data-star.dev/guide/reactive_signals)
- [Alpine.js + Tailwind Chrome Extension Starter](https://github.com/thomasjohnkane/tailwind-alpine-chrome-extension)
- [View Transitions 2025 Update (Chrome Developers)](https://developer.chrome.com/blog/view-transitions-in-2025)
- [View Transitions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Scoped View Transitions (Chrome Developers)](https://developer.chrome.com/blog/scoped-view-transitions-feedback)
- [Tailwind CSS + Shadow DOM Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/1935)
- [Light-DOM-Only Web Components (Frontend Masters)](https://frontendmasters.com/blog/light-dom-only/)
- [Alpine.js vs Lit Comparison](https://unitysangam.com/tech/alpine-js-vs-lit/)
- [Lit Bundle Size (Bundlephobia)](https://bundlephobia.com/package/lit-element)
- [Datastar on GitHub](https://github.com/starfederation/datastar/)
- [Web Components 2025 (Markaicode)](https://markaicode.com/web-components-2025-shadow-dom-lit-browser-compatibility/)
- [PicoCSS Extension Example (GitHub)](https://github.com/LennCord/pico-extension)
