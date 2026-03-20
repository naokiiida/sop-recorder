# Code Review Report: Story 7.2 — Accessibility Compliance

**Commit:** `14245068` | **Date:** 2026-03-20 | **Review mode:** full (3-layer adversarial)
**Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor — all completed successfully.

## Triage Summary

| Category   | Count | Description |
|------------|-------|-------------|
| Bad Spec   | 3     | Spec prescribes incorrect ARIA patterns |
| Patch      | 10    | Code issues fixable without spec changes |
| Defer      | 2     | Pre-existing issues, not caused by this change |
| Rejected   | 4     | False positives / noise |

---

## Bad Spec

*These findings suggest the spec should be amended before continuing.*

### BS-1: `role="application"` on root wrapper is harmful

The spec's Task 8.1 prescribes `role="application"` on the root element. This tells screen readers to stop intercepting keystrokes, disabling standard navigation (heading jump, landmarks, list browsing). Appropriate only for widget-heavy UIs like spreadsheets — not this standard document-like interface.

- **Location:** `src/components/sop-app.ts:49`
- **Suggested amendment:** Remove `role="application"`. Use `aria-label="SOP Recorder"` on the `<div>` or a `<main>` element without the application role.

### BS-2: Announce text says "Ctrl+Z" but no Ctrl+Z handler exists

Task 9.3 says announce "Step deleted. Press Ctrl+Z to undo." but no Ctrl+Z keyboard listener is implemented anywhere. The only undo mechanism is the visual toast button. This misleads screen reader users.

- **Location:** `src/components/sop-editor.ts:180`
- **Suggested amendment:** Either (a) add a Ctrl+Z keydown listener that triggers `handleUndo()`, or (b) change the announcement to "Step deleted" and let the toast button speak for itself.

### BS-3: Spec uses `role="button"` on non-button elements instead of semantic buttons

Tasks 2.1-2.4, 3.1, and 8.1 prescribe `tabindex="0"` + `role="button"` on `<h2>`, `<strong>`, `<p>`, and `<article>`. This contradicts the spec's own anti-pattern: "Do NOT add aria attributes that duplicate native semantics." The correct approach is to use actual `<button>` elements.

- **Location:** `sop-editor.ts:59`, `sop-step-card.ts:129`, `sop-step-card.ts:208`, `sop-home.ts:79`
- **Suggested amendment:** Refactor to use `<button>` elements styled to match the current design.

---

## Patch

*Fixable code issues — prioritized by impact.*

### P-1: CRITICAL — Edit-mode `<article>` missing `tabindex="0"`

The edit-mode `<article>` has `@keydown`, `aria-roledescription`, and `aria-label` but **no `tabindex`**. Since `<article>` is not natively focusable, this breaks: keyboard shortcuts (Alt+Arrow, Delete), focus after delete/reorder, and focus-visible styles. **This breaks AC 1, 4, and 6.**

- **Location:** `src/components/sop-step-card.ts:65`
- **Fix:** Add `tabindex="0"` to the edit-mode `<article>`.

### P-2: MAJOR — `handleUndo()` doesn't restore the deleted step

`handleUndo()` only clears `undoStep` and the timer — it never dispatches an event to re-insert the step. The undo button in the toast is non-functional.

- **Location:** `src/components/sop-editor.ts:194-200`
- **Fix:** Dispatch a `restore-step` event that re-inserts `this.undoStep` at its original position.

### P-3: MAJOR — Duplicate screen reader announcements for recording state

The `<strong>` element has `role="status" aria-live="assertive"` AND `updated()` calls `announce()` with assertive priority. Screen readers announce every state change twice.

- **Location:** `src/components/sop-recording.ts:59-62` + `src/components/sop-recording.ts:25-37`
- **Fix:** Remove the inline `role="status" aria-live="assertive"` from `<strong>` and keep the `announce()` calls.

### P-4: MAJOR — Lightbox initial focus fires before Lit renders

`connectedCallback` queues `requestAnimationFrame` to focus the close button, but Lit hasn't rendered yet. The `querySelector` returns `null` and focus is never moved into the lightbox.

- **Location:** `src/components/sop-screenshot-lightbox.ts:26-30`
- **Fix:** Move focus logic to `firstUpdated()` or `override updated()` with a first-render guard.

### P-5: MAJOR — `announce()` rapid-fire calls swallow messages

No debounce or rAF cancellation. If called twice in the same frame, the second call clears the first's text before the rAF callback delivers it.

- **Location:** `src/components/sop-app.ts:12-19`
- **Fix:** Store the rAF ID and call `cancelAnimationFrame` before scheduling a new one.

### P-6: MINOR — Lightbox trigger stores `e.target` pointing to `sop-editor`

The `show-lightbox` event is re-dispatched by `sop-editor`, so `e.target` in `sop-app.handleShowLightbox` is `sop-editor`. Focus restoration after close calls `focus()` on `sop-editor` which has no tabindex — focus is lost.

- **Location:** `src/components/sop-app.ts:215`
- **Fix:** Pass the trigger element in event detail or use `e.composedPath()[0]`.

### P-7: MINOR — `manageFocusForTransition` to edit view only handles `from === 'recording'`

Loading a saved recording from home (`home -> edit`) doesn't trigger focus management. Focus falls to `<body>`.

- **Location:** `src/components/sop-app.ts:95-98`
- **Fix:** Change condition to `to === 'edit'` (remove `from === 'recording'` guard).

### P-8: MINOR — `Delete` key has no modifier or confirmation guard

Pressing `Delete` while a step card has focus immediately deletes the step. Easy to trigger accidentally since `Delete` is adjacent to `Backspace`.

- **Location:** `src/components/sop-step-card.ts:268-270`
- **Fix:** Require a modifier (e.g., `Alt+Delete`) or ensure undo works reliably first.

### P-9: NIT — `*:focus-within > .sop-hover-actions` is too broad

Universal `*` with `:focus-within` forces re-evaluation on every focus change. Performance concern for large step lists.

- **Location:** `src/styles/global.css` (~line 450)
- **Fix:** Scope to `.sop-thumbnail-container:focus-within > .sop-hover-actions`.

### P-10: NIT — Axe-core test only covers home view

Recording and editor views (where most ARIA complexity lives) are untested.

- **Location:** `tests/e2e/accessibility.spec.ts`
- **Fix:** Add test cases for recording and editor views.

---

## Defer

*Pre-existing issues not caused by this change.*

### D-1: CSS `transition` properties not disabled under `prefers-reduced-motion`

Various `transition: background 0.15s`, `transition: opacity 0.15s` throughout global.css are not disabled. Pre-existing issue.

### D-2: `Shift+Enter` multi-select shortcut is undiscoverable

No visible affordance or help text reveals the shortcut. Design gap, not a code bug.

---

## Verdict

Implementation covers ~85% of the accessibility story, but **P-1 (missing tabindex) alone breaks keyboard navigation for edit-mode step cards** — the most critical AC in this story. Combined with P-2 (broken undo) and P-3 (duplicate announcements), these must be fixed before the story can move to `done`.

**Recommended priority:**
1. P-1, P-2, P-3, P-4 — functional breakage, fix immediately
2. BS-1, BS-2 — spec issues, amend and fix
3. P-5 through P-8 — quality improvements
4. BS-3, P-9, P-10 — refactoring / polish
