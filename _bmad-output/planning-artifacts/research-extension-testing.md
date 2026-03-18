# Automated Testing for Chrome Extensions — Practical Guide

> Research compiled March 2026. Focuses on Manifest V3 extensions with TypeScript, targeting CI/CD without manual browser installation.

---

## 1. Type Checking & Static Analysis

### TypeScript Strict Mode Configuration

Enable the full strict family in `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "strict": true,                    // Enables all strict sub-flags
    "noUncheckedIndexedAccess": true,  // Catches undefined from obj[key]
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "target": "ES2022",               // Service workers support ES2022
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["chrome"]
  }
}
```

### `@types/chrome` — Coverage & Alternatives

Two packages exist:

| Package | Source | Update Frequency | Notes |
|---------|--------|-----------------|-------|
| `@types/chrome` | DefinitelyTyped (community) | Manual PRs | Most widely used; `npm i -D @types/chrome` |
| `chrome-types` | Google (auto-generated from Chromium source) | Daily via GitHub Actions | MV3-only by default; more current |

**Known gaps in `@types/chrome`:**
- New APIs (e.g., `chrome.sidePanel`) may lag behind Chromium releases
- Some callback-style overloads missing Promise variants
- `chrome.scripting.executeScript` generic return types can be imprecise

**Recommendation:** Use `@types/chrome` for broad ecosystem compatibility. Supplement with manual type declarations for bleeding-edge APIs:

```typescript
// types/chrome-sidepanel.d.ts (if @types/chrome is behind)
declare namespace chrome.sidePanel {
  interface PanelOptions {
    path?: string;
    enabled?: boolean;
    tabId?: number;
  }
  function setOptions(options: PanelOptions): Promise<void>;
  function setPanelBehavior(behavior: { openPanelOnActionClick: boolean }): Promise<void>;
}
```

### ESLint Rules for Chrome Extensions

No mature Chrome-extension-specific ESLint plugin exists as of 2026. Instead, compose standard rules:

```javascript
// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      // Security: extensions must never use eval
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Prevent accidental globals in content scripts
      'no-implicit-globals': 'error',

      // Async best practices (most chrome.* APIs return Promises in MV3)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    }
  }
);
```

### Manifest Validation

No dominant automated linter exists. Best approach: write a JSON Schema validator or a custom script:

```typescript
// scripts/validate-manifest.ts
import manifest from '../dist/manifest.json';

const required = ['manifest_version', 'name', 'version', 'permissions'];
for (const key of required) {
  if (!(key in manifest)) {
    throw new Error(`Missing required manifest key: ${key}`);
  }
}
if (manifest.manifest_version !== 3) {
  throw new Error('Must be Manifest V3');
}
// Validate CSP does not allow unsafe-eval
if (manifest.content_security_policy?.extension_pages?.includes('unsafe-eval')) {
  throw new Error('CSP must not allow unsafe-eval');
}
console.log('Manifest validation passed');
```

Mozilla's `web-ext lint` command can also validate manifests structurally, even for Chrome-targeted extensions (it validates against the WebExtension standard).

---

## 2. Unit Testing Without a Browser

### Mocking `chrome.*` APIs — Library Comparison

| Library | Test Framework | Last Updated | Approach | TypeScript |
|---------|---------------|-------------|----------|------------|
| `jest-chrome` | Jest | ~2023 | Full mock from Chromium schemas | Yes (built-in) |
| `sinon-chrome` | Any (Mocha, etc.) | ~2022 | Sinon stubs from Chromium schemas | Partial |
| Manual mocks | Any | N/A | DIY `global.chrome = {...}` | Yes |

**Recommendation:** For new projects using Vitest, use manual mocks (they are straightforward). For Jest projects, `jest-chrome` is the most complete option.

### jest-chrome Setup

```bash
pnpm add -D jest-chrome @types/chrome
```

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterSetup: ['./jest.setup.js'],
};
```

```javascript
// jest.setup.js
Object.assign(global, require('jest-chrome'));
```

### Manual Mocking for Vitest (Recommended for New Projects)

```typescript
// test/setup.ts
import { vi } from 'vitest';

const chromeMock = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({
      manifest_version: 3,
      name: 'Test Extension',
      version: '1.0.0',
    })),
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
    lastError: null as chrome.runtime.LastError | null,
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  sidePanel: {
    setOptions: vi.fn(),
    setPanelBehavior: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
};

vi.stubGlobal('chrome', chromeMock);

export { chromeMock };
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    environment: 'jsdom', // or 'happy-dom' for speed
  },
});
```

### Testing Service Worker Logic

Decouple business logic from Chrome API calls using dependency injection:

```typescript
// src/background/recording.ts
export interface ChromeTabsAPI {
  query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]>;
  sendMessage(tabId: number, message: unknown): Promise<unknown>;
}

export class RecordingService {
  constructor(private tabs: ChromeTabsAPI) {}

  async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    const tabs = await this.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? null;
  }

  async sendCommand(tabId: number, command: string): Promise<void> {
    await this.tabs.sendMessage(tabId, { type: 'COMMAND', command });
  }
}
```

```typescript
// test/recording.test.ts
import { describe, it, expect, vi } from 'vitest';
import { RecordingService, ChromeTabsAPI } from '../src/background/recording';

describe('RecordingService', () => {
  const mockTabs: ChromeTabsAPI = {
    query: vi.fn(),
    sendMessage: vi.fn(),
  };

  it('returns active tab', async () => {
    const fakeTab = { id: 1, url: 'https://example.com' } as chrome.tabs.Tab;
    vi.mocked(mockTabs.query).mockResolvedValue([fakeTab]);

    const service = new RecordingService(mockTabs);
    const tab = await service.getActiveTab();

    expect(tab).toEqual(fakeTab);
    expect(mockTabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
  });
});
```

### Testing Content Script Logic in Isolation

Content scripts manipulate the DOM. Use `jsdom` (more accurate) or `happy-dom` (faster):

```typescript
// test/content-script.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { highlightElement } from '../src/content/highlighter';

// vitest.config.ts sets environment: 'jsdom'

describe('highlightElement', () => {
  beforeEach(() => {
    document.body.textContent = '';
    const div = document.createElement('div');
    div.id = 'target';
    div.textContent = 'Click me';
    document.body.appendChild(div);
  });

  it('adds highlight overlay to target element', () => {
    const el = document.getElementById('target')!;
    highlightElement(el);
    expect(el.style.outline).toBe('2px solid red');
  });
});
```

**jsdom limitations for content scripts:**
- No layout engine: `getBoundingClientRect()` returns zeros
- No CSS computed styles
- No `IntersectionObserver`, `MutationObserver` (partial), `ResizeObserver`
- No navigation or page lifecycle events
- Workaround: Use Vitest Browser Mode (runs in real Playwright browser) for DOM-heavy tests

### Testing Message Passing

```typescript
// src/shared/messages.ts
export type Message =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'STEP_RECORDED'; payload: { selector: string; action: string } };

export type MessageResponse =
  | { success: true }
  | { success: false; error: string };
```

```typescript
// test/message-handler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chromeMock } from './setup';
import { handleMessage } from '../src/background/message-handler';

describe('message handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responds to START_RECORDING', async () => {
    const sendResponse = vi.fn();
    const result = await handleMessage(
      { type: 'START_RECORDING' },
      { id: 'sender-id' } as chrome.runtime.MessageSender,
      sendResponse
    );
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('round-trip: background sends to content, content responds', async () => {
    chromeMock.tabs.sendMessage.mockResolvedValue({ success: true });

    const response = await chrome.tabs.sendMessage(1, { type: 'START_RECORDING' });
    expect(response).toEqual({ success: true });
  });
});
```

---

## 3. Integration / E2E Testing With a Real Browser

### Loading an Unpacked Extension in Playwright

```typescript
// e2e/fixtures.ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false, // Required — extensions do not work in old headless
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});
export const expect = test.expect;
```

**Key points:**
- Must use `launchPersistentContext` (not `browser.launch()`)
- Must use Chromium (Firefox/WebKit do not support Chrome extensions)
- Must use `headless: false` (use `xvfb-run` in CI for headless environments)
- Always point to the built `dist/` directory, not source
- Since Playwright v1.49+, the new headless mode supports extensions via the `chromium` channel

**Headless extension testing (Playwright >= 1.49):**

```typescript
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',  // Uses new headless mode that supports extensions
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});
```

### Testing Extension Popup as a Page

```typescript
test('popup renders timer options', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.locator('h1')).toHaveText('SOP Recorder');
  await expect(page.getByRole('button', { name: 'Start Recording' })).toBeVisible();
});
```

### Testing Content Script on Real Pages

```typescript
test('content script injects on target page', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto('https://example.com');

  // Wait for content script to inject its UI
  await page.waitForSelector('#sop-recorder-root', { timeout: 5000 });
  await expect(page.locator('#sop-recorder-root')).toBeVisible();
});
```

### Testing chrome.storage in E2E

```typescript
test('storage persists recording state', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  // Start recording via UI
  await page.click('button:has-text("Start")');

  // Verify storage was written via service worker
  const [sw] = context.serviceWorkers();
  const result = await sw.evaluate(() => {
    return chrome.storage.local.get('isRecording');
  });
  expect(result.isRecording).toBe(true);
});
```

### Multi-Window Testing with CDP

```typescript
// Switch focus between tabs for integration tests
async function bringToFront(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Page.bringToFront');
}
```

### Playwright vs Puppeteer for Extension Testing

| Feature | Playwright | Puppeteer |
|---------|-----------|-----------|
| Extension loading | `launchPersistentContext` | `puppeteer.launch({ args })` |
| Service worker access | `context.serviceWorkers()` | `browser.targets()` |
| Headless with extensions | Yes (v1.49+ with `channel: 'chromium'`) | No (requires headed or xvfb) |
| Test runner integration | Built-in `@playwright/test` | Needs Jest/Mocha/Vitest |
| Auto-wait / locators | Yes (robust) | Manual waits |
| Parallel execution | Yes (workers) | Manual |
| Cross-browser | Chromium only for extensions | Chrome only |
| **Recommendation** | **Preferred for new projects** | Legacy / existing setups |

---

## 4. Side Panel Testing

### Current Limitations (as of March 2026)

Playwright **cannot directly open or access the Chrome side panel DOM**. This is a known limitation tracked in [Playwright issue #26693](https://github.com/microsoft/playwright/issues/26693).

### Workaround Strategies

**Strategy 1: Test side panel HTML as a standalone page**

```typescript
test('side panel renders correctly', async ({ page, extensionId }) => {
  // Load the side panel HTML directly (bypasses chrome.sidePanel API)
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  await expect(page.locator('h1')).toHaveText('Recording Steps');
  await expect(page.getByRole('list')).toBeVisible();
});
```

This works because the side panel is just an HTML page. Loading it directly tests rendering, component behavior, and accessibility — everything except the chrome.sidePanel open/close lifecycle.

**Strategy 2: Test service worker communication that the side panel depends on**

```typescript
test('service worker responds to side panel messages', async ({ context }) => {
  const [sw] = context.serviceWorkers();
  const response = await sw.evaluate(async () => {
    return new Promise((resolve) => {
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.type === 'GET_STEPS') {
          sendResponse({ steps: [] });
        }
      });
      chrome.runtime.sendMessage({ type: 'GET_STEPS' }, resolve);
    });
  });
  expect(response).toEqual({ steps: [] });
});
```

**Strategy 3: Test side panel behavior indirectly through content script effects**

If the side panel triggers content script actions (e.g., highlighting elements), test those effects on real pages instead.

### Accessibility Testing for Side Panel

Since you can load `sidepanel.html` directly, accessibility testing works normally:

```typescript
import AxeBuilder from '@axe-core/playwright';

test('side panel is WCAG 2.1 AA compliant', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('side panel has correct ARIA landmarks', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Verify keyboard navigability
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).not.toBe('BODY'); // Something should receive focus

  // Check for main landmark
  await expect(page.locator('[role="main"], main')).toHaveCount(1);
});
```

---

## 5. CI/CD for Extensions

### GitHub Actions Workflow

```yaml
# .github/workflows/extension-ci.yml
name: Extension CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck        # tsc --noEmit
      - run: pnpm lint              # eslint
      - run: pnpm validate-manifest # custom script

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit         # vitest run

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm exec playwright install chromium --with-deps
      - run: xvfb-run pnpm test:e2e  # Playwright needs display server
        # Alternatively, with Playwright >= 1.49 using new headless:
        # run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Check bundle size
        run: |
          MAX_SIZE_KB=500
          ACTUAL_SIZE=$(du -sk dist/ | cut -f1)
          echo "Bundle size: ${ACTUAL_SIZE}KB (limit: ${MAX_SIZE_KB}KB)"
          if [ "$ACTUAL_SIZE" -gt "$MAX_SIZE_KB" ]; then
            echo "::error::Bundle size ${ACTUAL_SIZE}KB exceeds limit of ${MAX_SIZE_KB}KB"
            exit 1
          fi

  publish:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [lint-and-typecheck, unit-tests, e2e-tests, bundle-size]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Package extension
        run: cd dist && zip -r ../extension.zip .
      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: extension.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          publish: false  # Upload only; manually publish after review
```

### Chrome Web Store Publishing Setup

To get OAuth credentials for automated publishing:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the Chrome Web Store API
3. Create OAuth 2.0 credentials (Desktop app type)
4. Generate a refresh token via the OAuth playground
5. Store `client_id`, `client_secret`, `refresh_token`, and `extension_id` as GitHub Secrets

### Bundle Size Monitoring

For more granular monitoring, use `size-limit`:

```json
// package.json
{
  "size-limit": [
    { "path": "dist/background.js", "limit": "50 KB" },
    { "path": "dist/content.js", "limit": "30 KB" },
    { "path": "dist/sidepanel.js", "limit": "100 KB" }
  ]
}
```

```bash
pnpm add -D size-limit @size-limit/file
```

---

## 6. Testing Frameworks & Tools Comparison

### Playwright vs Puppeteer — Verdict

**Use Playwright.** It has better ergonomics, built-in test runner, auto-wait, and as of v1.49+ supports headless extension testing via `channel: 'chromium'`. Puppeteer requires more boilerplate and manual waiting.

### WXT Testing Utilities

WXT is a next-gen extension framework (like Next.js for extensions). As of 2026:

- **Built-in testing:** WXT does not ship a dedicated test framework. It recommends using Vitest for unit tests and Playwright for E2E.
- **`@wxt-dev/runner`:** Launches the extension in a real browser for manual or semi-automated testing.
- **`web-ext-run`:** A fork of Mozilla's `web-ext` that WXT uses internally for its dev server. Can run `web-ext lint` for manifest validation.
- **Dev server:** HMR for popup/options pages; auto-reloads service workers on change.

### Mozilla `web-ext` CLI

```bash
pnpm add -D web-ext
```

Useful commands for Chrome extension development:

```bash
# Validate manifest and extension structure
pnpm web-ext lint --source-dir ./dist

# Build a distributable zip
pnpm web-ext build --source-dir ./dist --overwrite-dest

# Run in a temporary Chrome profile (for manual testing)
pnpm web-ext run --target chromium --source-dir ./dist
```

`web-ext lint` checks for:
- Invalid manifest fields
- Deprecated APIs
- Unsafe coding patterns (eval, dynamic code execution)
- Missing icons referenced in manifest

Caveat: `web-ext` was built for Firefox WebExtensions. It catches many issues relevant to Chrome, but may miss Chrome-specific MV3 features or flag Firefox-only warnings.

### Extension-Specific Test Tools

| Tool | Purpose | Maturity |
|------|---------|----------|
| `jest-chrome` | Mock chrome.* APIs in Jest | Stable but aging (2023) |
| `sinon-chrome` | Mock chrome.* APIs with Sinon | Stable but aging (2022, Chrome 53 schemas) |
| `web-ext lint` | Manifest + code validation | Mature (Mozilla-maintained) |
| `@axe-core/playwright` | Accessibility testing | Mature |
| `chrome-webstore-upload` | Automated CWS publishing | Stable |
| `size-limit` | Bundle size enforcement | Mature |
| `playwright-crx` | Playwright running inside an extension | Experimental |

---

## 7. Baseline Tests Every Extension Should Have

### 7.1 Manifest Structure Validation

```typescript
// test/manifest.test.ts
import { describe, it, expect } from 'vitest';
import manifest from '../dist/manifest.json';

describe('manifest.json', () => {
  it('is valid Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('has required fields', () => {
    expect(manifest.name).toBeDefined();
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.description).toBeDefined();
  });

  it('declares a service worker', () => {
    expect(manifest.background?.service_worker).toBeDefined();
  });

  it('has icons at required sizes', () => {
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons?.['16']).toBeDefined();
    expect(manifest.icons?.['48']).toBeDefined();
    expect(manifest.icons?.['128']).toBeDefined();
  });

  it('does not use overly broad host permissions', () => {
    const hostPerms = manifest.host_permissions ?? [];
    expect(hostPerms).not.toContain('<all_urls>');
    expect(hostPerms).not.toContain('*://*/*');
  });

  it('has a content security policy without unsafe-eval', () => {
    const csp = manifest.content_security_policy?.extension_pages ?? '';
    expect(csp).not.toContain('unsafe-eval');
  });
});
```

### 7.2 Permissions Audit

```typescript
// test/permissions.test.ts
import { describe, it, expect } from 'vitest';
import manifest from '../dist/manifest.json';

// List every chrome.* API namespace your code actually imports/uses
const USED_PERMISSIONS = ['storage', 'tabs', 'activeTab', 'sidePanel', 'scripting'];

describe('permissions audit', () => {
  it('only requests permissions that are used', () => {
    const declared = manifest.permissions ?? [];
    const unused = declared.filter((p: string) => !USED_PERMISSIONS.includes(p));
    expect(unused).toEqual([]);
  });

  it('does not request dangerous permissions unnecessarily', () => {
    const declared = manifest.permissions ?? [];
    const dangerous = ['debugger', 'history', 'webNavigation', 'management'];
    const found = declared.filter((p: string) => dangerous.includes(p));
    expect(found).toEqual([]);
  });
});
```

### 7.3 Service Worker Starts Without Errors

```typescript
// e2e/baseline.spec.ts
import { test, expect } from './fixtures';

test('service worker starts without errors', async ({ context }) => {
  const errors: string[] = [];

  // Listen for console errors from the service worker
  const [sw] = context.serviceWorkers();
  sw.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Give the service worker time to initialize
  await sw.evaluate(() => new Promise(r => setTimeout(r, 1000)));
  expect(errors).toEqual([]);
});
```

### 7.4 Content Script Injects on Target Pages

```typescript
test('content script injects on matching URLs', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('https://example.com');

  // Verify content script injected (check for a known DOM element or class)
  const injected = await page.evaluate(() => {
    return document.querySelector('[data-sop-recorder]') !== null
      || typeof (window as any).__SOP_RECORDER_LOADED__ === 'boolean';
  });
  expect(injected).toBe(true);
});
```

### 7.5 Side Panel Renders and Is Accessible

```typescript
import AxeBuilder from '@axe-core/playwright';

test('side panel renders correctly', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  // Renders without blank page
  const bodyText = await page.locator('body').textContent();
  expect(bodyText?.trim().length).toBeGreaterThan(0);

  // Key UI elements present
  await expect(page.getByRole('heading')).toBeVisible();
});

test('side panel passes WCAG 2.1 AA', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### 7.6 No Console Errors on Startup

```typescript
test('no console errors on extension pages', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
});
```

### 7.7 Storage Operations Work

```typescript
test('storage round-trip works', async ({ context }) => {
  const [sw] = context.serviceWorkers();

  // Write and read back
  const result = await sw.evaluate(async () => {
    await chrome.storage.local.set({ testKey: 'testValue' });
    const data = await chrome.storage.local.get('testKey');
    await chrome.storage.local.remove('testKey');
    return data;
  });

  expect(result).toEqual({ testKey: 'testValue' });
});
```

### 7.8 Message Passing Round-Trip

```typescript
test('message round-trip between background and content', async ({ context, extensionId }) => {
  // Set up a listener in the service worker
  const [sw] = context.serviceWorkers();
  await sw.evaluate(() => {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'PING') {
        sendResponse({ type: 'PONG' });
      }
      return true; // async response
    });
  });

  // Send message from a page context (simulating content script)
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

  const response = await page.evaluate(async () => {
    return chrome.runtime.sendMessage({ type: 'PING' });
  });

  expect(response).toEqual({ type: 'PONG' });
});
```

---

## Quick-Start Checklist

```
[ ] tsconfig.json — strict: true, @types/chrome
[ ] eslint.config.mjs — strictTypeChecked + no-eval + no-floating-promises
[ ] vitest — unit tests with manual chrome.* mocks
[ ] playwright — e2e fixtures with launchPersistentContext
[ ] axe-core — accessibility on sidepanel.html
[ ] manifest validation — test or script
[ ] permissions audit — test
[ ] GitHub Actions — lint + typecheck + unit + e2e + bundle size
[ ] size-limit — per-file bundle budgets
[ ] web-ext lint — structural validation
```

---

## Sources

- [Playwright Chrome Extensions Docs](https://playwright.dev/docs/chrome-extensions)
- [Chrome for Developers — Unit Testing Extensions](https://developer.chrome.com/docs/extensions/how-to/test/unit-testing)
- [jest-chrome on GitHub](https://github.com/extend-chrome/jest-chrome)
- [sinon-chrome on GitHub](https://github.com/acvetkov/sinon-chrome)
- [Playwright Issue #26693 — Side Panel Support](https://github.com/microsoft/playwright/issues/26693)
- [E2E Tests for Chrome Extensions Using Playwright and CDP](https://dev.to/corrupt952/how-i-built-e2e-tests-for-chrome-extensions-using-playwright-and-cdp-11fl)
- [chrome-types (Google auto-generated)](https://github.com/GoogleChrome/chrome-types)
- [@types/chrome on npm](https://www.npmjs.com/package/@types/chrome)
- [chrome-webstore-upload GitHub Action](https://github.com/mnao305/chrome-extension-upload)
- [Playwright Headless Changes (Issue #33566)](https://github.com/microsoft/playwright/issues/33566)
- [WXT Framework](https://wxt.dev/)
- [web-ext CLI](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [BrowserStack — Playwright Chrome Extension Guide](https://www.browserstack.com/guide/playwright-chrome-extension)
- [Chrome Extension Linting with TypeScript](https://victoronsoftware.com/posts/linting-and-formatting-typescript/)
