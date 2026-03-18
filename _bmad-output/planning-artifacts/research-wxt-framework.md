# WXT Framework Deep Dive & Migration from Plasmo

> Research Date: 2026-03-18
> WXT Version: 0.20.20 (released 2026-03-17)
> Purpose: Inform architecture decisions for SOP Recorder browser extension

---

## 1. WXT Framework Overview

### Project Vitals

| Metric | Value |
|--------|-------|
| Current Version | 0.20.20 |
| GitHub Stars | 9,400+ |
| Forks | 479 |
| Dependents | 2,700+ projects |
| Total Releases | 236 |
| License | MIT |
| Codebase Language | TypeScript (99.3%) |
| Package Manager | pnpm |
| Maintainer | Aaron Klinker (aklinker1) - active, responsive |
| Community | Active Discord, healthy GitHub issue response |
| Notable Users | Eye Dropper (1M+ users), ChatGPT Writer (600k+ users) |

WXT is actively maintained with frequent releases. Plasmo, by contrast, "appears to be in maintenance mode with little to no maintainers or feature development happening" per WXT's official comparison and multiple community reports.

### Architecture: Entrypoint System

WXT uses a **file-based entrypoint system** (inspired by Nuxt.js) where files in the `entrypoints/` directory define extension components. The manifest is auto-generated from these files.

**Standard project structure:**
```
<rootDir>/
  entrypoints/
    background.ts          -> Background service worker
    content.ts             -> Content script (or {name}.content.ts for multiple)
    popup/                 -> Popup UI
      index.html
      App.tsx
      main.tsx
    sidepanel/             -> Side panel UI
      index.html
      App.tsx
      main.tsx
    options/               -> Options page
      index.html
      App.tsx
      main.tsx
  components/              -> Shared React components
  shared/                  -> Context-independent utilities
  assets/                  -> Static assets (images, CSS)
  public/                  -> Files copied as-is (icons, etc.)
  wxt.config.ts            -> Central configuration
  tsconfig.json            -> Extends .wxt/tsconfig.json
```

**Supported entrypoint types:**
- **Background** (`background.ts`) - Service worker (MV3) or background script (MV2)
- **Content Scripts** (`content.ts`, `{name}.content.ts`) - With CSUI support
- **Popup** (`popup.html` or `popup/index.html`)
- **Side Panel** (`sidepanel.html` or `sidepanel/index.html`)
- **Options** (`options.html` or `options/index.html`)
- **Devtools** (`devtools.html`)
- **Sandbox** (`sandbox.html`) - Chrome only
- **Override Pages** (bookmarks, history, newtab)
- **Unlisted Pages** (`{name}.html`) - Accessible via `browser.runtime.getURL()`
- **Unlisted Scripts** (`{name}.ts`) - For main-world injection, etc.

### Vite-Based Build Advantages Over Plasmo's Parcel

| Aspect | WXT (Vite) | Plasmo (Parcel) |
|--------|-----------|-----------------|
| Dev startup | Near-instantaneous (native ESM) | Noticeably slower |
| Build speed | 2-3x faster | Slower, Parcel lagging versions behind |
| Tree-shaking | Superior (Rollup) | Less effective |
| Bundle size | ~400 KB typical | ~700 KB typical (same extension) |
| HMR | All frameworks, including background SW | React only; others trigger full reload |
| Plugin ecosystem | Full Vite plugin ecosystem | Limited Parcel plugin options |
| Modern package compat | Excellent | Issues with some modern packages |

One migration report showed a reduction from **5 MB to 500 KB** zipped output due to superior tree-shaking.

### TypeScript Support

- First-class TypeScript support (99.3% of WXT codebase is TypeScript)
- Configuration via `wxt.config.ts` with full type inference
- Auto-generated types for `browser.runtime.getURL()` paths
- Extends `.wxt/tsconfig.json` for project config
- Auto-imports with full type safety
- `wxt prepare` generates type definitions

### React Support

WXT is **framework-agnostic** with official React support via `@wxt-dev/module-react`:

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
});
```

Or manually with the Vite React plugin:

```typescript
import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
});
```

Each entrypoint (popup, sidepanel, options) gets its own React app instance. Routing within entrypoints uses hash mode (`popup.html#/settings`).

---

## 2. WXT vs Plasmo Feature Comparison

### Feature Matrix

| Feature | WXT | Plasmo | Notes |
|---------|-----|--------|-------|
| **Side Panel** | Native support | Supported | WXT auto-adds `sidePanel` permission |
| **Offscreen Documents** | Supported (examples available) | Supported | WXT has official examples |
| **Content Script (auto-register)** | File-based auto-registration | File-based auto-registration | Both use file conventions |
| **Content Script UI (CSUI)** | 3 modes: Integrated, Shadow Root, IFrame | Shadow DOM | WXT more flexible |
| **Messaging API** | No built-in; recommends 3rd party | Built-in `@plasmohq/messaging` | WXT gap - use `@webext-core/messaging` |
| **Storage API** | Built-in `wxt/storage` | Built-in `@plasmohq/storage` | Both good; WXT has versioning/migrations |
| **HMR** | All frameworks + background SW | React only | WXT significantly better |
| **Cross-browser** | Chrome, Firefox, Safari, Edge | Chrome, Firefox, Safari, Edge | Both support all browsers |
| **MV2 + MV3** | Both from single codebase | Both | WXT also generates Firefox sources ZIP |
| **Auto-imports** | Yes (Nuxt-style) | No | WXT advantage |
| **Module/Plugin System** | Yes (reusable modules) | No | WXT advantage |
| **i18n** | Built-in | No | WXT advantage |
| **ZIP for Firefox sources** | Yes | No | Required for Firefox store compliance |
| **Auto-open browser in dev** | Yes | No | WXT advantage |
| **Framework Support** | All (React, Vue, Svelte, Solid, etc.) | React, Vue, Svelte | WXT broader |
| **Bundle Size** | ~40% smaller (typical) | Larger | Vite tree-shaking advantage |
| **Maintenance Status** | Actively maintained | Maintenance mode | Critical differentiator |

### Messaging: Migration Path from @plasmohq/messaging

WXT does not include a built-in messaging module. The recommended alternatives are:

1. **`@webext-core/messaging`** - Lightweight, type-safe wrapper (by WXT author)
   ```typescript
   // shared/messaging.ts
   import { defineExtensionMessaging } from '@webext-core/messaging';

   interface ProtocolMap {
     getStringLength(data: string): number;
     captureScreenshot(): string;
   }

   export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
   ```

2. **`trpc-chrome`** - tRPC adapter for extensions (more structured)
3. **`webext-bridge`** - Streamlined messaging with minimal setup
4. **`@webext-core/proxy-service`** - RPC-style: call functions from any context, execute in background
5. **`Comctx`** - RPC with type safety and flexible adapters

Key difference: Plasmo auto-generates types from file structure; with `@webext-core/messaging`, you define a `ProtocolMap` interface manually, which is explicit but requires manual maintenance.

### Storage: WXT vs Plasmo

WXT's storage API (`wxt/storage`) is built-in and feature-rich:

```typescript
import { storage } from '#imports';

// Define typed storage items with fallbacks
const showChangelog = storage.defineItem<boolean>('local:showChangelog', {
  fallback: true,
});

// Use
await showChangelog.getValue();    // boolean (never undefined with fallback)
await showChangelog.setValue(false);

// Watch for changes across contexts
const unwatch = showChangelog.watch((newValue) => {
  console.log('Changed:', newValue);
});

// Versioning and migrations
const settings = storage.defineItem<SettingsV2>('local:settings', {
  fallback: defaultSettings,
  version: 2,
  migrations: {
    2: (oldData: SettingsV1): SettingsV2 => ({ ...migrateV1toV2(oldData) }),
  },
});
```

**WXT storage advantages over Plasmo:**
- Built-in versioning and migrations
- Metadata support (store timestamps, version alongside values)
- Bulk operations (`getItems`, `setItems`)
- `init` option (one-time initialization on first access)
- All keys prefixed by storage area (`local:`, `session:`, `sync:`, `managed:`)

**Migration caveat:** Storage format is incompatible between Plasmo and WXT. Migration requires deserialization logic to handle format differences.

---

## 3. WXT Project Structure Details

### Entrypoint Definition

**Background service worker:**
```typescript
// entrypoints/background.ts
export default defineBackground({
  type: 'module',
  main() {
    browser.action.onClicked.addListener(async (tab) => {
      // Toggle side panel
      await browser.sidePanel.open({ tabId: tab.id });
    });
  },
});
```

**Content script with React CSUI:**
```typescript
// entrypoints/content.ts
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'sop-recorder-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    ui.mount();
  },
});
```

### Manifest Generation

WXT auto-generates `manifest.json` from:
1. **`wxt.config.ts`** - Global manifest properties
2. **Entrypoint files** - Inline config via `define*()` functions or HTML `<meta>` tags
3. **File conventions** - Entrypoint names determine their manifest role

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  manifest: {
    name: 'SOP Recorder',
    description: 'Record standard operating procedures',
    permissions: ['storage', 'tabs', 'activeTab', 'sidePanel'],
    action: {},  // Required for side panel toggle
    icons: {
      16: '/icon-16.png',
      48: '/icon-48.png',
      128: '/icon-128.png',
    },
  },
});
```

Dynamic manifest generation based on target:
```typescript
manifest: ({ browser, manifestVersion, mode, command }) => ({
  permissions: [
    'storage',
    'tabs',
    ...(manifestVersion === 3 ? ['sidePanel'] : []),
  ],
})
```

**Auto-generated properties:**
- `name` from `package.json` if not specified
- `version` / `version_name` from `package.json`
- Icons auto-discovered from `public/` directory
- `sidePanel` permission auto-added when sidepanel entrypoint exists
- MV3 properties auto-converted for MV2 targets

### Permissions

- Declared in `wxt.config.ts` under `manifest.permissions`
- Some auto-added: `sidePanel` (from sidepanel entrypoint), `tabs` + `scripting` (dev mode only)
- MV2/MV3 compatibility handled automatically (`action` -> `browser_action`)

### Assets and Static Files

- `public/` directory: Files copied as-is to output (icons, static HTML)
- `assets/` directory: Processed by Vite (CSS, images with imports)
- Import assets directly: `import logo from '~/assets/logo.png'`
- No `data-base64:` prefix needed (unlike Plasmo)

### Testing with Vitest

WXT provides first-class Vitest integration:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
});
```

**WxtVitest plugin automatically:**
- Polyfills `browser.*` APIs with `@webext-core/fake-browser` (in-memory)
- Integrates Vite config from `wxt.config.ts`
- Enables auto-imports in tests
- Sets up global variables (`import.meta.env.BROWSER`, etc.)
- Configures path aliases (`@/*`, `@@/*`)

**Storage works in tests without mocking:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

const accountStorage = storage.defineItem<Account>('local:account');

describe('isLoggedIn', () => {
  beforeEach(() => {
    fakeBrowser.reset();  // Reset in-memory storage between tests
  });

  it('returns true when account exists', async () => {
    await accountStorage.setValue({ username: 'test' });
    expect(await isLoggedIn()).toBe(true);
  });
});
```

**Mocking WXT APIs:**
```typescript
// Mock using real import path, not #imports
vi.mock('wxt/utils/inject-script', () => ({
  injectScript: vi.fn(),
}));
```

---

## 4. Migration Considerations (Plasmo to WXT)

### Estimated Migration Effort

Based on community migration reports, migration is **moderate effort** with most code reusable:

| Area | Effort | Notes |
|------|--------|-------|
| Project structure | Low | Move files to `entrypoints/` directory |
| Configuration | Low | `package.json` manifest -> `wxt.config.ts` |
| TypeScript config | Low | Extend `.wxt/tsconfig.json` |
| React components | Minimal | Reuse as-is |
| Content scripts | Low-Medium | Update to `defineContentScript()`, adapt CSUI |
| Background script | Low | Update to `defineBackground()` |
| Messaging | Medium | Replace `@plasmohq/messaging` with `@webext-core/messaging` |
| Storage | Medium | Different format; needs migration logic for existing users |
| Environment variables | Low | `process.env.PLASMO_*` -> `import.meta.env.VITE_*` |
| Asset imports | Low | Remove `data-base64:` prefix |
| Icons | Low | Manual sizes or use auto-icons plugin |

### Migration Guides Available

1. **Official WXT comparison page**: https://wxt.dev/guide/resources/compare
2. **Jetwriter migration blog**: Detailed step-by-step guide covering all major changes
3. **GitHub Discussion #782**: Community experiences and tips

### Patterns That Translate Directly

- React component code (popup, options, sidepanel UI)
- Business logic / utility functions
- CSS / Tailwind configuration (via Vite plugins)
- Most content script DOM manipulation logic
- Extension API calls (`browser.tabs.*`, `browser.storage.*`, etc.)

### What Needs Rewriting

1. **Messaging layer**: Replace `@plasmohq/messaging` with `@webext-core/messaging` or alternatives. Manual type definitions required instead of auto-generated.
2. **Storage initialization**: New API surface; existing stored data may need format migration.
3. **Content Script UI mounting**: Switch from Plasmo CSUI to WXT's `createShadowRootUi()` / `createIntegratedUi()` / `createIframeUi()`.
4. **Environment variable access**: `process.env.PLASMO_PUBLIC_*` -> `import.meta.env.VITE_*`
5. **Asset imports**: Remove Plasmo-specific import schemes.
6. **Build scripts**: `plasmo build` -> `wxt build`, `plasmo dev` -> `wxt dev`

### Key Gotchas

- **React.StrictMode**: Components render twice in dev mode, causing duplicate side effects. Design message sends and API calls to handle double invocation.
- **Port conflicts**: WXT defaults to port 3000 (same as Next.js). Use `--port 9000` to avoid conflicts.
- **No runtime code outside `main()`**: Background and content scripts must have all runtime code inside the `main()` function.
- **Entrypoint depth limit**: Files must be zero or one level deep inside `entrypoints/`.
- **Shared code**: Context-independent utilities go in `shared/` or `utils/` directory; avoid using `document`/`window` APIs in shared modules.

---

## 5. WXT Best Practices for Our Use Case

### Side Panel with React

```typescript
// entrypoints/sidepanel/index.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SOP Recorder</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>

// entrypoints/sidepanel/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Toggle from background:
```typescript
// entrypoints/background.ts
export default defineBackground({
  main() {
    browser.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        await browser.sidePanel.open({ tabId: tab.id });
      }
    });
  },
});
```

### Content Script for Event Capture

```typescript
// entrypoints/recorder.content.ts
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main(ctx) {
    // Listen for recording start/stop from side panel
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'START_RECORDING') startCapture(ctx);
      if (message.type === 'STOP_RECORDING') stopCapture();
    });
  },
});

function startCapture(ctx: ContentScriptContext) {
  ctx.addEventListener(document, 'click', handleClick, true);
  ctx.addEventListener(document, 'input', handleInput, true);
  ctx.addEventListener(document, 'change', handleChange, true);
  // ctx.addEventListener auto-cleans up on context invalidation
}
```

The `ctx` object is critical - it automatically manages event listener cleanup when the extension context is invalidated (e.g., after extension updates).

### Background Service Worker for State Management

```typescript
// entrypoints/background.ts
export default defineBackground({
  type: 'module',
  main() {
    // State stored in WXT storage (persists across SW restarts)
    const recordingState = storage.defineItem<RecordingState>('session:recording', {
      fallback: { isRecording: false, steps: [] },
    });

    // Handle messages from content script and side panel
    onMessage('addStep', async (message) => {
      const state = await recordingState.getValue();
      state.steps.push(message.data);
      await recordingState.setValue(state);
    });

    onMessage('getState', async () => {
      return await recordingState.getValue();
    });
  },
});
```

### Screenshot Capture Pattern

```typescript
// entrypoints/background.ts (inside main)
onMessage('captureScreenshot', async (message) => {
  const dataUrl = await browser.tabs.captureVisibleTab(undefined, {
    format: 'png',
    quality: 80,
  });
  return dataUrl;
});
```

For offscreen document processing (if needed for canvas manipulation):
```
entrypoints/
  offscreen.html          -> Offscreen document entrypoint
  offscreen/main.ts       -> Canvas processing logic
```

### Storage for Settings

```typescript
// shared/storage.ts
import { storage } from '#imports';

export const settings = storage.defineItem<UserSettings>('sync:settings', {
  fallback: {
    captureScreenshots: true,
    highlightClicks: true,
    outputFormat: 'markdown',
    theme: 'system',
  },
  version: 1,
});

export const recordingState = storage.defineItem<RecordingState>('session:recording', {
  fallback: { isRecording: false, currentSOP: null, steps: [] },
});

export const sopHistory = storage.defineItem<SOP[]>('local:sopHistory', {
  fallback: [],
  version: 1,
});
```

Use `sync:` for settings (synced across devices), `session:` for transient recording state, `local:` for persistent local data.

---

## 6. WXT Ecosystem

### Official Modules

| Module | Package | Purpose |
|--------|---------|---------|
| React | `@wxt-dev/module-react` | React + Vite plugin auto-config |
| Vue | `@wxt-dev/module-vue` | Vue support |
| Svelte | `@wxt-dev/module-svelte` | Svelte support |
| Solid | `@wxt-dev/module-solid` | SolidJS support |
| Auto Icons | `@wxt-dev/auto-icons` | Auto-generate icon sizes |
| Storage | `@wxt-dev/storage` | Standalone storage (also built-in) |
| i18n | Built-in | Internationalization |
| Module System | Built-in | Create reusable modules |

### Recommended Companion Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| `@webext-core/messaging` | Type-safe messaging | By WXT author; lightweight |
| `@webext-core/proxy-service` | RPC-style background calls | Call background functions from any context |
| `@webext-core/fake-browser` | Testing mock | In-memory browser API for Vitest |
| `webext-bridge` | Messaging | Alternative with simpler API |
| `trpc-chrome` | Structured messaging | tRPC adapter for extensions |

### Testing Utilities

- **Vitest** with `WxtVitest` plugin (first-class support)
- **`@webext-core/fake-browser`** - In-memory browser API polyfill
- Storage works without mocking in tests
- Auto-import support in test files
- E2E testing possible but requires custom setup

### Community Examples Relevant to Our Use Case

| Example | URL |
|---------|-----|
| Offscreen Document Setup | `github.com/wxt-dev/examples/tree/main/examples/offscreen-document-setup` |
| Vitest Unit Testing | `github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing` |
| Screenshot Editor (WXT + React) | `github.com/raakkan/screenshot-editor` - Full screenshot capture & editing extension |
| WXT React + Shadcn + Tailwind | `github.com/imtiger/wxt-react-shadcn-tailwindcss-chrome-extension` |
| WXT Side Panel Sample (React) | `github.com/pikum99/wxt-side-panel-sample` |

---

## 7. Recommendation Summary

### Why WXT Over Plasmo for SOP Recorder

1. **Active maintenance** vs Plasmo's maintenance mode - critical for long-term project
2. **40-85% smaller bundles** - important for extension store acceptance
3. **Superior HMR** across all contexts including background service worker
4. **Better CSUI options** - 3 modes (integrated, shadow root, iframe) vs Plasmo's single approach
5. **Framework-agnostic** - not locked into React-specific patterns
6. **Vite ecosystem** - full access to Vite plugins, faster builds
7. **Built-in storage with migrations** - essential for evolving data schemas
8. **Firefox sources ZIP** - required for Firefox store compliance
9. **Auto-opens browser** during development - better DX
10. **Growing community** - 9.4k stars, 2.7k dependent projects

### Trade-offs to Accept

1. **No built-in messaging** - Must use `@webext-core/messaging` (by same author, well-maintained)
2. **Manual type definitions for messages** - No auto-generation like Plasmo
3. **Newer ecosystem** - Fewer blog posts/tutorials (but growing rapidly)
4. **Version 0.x** - Not yet 1.0, though API is stable and widely used in production

### Migration Feasibility: HIGH

For a greenfield project (which SOP Recorder is), there is no migration cost - we start fresh with WXT. The framework provides everything needed for our architecture: side panel, content scripts with CSUI, background service worker, storage, and screenshot capture.

---

## Sources

- [WXT Official Site](https://wxt.dev/)
- [WXT GitHub Repository](https://github.com/wxt-dev/wxt)
- [WXT vs Plasmo Comparison](https://wxt.dev/guide/resources/compare)
- [WXT Content Scripts Guide](https://wxt.dev/guide/essentials/content-scripts)
- [WXT Frontend Frameworks Guide](https://wxt.dev/guide/essentials/frontend-frameworks)
- [WXT Entrypoints Guide](https://wxt.dev/guide/essentials/entrypoints)
- [WXT Storage API](https://wxt.dev/storage)
- [WXT Messaging Guide](https://wxt.dev/guide/essentials/messaging)
- [WXT Manifest Configuration](https://wxt.dev/guide/essentials/config/manifest)
- [WXT Unit Testing Guide](https://wxt.dev/guide/essentials/unit-testing)
- [WXT Examples Repository](https://github.com/wxt-dev/wxt-examples)
- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Jetwriter: Migrating from Plasmo to WXT](https://jetwriter.ai/blog/migrate-plasmo-to-wxt)
- [WXT vs Plasmo Discussion #782](https://github.com/wxt-dev/wxt/discussions/782)
- [Chrome Extension Framework Comparison 2025](https://www.devkit.best/blog/mdx/chrome-extension-framework-comparison-2025)
- [Top 5 Chrome Extension Frameworks 2026](https://extensionbooster.com/blog/best-chrome-extension-frameworks-compared/)
- [@wxt-dev/module-react on npm](https://www.npmjs.com/package/@wxt-dev/module-react)
- [@webext-core/messaging](https://webext-core.aklinker1.io/messaging/installation)
- [Screenshot Editor Extension (WXT + React)](https://github.com/raakkan/screenshot-editor)
- [WXT Side Panel Sample (React)](https://github.com/pikum99/wxt-side-panel-sample)
