# Story 7.5: Write E2E Tests for Critical Path

Status: ready-for-dev

## Story

As a developer,
I want E2E tests that verify the full record -> edit -> export flow,
so that the critical user journey is validated automatically.

## Acceptance Criteria

1. **Critical Path Test:** A test verifies the complete flow: open side panel -> click "Start Recording" -> perform clicks on a test page -> steps appear in side panel -> click "Stop" -> edit a step title -> click "Export as ZIP" -> ZIP file is downloaded
2. **Empty State Test:** A test verifies the side panel shows the empty state when no recordings exist (`.sop-empty-state` with "Record your first SOP" text)
3. **Saved Recordings Test:** A test verifies saved recordings appear in the home view as `article.sop-rec-card` cards after a recording is completed and the user navigates back
4. **Delete Recording Test:** A test verifies a recording can be deleted from the editor view via the "Delete Recording" button (`button.sop-btn-danger`)
5. **Keyboard Shortcut Test:** A test verifies `Alt+Shift+R` toggles recording (starts when idle, stops when recording)
6. **CI Integration:** Tests run in CI via the existing GitHub Actions workflow with headless Chromium (note: `headless: false` is required for extension loading -- this is already handled by the fixture)
7. **Test Fixture:** The test page is a local HTML fixture with predictable DOM elements (buttons, inputs, links, form with submit) served by Playwright or loaded as a local file

## Tasks / Subtasks

- [ ] Task 1: Create HTML test fixture (AC: #7)
  - [ ] Create `tests/e2e/fixtures/test-page.html` with predictable DOM: buttons, text inputs, links, a form with submit, checkboxes, and a select dropdown
  - [ ] Each element must have unique `data-testid` attributes for reliable selection
  - [ ] Include minimal styling so elements are visible and clickable (non-zero dimensions)
- [ ] Task 2: Create Page Object / helper utilities (AC: #1-5)
  - [ ] Create `tests/e2e/fixtures/side-panel.ts` with a `SidePanelPage` helper class that encapsulates common side panel interactions
  - [ ] Methods: `goto()`, `startRecording()`, `stopRecording()`, `pauseRecording()`, `resumeRecording()`, `getStepCards()`, `getRecordingCards()`, `editStepTitle(index, newTitle)`, `exportAsZip()`, `copyMarkdown()`, `deleteRecording()`, `goBack()`, `isEmpty()`, `getAnnouncerText()`
  - [ ] Helper to navigate to the test fixture page in a separate tab
- [ ] Task 3: Write Empty State test (AC: #2)
  - [ ] Navigate to `chrome-extension://<id>/sidepanel.html`
  - [ ] Assert `sop-app` is visible
  - [ ] Assert `.sop-empty-state` is visible with text "Record your first SOP"
  - [ ] Assert `button.contrast` with text "Start Recording" is visible
  - [ ] Assert no `article.sop-rec-card` elements exist
- [ ] Task 4: Write Critical Path E2E test (AC: #1)
  - [ ] Open side panel, click "Start Recording"
  - [ ] Open a new tab with the test fixture HTML page
  - [ ] Perform 2-3 clicks on test page elements (buttons, links)
  - [ ] Switch back to side panel tab and verify steps appear in `section[role="log"]`
  - [ ] Verify step count matches actions performed
  - [ ] Click Stop (`button.sop-btn-danger` with "Stop")
  - [ ] Verify view transitions to editor (`h2.sop-editable` visible)
  - [ ] Edit a step title: click `strong.sop-editable[aria-label="Edit step title"]`, type new title, press Enter
  - [ ] Verify title change persists in the step card
  - [ ] Click "Export as ZIP" (`button.contrast` with text "Export as ZIP")
  - [ ] Verify download is triggered (use Playwright's `page.waitForEvent('download')` or check for download via chrome.downloads)
- [ ] Task 5: Write Saved Recordings test (AC: #3)
  - [ ] Complete a recording (start, perform an action, stop)
  - [ ] Navigate back to home view via the back button (`button.sop-back-button`)
  - [ ] Verify at least one `article.sop-rec-card` is visible in the home view
  - [ ] Verify the recording card shows the correct title and step count
- [ ] Task 6: Write Delete Recording test (AC: #4)
  - [ ] Complete a recording (start, perform an action, stop) — ends in editor view
  - [ ] Click "Delete Recording" button (`button.sop-btn-danger` text "Delete Recording")
  - [ ] Verify view returns to home
  - [ ] Verify the recording no longer appears (no `article.sop-rec-card` or one fewer)
- [ ] Task 7: Write Keyboard Shortcut test (AC: #5)
  - [ ] Open side panel, verify idle state (home view)
  - [ ] Press `Alt+Shift+R` (the `toggle-recording` command)
  - [ ] Verify recording starts: view changes to recording, `strong[role="status"]` shows "Recording"
  - [ ] Press `Alt+Shift+R` again
  - [ ] Verify recording stops: view changes to editor or home depending on step count
- [ ] Task 8: Verify CI integration (AC: #6)
  - [ ] Ensure all new tests pass with `pnpm run test:e2e`
  - [ ] Verify no changes needed to `.github/workflows/ci.yml` (existing E2E job already runs all Playwright tests)
  - [ ] Verify tests work with `workers: 1` (sequential, as CI config requires)

## Dev Notes

### Architecture & Existing Infrastructure

The Playwright E2E setup is already established from Story 1.4. The key files:

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Config: `testDir: 'tests/e2e'`, HTML reporter, CI: 2 retries, 1 worker |
| `tests/e2e/fixtures/extension.ts` | Custom fixture: `chromium.launchPersistentContext` with `--load-extension=.output/chrome-mv3` |
| `tests/e2e/extension-loads.spec.ts` | Existing smoke test: SW loads, side panel accessible |
| `tests/e2e/accessibility.spec.ts` | Existing a11y test: axe-core WCAG audit |

**CRITICAL: Import from the existing fixture, not `@playwright/test` directly:**
```typescript
import { test, expect } from './fixtures/extension.js';
```

**Extension must be pre-built before E2E tests run:**
```bash
pnpm run build && pnpm run test:e2e
```

### Extension Architecture for E2E Testing

The extension uses a port-based communication model:
- **Side panel** connects to background via `browser.runtime.connect({ name: 'sidepanel' })`
- **Content script** communicates via `browser.runtime.sendMessage`
- **Background** orchestrates everything

The side panel URL is: `chrome-extension://<extensionId>/sidepanel.html`

**Extensions cannot run in true headless mode.** The fixture uses `headless: false` -- this is correct and required. On CI (Linux), this runs with Xvfb (headless display server), which Playwright installs via `playwright install --with-deps chromium`.

### Side Panel Selectors Reference

| Action | Locator Strategy | View |
|--------|-----------------|------|
| Start Recording | `page.getByRole('button', { name: 'Start Recording' })` | home |
| Pause | `page.locator('.sop-control-grid button.secondary')` with text "Pause" | recording |
| Resume | `page.locator('.sop-control-grid button.secondary')` with text "Resume" | recording |
| Stop | `page.getByRole('button', { name: /Stop/ })` | recording |
| Recording status | `page.locator('strong[role="status"]')` | recording |
| Step feed | `page.locator('section[role="log"]')` | recording |
| Live step cards | `page.locator('section[role="log"] article.sop-step-card')` | recording |
| Step count (header) | `page.locator('header.sop-flex small')` | recording |
| Empty state | `page.locator('.sop-empty-state')` | home |
| Recording cards | `page.locator('article.sop-rec-card')` | home |
| Edit title (recording) | `page.locator('h2.sop-editable')` | edit |
| Edit step title | `page.locator('strong.sop-editable[aria-label="Edit step title"]').first()` | edit |
| Export as ZIP | `page.getByRole('button', { name: 'Export as ZIP' })` | edit |
| Copy Markdown | `page.getByRole('button', { name: 'Copy Markdown' })` | edit |
| Delete Recording | `page.getByRole('button', { name: /Delete Recording/ })` | edit |
| Back to home | `page.locator('button.sop-back-button')` | edit |
| Undo toast | `page.locator('aside.sop-undo-toast')` | edit |
| Announcer | `page.locator('#sop-announcer')` | all |

### View Routing Logic

The `RecordingController` drives view state:
- `viewState === 'home'` → renders `<sop-home>`
- `viewState === 'recording'` → renders `<sop-recording>`
- `viewState === 'edit'` → renders `<sop-editor>` + back button

Transitions:
- Start Recording → `home` → `recording`
- Stop Recording (with steps) → `recording` → `edit`
- Stop Recording (no steps) → `recording` → `home`
- Load Recording → `home` → `edit`
- Back button → `edit` → `home`
- Delete Recording → `edit` → `home`

### Test Page Fixture Design

Create `tests/e2e/fixtures/test-page.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head><title>SOP Recorder Test Page</title></head>
<body>
  <h1>Test Page</h1>
  <button data-testid="btn-save">Save</button>
  <button data-testid="btn-cancel">Cancel</button>
  <a href="#section2" data-testid="link-nav">Go to Section 2</a>
  <input type="text" data-testid="input-name" placeholder="Enter name" />
  <select data-testid="select-role">
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </select>
  <input type="checkbox" data-testid="checkbox-agree" />
  <form data-testid="form-login">
    <input type="text" data-testid="input-username" placeholder="Username" />
    <input type="password" data-testid="input-password" placeholder="Password" />
    <button type="submit" data-testid="btn-submit">Submit</button>
  </form>
  <div id="section2"><h2>Section 2</h2></div>
</body>
</html>
```

All elements have `data-testid` for reliable Playwright selection. Elements have visible text/dimensions so clicks register.

### Handling Multi-Tab E2E Flow

The critical path test requires interacting with both the side panel page AND a separate test page tab. The approach:

```typescript
// Open side panel
const panelPage = await context.newPage();
await panelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);

// Start recording from side panel
await panelPage.getByRole('button', { name: 'Start Recording' }).click();

// Open test page in new tab
const testPage = await context.newPage();
await testPage.goto('file://' + path.resolve('tests/e2e/fixtures/test-page.html'));
// OR serve it: await testPage.goto('about:blank'); and set content

// Perform actions on test page
await testPage.locator('[data-testid="btn-save"]').click();
await testPage.locator('[data-testid="input-name"]').fill('Test User');

// Switch back to panel to verify
await panelPage.bringToFront();
// ... assert steps appeared
```

**IMPORTANT:** The content script injection happens via `chrome.scripting.executeScript` when recording starts. It targets the active tab. When the user opens a new tab, the background's `tabs.onActivated` and content script's `CONTENT_READY` message handle injection on the new tab.

**Timing considerations:**
- After clicking "Start Recording," wait for the recording view to appear before opening a new tab
- After performing actions on the test page, wait briefly for the step capture pipeline (screenshot + processing takes ~200-500ms per step)
- Use `waitForSelector` or `waitForFunction` rather than fixed timeouts

### Download Verification

For the ZIP export assertion, Playwright can intercept downloads:

```typescript
const [download] = await Promise.all([
  panelPage.waitForEvent('download'),
  panelPage.getByRole('button', { name: 'Export as ZIP' }).click(),
]);
expect(download.suggestedFilename()).toMatch(/\.zip$/);
// Optionally verify ZIP contents:
const filePath = await download.path();
// Use JSZip or unzipper to verify sop.md + screenshots/ exist
```

**Note:** `chrome.downloads.download` is used by the extension. Playwright's download event captures this. If not, an alternative is to mock `chrome.downloads` or check the file system.

### Keyboard Shortcut Testing

Chrome extension commands (`chrome.commands`) are registered globally. In Playwright with a loaded extension:

```typescript
// The keyboard shortcut is Alt+Shift+R
await panelPage.keyboard.press('Alt+Shift+R');
```

**Caveat:** Extension keyboard shortcuts may not fire via Playwright's `keyboard.press()` in all contexts because they're handled by Chrome's command system, not the page's keyboard event listeners. If this doesn't work:
- **Fallback approach:** Test the `toggleRecording()` function indirectly by using the UI buttons (Start/Stop), and separately verify the command is registered in the manifest
- **Alternative:** Use `chrome.commands` API from a test page to verify the command exists

### Known Constraints & Gotchas

1. **No true headless for extensions.** Always `headless: false`. CI uses Xvfb.
2. **Side panel is a regular page** at `chrome-extension://<id>/sidepanel.html`, not the actual Chrome side panel. The E2E tests navigate to it as a tab. This is the standard approach for testing extension panel pages.
3. **Service worker timing.** After build, the SW may need a moment to start. The fixture handles this with `waitForEvent('serviceworker')`.
4. **Content script injection delay.** After starting recording + opening a new tab, the content script needs to load and send `CONTENT_READY` before events can be captured. Budget 1-2 seconds.
5. **Screenshot capture is async.** After each action on the test page, the step capture pipeline runs asynchronously (200ms overlay wait + screenshot + thumbnail + persist). Wait for step cards to appear in the panel rather than using fixed delays.
6. **Test isolation.** Each test starts a fresh browser context (via the fixture), so storage is clean. No inter-test state leakage.
7. **Extension ID format.** Always a 32-character lowercase alpha string matching `/^[a-z]{32}$/`.
8. **Build required.** Tests run against `.output/chrome-mv3/`. Always `pnpm run build` before `pnpm run test:e2e`.

### Previous Story Intelligence (from Story 7.4)

- **Agent used:** claude-sonnet-4-6
- **Coverage achieved:** 100% statements, 98.41% branches across all core modules
- **Key pattern:** Tests are in `tests/unit/core/` mirroring `src/core/`
- **Lesson:** Unreachable defensive branches (TypeScript guarantees) don't need coverage -- the 1.59% gap is acceptable
- **Build verification:** Always run `pnpm run build` and `pnpm run test:unit` to ensure no regressions

### Git Intelligence

Recent commit pattern: `feat(scope): description (Story N.M)` for implementations, `fix(scope): description (Story N.M remediation)` for fixes. Latest commits:
```
5cd8feb0 fix(tests): strengthen weak assertions (Story 7.4 remediation)
ba10273a fix(perf): remediate 3 findings (Story 7.3 review)
8a9e5cb1 fix(a11y): remediate 5 accessibility bugs (Story 7.2 review)
56067040 feat(tests): expand core module unit tests to 100% coverage (Story 7.4)
```

Expected commit message: `feat(tests): write E2E tests for critical path (Story 7.5)`

### Project Structure Notes

New files to create:
```
tests/e2e/
  fixtures/
    test-page.html         # Static HTML test fixture
    side-panel.ts          # Page object helper (optional but recommended)
  critical-path.spec.ts    # Critical path E2E test (AC #1)
  empty-state.spec.ts      # Empty state test (AC #2)
  saved-recordings.spec.ts # Saved recordings test (AC #3)
  delete-recording.spec.ts # Delete recording test (AC #4)
  keyboard-shortcut.spec.ts # Keyboard shortcut test (AC #5)
```

Alternatively, group related tests into fewer files (e.g., `recording-flow.spec.ts` for AC #1-4, `keyboard-shortcut.spec.ts` for AC #5). Use the developer's judgment on file organization, but each AC must have a distinct test.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Section 11 - Testing Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Section 11.3 - E2E Testing]
- [Source: _bmad-output/planning-artifacts/architecture.md#Section 13 - Performance Requirements]
- [Source: _bmad-output/planning-artifacts/epics-and-stories.md#Story 7.5]
- [Source: _bmad-output/implementation-artifacts/7-4-write-core-module-unit-tests.md]
- [Source: _bmad-output/implementation-artifacts/reviews/7-4-code-review-20260320.md]
- [Source: tests/e2e/fixtures/extension.ts - Existing Playwright fixture]
- [Source: tests/e2e/extension-loads.spec.ts - Existing smoke tests]
- [Source: tests/e2e/accessibility.spec.ts - Existing a11y tests]
- [Source: src/components/sop-app.ts - Root component, view routing]
- [Source: src/components/sop-home.ts - Home view, recording cards]
- [Source: src/components/sop-recording.ts - Recording view, controls]
- [Source: src/components/sop-editor.ts - Editor view, export]
- [Source: src/components/sop-step-card.ts - Step card component]
- [Source: src/entrypoints/background.ts - Background orchestrator]
- [Source: src/entrypoints/content.ts - Content script]
- [Source: wxt.config.ts - Extension manifest, keyboard shortcut]
- [Source: .github/workflows/ci.yml - CI pipeline with E2E job]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
