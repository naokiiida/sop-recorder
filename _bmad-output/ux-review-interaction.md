# Interaction Design Review -- SOP Recorder

**Author:** UX Reviewer (Interaction Design Focus)
**Date:** 2026-03-19
**Version:** 1.0
**Status:** Comprehensive Review

---

## Executive Summary

The current SOP Recorder implementation has solid foundational interactions but suffers from **clarity issues**, **cluttered controls**, **weak visual hierarchy**, and **incomplete drag-and-drop feedback**. The core problems:

1. **Redundant h1** -- Chrome already shows "SOP Recorder" title in the panel header
2. **Overcrowded step card actions** -- Up/Down/X buttons look cluttered and create icon confusion
3. **Poor visual distinction** -- "Start Recording" button and cards have identical styling
4. **Input padding issues** -- Edited fields become much larger than display text (PicoCSS)
5. **Incomplete drag feedback** -- No drop zones, insertion indicators, or visual affordances
6. **No hover state patterns** -- All controls always visible, cluttering the interface

---

## 1. Progressive Disclosure & Hover States

### 1.1 Philosophy

Progressive disclosure reduces cognitive load by hiding secondary actions until relevant. In a compact 400px panel, this is critical:

- **Always visible:** Primary action, primary content (title, thumbnail)
- **Hover reveal:** Secondary actions (reorder, delete, edit menu)
- **Behind click/menu:** Tertiary actions (export options, advanced settings)

### 1.2 Home View Recording Cards

**Default state:**
```css
.recording-card-actions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-in;
}
```

**Hover state:**
```css
.recording-card:hover {
  background: var(--pico-muted-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.recording-card:hover .recording-card-actions {
  opacity: 1;
  pointer-events: auto;
}
```

**Touch handling:**
```css
@media (hover: none) {
  .recording-card-actions {
    opacity: 1;  /* Always visible on touch */
    pointer-events: auto;
  }
}
```

### 1.3 Step Card Controls (Edit View)

**Proposed:** Hover-reveal pattern for reorder/delete actions. Keep them hidden by default.

```css
.sop-step-card-actions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-in;
}

.sop-step-card:hover .sop-step-card-actions {
  opacity: 1;
  pointer-events: auto;
}

@media (hover: none) {
  .sop-step-card-actions {
    opacity: 1;
  }
}
```

### 1.4 Edit Field Affordance

Strengthen the hover state for `.sop-editable`:

```css
.sop-editable:hover {
  background: var(--sop-editable-hover-bg);
  border-color: var(--pico-primary);
  box-shadow: 0 0 0 2px rgba(16, 149, 193, 0.1);
}

.sop-editable:active {
  transform: scale(0.99);  /* Micro-interaction: press-down feedback */
}
```

---

## 2. Drag & Drop Design

### 2.1 Current Problems

1. No visual feedback during drag -- user can't see where the step is going
2. No insertion indicators -- drop target is unclear
3. Ghost appearance is minimal
4. Keyboard alternative is missing if buttons are hover-hidden
5. Drag handle is implicit -- users don't know the entire card is draggable

### 2.2 Proposed Drag Handle

Instead of making the entire card draggable, add a small grip icon on the left:

```css
.sop-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: grab;
  color: var(--pico-muted-color);
  transition: color 0.15s, background 0.15s;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  user-select: none;
  border-radius: 4px;
}

.sop-drag-handle:hover {
  color: var(--pico-primary);
  background: rgba(16, 149, 193, 0.1);
}

.sop-drag-handle:active {
  cursor: grabbing;
}
```

### 2.3 Drop Zone Feedback

Improve the drop indicator:

```css
.sop-drop-indicator {
  height: 3px;
  background: var(--pico-primary);
  border-radius: 2px;
  margin: -1.5px 0;
  box-shadow: 0 0 0 2px rgba(16, 149, 193, 0.2);
}
```

### 2.4 Keyboard Alternative

Keep Up/Down buttons as keyboard alternative. Add shortcuts:
- Alt+Up: Move step up
- Alt+Down: Move step down

### 2.5 D&D Should Be Secondary

Drag-and-drop should be secondary, not primary. Users who discover it will use it. Users who don't can rely on buttons. This is the Trello/Notion pattern.

---

## 3. Click Targets & Affordances

### 3.1 WCAG Minimum Touch Target Size

**Current audit (FAIL):**
- Delete button: ~20px -- too small
- Up/Down buttons: ~20px -- too small
- "..." menu button: ~28px -- too small

**Fix:** Increase all buttons to 44x44px minimum:

```css
.sop-action-button {
  background: none;
  border: none;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.15s, transform 0.15s;
}

.sop-action-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sop-action-button:active {
  transform: scale(0.95);
}
```

### 3.2 Input Padding Issue (PicoCSS)

**Problem:** PicoCSS applies additional padding on inputs. The input becomes ~8-10px taller than display text.

**Fix:** Override with a custom class:

```css
.sop-inline-input {
  font-size: inherit;
  padding: 0.2rem 0.35rem;
  margin: 0;
  border: 1px solid var(--pico-primary);
  border-radius: 4px;
  font-family: inherit;
  line-height: inherit;
  width: 100%;
}

.sop-inline-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(16, 149, 193, 0.2);
}
```

---

## 4. Control Visibility Patterns

### 4.1 Step Card Actions (Edit View)

**Recommended: Pattern A (Hover Reveal)**

- Default: Hidden
- Hover: Appear on the right
- Touch: Always visible

**Pros:** Cleaner default, less cognitive load
**Cons:** Discoverable only through hover (mitigated by touch fallback)

### 4.2 Comparison with Real Products

| Pattern | Product | How They Do It |
|---------|---------|----------------|
| **Hover reveal** | Reddit, Trello, Notion | Actions appear on hover; always visible on touch |
| **Three-dot menu** | Gmail, Slack, Twitter | Icon visible; dropdown on click |
| **Context menu** | Figma, Chrome DevTools | Right-click or gear icon |

**Recommendation:** Hover-reveal for step cards, three-dot menu for recording cards.

---

## 5. Icon System

### 5.1 Delete Icon: X vs Trash

**Current:** X (cross) -- conflicts with Chrome's panel close button

**Proposed:** Trash emoji (wastebasket) -- universal affordance for "delete"

### 5.2 Complete Icon Mapping

| Icon | Context | Use |
|------|---------|-----|
| ← | Navigation | "Back to home" |
| Trash | Deletion | "Delete step/recording" |
| ⋮⋮ | Drag | Drag handle on step card |
| Up/Down | Keyboard | Keyboard-only reorder buttons |
| ... | Menu | "More actions" (three-dot menu) |

### 5.3 Icon Style

- Use Unicode symbols for simplicity (no icon library needed)
- Keep icon color consistent with text
- Size: 14-16px (match text)
- No filled icons -- outline style matches PicoCSS aesthetic

---

## 6. State Transitions & Micro-interactions

### 6.1 View Transitions

Already uses View Transitions API with fade. Enhancement: add directional slide for forward/back navigation.

### 6.2 Step Card Entering Live Feed

```css
@keyframes step-enter-live {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.sop-step-card.entering {
  animation: 300ms ease-out both step-enter-live;
}

@media (prefers-reduced-motion: reduce) {
  .sop-step-card.entering { animation: none; }
}
```

### 6.3 Undo Toast Animation

```css
@keyframes toast-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes toast-exit {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(12px); }
}

.sop-undo-toast {
  animation: 300ms ease-out both toast-enter;
}

.sop-undo-toast.exiting {
  animation: 300ms ease-in both toast-exit;
}
```

### 6.4 Edit Mode Enter/Exit

```css
.sop-inline-input {
  animation: 200ms ease-out both input-appear;
}

@keyframes input-appear {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
```

### 6.5 Button Micro-interactions

All buttons should have:
- Hover: background color change
- Active: `transform: scale(0.95)` (press-down feedback)
- Focus: visible outline ring
- Disabled: `opacity: 0.5; cursor: not-allowed`

---

## 7. Full User Flow Walkthrough

### 7.1 Home -> Start Recording

1. Button hover: subtle darkening + scale(1.02)
2. Button click: View Transition fade to recording view
3. Recording view: pulse starts, "0 steps" counter

### 7.2 Recording -> Capture Steps

1. User interacts with page
2. New step card slides in from top (300ms ease-out)
3. Step counter increments
4. Thumbnail loads from screenshot

### 7.3 Recording -> Pause/Resume

1. Pause click: scale(0.95) press feedback
2. Indicator: red -> orange, pulse stops
3. Button text: "Pause" -> "Resume"

### 7.4 Recording -> Stop

1. Stop click: scale(0.95) press feedback
2. View Transition to editor view (150ms fade)
3. Steps shown in sequential order (step 1 first)

### 7.5 Editor -> Reorder (Drag)

1. Hover card: drag handle appears
2. Grab drag handle: cursor -> grabbing
3. Drag over target: blue drop indicator line appears
4. Drop: instant reorder, indicator removed

### 7.6 Editor -> Reorder (Keyboard)

1. Focus card with Tab
2. Press Alt+Up or Alt+Down
3. Step moves, focus follows

### 7.7 Editor -> Delete Step

1. Hover card: actions reveal (including trash icon)
2. Click trash: step removed immediately
3. Undo toast slides up from bottom (300ms)
4. 5 seconds to click "Undo"
5. Toast slides out

### 7.8 Editor -> Edit Title

1. Hover title: dashed border + light background
2. Click: input appears (200ms fade-in), text selected
3. Type new title
4. Enter/blur: input disappears, title updates
5. Esc: cancel, revert to original

### 7.9 Editor -> Back to Home

1. Click back arrow: translateX(-2px) hover effect
2. View Transition fade to home view
3. Home refreshes recording list

---

## 8. Priority Implementation

**Phase 1 (High Impact, Low Effort):**
1. Replace X with trash icon for delete
2. Hide step card actions by default; reveal on hover
3. Increase button hit areas to 44x44px
4. Fix input padding (PicoCSS override)
5. Add hover states to all buttons

**Phase 2 (Medium Impact):**
1. Add drag handle icon
2. Improve drop indicator feedback
3. Enhance undo toast animation
4. Add step card entrance animation
5. Fix grey-on-blue contrast

**Phase 3 (Nice-to-Have):**
1. Custom drag image
2. Keyboard reorder shortcuts (Alt+Up/Down)
3. Enhanced view transitions
4. Edit mode transitions
5. Reusable `.sop-inline-input` component
