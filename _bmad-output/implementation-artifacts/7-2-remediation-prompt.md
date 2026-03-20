# Story 7.2 Remediation — Accessibility Fixes

**Context:** Story 7.2 (WCAG 2.1 AA accessibility) was implemented in commit `14245068`. Code review found 5 confirmed bugs. All other findings were verified against source and rejected as false positives or low-risk.

**Spec:** `_bmad-output/implementation-artifacts/7-2-implement-accessibility-compliance.md`

**Read CLAUDE.md before starting.**

---

## Fix 1 — CRITICAL: Add `tabindex="0"` to edit-mode step card article

**File:** `src/components/sop-step-card.ts`, line 65

The `<article>` in `renderEditMode()` has `@keydown`, `aria-roledescription`, and `aria-label` but no `tabindex="0"`. This means:
- The article is not keyboard-focusable
- `handleCardKeydown` (Alt+Arrow reorder, Delete) is unreachable by keyboard users
- `sop-app.ts:122` and `sop-editor.ts:189` call `article.focus()` which silently fails

**Fix:** Add `tabindex="0"` to the `<article>` element in `renderEditMode()`:

```typescript
<article class="sop-step-card sop-step-card--vertical"
  tabindex="0"
  draggable="true"
  ...
```

This matches the pattern already used for editable `<strong>` (line 128) and `<p>` (line 207) in the same component.

---

## Fix 2 — MAJOR: Fix nested interactivity in selection mode checkboxes

**File:** `src/components/sop-home.ts`, line 90

In selection mode, a bare `<input type="checkbox">` is rendered inside `<article role="button" tabindex="0">`. This creates:
- Nested interactive content (WCAG violation)
- Double tab stop (article + checkbox)
- Checkbox has no label for screen readers

**Fix:** Make the checkbox a visual-only indicator since the parent article handles all interaction:

```typescript
${this.selecting ? html`<input type="checkbox" .checked=${isSelected} tabindex="-1" aria-hidden="true" />` : nothing}
```

Also update the parent article's `aria-label` to include selection state when in select mode:

```typescript
aria-label="${this.selecting && isSelected ? 'Selected, ' : ''}${title}, ${stepLabel}"
```

---

## Fix 3 — MEDIUM: Restore focus after recording title edit in editor

**File:** `src/components/sop-editor.ts`, lines 147-159

`saveTitle()` and `cancelTitleEdit()` do not restore focus to the editable `<h2>` after editing. Compare with `sop-step-card.ts` which correctly calls `this.focusEditableTitle()` on lines 170 and 175.

**Fix:** Add a `focusEditableTitle` method and call it from both methods:

```typescript
private saveTitle() {
  if (!this.editingTitle) return;
  this.editingTitle = false;
  const newTitle = this.editTitleValue.trim();
  if (newTitle && this.recording && newTitle !== this.recording.title) {
    this.recording = { ...this.recording, title: newTitle };
    this.dispatchEvent(new CustomEvent('save-recording', { bubbles: true, composed: true }));
  }
  this.focusEditableTitle();
}

private cancelTitleEdit() {
  this.editingTitle = false;
  this.focusEditableTitle();
}

private focusEditableTitle() {
  requestAnimationFrame(() => {
    const el = this.querySelector('h2.sop-editable') as HTMLElement | null;
    el?.focus();
  });
}
```

---

## Fix 4 — MEDIUM: Focus fallback when all steps are deleted

**File:** `src/components/sop-editor.ts`, lines 182-191

When the last step is deleted, `cards.length` is 0, `focusIndex` becomes -1, and focus is lost to `<body>`. Keyboard users have no context.

**Fix:** Add a fallback after the existing focus logic. When no step cards remain, focus the "Delete Recording" button or the empty state message area:

```typescript
requestAnimationFrame(() => {
  const cards = this.querySelectorAll('sop-step-card');
  const focusIndex = Math.min(deletedIndex, cards.length - 1);
  const card = focusIndex >= 0 ? cards[focusIndex] : undefined;
  if (card) {
    const article = card.querySelector('article');
    (article as HTMLElement)?.focus();
  } else {
    // All steps deleted — focus the delete recording button as fallback
    const fallback = this.querySelector('button.outline.secondary') as HTMLElement | null;
    fallback?.focus();
  }
});
```

Verify the fallback selector matches the "Delete Recording" button in `render()`.

---

## Fix 5 — LOW: Announce first step capture

**File:** `src/components/sop-recording.ts`, line 39

The condition `this.previousStepCount > 0` skips the announcement for the first captured step. Screen reader users hear "Recording started" but never get confirmation that their first action was captured.

**Fix:** Change the condition to `>= 0`:

```typescript
if (this.steps.length > this.previousStepCount && this.previousStepCount >= 0) {
```

Note: This means "Step 1 captured: [title]" will announce shortly after "Recording started". If the timing feels like a double-announcement, add a guard that skips if `this.steps.length === 1 && elapsed < 1000ms` from recording start — but try the simple fix first and test with VoiceOver.

---

## Verification

After all fixes:
1. `pnpm build` — zero errors
2. `pnpm test` — all 247+ tests pass
3. Manual keyboard test: Tab to a step card in edit mode, press Alt+ArrowDown to reorder, press Delete to delete
4. Manual keyboard test: Tab through recording cards in selection mode — should be one tab stop per card, not two
5. Manual keyboard test: Edit recording title in editor, press Enter — focus should return to the title
6. Manual keyboard test: Delete all steps — focus should land on Delete Recording button
7. VoiceOver: Start recording, perform first action — should hear "Step 1 captured: [title]"
