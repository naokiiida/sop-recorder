# Story 8.3: Chrome Web Store Submission Validation

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to validate the extension package passes all CWS requirements,
so that the store submission is accepted on first attempt.

## Acceptance Criteria

1. **Remote sync:** All local commits (currently 18 ahead of origin/main) are pushed to GitHub and CI pipeline passes all jobs (lint, typecheck, unit-test, build, e2e)
2. **Extension ZIP:** `pnpm zip` produces a CWS-ready ZIP under 2 MB in `.output/`
3. **Manifest validation:** Built `manifest.json` passes CWS validation — all required fields present (`manifest_version: 3`, `name`, `version`, `description`, `icons`, `permissions`), valid permissions only
4. **CSP compliance:** No unsafe-eval directives, no remote code loading, no inline scripts — standard MV3 CSP is sufficient
5. **Privacy policy:** A `store/privacy-policy.md` accurately reflects zero data collection (no network, no telemetry, no remote storage)
6. **Chrome 120+ compatibility:** Extension loads and functions without errors on Chrome 120+ (minimum target)
7. **Clean profile load:** Extension installs and loads without console errors in a clean Chrome profile
8. **CI green on release commit:** Final commit with all validation artifacts passes CI

## Tasks / Subtasks

- [ ] Task 1: Push to remote and fix CI (AC: #1)
  - [ ] Push all 18 local commits to `origin/main`
  - [ ] Monitor CI pipeline run — check all 5 jobs: lint, typecheck, unit-test, build+size+manifest, e2e
  - [ ] If any CI job fails, diagnose and fix locally, push fix commit
  - [ ] Iterate until all CI jobs pass green
  - [ ] **Note:** E2E tests require `pnpm exec playwright install --with-deps chromium` in CI — this is already configured in `.github/workflows/ci.yml`

- [ ] Task 2: Validate `pnpm zip` output (AC: #2, #3)
  - [ ] Run `pnpm zip` and verify it produces `.output/nuknow-1.0.0-chrome.zip` (or similar)
  - [ ] Verify ZIP size < 2 MB (architecture budget: < 2 MB required, < 1 MB nice-to-have)
  - [ ] Unzip and inspect `manifest.json` for required CWS fields:
    - `manifest_version: 3`
    - `name: "nuknow"`
    - `version: "1.0.0"`
    - `description` (non-empty)
    - `icons` map (16, 32, 48, 128)
    - `permissions` — only declared: `activeTab`, `tabs`, `scripting`, `storage`, `sidePanel`, `alarms`, `downloads`
    - `action.default_icon` map
    - `background.service_worker`
    - `side_panel.default_path`
    - `content_scripts` array
    - `commands.toggle-recording`
  - [ ] Verify no `host_permissions`, no `<all_urls>`, no `optional_permissions` unless intentional

- [ ] Task 3: CSP and security validation (AC: #4)
  - [ ] Verify built output contains no dynamic code execution patterns (unsafe-eval, dynamic Function constructors)
  - [ ] Verify no remote `<script>` tags or `importScripts()` with external URLs
  - [ ] Verify no inline `<script>` in HTML files — Vite bundles everything
  - [ ] Confirm Lit uses CSP-safe tagged template literals (no string-based rendering)
  - [ ] Optionally run CWS review simulator or manual checklist against MV3 CSP rules

- [ ] Task 4: Create privacy policy (AC: #5)
  - [ ] Create `store/privacy-policy.md` with zero data collection statement
  - [ ] Include: no network requests, no telemetry, no analytics, no user accounts, no remote storage
  - [ ] State data stays on device in chrome.storage and IndexedDB, cleared on uninstall
  - [ ] Note explicit user action required for any data to leave the device (file download export only)
  - [ ] CWS requires a privacy policy URL — note that this can be hosted as a GitHub raw file or GitHub Pages

- [ ] Task 5: Enhance manifest tests for CWS completeness (AC: #3)
  - [ ] Extend existing `tests/unit/manifest.test.ts` with CWS-specific assertions:
    - `icons` map has all 4 sizes (16, 32, 48, 128)
    - `action.default_icon` is present
    - No `host_permissions` unless intentional
    - `version` matches semver pattern
  - [ ] Run `pnpm test:unit -- tests/unit/manifest.test.ts` to validate

- [ ] Task 6: Final CI validation (AC: #8)
  - [ ] Commit all new/modified files from Tasks 2-5
  - [ ] Push to remote
  - [ ] Verify all CI jobs pass on the final commit
  - [ ] Record the passing CI run URL/commit SHA

## Dev Notes

### Priority: CI First

The user specifically requested starting with pushing to remote and getting CI passing. There are **18 commits ahead of origin/main** spanning Stories 7.x through 8.1. The CI pipeline has 5 jobs:

1. **lint** — ESLint + Prettier format check
2. **typecheck** — `tsc --noEmit`
3. **unit-test** — Vitest
4. **build** — `wxt build` + `size-limit` + manifest validation test
5. **e2e** — Playwright (depends on build job)

All CI jobs use Node 22 + pnpm with `--frozen-lockfile`. If `pnpm-lock.yaml` is stale, CI will fail.

### Current Git State

- 18 commits ahead of origin/main (Stories 7.1-7.5, 8.1, plus fixes)
- Uncommitted/untracked files exist: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `prd-v2-addendum.md`, `architecture-v2-addendum.md`, `8-2-create-readme-and-repository-setup.md`
- These untracked files are from Story 8.2 (in-progress) — do NOT commit these in Story 8.3

### `pnpm zip` Behavior

WXT provides a built-in `wxt zip` command (aliased as `pnpm zip`) that:
1. Runs a production build
2. Creates a `.zip` file ready for CWS upload
3. Output location: `.output/` directory (e.g., `.output/nuknow-1.0.0-chrome.zip`)

This is the **canonical CWS packaging** command — do NOT manually zip the build output.

### Existing Manifest Test

`tests/unit/manifest.test.ts` already validates:
- manifest_version === 3
- Required metadata (name, version, description)
- Required permissions (activeTab, scripting, storage, sidePanel, alarms, downloads)
- Background service worker configuration
- Side panel configuration
- Content scripts
- toggle-recording command

The manifest test runs against the **built** output (`.output/chrome-mv3/manifest.json`), so `pnpm build` must succeed first. This test is also run explicitly in the CI build job.

### Bundle Size Budgets

From `.size-limit.json`:
- Content script: < 50 KB
- Service worker: < 100 KB
- Side panel: < 200 KB
- Total ZIP: < 2 MB (architecture requirement)

### Permissions — Declared vs Architecture

Current manifest declares: `activeTab`, `tabs`, `scripting`, `storage`, `sidePanel`, `alarms`, `downloads`

Architecture document lists: `activeTab`, `scripting`, `storage`, `sidePanel`, `alarms`, `downloads` (no `tabs`)

The `tabs` permission was added during Story 3.3 (navigation detection). This is intentional and correct — the dev should NOT remove it. The architecture doc predates the implementation decision.

### CSP Safety — Lit Framework

Lit uses tagged template literals which are CSP-safe. No unsafe-eval is needed. The standard MV3 CSP applies:
```
script-src 'self'; object-src 'self'
```

No custom CSP is declared in `wxt.config.ts` — MV3 default applies automatically.

### Privacy Policy Requirements

CWS submission requires a privacy practices declaration. Since the extension:
- Requests zero network permissions
- Has zero telemetry, analytics, or tracking
- Stores data only in extension-scoped `chrome.storage.local` and IndexedDB
- Data leaves device ONLY via explicit user-initiated file download

The privacy policy is straightforward: "We do not collect, transmit, or store any user data on external servers."

### Project Structure Notes

New files in this story:
- `store/privacy-policy.md` — new file in existing `store/` directory (created in Story 8.1)
- `tests/unit/manifest.test.ts` — modify existing file (add CWS-specific assertions)

No changes to `src/` directory.

### References

- [Source: _bmad-output/planning-artifacts/epics-and-stories.md#Epic8] — Story 8.3 requirements and AC
- [Source: _bmad-output/planning-artifacts/architecture.md#11.4] — CI pipeline configuration
- [Source: _bmad-output/planning-artifacts/architecture.md#11.5] — Bundle size budgets
- [Source: _bmad-output/planning-artifacts/architecture.md#12] — Security model, CSP, permissions
- [Source: _bmad-output/planning-artifacts/architecture.md#14.1] — Build and packaging commands
- [Source: .github/workflows/ci.yml] — CI workflow definition (5 jobs)
- [Source: .size-limit.json] — Bundle size budgets
- [Source: wxt.config.ts] — Manifest configuration
- [Source: tests/unit/manifest.test.ts] — Existing manifest validation tests
- [Source: package.json] — Scripts and dependencies
- [Source: _bmad-output/implementation-artifacts/8-1-create-extension-icons-and-cws-store-assets.md] — Story 8.1 (icons, store assets)
- [Source: _bmad-output/implementation-artifacts/8-2-create-readme-and-repository-setup.md] — Story 8.2 (README, repo setup — in-progress)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

### File List
