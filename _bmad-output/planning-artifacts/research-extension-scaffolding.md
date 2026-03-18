# Research: Extension Scaffolding & Testing-Ready Starter Kits

**Date:** 2026-03-18
**Status:** Complete

---

## Executive Summary

The user's skepticism is **partially validated**: while many CLI scaffolding tools exist for browser extensions, **almost none include testing pre-configured out of the box**. The ecosystem has a clear gap between "scaffolding tools that get you building fast" and "testing infrastructure that gets you testing fast." Only **Bedframe** attempts to bridge this gap with optional Vitest + Testing Library during scaffold, and **WXT** provides first-class Vitest plugin support (but not in the default scaffold). No tool currently gives you a single command that produces an extension with unit tests, E2E tests, and CI/CD all running.

---

## 1. CLI Scaffolding Tools

### 1.1 `npx create-chrome-ext` (guocaoyi/create-chrome-ext)

- **GitHub:** ~2k+ stars, actively maintained
- **Command:** `npx create-chrome-ext` or `npm create chrome-ext`
- **Frameworks:** React, Vue, Svelte, Solid, Preact, Alpine, Lit, Stencil, Inferno, Vanilla
- **What you get:** Vite + HMR + TypeScript + framework boilerplate
- **Testing included?** **No.** No Vitest, Jest, or Playwright configuration
- **CI/CD?** No
- **Verdict:** Fast scaffold, zero testing

### 1.2 `npx wxt@latest init` (WXT)

- **GitHub:** ~7.9k stars, very actively maintained, strong Discord community
- **Command:** `npx wxt@latest init` (or `pnpm dlx wxt@latest init`)
- **Frameworks:** Vanilla, React, Vue, Svelte, Solid (all TypeScript by default)
- **What you get:** Minimal extension with background entrypoint, dev/build/zip scripts
- **Testing included in scaffold?** **No.** Testing is NOT in the default template
- **Testing support available?** **Yes, first-class:**
  - `WxtVitest` plugin provides polyfilled browser APIs, auto-imports, alias resolution
  - `@webext-core/fake-browser` for in-memory browser API mocking
  - Separate examples repo: `vitest-unit-testing` and `playwright-e2e-testing`
- **CI/CD?** Not scaffolded, but documented
- **Verdict:** Best framework overall, but testing requires manual setup after scaffold

### 1.3 `npm create plasmo` (Plasmo)

- **GitHub:** ~12.3k stars (highest count, but misleading -- maintenance concerns)
- **Command:** `npm create plasmo`
- **Frameworks:** React-first (others possible but suboptimal)
- **What you get:** TypeScript + Parcel + React extension scaffold
- **Testing included?** **Not by default.** A `with-jest` example exists in the examples repo but is NOT part of the default scaffold. No Vitest example exists.
- **Testing support?** Plasmo offers "Itero TestBed" for manual/staging testing, not automated test frameworks
- **Maintenance status:** **Concerning.** Described as "maintenance mode with little to no maintainers or feature development." Parcel dependency is lagging major versions behind.
- **CI/CD?** GitHub Actions template for publishing, not testing
- **Verdict:** Declining framework. Skip for new projects.

### 1.4 `npm create bedframe` (Bedframe)

- **GitHub:** ~573 stars, actively maintained (last release: 2026-03-17)
- **Command:** `npm create bedframe`
- **Frameworks:** React, Vue, Svelte, Solid, Preact, Lit, Qwik, Vanilla
- **What you get:** Vite project with the **option** during scaffold to include:
  - Vitest + Testing Library (unit testing)
  - ESLint + Prettier or Biome
  - Git hooks (prepare-commit-msg, pre-commit, commit-msg)
  - Commit linting with conventional commits
  - GitHub CLI integration
- **Testing included?** **Yes, optionally during scaffold.** The CLI prompts whether to add "tests with vitest and testing library." When enabled, generates `vitest.config.ts` and `vitest/vitest.setup.ts`.
- **E2E testing?** Playwright is mentioned in docs as recommended but does NOT appear to be auto-scaffolded
- **CI/CD?** GitHub Actions workflows pre-configured
- **Browser support:** Broadest -- Chrome, Firefox, Edge, Safari, Opera, Brave, Arc
- **Verdict:** Most "batteries-included" scaffold available. Small community is the main risk.

### 1.5 `npx extension create` (Extension.js)

- **GitHub:** ~4.9k stars, actively maintained
- **Command:** `npx extension create my-extension`
- **Frameworks:** React, Vue, Svelte, Preact, TypeScript, ESNext
- **What you get:** Zero-config cross-browser extension with dev/build/preview
- **Testing included?** **No** (despite having Playwright + Vitest in the framework's own repo for internal testing)
- **CI/CD?** No
- **Fastest onboarding:** Claims 60 seconds to first extension
- **Verdict:** Best for prototyping and hackathons. No testing story for users.

### 1.6 Yeoman Generators (Legacy)

| Generator | Last Published | Status |
|-----------|---------------|--------|
| `generator-chrome-extension` | Years ago | Legacy, MV2 era |
| `generator-web-extension` | 7+ years ago | Abandoned |
| `generator-chrome-extension-kickstart` | Years ago | Abandoned |

**Verdict:** All Yeoman generators are effectively dead for modern extension development.

### 1.7 Other npm Packages

| Package | Status |
|---------|--------|
| `create-browser-extension` | v1.0.0, published 7+ years ago. Dead. |
| `@clydedsouza/create-chrome-extension` | Basic template generator |
| `chrome-extension-cli` | Webpack-based, no testing |
| `create-web-ext` | Basic scaffolding |

---

## 2. Testing-Ready Templates & Boilerplates on GitHub

### 2.1 Jonghakseo/chrome-extension-boilerplate-react-vite

- **Stars:** 4.8k (very popular)
- **Stack:** React + Vite + TypeScript + Turborepo monorepo
- **Testing:** WebdriverIO E2E tests (`pnpm e2e`)
- **Extras:** Tailwind CSS, ESLint, Prettier, i18n, HMR, Chrome storage helpers
- **CI/CD:** GitHub Actions for build + lint
- **Status:** **Archived on 2026-02-14** (read-only)
- **Verdict:** Was the gold standard boilerplate. Now archived. E2E via WebdriverIO, not Playwright.

### 2.2 kelseyaubrecht/playwright-chrome-extension-testing-template

- **Stars:** 3 (very small)
- **What it is:** A GitHub template repo specifically for testing Chrome extensions with Playwright
- **Includes:** Playwright config, test fixtures for extension ID retrieval, sample extension with content/background scripts, GitHub Actions CI workflow
- **Limitation:** Service worker required for fixture to work
- **Verdict:** Excellent reference for Playwright + extension E2E patterns. Too small/niche to be a full starter.

### 2.3 davidnguyen11/web-extension-boilerplate

- **Stack:** TypeScript + Jest + Webpack + GitHub Actions
- **Testing:** Jest pre-configured
- **Verdict:** Older Webpack-based approach but does include testing

### 2.4 WXT Official Examples (wxt-dev/examples)

Two testing-specific examples:

1. **`vitest-unit-testing`** -- Minimal setup showing `WxtVitest()` plugin, `fakeBrowser` API mocking, package.json with test script
2. **`playwright-e2e-testing`** -- Full Playwright config, e2e/ directory, requires `pnpm build` before running tests

These are excellent **reference implementations** but are NOT part of the default `wxt init` scaffold.

### 2.5 Google Chrome Extension Samples (GoogleChrome/chrome-extensions-samples)

- **Testing included?** **No.** These are simple API usage examples, not production templates. No test files.

---

## 3. Extension Development Platforms / Meta-Frameworks

### 3.1 WXT (wxt.dev)

- **Bundler:** Vite
- **Architecture:** Nuxt-inspired file-based entrypoints
- **Testing story:**
  - Unit: First-class Vitest plugin (`WxtVitest()`) with fake browser API
  - E2E: Playwright docs + example (manual setup)
  - Neither is scaffolded by default
- **Unique strengths:** Auto-imports, storage API wrapper, reusable module system, automated publishing, smallest bundles (387 KB), fastest builds (1.2s)
- **Market position:** Consensus "best framework" for new extension projects in 2025-2026

### 3.2 Extension.js (extension.js.org)

- **Bundler:** Custom (limits plugin ecosystem)
- **Testing story:** None for end users
- **Unique strengths:** Fastest onboarding, cross-browser preview via CLI flags, zero config
- **Best for:** Prototyping, learning, hackathons

### 3.3 CRXJS (@crxjs/vite-plugin)

- **Bundler:** Vite plugin (not a full framework)
- **Status:** Revived in 2025 after years in beta. v2.4.0 released March 2026. New maintenance team.
- **Testing story:** None built-in
- **Unique strengths:** Best content script HMR (~180ms), teaches raw Chrome APIs, minimal abstraction
- **Best for:** Experienced developers who want Vite DX without framework opinions

### 3.4 Bedframe (bedframe.dev)

- **Bundler:** Vite
- **Testing story:** **Best in class for scaffolding.** Optional Vitest + Testing Library during `npm create bedframe`. Playwright recommended in docs.
- **Unique strengths:** Most production-ready out of box (CI/CD, git hooks, commit linting, multi-browser publishing)
- **Weakness:** Small community (573 stars), fewer examples and resources

### 3.5 Plasmo (plasmo.com)

- **Bundler:** Parcel (outdated, lagging versions)
- **Testing story:** `with-jest` example exists but not default. Itero TestBed for manual testing.
- **Status:** Effectively in maintenance mode. Not recommended for new projects.

---

## 4. Best-in-Class Starter Comparison

### Head-to-Head: Zero to "Extension with Tests in CI"

| Criterion | WXT | Extension.js | Bedframe | Plasmo | Manual (Vite+CRXJS) |
|-----------|-----|-------------|----------|--------|---------------------|
| **Scaffold command** | `npx wxt@latest init` | `npx extension create` | `npm create bedframe` | `npm create plasmo` | Manual |
| **Time to running extension** | ~2 min | ~1 min | ~3 min | ~2 min | ~10 min |
| **Unit tests in scaffold?** | No | No | Yes (optional) | No | No |
| **E2E tests in scaffold?** | No | No | No | No | No |
| **CI/CD in scaffold?** | No | No | Yes | Publish only | No |
| **Unit test support quality** | Excellent (WxtVitest) | None | Good (Vitest) | Poor (only Jest example) | Manual |
| **E2E test support quality** | Good (Playwright docs+example) | None | Docs only | None | Manual |
| **Time to add unit tests** | ~10 min (plugin exists) | ~30 min | ~0 min (if opted in) | ~20 min | ~30 min |
| **Time to add E2E tests** | ~30 min (example exists) | ~60 min | ~45 min | ~60 min | ~45 min |
| **Time to add CI** | ~20 min | ~30 min | ~0 min (scaffolded) | ~20 min | ~30 min |
| **Total: zero to tests in CI** | ~60 min | ~2 hr | ~45 min | ~2 hr | ~2 hr |
| **Framework health** | Excellent | Good | Good (small) | Declining | N/A |
| **Bundle size** | 387 KB | 498 KB | Unknown | 812 KB | Varies |

### What's Missing From Each

**WXT:**
- Default scaffold should include Vitest config + sample test
- E2E Playwright setup should be a `wxt init --with-e2e` flag
- CI/CD template (GitHub Actions) should be scaffoldable

**Extension.js:**
- No testing story at all for end users
- No CI/CD templates
- Custom build system limits ecosystem

**Bedframe:**
- E2E testing (Playwright) not auto-scaffolded even when tests enabled
- Small community means fewer Stack Overflow answers, fewer blog posts
- Documentation could be more comprehensive

**Plasmo:**
- No Vitest support (only legacy Jest example)
- Framework maintenance is declining
- Parcel bundler is a liability

---

## 5. Ideal "Start Building" Experience

### What `npx create-sop-recorder` Should Produce

```
sop-recorder/
  .github/
    workflows/
      ci.yml                    # Lint + Unit tests + E2E tests on PR
      release.yml               # Build + package + publish to stores
  src/
    entrypoints/
      background.ts             # Service worker
      popup/
        index.html
        main.tsx
        App.tsx
      content.ts                # Content script
      sidepanel/                # Side panel UI
        index.html
        main.tsx
    components/                 # Shared React components
    hooks/                      # Shared hooks
    utils/                      # Shared utilities
    storage.ts                  # Typed storage definitions
  tests/
    unit/
      utils.test.ts             # Example unit test
      storage.test.ts           # Storage mock example
    e2e/
      popup.spec.ts             # Playwright popup test
      fixtures/
        extension.ts            # Extension loading fixture
  public/
    icons/                      # Extension icons
  wxt.config.ts                 # WXT configuration
  vitest.config.ts              # Vitest + WxtVitest plugin
  playwright.config.ts          # Playwright for extension E2E
  tsconfig.json
  tailwind.config.ts
  postcss.config.js
  eslint.config.js              # Flat config
  prettier.config.js
  .gitignore
  package.json
```

### What Should Come Pre-Configured

| Category | Tool | Why |
|----------|------|-----|
| **Framework** | WXT | Best DX, most active, Vite-based, framework-agnostic |
| **UI** | React 19 + TypeScript 5 | Most ecosystem support, best hiring pool |
| **Styling** | Tailwind CSS 4 | Utility-first, fast iteration |
| **Unit Testing** | Vitest + WxtVitest plugin + @webext-core/fake-browser | First-class WXT support, fast, Vite-native |
| **E2E Testing** | Playwright | Only viable option for extension E2E testing |
| **Linting** | ESLint (flat config) | Industry standard |
| **Formatting** | Prettier | Industry standard |
| **CI/CD** | GitHub Actions | Most common, free for public repos |
| **Git Hooks** | lint-staged + husky (or lefthook) | Pre-commit quality gates |

### How Mature Extension Projects Structure Tests

Based on research into production extensions (Bitwarden, various WXT projects):

**Unit Tests (`tests/unit/` or co-located `*.test.ts`):**
- Test pure utility functions
- Test storage operations with mocked/fake browser API
- Test message parsing/routing logic
- Test state management (if using stores)
- Mock `chrome.*`/`browser.*` APIs using `@webext-core/fake-browser` or `vitest-chrome`

**E2E Tests (`tests/e2e/` or `e2e/`):**
- Use Playwright with `launchPersistentContext()` and `--load-extension` flag
- Build extension first, then test against `.output/chrome-mv3`
- Test popup UI interactions via `chrome-extension://{id}/popup.html`
- Test content script DOM modifications on real pages
- Test service worker lifecycle via `context.serviceWorkers()`
- **Key limitation:** Extension ID is dynamic, must be extracted from service worker URL

**Integration Tests (less common):**
- Test background <-> content script messaging
- Test storage sync between contexts
- Often folded into E2E tests

---

## 6. Key Libraries for Extension Testing

| Library | Purpose | npm |
|---------|---------|-----|
| `wxt/testing/vitest-plugin` | WXT-native Vitest plugin | Built into `wxt` |
| `wxt/testing/fake-browser` | In-memory browser API mock | Built into `wxt` |
| `@webext-core/fake-browser` | Standalone fake browser API | `@webext-core/fake-browser` |
| `vitest-chrome` | Chrome API mock for Vitest | `vitest-chrome` |
| `webextensions-api-mock` | Sinon-based WebExtension API mock | `webextensions-api-mock` |
| `@playwright/test` | E2E testing framework | `@playwright/test` |

---

## 7. Conclusions & Recommendations

### The Gap Is Real

The user is right to be skeptical -- the tooling *should* exist, but it largely doesn't. The browser extension ecosystem is 3-5 years behind web app frameworks (Next.js, Nuxt, SvelteKit) in terms of testing-ready scaffolding. Key observations:

1. **No single tool gives you "extension + tests + CI" in one command.** Bedframe comes closest but lacks E2E scaffolding and has a small community.
2. **WXT has the best testing *support* but doesn't scaffold it.** The `WxtVitest` plugin and Playwright examples are excellent, but you have to wire them up yourself.
3. **E2E testing for extensions is inherently harder** due to dynamic extension IDs, persistent context requirements, and popup accessibility constraints.
4. **The Playwright + extension pattern is well-documented** but not yet productized into any scaffold tool.

### Recommended Approach for SOP Recorder

1. **Use WXT as the foundation** -- best framework health, best Vitest integration, active community
2. **Create a custom scaffold script** (or just a well-structured template repo) that includes:
   - WXT + React + TypeScript + Tailwind
   - Vitest pre-configured with `WxtVitest()` plugin + sample tests
   - Playwright pre-configured for extension E2E + sample tests + fixture for extension ID
   - GitHub Actions CI workflow
   - ESLint + Prettier
3. **Consider contributing upstream** -- a PR to WXT adding `--with-tests` flag to `wxt init` would benefit the entire community

---

## Sources

- [WXT Unit Testing Docs](https://wxt.dev/guide/essentials/unit-testing)
- [WXT E2E Testing Docs](https://wxt.dev/guide/essentials/e2e-testing)
- [WXT Installation](https://wxt.dev/guide/installation.html)
- [WXT Vitest Example](https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing)
- [WXT Playwright Example](https://github.com/wxt-dev/examples/tree/main/examples/playwright-e2e-testing)
- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Top 5 Chrome Extension Frameworks 2026](https://extensionbooster.com/blog/best-chrome-extension-frameworks-compared/)
- [Frameworks for Developing Browser Extensions](https://chuniversiteit.nl/programming/developing-chrome-extensions)
- [create-chrome-ext (guocaoyi)](https://github.com/guocaoyi/create-chrome-ext)
- [Extension.js](https://github.com/extension-js/extension.js)
- [Bedframe](https://www.bedframe.dev/)
- [Bedframe GitHub](https://github.com/nyaggah/bedframe)
- [Plasmo Framework](https://docs.plasmo.com/)
- [Plasmo Examples (with-jest)](https://github.com/PlasmoHQ/examples)
- [CRXJS Vite Plugin](https://www.npmjs.com/package/@crxjs/vite-plugin)
- [Playwright Chrome Extension Docs](https://playwright.dev/docs/chrome-extensions)
- [Playwright Chrome Extension Testing Template](https://github.com/kelseyaubrecht/playwright-chrome-extension-testing-template)
- [Jonghakseo Chrome Extension Boilerplate](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite)
- [E2E Tests for Chrome Extensions with Playwright + CDP](https://dev.to/corrupt952/how-i-built-e2e-tests-for-chrome-extensions-using-playwright-and-cdp-11fl)
- [Vitest 4.0 Stable Browser Mode](https://www.infoq.com/news/2025/12/vitest-4-browser-mode/)
- [GoogleChrome/chrome-extensions-samples](https://github.com/GoogleChrome/chrome-extensions-samples)
- [vitest-chrome Mock Library](https://github.com/probil/vitest-chrome)
- [playwright-crx](https://github.com/ruifigueira/playwright-crx)
