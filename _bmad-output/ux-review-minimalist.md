# UX Review: Minimalist Information Architecture
## SOP Recorder Chrome Extension Side Panel

**Date:** 2026-03-19
**Reviewer:** UX Audit (Minimalist Information Architecture Perspective)
**Scope:** All UI elements across Home, Recording, and Editor views

---

## Executive Summary

The SOP Recorder extension demonstrates solid interaction patterns but suffers from **information architecture redundancy, visual noise, and unclear information hierarchy** that contradicts its stated design philosophy of "invisible until needed" and "progressive disclosure."

Key findings:
- Header contains redundant chrome already provided by the browser
- Step card controls (up/down/x) are always-visible but rarely used -- should be progressive
- Recording list and "Start Recording" action lack visual distinction
- Too much metadata shown too early (URLs, step counts, descriptions)
- Editor navigation pattern (back button) conflicts with modern browser UX expectations

**Recommendation:** Ruthlessly prune always-visible elements. Move 70% of controls to hover/menu states. Redesign visual hierarchy so the primary action is unmistakable.

---

## 1. Element-by-Element Audit

### 1.1 Header Section

**Current:** Header with back button (edit mode) + h1 "SOP Recorder"

**Issues:**

| Element | Does it need to exist? | Analysis | Recommendation |
|---------|------------------------|----------|-----------------|
| Back button | No (in edit mode) | Chrome already shows extension name + close/minimize icons in the side panel header. Users understand the panel context. The arrow is a weak signifier compared to platform conventions. | Remove. Let browser context (panel header) inform the user they're in the side panel. |
| h1 SOP Recorder | **No.** | Chrome already displays "SOP Recorder" with a pin icon and close button above the side panel. Repeating it inside wastes ~50px of vertical space. | Remove from header. Repurpose space for dynamic view titles or remove entirely. |

**What happens if we remove these?**
- Users still know they're in SOP Recorder (Chrome header remains)
- We gain ~2 lines of vertical space
- First glance focuses on actual content, not chrome

**Visual comparison:** Loom and Scribe both hide their brand name inside the extension panel -- the browser chrome is sufficient.

---

### 1.2 Home View

#### Recording List Cards

**Issues:**

| Element | Does it need to exist? | Analysis | Recommendation |
|---------|------------------------|----------|-----------------|
| **Step count badge** ("5 steps") | Partially | Users scanning saved recordings care about: (1) What is this? (2) Is it recent? Step count is metadata that matters only when *opening* a recording. | Move to hover tooltip or open-on-click detail view. Show only on editor view where it's actionable. |
| **Creation date** (Mar 19) | Yes | Helps locate "which one is recent?" But format is sub-optimal. | Keep, but use relative dates ("Today", "Yesterday", "3 days ago") for faster cognitive load. |
| **Per-card actions** | Replaced | Old three-dot menu removed. Recording cards are now simple clickable list items. Long-press (500ms) enters multi-select mode for batch delete/export. Delete Recording button available in editor view. | Simpler interaction model; reduces per-card visual noise. |

#### "Start Recording" Button

**Issues:**

| Element | Visual priority? | Analysis | Recommendation |
|---------|------------------|----------|-----------------|
| Button text + bullet | **Not distinctive enough** | PicoCSS applies default button styles (blue). Recording cards below also have blue backgrounds. Result: "Start Recording" blends into the saved recordings list. | Use `class="contrast"` in PicoCSS for dark background, OR custom styling with contrasting color. Add 1rem gap between button and list. |

**Competitive analysis:** Loom shows a large red/orange "New Video" button. Scribe uses a green "+ New SOP" button with clear color differentiation.

---

### 1.3 Recording View

#### Recording Indicator & Step Counter

| Element | Does it need to exist? | Analysis | Recommendation |
|---------|------------------------|----------|-----------------|
| Red pulsing dot | Yes (critical affordance) | Users need to know recording is live. Pulse animation is excellent. | Keep as-is. |
| "Recording" text | Partially | The pulsing dot already communicates state. Text is redundant but reinforcing. | Acceptable. Consider: remove color from text (just use default) since the dot carries the color signal. |
| "3 steps" counter | Yes | Feedback that interactions are being captured. Important for user confidence. | Keep. |

#### Pause/Resume/Stop Controls

**Assessment:** Good. Clear, distinct actions. No changes recommended.

---

### 1.4 Step Card -- The Most Critical Element

This component appears in TWO contexts: **live mode** (recording view) and **edit mode** (editor view). Scrutiny here yields the biggest UX improvements.

#### Live Mode (read-only)

**Information Hierarchy Analysis:**

| Priority | Element | Current Visibility | Assessment |
|----------|---------|-------------------|------------|
| **#1** | Screenshot | Always visible (80x45px) | Good. Users recognize the page context visually. |
| **#2** | Step title | Always visible (0.85rem, bold) | Good. Clear action label. |
| **#3** | URL | Always visible (0.75rem, muted) | **Problem.** In a 400px panel, URL takes ~50px width and offers low value during recording. Users already see the page they're interacting with. |
| **#4** | Step number | Always visible (0.7rem) | Acceptable. Small, doesn't clutter. |

**Proposal for live mode:**

| Element | Action | Rationale |
|---------|--------|-----------|
| **URL** | Hide by default | During recording, the user's *visible page* is the best reference. The URL is noise. |
| **Show URL on hover** | Tooltip | Hover reveals full URL. Touch users can long-press thumbnail. |

---

#### Edit Mode

**Current controls:** Step number + Up/Down/Delete buttons always visible

**Issues:**

| Element | Does it need to exist? | Recommendation |
|---------|------------------------|-----------------|
| **Up/Down reorder buttons** | Conditional. Exist but are intrusive. | **Hide by default.** Show on hover (mouse). Most users will rely on drag-and-drop, not click buttons. When hover state appears, show: a single "..." menu. |
| **Delete (x) button** | Yes, but placement is wrong. | Move to menu. Delete is destructive -- should be *less* prominent, not prominent. Inline icon makes it easy to fat-finger. Combined with undo toast, menu-hidden delete is safe and modern. |

**Competitive analysis:**
- **Chrome DevTools Recorder:** Uses context menu for step actions. No inline symbols.
- **Scribe:** Reorder buttons appear only on hover. Delete is a menu option with undo toast.
- **Tango:** Cards show only title + screenshot. Reorder is drag-only. Delete is menu-hidden.

**Visual clutter audit for edit mode step card:**
```
Current inline controls: Up Down X = 3 buttons x 0.35rem + gaps = ~1.2rem of visual weight
With menu-hidden: just "..." = 0.35rem
Saves ~0.85rem per card. In a 400px panel, that's ~20% more breathing room.
```

---

#### Title Editing

**Issue:** Input height is noticeably larger than the strong text due to PicoCSS default input padding. Visual "jump" when clicked makes the UI feel janky.

**Proposal:** Set `padding: 0.1rem 0.2rem` on input to match the display text height.

---

#### Description Editing

**Issue:** "Add description" placeholder looks the same as other muted text, causing confusion about affordance.

**Proposal:**
- Add visual cue: prefix with pencil icon or "+" -- e.g., "Add description" with dashed border
- Use `font-weight: 500` instead of italic (italic can feel like "disabled" text)
- Add outline on hover to match affordance of editable title

---

#### URL Display

| Aspect | Current | Issue | Proposal |
|--------|---------|-------|----------|
| Always visible | Yes | In edit mode, URL takes ~50px width. User can see page context from screenshots. URL is secondary reference. | Hide by default. Show in tooltip on hover. |

---

### 1.5 Editor View

#### Recording Title Editing

**Issue:** Input is significantly larger than h2 due to PicoCSS padding defaults. Visual jump on click is jarring.

**Proposal:** Tighten input padding to prevent visual jump. Add subtle dashed border on h2 hover to signal editability.

---

## 2. Information Hierarchy Analysis

### 2.1 Home View

**Current hierarchy (reading order):**
1. "Start Recording" button (primary)
2. "Saved Recordings" heading
3. Recording cards: Title, Step count + date, menu

**Problem:** Step count and date are cognitive load at scan time.

**Proposed hierarchy:**
1. **Prominent "Start Recording"** with visual distinction (contrasting color)
2. Simple recording list: **Title only** (or Title + small thumbnail)
3. On click: enter editor, where step count becomes primary metadata
4. Long-press (500ms): enter multi-select mode for batch delete/export

### 2.2 Recording View

**Current hierarchy:** Correct. No changes needed.

### 2.3 Editor View

**Proposed hierarchy:**
1. Recording title + step count (both needed in editor context)
2. Steps with **hidden controls** (show "..." menu on hover)
3. Export button (unchanged)
4. Undo toast (unchanged)

---

## 3. Specific Proposals for User Concerns

### 3.1 Header/Navigation

**Proposal: Remove Header Entirely (Most Minimalist)**

- Chrome context (side panel) is clear
- View structure is consistent (home -> edit -> home)
- Use Esc key for back navigation
- Saves 50px+ of vertical space

**Implementation:** Delete header section from sop-app.ts. Add Esc keydown listener for back navigation.

### 3.2 Step Card -- Reorder Controls

**Proposal: Hide by Default, Show on Interaction**

For step cards in the editor view:
- Mouse users (hover): Show "..." button on card hover, which opens context menu with Move Up, Move Down, Delete.
- Touch users: Always show "..." button (`@media (hover: none)`).

For recording cards on the home view:
- Simple clickable list items (click to navigate to editor).
- Long-press (500ms) enters multi-select mode for batch delete/export.
- Delete Recording button is also available in the editor view.

**Benefit:**
- Removes visual clutter from default view
- Drag-and-drop remains primary reorder method
- Delete is less accidental (requires menu + undo)

### 3.3 Delete Action

**Delete actions use two patterns:**

For individual steps (editor view): Move delete to step card context menu ("..."). Combined with the undo toast, this provides "forgiveness over confirmation."

Step delete flow:
1. Click "..." menu -> "Delete"
2. Step is immediately deleted
3. Toast appears: "Step deleted [Undo]"
4. User has 5 seconds to undo

For recordings: Use long-press (500ms) multi-select on home view for batch delete, or "Delete Recording" button in editor view.

### 3.4 Home View -- Visual Distinction

**Use PicoCSS `class="contrast"`** on Start Recording button. Cards stay as `<article>` with default styling. Clear visual separation.

### 3.5 Editor View -- Navigate Back to Home

**Use Esc key.** Remove back button. Standard web UX for "close/back." Alternatively, add subtle breadcrumb if users get stuck.

---

## 4. User Flow Analysis -- Friction Points

### Primary Journey: "Record and Save a SOP"

| Step | Friction | Proposal |
|------|----------|----------|
| Home view | "Start" button doesn't visually dominate | Add contrast styling |
| Recording | Controls are clear; feedback is good | No changes |
| Recording -> Editor | Automatic transition after "Stop" | Good |
| Editor | Reorder/delete controls are always visible, cluttering UI | Hide step controls in "..." menu; add Delete Recording button |
| Editor -> Export | Button is visible; low friction | Good |

### Secondary Journey: "Review and Clean Up Recording"

| Step | Friction | Proposal |
|------|----------|----------|
| Home view | Step count metadata is secondary info | Move to tooltip |
| Editor | Too many inline controls | Hide step controls in context menu; Delete Recording button at bottom |

---

## 5. Competitive Analysis

### Reorder & Delete Controls

| Tool | Reorder Method | Delete Affordance | Undo |
|------|---|---|---|
| **Chrome DevTools Recorder** | Drag-and-drop or right-click menu | Right-click > "Remove Step" | No |
| **Scribe** | Drag-and-drop | Hover menu > Delete | Confirmation dialog |
| **Tango** | Drag-and-drop or "..." menu | Hidden in menu | Undo toast (5s) |
| **Loom** | Drag-and-drop (clips) | Inline delete + confirm | Undo toast |
| **SOP Recorder (proposed)** | Drag-and-drop (steps); long-press multi-select (recordings) | Steps: hidden in "..." menu; Recordings: multi-select batch delete or editor Delete button; undo toast | Undo toast (5s) |

### Metadata Density in Lists

| Tool | List Item Shows | Scannability |
|---|---|---|
| **Loom** | Thumbnail, title, duration | Fast |
| **Tango** | Thumbnail, title only | Very fast |
| **SOP Recorder (proposed)** | Title only; long-press for multi-select | Very fast |

### Header/Navigation

| Tool | Header Strategy | Nav Pattern |
|---|---|---|
| **Chrome DevTools Recorder** | Tool name in DevTools tab (not in panel) | No back button |
| **Scribe** | No header in panel | Click to expand/collapse |
| **SOP Recorder (proposed)** | No header (rely on browser chrome) | Esc key to back |

---

## 6. Recommendations Summary

### Immediate Changes

**Remove:**
1. `<h1>SOP Recorder</h1>` from header (chrome already shows this)
2. Back button (use Esc key instead)
3. Up/Down/X controls from always-visible step card layout

**Hide by Default:**
1. URL in live card (show on hover tooltip)
2. URL in edit card (show on hover tooltip)
3. Step count in home view card (show on hover)
4. Delete/reorder actions in step cards (show in "..." context menu on hover in editor view)

**Add:**
1. `class="contrast"` to "Start Recording" button
2. Long-press (500ms) multi-select mode on home view recording list for batch delete/export
3. Delete Recording button in editor view
4. Hover state for step cards in editor: show "..." menu with Move Up, Move Down, Delete

**Fixes:**
1. Tighten input padding (title edit boxes) to prevent visual jump
2. Add `@media (hover: none)` rule to always show "..." on touch devices (step cards in editor)
3. Adjust gap between "Start Recording" button and recording list (1rem separator)

### Secondary Changes (Future)

1. Relative dates: "Today", "Yesterday" instead of absolute dates
2. Breadcrumb header: Only show in editor view as "Editing: [Title]"
3. Inline drag-handle: Add subtle grip icon to left of step number

---

## 7. Design Rationale

### Why Remove Header?

- Chrome already shows extension name + close/pin buttons above the side panel
- Saves 50px of vertical space in a constrained 400px-wide panel
- Consistent with competitive tools (Scribe, DevTools)
- Back button contradicts modern UX; Esc is the standard

### Why Hide Step Controls?

- Only used rarely: most users drag-to-reorder
- Reduces cognitive load: each card is simpler to scan
- Prevents fat-finger errors on destructive delete action
- Follows modern UX patterns: Figma, Notion, Slack all hide destructive actions in menus

### Key Principle

In a 400px panel, **every pixel must earn its place.** If an element is used < 20% of the time, hide it by default.
