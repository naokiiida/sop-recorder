# Library Version Research - March 2026

> Research date: 2026-03-18
> Purpose: Determine latest versions and compatibility for SOP Recorder extension development

---

## 1. Vite 8

- **Latest version:** 8.0.x (stable released **March 12, 2026**)
- **Headline change:** Rolldown replaces esbuild + Rollup as the single, unified, Rust-based bundler
- **Performance:** 10-30x faster builds compared to Vite 7
- **Bundle size note:** Vite 8 is ~15 MB larger than Vite 7 (~10 MB from LightningCSS now a normal dependency, ~5 MB from Rolldown)

### Breaking changes from Vite 7

| Area | Change |
|------|--------|
| Bundler | Rolldown + Oxc replace esbuild + Rollup (compat layer auto-converts most `rollupOptions`) |
| CSS | Lightning CSS used for CSS minification by default |
| HMR | `import.meta.hot.accept` no longer accepts a URL; pass an `id` instead |
| CJS resolution | Default import from CJS handled consistently based on `.mjs`/`.mts` importer |
| `resolve.mainFields` | When both `browser` and `module` fields exist, Vite respects `resolve.mainFields` order (no heuristic) |
| tsconfig paths | Built-in support via `resolve.tsconfigPaths: true` (opt-in, small perf cost) |

### New features relevant to extensions

- **Rolldown unlocks:** full bundle mode, flexible chunk splitting, module-level persistent cache, Module Federation
- **DevTools option:** built-in Vite Devtools for inspecting dev server
- **Environment API:** moving toward stable; allows framework authors to create multiple environments matching production topology
- **Plugin compat:** Rolldown supports same plugin API as Rollup/Vite, so existing plugins mostly work

### Sources

- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8)
- [Vite 8 Beta announcement](https://vite.dev/blog/announcing-vite8-beta)
- [Migration from v7](https://vite.dev/guide/migration)

---

## 2. WXT (Web Extension Framework)

- **Latest version:** 0.20.19 (published ~March 14, 2026)
- **Vite 8 support:** Yes -- added in v0.20.19
- **Status:** Pre-1.0 but v0.20 is the intended RC for v1.0

### Key changes since v0.20.0

| Change | Detail |
|--------|--------|
| Browser API | No longer uses `webextension-polyfill`; types now based on `@types/chrome` |
| Entrypoint loader | Default changed to `vite-node` (supports `import.meta.glob` in entrypoint options) |
| CJS dropped | Must use `"type": "module"` in package.json |
| `extensionApi` config | Removed (was for opting into new browser object pre-0.20) |
| Vite 8 | Supported as of v0.20.19 |

### Sources

- [WXT npm](https://www.npmjs.com/package/wxt)
- [WXT GitHub](https://github.com/wxt-dev/wxt)
- [WXT Releases](https://github.com/wxt-dev/wxt/releases)
- [WXT Upgrading Guide](https://wxt.dev/guide/resources/upgrading)

---

## 3. Lit (Web Components)

- **Latest version:** 3.3.2 (published ~December 2025)
- **No Lit 4 announced** -- Lit 3.x remains the current major version
- **Bundle size:** ~5 KB minified + gzipped (core library)
- **Vite 8 compatibility:** Lit is framework-agnostic / no Vite dependency; works fine with any bundler

### Notes for extension development

- Lit works well in Shadow DOM (its native rendering target)
- SSR/hydration features exist but are not particularly relevant for extension HTML pages (popup, side panel, options) which run client-side only
- `@lit/task` for async data loading, `@lit/context` for dependency injection are stable
- `@lit/react` wrapper available if mixing with React

### Sources

- [Lit npm](https://www.npmjs.com/package/lit)
- [Lit website](https://lit.dev/)
- [Lit GitHub releases](https://github.com/lit/lit/releases)

---

## 4. Vitest

- **Latest version:** 4.1.0 (published ~March 14, 2026)
- **Vite 8 compatibility:** Yes -- Vitest 4.1 adds Vite 8 support; uses installed Vite version instead of bundling its own

### Key Vitest 4.x features

| Feature | Detail |
|---------|--------|
| Vite 8 support | Uses installed Vite, eliminating type inconsistencies |
| Tags | Test tagging for filtering/grouping |
| Around hooks | New hook type wrapping test execution |
| `--detect-async-leaks` | Flag to detect leaked async operations |
| `test.extend` | New syntax with type inference |
| GitHub Actions reporter | Auto-generates Job Summary with test stats, highlights flaky tests |
| VSCode extension | No background process unless continuous run enabled; shows module load time inline |
| Mock helpers | `mockThrow`, `mockThrowOnce` added |
| Assertion helper | Hide internal stack traces |
| Artifacts API | Store failure screenshots |

### Sources

- [Vitest 4.1 announcement](https://vitest.dev/blog/vitest-4-1)
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4)
- [Vitest npm](https://www.npmjs.com/package/vitest)

---

## 5. Playwright

- **Latest version:** 1.58.2 (published ~February 2026)
- **Vite 8 compatibility:** N/A (Playwright is a browser automation tool, not bundler-dependent)

### Chrome extension testing

- Requires **Chromium only** (Firefox/WebKit do not support Chrome extensions)
- Requires **persistent browser context** so extensions stay loaded
- MV3 extensions supported; MV2 support dropped
- Side panel testing: There is an open feature request ([#26693](https://github.com/microsoft/playwright/issues/26693)) for explicit side panel API support, but no dedicated API yet. Side panels can be tested via page handles.
- `playwright-crx` community project allows recording Playwright scripts as a Chrome extension

### Sources

- [Playwright Chrome extensions docs](https://playwright.dev/docs/chrome-extensions)
- [Playwright npm](https://www.npmjs.com/package/playwright)
- [Playwright releases](https://github.com/microsoft/playwright/releases)
- [Side panel feature request](https://github.com/microsoft/playwright/issues/26693)

---

## 6. Tailwind CSS

- **Latest version:** 4.2.1 (published ~February 27, 2026)
- **Major version:** v4 released January 2025

### What changed in v4

| Area | Change |
|------|--------|
| Engine | Rebuilt on Lightning CSS for dramatically faster builds |
| Configuration | CSS-first config (no `tailwind.config.js` needed); customize in CSS with `@theme` |
| Content detection | Automatic -- no `content` array configuration required |
| Vite integration | First-party `@tailwindcss/vite` plugin (faster than PostCSS approach) |
| CSS features | Cascade layers, container queries, 3D transforms built-in |
| PostCSS | Still available via `@tailwindcss/postcss` |

### Bundle size

- Production output is tree-shaken: typically **< 10 KB** gzipped for real projects
- Netflix Top 10 site ships 6.5 KB total CSS using Tailwind
- Some users report ~7 KB gzipped with `@tailwindcss/vite`

### Shadow DOM compatibility (important for Lit)

- **Known issue:** Tailwind v4 CSS custom properties use `:root` selector which does not penetrate Shadow DOM
- Discussion open for adding `:host` selector support ([#15556](https://github.com/tailwindlabs/tailwindcss/discussions/15556))
- Workaround: Vite build-time transformation to inject `@property` definitions or adopt styles into shadow root
- Tailwind inside Shadow DOM requires manually adopting constructed stylesheets or using `<link>` to the built CSS

### Vite 8 compatibility

- `@tailwindcss/vite` has been updated to support Vite 8 (`^8.0.0` in peer deps) via [PR #19790](https://github.com/tailwindlabs/tailwindcss/pull/19790)

### Sources

- [Tailwind CSS v4 blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS npm](https://www.npmjs.com/package/tailwindcss)
- [@tailwindcss/vite npm](https://www.npmjs.com/package/@tailwindcss/vite)
- [Shadow DOM discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15556)
- [Tailwind + Shadow DOM blog](https://meefik.dev/2025/03/19/tailwindcss-and-shadow-dom/)

---

## 7. PicoCSS

- **Latest version:** 2.1.1
- **Bundle size:** ~10 KB minified, ~2.5-3 KB gzipped (classless version is smaller)
- **No JavaScript dependencies**
- **Features:** 130+ CSS variables, 380 colors, light/dark schemes built-in, semantic HTML styling with < 10 classes total

### Notes for extension development

- Good fit for simple extension pages (options, onboarding) where semantic HTML suffices
- Classless version ideal for minimal UI
- No Shadow DOM specific support, but can be adopted as constructed stylesheet

### Sources

- [PicoCSS npm](https://www.npmjs.com/package/@picocss/pico)
- [PicoCSS website](https://picocss.com/)
- [PicoCSS GitHub](https://github.com/picocss/pico)

---

## 8. Alpine.js / Datastar

### Alpine.js

- **Latest version:** 3.14.9 (released March 12, 2026)
- **Bundle size:** ~7.1 KB gzipped / ~21.9 KB minified
- **Status:** Stable, mature
- **Vite 8 compatibility:** N/A (Alpine is a runtime script, not bundler-dependent)

### Datastar

- **Latest version:** 1.0.0-RC.8 (Release Candidate)
- **Bundle size:** ~11.29 KB
- **Status:** NOT production-ready -- still in RC phase
- **Architecture:** Hypermedia-driven framework, server-side rendering focused
- **Recommendation:** Too early for production use; API may change before 1.0 stable

### Sources

- [Alpine.js GitHub releases](https://github.com/alpinejs/alpine/releases)
- [Alpine.js Bundlephobia](https://bundlephobia.com/package/alpinejs)
- [Datastar GitHub](https://github.com/starfederation/datastar)
- [Datastar npm](https://www.npmjs.com/package/@starfederation/datastar)

---

## 9. Compatibility Matrix

| Library | Latest Version | Vite 8 Compatible | Bundle Size (gzip) | Status |
|---------|---------------|-------------------|-------------------|--------|
| Vite | 8.0.x | -- | N/A (build tool) | Stable |
| WXT | 0.20.19 | Yes (v0.20.19+) | N/A (dev tool) | RC for v1.0 |
| Lit | 3.3.2 | Yes (agnostic) | ~5 KB | Stable |
| Vitest | 4.1.0 | Yes (v4.1+) | N/A (test tool) | Stable |
| Playwright | 1.58.2 | N/A | N/A (test tool) | Stable |
| Tailwind CSS | 4.2.1 | Yes (@tailwindcss/vite) | < 10 KB (output) | Stable |
| PicoCSS | 2.1.1 | N/A (pure CSS) | ~3 KB | Stable |
| Alpine.js | 3.14.9 | N/A (runtime) | ~7 KB | Stable |
| Datastar | 1.0.0-RC.8 | N/A (runtime) | ~11 KB | RC (not prod-ready) |

### Key takeaways

1. **Vite 8 ecosystem is ready.** WXT, Vitest, and @tailwindcss/vite all support Vite 8 as of mid-March 2026.
2. **WXT 0.20.19** is the version to target -- it supports Vite 8 and is the RC for v1.0.
3. **Lit 3.3.2** remains the current stable; no Lit 4 announced. Works perfectly with any bundler.
4. **Tailwind + Shadow DOM** requires workarounds. If using Lit with Tailwind, plan for stylesheet adoption into shadow roots.
5. **Datastar is not production-ready.** Stick with Alpine.js if a lightweight reactive layer is needed, or use Lit's built-in reactivity.
6. **Playwright side panel testing** has no dedicated API yet -- use page handle workarounds.
