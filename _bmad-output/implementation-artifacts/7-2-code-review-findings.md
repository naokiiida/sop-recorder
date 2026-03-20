# Code Review — Story 7.2: Implement Accessibility Compliance

**Date:** 2026-03-20
**Reviewer:** bmad-code-review (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
**Model:** minimax-m2.5-free (opencode/minimax-m2.5-free)
**Spec:** `_bmad-output/implementation-artifacts/7-2-implement-accessibility-compliance.md`
**Status:** 0 intent_gap · 0 bad_spec · 11 patch · 0 defer · 5 rejected

---

## PATCH — Fixable Code Issues

### P-1 [CRITICAL] Typo breaks focus trap second branch
- **File:** `src/components/sop-screenshot-lightbox.ts` — `handleFocusTrap`
- **Severity:** CRITICAL
- **Sources:** blind, edge
- **Detail:** `eShiftKey` is undefined (typo), so the second `else if` branch `!eShiftKey && document.activeElement === last` evaluates `!undefined === true` → always true. This means every forward Tab press from the last focusable element wraps to `first` instead of staying in the dialog, breaking expected focus behavior.
- **Fix:**
```ts
// WRONG:
} else if (!eShiftKey && document.activeElement === last) {
// FIX:
} else if (!e.shiftKey && document.activeElement === last) {
```

---

### P-2 [HIGH] Document keydown listener leaks on lightbox unmount
- **File:** `src/components/sop-screenshot-lightbox.ts` — `connectedCallback`
- **Severity:** HIGH
- **Sources:** blind
- **Detail:** Adds `document.addEventListener('keydown', this.handleKeydown)` but never removes it in `disconnectedCallback`. If the lightbox component is created, destroyed, and recreated, duplicate listeners accumulate on the document. Each stale listener fires on subsequent key presses.
- **Fix:** Add to `disconnectedCallback`:
```ts
override disconnectedCallback() {
  super.disconnectedCallback();
  document.removeEventListener('keydown', this.handleKeydown);
}
```

---

### P-3 [HIGH] Focus trap mishandles zero focusable elements
- **File:** `src/components/sop-screenshot-lightbox.ts` — `handleFocusTrap`
- **Severity:** HIGH
- **Sources:** edge
- **Detail:** The early return `if (!first || !last) return;` silently exits when no focusable elements exist inside the dialog. This leaves the dialog with zero keyboard access — Tab/Shift+Tab pass through to the background. This can happen if the image fails to load and the dialog only contains the close button (also non-focusable for some reason).
- **Fix:** When no focusable elements exist, ensure at minimum the close button is focusable, or fall back to focusing the dialog itself (`dialog.focus()`).

---

### P-4 [MEDIUM] Timer leak on component disconnect
- **File:** `src/components/sop-app.ts` — `SopApp` class
- **Severity:** MEDIUM
- **Sources:** blind, edge
- **Detail:** `reconnectDebounceTimer` is set in `updated()` but never cleared in `disconnectedCallback`. If the side panel closes while the timer is pending (500ms), the callback fires on a detached component, causing a memory leak and potential state corruption.
- **Fix:** Add to `SopApp`:
```ts
override disconnectedCallback() {
  super.disconnectedCallback();
  if (this.reconnectDebounceTimer) {
    clearTimeout(this.reconnectDebounceTimer);
    this.reconnectDebounceTimer = null;
  }
}
```

---

### P-5 [MEDIUM] Announcer race condition with rapid calls
- **File:** `src/components/sop-app.ts` — `announce()`
- **Severity:** MEDIUM
- **Sources:** blind, edge
- **Detail:** The `announce()` function uses a single `requestAnimationFrame` to set `el.textContent`. If two announcements fire in the same animation frame (e.g., "Recording paused" assertive + "Step 1 captured" polite both triggered simultaneously), the first `textContent = message` is overwritten by the second. Screen readers may only read the last message. Mitigation: queue announcements with a small delay, or clear the pending message before setting a new one.
- **Fix:** Consider a message queue with `setTimeout(fn, 100)` between queued announcements, or a debounced approach that cancels the previous RAF.

---

### P-6 [MEDIUM] Missing Escape key handler for editable fields
- **File:** `src/components/sop-step-card.ts` — `handleTitleKeydown`, `handleDescriptionKeydown`
- **Severity:** MEDIUM
- **Sources:** edge
- **Detail:** Only Enter/Space handle starting edit mode. Escape while focused on an editable element does nothing — the cancel flow works via blur (clicking elsewhere), but explicit Escape would provide better keyboard UX.
- **Fix:** Add Escape handling in the keydown handlers to call `cancelTitleEdit()` / `cancelDescriptionEdit()` when Escape is pressed.

---

### P-7 [MEDIUM] Missing Shift+Enter newline in description textarea
- **File:** `src/components/sop-step-card.ts` — `handleDescriptionKeydown`
- **Severity:** MEDIUM
- **Sources:** edge
- **Detail:** Description fields are `<textarea>` elements. Shift+Enter should insert a newline, but the current Enter handler triggers edit mode instead. Users cannot type multiline descriptions via keyboard.
- **Fix:** In `handleDescriptionKeydown`, check `e.shiftKey` before triggering edit mode. If Shift+Enter, allow default behavior (newline insertion in textarea).

---

### P-8 [MEDIUM] Missing `override` annotation on Lit lifecycle method
- **File:** `src/components/sop-recording.ts` — `updated()`
- **Severity:** MEDIUM
- **Sources:** blind
- **Detail:** `updated()` should be declared as `override updated(_changedProperties: Map<PropertyKey, unknown>): void` to properly type-annotate the LitElement override and ensure the method is recognized as a lifecycle hook.
- **Fix:**
```ts
override updated(_changedProperties: Map<PropertyKey, unknown>): void {
```

---

### P-9 [MEDIUM] Error boundary too broad
- **File:** `src/components/sop-app.ts` — `constructor`
- **Severity:** MEDIUM
- **Sources:** blind
- **Detail:** `this.addEventListener('error', ...)` catches all DOM ErrorEvents including network failures, unhandled promise rejections, and resource load failures — not just render exceptions. All of these incorrectly set `renderError`, triggering the "Something went wrong" UI for non-render failures.
- **Fix:** Either narrow to only catch synchronous render errors (try/catch in `render()` already covers this), or rename `renderError` to `appError` and clarify its scope.

---

### P-10 [MEDIUM] Unsafe type casts in focus management
- **File:** `src/components/sop-app.ts` — `manageFocusForTransition`
- **Severity:** MEDIUM
- **Sources:** blind
- **Detail:** `(pauseBtn as HTMLElement)?.focus()` — the optional chaining covers null, but if the button selected is the "Stop" button instead of "Pause" (depends on recording state), focus goes to the wrong button. Also, the selector `.sop-control-grid button` is fragile — the first button in the grid changes based on state.
- **Fix:** Use a more specific selector like `button[aria-label="Pause"]` or `button.sop-pause-button` to ensure the correct button receives focus.

---

### P-11 [MEDIUM] Focus called before dialog renders
- **File:** `src/components/sop-screenshot-lightbox.ts` — `connectedCallback`
- **Severity:** MEDIUM
- **Sources:** blind
- **Detail:** `requestAnimationFrame` runs `closeBtn.focus()` in `connectedCallback`, before Lit's render cycle guarantees the dialog and its close button exist in the DOM. On slow renders, this is a no-op.
- **Fix:** Use `this.updateComplete` promise before focusing:
```ts
this.updateComplete.then(() => {
  const closeBtn = this.querySelector('button[aria-label="Close"]') as HTMLElement | null;
  closeBtn?.focus();
});
```

---

## Rejected (Noise)

- **XSS in announce()**: `textContent` auto-escapes — not a vulnerability.
- **Missing aria-expanded**: No collapsible elements in this diff.
- **Export retry logic**: Logic is correct — `exportRetryCount` starts at 0, increments to 1 on first export attempt, fallback triggers at count 2.
- **Scroll preference override**: Intentional per AC #5 (`prefers-reduced-motion` should force `auto`).
- **Deprecated clip property**: `clip: rect(0,0,0,0)` is functional in all target browsers.

---

## Acceptance Criteria Status

All 10 acceptance criteria are satisfied. No intent gaps or spec issues found.
