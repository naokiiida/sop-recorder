# Code Review Report: Story 7.2 Accessibility Compliance

## Executive Summary
The implementation provides a strong foundation for WCAG 2.1 AA compliance, particularly in focus management and screen reader announcements. However, a critical omission of `tabindex` on draggable cards prevents keyboard users from using the newly implemented reordering shortcuts. Additionally, nested interactivity in the home view selection mode may confuse screen reader users.

## Triage Summary
| Category | Count | Description |
| --- | --- | --- |
| 🔴 CRITICAL | 1 | Functional breakage for keyboard users (shortcuts inaccessible). |
| 🟠 MAJOR | 1 | Nested interactivity and missing selection state in ARIA labels. |
| 🟡 MINOR | 2 | Announcement and focus restoration omissions. |
| 🔵 CONSIDERATION | 2 | UX/A11y enhancements for better clarity. |

---

## 🔴 CRITICAL FINDINGS

### 1. Draggable Step Cards Missing Tabindex
- **File**: `src/components/sop-step-card.ts`
- **Issue**: The `<article>` element in `renderEditMode` lacks `tabindex="0"`.
- **Impact**: Keyboard users cannot focus the card itself. Since the `Alt+Arrow` and `Delete` handlers are attached to this article, these shortcuts are completely inaccessible to keyboard-only users. Furthermore, `sop-app.ts`'s focus management fails to focus the first card when entering the editor.
- **Remediation**: Add `tabindex="0"` to the `<article>` in `renderEditMode`.

---

## 🟠 MAJOR FINDINGS

### 2. Nested Interactivity in Recording Selection
- **File**: `src/components/sop-home.ts`
- **Issue**: In selection mode, a native `<input type="checkbox">` is rendered inside an `<article role="button" tabindex="0">`.
- **Impact**: This creates a "button inside a button" anti-pattern. Screen readers may struggle to navigate or activate the internal checkbox correctly. Additionally, the checkbox lacks an `aria-label`.
- **Remediation**: Add `tabindex="-1"` and `aria-hidden="true"` to the internal checkbox since the entire card toggles selection via the parent's `@click`. Ensure the `aria-label` on the parent article reflects the selected state (e.g., `"Selected, [Title], [Steps]"`).

---

## 🟡 MINOR FINDINGS

### 3. First Step Captured Announcement Skipped
- **File**: `src/components/sop-recording.ts`
- **Issue**: The logic `if (this.steps.length > this.previousStepCount && this.previousStepCount > 0)` explicitly skips the announcement for the first step (where `previousStepCount` is 0).
- **Impact**: Screen reader users miss the confirmation for the first action they take.
- **Remediation**: Change condition to `this.previousStepCount >= 0` or ensure the first step is captured and announced.

### 4. Missing Focus Restoration for Recording Title
- **File**: `src/components/sop-editor.ts`
- **Issue**: Unlike `sop-step-card.ts`, the `saveTitle` and `cancelTitleEdit` methods do not return focus to the `h2.sop-editable` button.
- **Impact**: Focus is lost after editing the recording title, requiring the user to re-tab through the entire page.
- **Remediation**: Implement a `focusEditableTitle` method using `requestAnimationFrame` and call it after title edits.

---

## 🔵 CONSIDERATIONS

### 5. ARIA Label Dynamic Updates
- **File**: `src/components/sop-home.ts`
- **Suggestion**: When `this.selecting` is true, the `aria-label` for recording cards should ideally include "Selected" or "Not selected" to provide immediate feedback on the state.

### 6. Live Mode Card Semantic Clarity
- **File**: `src/components/sop-step-card.ts`
- **Suggestion**: In `live` mode, the step card is read-only but styled similarly to the interactive cards. Consider if a `role="listitem"` would be more appropriate for the step feed container.

---

## Validation Status
- [x] Announcer infrastructure (sop-app.ts)
- [x] Keyboard shortcuts (sop-step-card.ts - implementation logic correct, but trigger missing tabindex)
- [x] Focus management (sop-app.ts - logic correct, but target in editor not focusable)
- [x] ARIA attributes (sop-recording.ts, sop-editor.ts)
- [x] Lightbox focus trap (sop-screenshot-lightbox.ts)
- [x] Axe-core E2E test (Home view only)

**Verdict**: Implementation is 90% complete but requires surgical fixes for the critical `tabindex` and major `nested interactivity` issues before it can be considered truly compliant.
