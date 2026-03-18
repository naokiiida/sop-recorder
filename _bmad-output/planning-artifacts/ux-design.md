# UX Design Specification — SOP Recorder

**Author:** Naokiiida
**Date:** 2026-03-18
**Version:** 1.0
**Status:** Draft

---

## 1. Design Philosophy

### 1.1 Guiding Principles

1. **Invisible until needed** — The extension stays out of the way until the user activates it. No onboarding wizard, no splash screen, no mandatory setup.
2. **Progressive disclosure** — Show only what matters for the current task. Recording view shows recording controls. Edit view shows editing tools. No feature dumping.
3. **Platform-native** — Use Chrome's side panel as intended. Respect system dark/light mode. Use semantic HTML that PicoCSS styles automatically. Prefer browser APIs (View Transitions, HTML5 DnD) over JavaScript alternatives.
4. **Forgiveness over confirmation** — Undo instead of "Are you sure?" dialogs. Destructive actions are recoverable, not gated.
5. **Compact density** — Every pixel matters in a ~400px-wide panel. Prioritize information density without sacrificing touch targets.

### 1.2 Design Constraints

| Constraint | Detail |
|-----------|--------|
| **Width** | Chrome side panel: ~300-500px, design target 400px |
| **Height** | Full viewport height, scrollable content area |
| **Framework** | Lit Web Components (light DOM mode) |
| **Styling** | PicoCSS classless (~4 KB gzip) + minimal custom CSS |
| **Animations** | View Transitions API (native, zero bundle cost) |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Color** | System dark/light mode via `prefers-color-scheme` (PicoCSS handles this) |

---

## 2. Information Architecture

### 2.1 View Structure

The side panel has three primary views plus one overlay. Navigation is state-driven, not user-selected (no tab bar or hamburger menu).

```
┌──────────────────────────────────┐
│           <sop-app>              │
│  ┌────────────────────────────┐  │
│  │  View Router (state-based) │  │
│  │                            │  │
│  │  ┌─────────┐              │  │
│  │  │  HOME   │ ← Default    │  │
│  │  │         │   (idle)     │  │
│  │  └────┬────┘              │  │
│  │       │ Start Recording   │  │
│  │       ▼                   │  │
│  │  ┌──────────┐             │  │
│  │  │RECORDING │ ← Active    │  │
│  │  │          │   capture   │  │
│  │  └────┬─────┘             │  │
│  │       │ Stop Recording    │  │
│  │       ▼                   │  │
│  │  ┌─────────┐              │  │
│  │  │  EDIT   │ ← Post-     │  │
│  │  │         │   recording  │  │
│  │  └─────────┘              │  │
│  │                            │  │
│  │  Screenshot Lightbox       │  │
│  │  (overlay on any view)    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 2.2 View Transition Map

| From | To | Trigger | Transition |
|------|----|---------|-----------|
| Home | Recording | Click "Start Recording" or Alt+Shift+R | Slide-up (new view rises from bottom) |
| Recording | Edit | Click "Stop Recording" | Crossfade (step list persists, controls transform) |
| Edit | Home | Click "Done" or back arrow | Slide-down (return to list) |
| Home | Edit | Click a saved recording | Slide-right (drill into detail) |
| Edit | Home | Click back arrow | Slide-left (return to list) |
| Any | Recording | Alt+Shift+R (while idle) | Slide-up |
| Recording | Home | Alt+Shift+R (while recording) → stops, then if no steps captured | Crossfade to Home |

### 2.3 URL/State Scheme

Since the side panel is a single HTML document, views are managed by application state, not URL routing.

```typescript
type ViewState = 'home' | 'recording' | 'edit';

// State drives view rendering
interface AppState {
  currentView: ViewState;
  activeRecordingId: string | null;
  selectedRecordingId: string | null;  // For editing saved recordings
}
```

---

## 3. Component Architecture

### 3.1 Component Tree

```
<sop-app>                          Root shell, view router
├── <sop-home>                     Recording list + start button
│   ├── <sop-empty-state>          First-time empty state
│   └── <sop-recording-card>       Recording list item (repeated)
├── <sop-recording>                Active recording view
│   ├── recording controls         Start/Stop/Pause inline
│   └── <sop-step-card>            Live step preview (repeated)
├── <sop-editor>                   Step editing view
│   ├── header with back + export  Navigation + actions
│   ├── <sop-step-card>            Editable step (repeated)
│   └── <sop-export-panel>         Export options (inline, not modal)
└── <sop-screenshot-lightbox>      Full-size screenshot overlay
```

### 3.2 Component Specifications

#### `<sop-app>` — Root Shell

**Purpose:** Application shell, view routing, global state management.

```
┌──────────────────────────────┐
│ SOP Recorder          [gear] │  ← Minimal header
├──────────────────────────────┤
│                              │
│  [Active View Content]       │  ← Scrollable content area
│                              │
│                              │
└──────────────────────────────┘
```

- Manages `ViewState` and transitions between views
- Hosts the `RecordingStore` (Lit ReactiveController) for cross-component state
- Renders active view based on state
- Header shows app name; gear icon opens settings (v1: minimal — auto-purge toggle, keyboard shortcut reference)
- Uses `document.startViewTransition()` for view changes
- Listens for `chrome.runtime` messages to sync state with background

**Lit implementation notes:**
- Light DOM mode (`createRenderRoot() { return this; }`)
- Conditional rendering via `switch` in `render()`, not `<template>` elements
- View transition names assigned to view containers for animated swaps

---

#### `<sop-home>` — Home View

**Purpose:** List saved recordings, provide "Start Recording" entry point.

**Empty State** (no recordings):

```
┌──────────────────────────────┐
│ SOP Recorder          [gear] │
├──────────────────────────────┤
│                              │
│         ┌────────┐           │
│         │  📋➡️  │           │
│         └────────┘           │
│                              │
│   Record your first SOP      │
│                              │
│   Click below to start       │
│   capturing browser actions  │
│   as step-by-step docs.      │
│                              │
│  ┌──────────────────────┐    │
│  │   ⏺  Start Recording │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**With Recordings:**

```
┌──────────────────────────────┐
│ SOP Recorder          [gear] │
├──────────────────────────────┤
│                              │
│  ┌──────────────────────┐    │
│  │  ⏺  Start Recording  │    │
│  └──────────────────────┘    │
│                              │
│  Saved Recordings (3)        │
│                              │
│  ┌──────────────────────────┐│
│  │ Salesforce Contact Setup ││
│  │ 12 steps · Mar 18, 2026  ││
│  │                    [···] ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ Jira Ticket Workflow     ││
│  │ 8 steps · Mar 17, 2026   ││
│  │                    [···] ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ HR Onboarding Process    ││
│  │ 22 steps · Mar 15, 2026  ││
│  │                    [···] ││
│  └──────────────────────────┘│
│                              │
└──────────────────────────────┘
```

**Component behavior:**
- "Start Recording" button is always visible and prominent (PicoCSS primary `<button>`)
- Recording cards show: title, step count, date, overflow menu (rename, delete, export)
- Click on card → navigate to Edit view for that recording
- Overflow menu `[···]` → small dropdown: Rename, Export, Delete
- Delete from list → undo toast (5-second window), not confirmation dialog
- List sorted by `updatedAt` descending (most recent first)

**HTML structure:**
```html
<section>
  <button>Start Recording</button>
</section>
<section>
  <h2>Saved Recordings <small>(3)</small></h2>
  <article><!-- recording card --></article>
  <article><!-- recording card --></article>
</section>
```

PicoCSS styles `<article>`, `<button>`, `<section>`, `<h2>`, `<small>` automatically.

---

#### `<sop-recording>` — Active Recording View

**Purpose:** Show recording status, live step feed, recording controls.

```
┌──────────────────────────────┐
│ SOP Recorder          [gear] │
├──────────────────────────────┤
│  ┌──────────────────────────┐│
│  │ 🔴 Recording · 5 steps   ││
│  │                          ││
│  │  [ ⏸ Pause ] [ ⏹ Stop ] ││
│  └──────────────────────────┘│
│                              │
│  Live Steps                  │
│                              │
│  5. Clicked "Save" button    │
│     salesforce.com/contact   │
│  ┌──────┐                    │
│  │thumb │                    │
│  └──────┘                    │
│                              │
│  4. Typed "john@example.com" │
│     Email input field        │
│  ┌──────┐                    │
│  │thumb │                    │
│  └──────┘                    │
│                              │
│  3. Clicked "Email" field    │
│     salesforce.com/contact   │
│  ┌──────┐                    │
│  │thumb │                    │
│  └──────┘                    │
│                              │
│  2. Clicked "New Contact"    │
│  1. Navigated to Contacts    │
│                              │
└──────────────────────────────┘
```

**Component behavior:**
- **Recording indicator**: Red circle (CSS `background: red; border-radius: 50%;`) with pulse animation (`@keyframes pulse`). Text "Recording" beside it with step counter.
- **Pause button**: Toggles to "Resume" when paused. Indicator changes to yellow/amber. Text changes to "Paused".
- **Stop button**: Ends recording, transitions to Edit view.
- **Live step list**: New steps appear at the top (reverse chronological during recording for immediate visibility). Each step shows:
  - Step number
  - Auto-generated title (accessible name or action description)
  - Page URL (truncated, muted color)
  - Thumbnail (small, ~80x45px during recording, loaded lazily)
- Steps animate in from top using View Transitions API
- List is read-only during recording (editing happens in Edit view)
- Most recent step is visually emphasized (slight background highlight that fades after 2 seconds)

**Paused state:**

```
┌──────────────────────────────┐
│  ┌──────────────────────────┐│
│  │ ⏸ Paused · 5 steps       ││
│  │                          ││
│  │ [▶ Resume ] [ ⏹ Stop ]  ││
│  └──────────────────────────┘│
```

**Recovery state** (after service worker restart):

```
┌──────────────────────────────┐
│  ┌──────────────────────────┐│
│  │ ⚠ Recording Interrupted  ││
│  │ 12 steps captured        ││
│  │                          ││
│  │ [▶ Resume] [💾 Save]     ││
│  └──────────────────────────┘│
```

---

#### `<sop-editor>` — Edit View

**Purpose:** Full step editing, reordering, deletion, and export trigger.

```
┌──────────────────────────────┐
│ [←] Salesforce Contact  [⬇]  │  ← Back + title (editable) + export
├──────────────────────────────┤
│                              │
│  12 steps · Mar 18, 2026     │
│                              │
│  ┌──────────────────────────┐│
│  │ 1. Navigated to Contacts ││
│  │    salesforce.com/contacts││
│  │ ┌──────────────────────┐ ││
│  │ │                      │ ││
│  │ │    screenshot        │ ││
│  │ │    thumbnail         │ ││
│  │ │    (160x90)          │ ││
│  │ │                      │ ││
│  │ └──────────────────────┘ ││
│  │ Click title to edit      ││
│  │              [↑][↓] [🗑] ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ 2. Clicked "New Contact" ││
│  │    ...                   ││
│  └──────────────────────────┘│
│                              │
│  ...more steps...            │
│                              │
│  ┌──────────────────────────┐│
│  │  ⬇  Export as ZIP        ││
│  └──────────────────────────┘│
│                              │
└──────────────────────────────┘
```

**Component behavior:**
- **Back arrow** `[←]` returns to Home view
- **SOP title** in header is click-to-edit (inline, no modal)
- **Export icon** `[⬇]` in header triggers export (same as bottom button)
- **Step cards** in edit mode show:
  - Step number (auto-renumbered)
  - Title (click-to-edit, becomes `<input>` on click)
  - Description (click-to-edit, becomes `<textarea>` on click)
  - URL (display only, muted)
  - Screenshot thumbnail (click to open lightbox)
  - Reorder buttons `[↑][↓]` (disabled at boundaries)
  - Delete button `[🗑]`
- **Drag-and-drop reorder**: Steps are draggable via a drag handle on the left edge. Uses HTML5 Drag and Drop API. Visual placeholder shows insertion point.
- **Step deletion**: Removes step immediately, shows undo toast at bottom for 5 seconds. No confirmation dialog.
- **Export button** at bottom of step list — prominent, always visible when scrolled to bottom

**Inline editing interaction:**

```
[Normal state]
┌──────────────────────────────┐
│ 3. Clicked "Email" field     │  ← Click to edit
└──────────────────────────────┘

[Edit state - activated by click]
┌──────────────────────────────┐
│ 3. [Clicked "Email" field |] │  ← Input with cursor
│    [Enter customer email   ] │  ← Description textarea
│              [Save] [Cancel] │
└──────────────────────────────┘
```

- Click on title text → replaces with `<input>` pre-filled with current value
- Click on description area → replaces with `<textarea>`
- Save: Enter key (title) or click Save / blur (description)
- Cancel: Escape key or Cancel button
- Focus management: autofocus the input/textarea on activation

---

#### `<sop-step-card>` — Step Card Component

**Purpose:** Reusable step display component used in both Recording and Edit views.

**Variants:**
1. **Live mode** (in Recording view) — read-only, compact, no actions
2. **Edit mode** (in Editor view) — interactive, full controls

**Live mode layout (compact):**

```
┌──────────────────────────────────┐
│ 5. Clicked "Save" button         │
│    salesforce.com/contact/new    │
│ ┌────────┐                       │
│ │ thumb  │                       │
│ │ 80x45  │                       │
│ └────────┘                       │
└──────────────────────────────────┘
```

**Edit mode layout (full):**

```
┌──────────────────────────────────────┐
│ ≡  5. Clicked "Save" button    [↑↓🗑]│
│    salesforce.com/contact/new        │
│    ┌────────────────────────────┐    │
│    │                            │    │
│    │   screenshot thumbnail     │    │
│    │   160x90px                 │    │
│    │   (click to enlarge)       │    │
│    │                            │    │
│    └────────────────────────────┘    │
│    Description: Click the Save       │
│    button to confirm the contact.    │
└──────────────────────────────────────┘
```

- `≡` is the drag handle (visible in edit mode only)
- Step number auto-updates based on position
- Thumbnail: 160x90px in edit mode, 80x45px in live mode
- Click thumbnail → opens `<sop-screenshot-lightbox>`

**Accessibility attributes:**
```html
<article
  role="listitem"
  aria-label="Step 5: Clicked Save button"
  draggable="true"
  tabindex="0"
>
  <button aria-label="Move step 5 up" class="reorder-up">↑</button>
  <button aria-label="Move step 5 down" class="reorder-down">↓</button>
  <button aria-label="Delete step 5" class="delete-step">Delete</button>
</article>
```

---

#### `<sop-screenshot-lightbox>` — Screenshot Overlay

**Purpose:** Display full-size screenshot in an overlay.

```
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │                     [✕]  │ │
│ │                          │ │
│ │   Full-size screenshot   │ │
│ │   (scrollable if larger  │ │
│ │    than viewport)        │ │
│ │                          │ │
│ │                          │ │
│ │                          │ │
│ │                          │ │
│ └──────────────────────────┘ │
│ Step 5: Clicked "Save"       │
│ ◀ Prev          Next ▶       │
└──────────────────────────────┘
```

- Uses native `<dialog>` element (PicoCSS styles modals automatically)
- Close: click `[✕]`, press Escape, or click backdrop
- Navigate between steps with Prev/Next buttons or left/right arrow keys
- Screenshot scales to fit panel width; pinch-to-zoom on touch devices
- Loads full-resolution screenshot from IndexedDB on demand (not preloaded)
- Focus trapped inside dialog while open
- `aria-label="Screenshot for step 5"` on the image

---

#### `<sop-export-panel>` — Export Controls

**Purpose:** Trigger export and show progress/completion.

This is rendered inline at the bottom of the Edit view, not as a separate view or modal. For v1, there is only one export format (Markdown + ZIP), so the UI is minimal.

```
┌──────────────────────────────┐
│  Export                       │
│                              │
│  ┌──────────────────────────┐│
│  │  ⬇  Download ZIP         ││
│  │  Markdown + screenshots  ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │  📋  Copy Markdown       ││
│  │  Text only, no images    ││
│  └──────────────────────────┘│
│                              │
└──────────────────────────────┘
```

**States:**
- **Idle**: Buttons shown as above
- **Generating**: Button text changes to "Generating..." with a subtle spinner (CSS animation, no JS). Button disabled.
- **Complete**: "Downloaded!" with checkmark, reverts to idle after 3 seconds
- **Error**: "Export failed — try again" in red text. Button returns to idle state.

---

### 3.3 Undo Toast Component

A transient notification for recoverable actions (step deletion, recording deletion).

```
┌──────────────────────────────┐
│                              │
│  (normal view content)       │
│                              │
│  ┌──────────────────────────┐│
│  │ Step deleted    [Undo]   ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

- Fixed to bottom of panel, above any sticky footer
- Auto-dismisses after 5 seconds
- "Undo" button restores the deleted item
- Only one toast visible at a time (new toast replaces previous)
- Uses `role="status"` and `aria-live="polite"` for screen readers
- Slide-up animation on appear, fade-out on dismiss

---

## 4. Interaction Patterns

### 4.1 Recording Flow

```
User clicks "Start Recording" or presses Alt+Shift+R
    │
    ├── Side panel transitions to Recording view (slide-up)
    ├── Red recording indicator appears with pulse animation
    ├── Step counter shows "0 steps"
    ├── Content script injection begins
    │
    ▼
User performs browser actions
    │
    ├── Each action captured → step appears at top of live list
    ├── New step slides in from top (View Transition)
    ├── Step counter increments
    ├── Thumbnail loads asynchronously (may appear 200-500ms after step title)
    │
    ▼
User clicks "Pause" (optional)
    │
    ├── Indicator changes: red → amber, "Recording" → "Paused"
    ├── Events are no longer captured
    ├── User can browse freely
    ├── Click "Resume" → recording resumes, indicator returns to red
    │
    ▼
User clicks "Stop" or presses Alt+Shift+R
    │
    ├── Recording ends
    ├── Steps are saved to storage
    ├── View transitions to Edit (crossfade — step list remains, controls transform to edit toolbar)
    └── Step list reorders to chronological (1, 2, 3... from top)
```

### 4.2 Inline Text Editing

All text editing uses inline editing (click-to-edit), never modals or separate pages.

**Title editing:**
1. User clicks on step title text
2. Text replaces with `<input type="text">` pre-filled with current value
3. Input auto-focuses with text selected
4. Enter → save and exit edit mode
5. Escape → cancel and restore original value
6. Blur (click elsewhere) → save

**Description editing:**
1. User clicks description area (or "Add description" placeholder)
2. Area replaces with `<textarea>` (2-3 rows, auto-expanding)
3. Textarea auto-focuses
4. Click "Save" or blur → save and exit edit mode
5. Escape → cancel

**SOP title editing (in editor header):**
1. User clicks SOP title in header
2. Inline `<input>` replaces title text
3. Same Enter/Escape/blur behavior as step title

### 4.3 Step Reordering

**Drag-and-drop (primary for mouse users):**
1. User grabs drag handle `≡` on left edge of step card
2. Card lifts with subtle scale + shadow (CSS transform)
3. Dragging over other cards shows a blue insertion line between them
4. Drop → step moves to new position
5. Step numbers auto-renumber
6. View Transition animates surrounding steps shifting

**Button reorder (accessible alternative):**
1. Each step card has `[↑]` and `[↓]` buttons
2. Click `[↑]` → step swaps with previous step (animated via View Transition)
3. Click `[↓]` → step swaps with next step
4. `[↑]` disabled on first step, `[↓]` disabled on last step
5. Focus stays on the moved step's button after reorder

**Keyboard reorder:**
- Focus on step card → Alt+Up/Alt+Down moves the step
- Screen reader announcement: "Step 3 moved to position 2"

### 4.4 Step Deletion

1. User clicks delete button `[🗑]` on a step card
2. Step immediately removed from list (no confirmation dialog)
3. Surrounding steps animate closed (View Transition)
4. Step numbers auto-renumber
5. Undo toast appears at bottom: "Step deleted [Undo]"
6. Undo toast auto-dismisses after 5 seconds
7. If user clicks "Undo" within 5 seconds, step is restored at original position
8. Focus moves to the next step (or previous if last step was deleted)

### 4.5 Screenshot Viewing

1. User clicks thumbnail in step card
2. `<dialog>` opens with full-size screenshot (fetched from IndexedDB)
3. While loading: skeleton placeholder with spinner
4. Screenshot scales to fit panel width (max-width: 100%)
5. If screenshot is taller than viewport, content scrolls within dialog
6. Prev/Next buttons navigate between steps
7. Left/Right arrow keys also navigate
8. Close: Escape, click `[✕]`, or click backdrop
9. Focus returns to the thumbnail that opened the lightbox

### 4.6 Export Flow

1. User clicks "Download ZIP" in export panel (or export icon in header)
2. Button text changes to "Generating..." (disabled, spinner animation)
3. Extension generates ZIP (Markdown + JPEG screenshots)
4. `chrome.downloads.download()` triggers native download
5. Button text changes to "Downloaded!" with checkmark for 3 seconds
6. Returns to idle state

If export fails:
1. Button returns to enabled state
2. Error message appears below button: "Export failed. Please try again."
3. Message uses PicoCSS `ins` or custom error class with red/danger color

---

## 5. Visual Design

### 5.1 Color System

PicoCSS provides automatic dark/light mode through `prefers-color-scheme`. The extension uses PicoCSS defaults with targeted custom property overrides.

**Custom CSS properties (extension-specific):**

```css
:root {
  /* Recording state colors */
  --sop-recording-color: #e53e3e;       /* Red for active recording */
  --sop-recording-pulse: #e53e3e40;     /* Red with transparency for pulse */
  --sop-paused-color: #d69e2e;          /* Amber for paused state */

  /* Step card accents */
  --sop-step-new-highlight: rgba(66, 153, 225, 0.1);  /* Brief highlight on new step */
  --sop-drag-insertion: #3182ce;        /* Blue insertion line during drag */

  /* Thumbnail dimensions */
  --sop-thumb-width-live: 80px;
  --sop-thumb-height-live: 45px;
  --sop-thumb-width-edit: 160px;
  --sop-thumb-height-edit: 90px;

  /* Toast */
  --sop-toast-bg: var(--pico-card-background-color);
  --sop-toast-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
}

/* Dark mode adjustments (PicoCSS handles most) */
@media (prefers-color-scheme: dark) {
  :root {
    --sop-step-new-highlight: rgba(66, 153, 225, 0.15);
    --sop-toast-shadow: 0 -2px 8px rgba(0, 0, 0, 0.4);
  }
}
```

### 5.2 Typography

PicoCSS provides responsive typography out of the box. Specific extensions:

| Element | Usage | Style |
|---------|-------|-------|
| `<h1>` | Not used (too large for side panel) | — |
| `<h2>` | Section headers ("Saved Recordings", "Live Steps") | PicoCSS default |
| `<h3>` | Step title in cards | PicoCSS default, slightly reduced size |
| `<small>` | Metadata (step count, dates, URLs) | PicoCSS muted color |
| `<mark>` | Highlight search matches (future) | PicoCSS default yellow highlight |
| `<code>` | Selector display (if shown to advanced users) | PicoCSS monospace |

**Text overflow handling:**
```css
/* Step titles — single line, truncate with ellipsis */
.step-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Descriptions — multi-line, clamp at 3 lines */
.step-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* URLs — single line, truncate */
.step-url {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
```

### 5.3 Iconography

Avoid icon libraries for v1. Use Unicode symbols and emoji for minimal footprint:

| Action | Symbol | Fallback |
|--------|--------|----------|
| Record | ⏺ (U+23FA) | Red circle CSS |
| Stop | ⏹ (U+23F9) | Square CSS |
| Pause | ⏸ (U+23F8) | Two bars CSS |
| Resume/Play | ▶ (U+25B6) | Triangle CSS |
| Delete | — | Text "Delete" |
| Move up | ↑ (U+2191) | Text "Up" |
| Move down | ↓ (U+2193) | Text "Down" |
| Export/Download | ⬇ (U+2B07) | Text "Export" |
| Back | ← (U+2190) | Text "Back" |
| Close | ✕ (U+2715) | Text "Close" |
| Drag handle | ≡ (U+2261) | Three bars CSS |
| Settings | ⚙ (U+2699) | Text "Settings" |
| More/overflow | ··· (U+00B7×3) | Text "More" |
| Copy | 📋 (clipboard) | Text "Copy" |

For v2, consider migrating to a lightweight SVG icon set (Lucide or Heroicons) for visual consistency.

### 5.4 Recording Indicator

The recording indicator is the most important visual element during capture.

```css
/* Recording dot with pulse animation */
.recording-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.recording-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--sop-recording-color);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--sop-recording-pulse); }
  50% { box-shadow: 0 0 0 6px transparent; }
}

/* Paused state — no animation, amber color */
.recording-dot[data-state="paused"] {
  background: var(--sop-paused-color);
  animation: none;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .recording-dot {
    animation: none;
  }
}
```

### 5.5 Step Card Layout

Optimized for the narrow side panel width:

```css
/* Step card in edit mode */
.step-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 0.25rem 0.5rem;
  padding: 0.75rem;
  /* PicoCSS <article> provides card styling automatically */
}

/* Grid areas:
   [drag] [title] [actions]
   [    ] [url  ] [       ]
   [    ] [thumb] [       ]
   [    ] [desc ] [       ]
*/

.step-card .drag-handle {
  grid-row: 1 / -1;
  cursor: grab;
  display: flex;
  align-items: center;
  padding: 0 0.25rem;
  color: var(--pico-muted-color);
}

.step-card .actions {
  grid-row: 1;
  display: flex;
  gap: 0.25rem;
}

.step-card .actions button {
  /* Minimal button styling — no background, just icon */
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
}
```

### 5.6 Thumbnail Sizing

| Context | Width | Height | Aspect Ratio | File Size Target |
|---------|-------|--------|-------------|-----------------|
| Live step (recording) | 80px | 45px | 16:9 | < 5 KB (data URL) |
| Edit step card | 160px | 90px | 16:9 | < 10 KB (data URL) |
| Lightbox (full) | panel width (~380px) | proportional | original | Full JPEG from IndexedDB |

Thumbnails use `<img>` with `loading="lazy"` for performance. The `thumbnailDataUrl` (320x180 source, stored inline) is scaled down by CSS.

---

## 6. View Transitions

### 6.1 Transition Definitions

```css
/* View containers get transition names */
.view-home { view-transition-name: main-view; }
.view-recording { view-transition-name: main-view; }
.view-editor { view-transition-name: main-view; }

/* Default crossfade for view switches */
::view-transition-old(main-view) {
  animation: fade-out 200ms ease-out;
}
::view-transition-new(main-view) {
  animation: fade-in 200ms ease-in;
}

/* Step list items — animate on add/remove/reorder */
.step-card {
  view-transition-name: match-element;  /* Chrome 140+ auto-naming */
}

/* New step slides in from top */
::view-transition-new(.step-card):only-child {
  animation: slide-in-top 250ms ease-out;
}

/* Removed step fades out */
::view-transition-old(.step-card):only-child {
  animation: shrink-out 200ms ease-in;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-in-top {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes shrink-out {
  from { height: auto; opacity: 1; transform: scaleY(1); }
  to { height: 0; opacity: 0; transform: scaleY(0); }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

### 6.2 Transition Triggers in Lit

```typescript
// In <sop-app>, wrap view changes with View Transition API
private async switchView(newView: ViewState) {
  if (!document.startViewTransition) {
    this.currentView = newView;
    return;
  }
  const transition = document.startViewTransition(() => {
    this.currentView = newView;
  });
  await transition.finished;
}

// In <sop-recording>, wrap step list updates
private addStep(step: RecordedStep) {
  if (!document.startViewTransition) {
    this.steps = [step, ...this.steps];
    return;
  }
  document.startViewTransition(() => {
    this.steps = [step, ...this.steps];
  });
}
```

---

## 7. Responsive Behavior

### 7.1 Side Panel Width Adaptation

The side panel width varies from ~300px to ~500px depending on user configuration. The UI must be fluid within this range.

```css
/* Base layout — fluid, no fixed widths */
:host, sop-app {
  width: 100%;
  min-width: 280px;
  max-width: 100%;
  padding: 0.75rem;
  box-sizing: border-box;
}

/* Thumbnail adapts to available space */
.step-card .thumbnail {
  width: min(var(--sop-thumb-width-edit), 40%);
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 4px;
}

/* At narrow widths, stack actions vertically */
@container (max-width: 320px) {
  .step-card {
    grid-template-columns: auto 1fr;
  }
  .step-card .actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
```

### 7.2 Touch Targets

All interactive elements meet the 44x44px minimum touch target size:

```css
/* Ensure all buttons meet minimum touch target */
button, [role="button"], .clickable {
  min-height: 44px;
  min-width: 44px;
}

/* Small icon buttons use padding to expand touch area */
.step-card .actions button {
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem;
  /* Visual size can be smaller, touch area remains 44x44 */
}
```

### 7.3 Overflow Handling

| Content | Strategy |
|---------|----------|
| Step title (long) | Truncate with ellipsis (single line) |
| Step description (long) | Clamp at 3 lines with ellipsis; full text visible in edit mode |
| Page URL | Truncate with ellipsis; show full URL in tooltip on hover |
| Recording list (many items) | Scroll within panel; no pagination |
| Step list (many steps) | Virtual scrolling not needed for v1 (max 200 steps); native scroll |
| SOP title (header) | Truncate with ellipsis; full title visible when editing |

---

## 8. Empty States & Error States

### 8.1 Empty States

**No recordings (first launch):**
- Illustration: A simple line-art clipboard icon (CSS-drawn or inline SVG, not an image file)
- Heading: "Record your first SOP"
- Body: "Click below to start capturing browser actions as step-by-step documentation."
- CTA: Primary "Start Recording" button

**Recording with no steps yet:**
- The step list area shows: "Perform actions in your browser. Each click, input, and navigation will appear here."
- Muted text, centered, with a subtle down-arrow or pointing indicator

**Empty description on a step:**
- Placeholder text: "Add a description..." in muted/italic style
- Clicking activates the description editor

### 8.2 Error States

**Recording interrupted (service worker restart):**
- Warning banner at top of panel (amber background)
- Text: "Recording interrupted — X steps captured"
- Actions: "Resume" (try to continue) and "Save" (save what was captured)
- Clear, non-alarming language

**Export failed:**
- Inline error below export button
- Text: "Export failed. Please try again." (red/danger color)
- Button returns to enabled/clickable state
- No modal, no toast — the error is contextual to the action

**Screenshot capture failed:**
- Step appears in list with a placeholder image (gray box with "Screenshot unavailable" text)
- Step is still valid — title and metadata are captured
- Non-blocking: recording continues

**Storage quota warning (80% full):**
- Banner at top of Home view
- Text: "Storage is almost full. Delete old recordings to free space."
- Dismiss button to hide the banner
- Uses `navigator.storage.estimate()` to calculate

**Content script injection failed:**
- Toast notification: "Cannot record on this page. Try a different tab."
- Recording remains in idle state
- Applies to: chrome:// pages, Chrome Web Store, extension pages

---

## 9. Accessibility Specification

### 9.1 Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| Tab | Any view | Move focus to next interactive element |
| Shift+Tab | Any view | Move focus to previous interactive element |
| Enter | Button focused | Activate button |
| Enter | Step title focused (edit mode) | Save title edit |
| Escape | Input/textarea focused | Cancel edit, restore original value |
| Escape | Lightbox open | Close lightbox |
| Escape | Dropdown menu open | Close menu |
| Alt+Shift+R | Global (extension shortcut) | Toggle recording start/stop |
| Arrow Left/Right | Lightbox open | Navigate to previous/next screenshot |
| Alt+Arrow Up | Step card focused (edit mode) | Move step up |
| Alt+Arrow Down | Step card focused (edit mode) | Move step down |
| Delete | Step card focused (edit mode) | Delete step (with undo) |

### 9.2 Focus Management

| Transition | Focus Target |
|-----------|-------------|
| Home → Recording | Pause button (first interactive element in recording controls) |
| Recording → Edit | First step card |
| Edit → Home | "Start Recording" button (or the recording card that was just edited) |
| Step deleted | Next step card (or previous if last was deleted) |
| Step reordered | The moved step card |
| Lightbox opened | Close button inside lightbox |
| Lightbox closed | The thumbnail that triggered it |
| Toast appears | Toast is `aria-live`, no focus steal |
| Inline edit activated | The input/textarea |
| Inline edit completed | The original text element |

### 9.3 ARIA Attributes

```html
<!-- App shell -->
<sop-app role="application" aria-label="SOP Recorder">

<!-- Recording list -->
<section aria-label="Saved recordings">
  <article role="listitem" aria-label="Salesforce Contact Setup, 12 steps">
  </article>
</section>

<!-- Recording controls -->
<section aria-label="Recording controls">
  <span role="status" aria-live="polite">
    Recording · 5 steps captured
  </span>
  <button aria-label="Pause recording">Pause</button>
  <button aria-label="Stop recording">Stop</button>
</section>

<!-- Step list (edit mode) -->
<ol role="list" aria-label="Recording steps">
  <li role="listitem"
      aria-label="Step 3: Clicked Email field"
      draggable="true"
      aria-roledescription="Draggable step">
    <button aria-label="Move step 3 up">↑</button>
    <button aria-label="Move step 3 down">↓</button>
    <button aria-label="Delete step 3">Delete</button>
    <img alt="Screenshot of step 3: Clicked Email field"
         loading="lazy">
  </li>
</ol>

<!-- Lightbox -->
<dialog aria-label="Screenshot viewer" aria-modal="true">
  <img alt="Full screenshot of step 3: Clicked Email field">
  <button aria-label="Previous screenshot">◀</button>
  <button aria-label="Next screenshot">▶</button>
  <button aria-label="Close screenshot viewer">✕</button>
</dialog>

<!-- Undo toast -->
<div role="status" aria-live="polite" aria-atomic="true">
  Step deleted. <button>Undo</button>
</div>

<!-- Recording indicator -->
<span role="status" aria-live="assertive">
  Recording active
</span>
```

### 9.4 Screen Reader Announcements

| Event | Announcement | Priority |
|-------|-------------|----------|
| Recording started | "Recording started" | Assertive |
| Recording paused | "Recording paused" | Assertive |
| Recording resumed | "Recording resumed" | Assertive |
| Recording stopped | "Recording stopped. X steps captured." | Assertive |
| New step captured | "Step X captured: [title]" | Polite |
| Step deleted | "Step X deleted. Press Undo to restore." | Polite |
| Step moved | "Step moved to position X" | Polite |
| Export started | "Generating export..." | Polite |
| Export complete | "Export downloaded" | Polite |
| Export failed | "Export failed. Try again." | Assertive |

Use a visually-hidden live region element for announcements that do not have a natural visual representation:

```html
<div class="sr-only" role="status" aria-live="polite" id="announcer"></div>
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 9.5 Color Contrast

PicoCSS meets WCAG 2.1 AA contrast ratios by default for both light and dark themes. Custom colors must be verified:

| Element | Color | Background | Ratio | Requirement |
|---------|-------|-----------|-------|------------|
| Recording dot (red) | #e53e3e | Light bg | > 3:1 | UI component |
| Paused indicator (amber) | #d69e2e | Light bg | > 3:1 | UI component |
| Recording dot (red) | #e53e3e | Dark bg | > 3:1 | UI component |
| Muted URL text | PicoCSS muted | Both | > 4.5:1 | Body text |
| Error text | Red/danger | Both | > 4.5:1 | Body text |

### 9.6 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all custom animations */
  .recording-dot {
    animation: none;
  }

  /* View transitions become instant swaps */
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }

  /* Disable smooth scrolling */
  * {
    scroll-behavior: auto !important;
  }
}
```

---

## 10. Drag-and-Drop Specification

### 10.1 HTML5 Drag and Drop Implementation

Uses native HTML5 DnD API (no library for v1). SortableJS is reserved as a fallback if native DnD proves insufficiently smooth.

**Drag initiation:**
- Only the drag handle `≡` initiates drag (not the entire card)
- `draggable="true"` set on the step card `<article>` element
- `dragstart` event sets `dataTransfer` with step ID

**Visual feedback during drag:**
```css
/* Dragged item — semi-transparent, slightly scaled */
.step-card.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

/* Drop target indicator — blue line between cards */
.step-card.drag-over-top::before {
  content: '';
  display: block;
  height: 3px;
  background: var(--sop-drag-insertion);
  border-radius: 2px;
  margin-bottom: 0.25rem;
}

.step-card.drag-over-bottom::after {
  content: '';
  display: block;
  height: 3px;
  background: var(--sop-drag-insertion);
  border-radius: 2px;
  margin-top: 0.25rem;
}
```

**Drop handling:**
1. `dragover` event on each step card calculates whether cursor is in top or bottom half
2. CSS class `drag-over-top` or `drag-over-bottom` applied accordingly
3. `drop` event triggers reorder in data model
4. View Transition wraps the DOM update for smooth animation

### 10.2 Accessibility Alternative

Users who cannot or prefer not to use drag-and-drop have equivalent functionality via:
- **Reorder buttons**: `[↑]` and `[↓]` on each step card
- **Keyboard shortcuts**: Alt+Up/Alt+Down when step card is focused
- Both trigger the same reorder logic with animated transitions

---

## 11. Component Sizing Reference

### 11.1 Panel Layout Measurements

```
┌─────────────────── 400px ──────────────────┐
│ 12px padding                          12px │
│ ┌──────────────── 376px ────────────────┐  │
│ │ Header (44px height)                  │  │
│ ├───────────────────────────────────────┤  │
│ │                                       │  │
│ │ Content area (scrollable)             │  │
│ │                                       │  │
│ │ Step card:                            │  │
│ │ ┌─────────────────────────────────┐   │  │
│ │ │ 12px padding                    │   │  │
│ │ │ Title: 16px font, 1 line       │   │  │
│ │ │ URL: 12px font, muted, 1 line  │   │  │
│ │ │ Thumbnail: 160x90px            │   │  │
│ │ │ Description: 14px, 1-3 lines   │   │  │
│ │ │ Actions: 44px height           │   │  │
│ │ │ Total height: ~220-260px       │   │  │
│ │ └─────────────────────────────────┘   │  │
│ │ Gap between cards: 8px               │  │
│ │                                       │  │
│ └───────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### 11.2 Component Height Budget

Approximately 2-3 step cards visible at once in a typical side panel height (~600px):

| Element | Height |
|---------|--------|
| Header | 44px |
| Recording controls (recording view) | ~80px |
| Section heading | ~32px |
| Step card (edit mode, with thumbnail) | ~220-260px |
| Step card (live mode, compact) | ~100-130px |
| Export panel | ~120px |
| Toast | 48px |
| Gap between cards | 8px |

---

## 12. State Diagram

```
                    ┌─────────┐
                    │  IDLE   │ (Home view)
                    │         │
                    └────┬────┘
                         │ Start Recording
                         │ (button or Alt+Shift+R)
                         ▼
                    ┌──────────┐
              ┌────▶│RECORDING │ (Recording view)
              │     │          │
              │     └──┬───┬──┘
              │        │   │
     Resume   │  Pause │   │ Stop Recording
              │        ▼   │
              │   ┌────────┐│
              └───│ PAUSED ││
                  │        ││
                  └────────┘│
                            │
                            ▼
                    ┌──────────┐
                    │ EDITING  │ (Edit view)
                    │          │
                    └────┬─────┘
                         │ Done / Back
                         ▼
                    ┌─────────┐
                    │  IDLE   │ (Home view, recording saved)
                    └─────────┘

         ┌──────────────┐
         │  INTERRUPTED │ (Service worker restart during recording)
         │              │
         └──┬───────┬───┘
            │       │
     Resume │       │ Save
            ▼       ▼
        RECORDING   EDITING
```

---

## 13. CSS Architecture

### 13.1 File Structure

```
sidepanel/
  style.css                  Main stylesheet (imports PicoCSS + custom)
  components/
    (styles are inline in Lit components via `static styles`
     OR since we use light DOM, in the main stylesheet)
```

Since all components use light DOM mode, a single stylesheet approach works:

```css
/* style.css */

/* 1. PicoCSS classless baseline */
@import '@picocss/pico/css/pico.classless.min.css';

/* 2. Extension-specific custom properties */
:root { /* see Section 5.1 */ }

/* 3. Layout overrides for side panel */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* 4. Component-specific styles */
/* Organized by component, using element/class selectors */

/* 5. View transitions */
/* see Section 6.1 */

/* 6. Utilities */
.sr-only { /* see Section 9.4 */ }

/* 7. Animations */
@keyframes pulse { /* see Section 5.4 */ }

/* 8. Reduced motion overrides */
@media (prefers-reduced-motion: reduce) { /* see Section 9.6 */ }
```

### 13.2 PicoCSS Usage Map

| PicoCSS Element | Extension Usage |
|----------------|----------------|
| `<article>` | Step cards, recording cards |
| `<button>` | Primary actions (Start, Stop, Export) |
| `<button class="secondary">` | Secondary actions (Pause, Cancel) |
| `<button class="outline">` | Tertiary actions (Copy Markdown) |
| `<dialog>` | Screenshot lightbox |
| `<input type="text">` | Inline title editing |
| `<textarea>` | Description editing |
| `<small>` | Metadata text (dates, counts, URLs) |
| `<h2>` | Section headings |
| `<h3>` | Step titles |
| `<ol>`, `<li>` | Step list |
| `<header>`, `<footer>` | Within `<article>` cards |
| `<nav>` | Header with back button and actions |
| `<mark>` | (Future) search highlights |
| `<progress>` | (Future) export progress |
| `<ins>` / custom | Error/success messages |

---

## 14. Performance Considerations

### 14.1 Rendering Budget

| Metric | Target |
|--------|--------|
| Side panel First Contentful Paint | < 500ms |
| Side panel Time to Interactive | < 1000ms |
| Step list update (add step during recording) | < 100ms |
| View transition duration | 200-250ms |
| Thumbnail lazy load | Within 200ms of scroll into view |
| Screenshot lightbox load | < 500ms (IndexedDB fetch + render) |

### 14.2 Optimization Strategies

1. **Lazy thumbnail loading**: Use `loading="lazy"` on `<img>` elements. Only thumbnails in viewport are rendered.
2. **Virtual scrolling not needed for v1**: Max 200 steps per recording. At ~220px per card, that is ~44,000px of scroll. Modern browsers handle this without virtualization.
3. **Screenshot lightbox on-demand**: Full-res screenshots fetched from IndexedDB only when lightbox is opened, not preloaded.
4. **Debounced inline edits**: Auto-save after 300ms of no typing (debounced), not on every keystroke.
5. **View Transition fallback**: If `document.startViewTransition` is unavailable (should not happen in Chrome 120+, but defensive), changes apply instantly without animation.

---

## 15. Future Design Considerations (v2+)

The following are explicitly not part of v1 UX but influence architectural decisions:

| Feature | Design Implication for v1 |
|---------|--------------------------|
| **Multi-format export** (tour, HTML, Notion) | Export panel designed as a list of options, not a single button. v1 shows only ZIP but the layout accommodates more. |
| **AI step enhancement** | Step card layout has room for a "magic wand" icon to trigger AI rewrite. No UI in v1. |
| **Screenshot annotation** | Lightbox viewer designed to accommodate a toolbar above the image. No toolbar in v1. |
| **Search/filter recordings** | Home view heading area has space for a search input. Not shown in v1. |
| **Localization** | All user-facing strings in components, not hardcoded in CSS. Prepared for i18n extraction. |
| **Tour preview** | Editor could show a "Preview as tour" button that opens a new tab with GuideChimp overlay. Data model supports it from day 1. |

---

## Appendix A: Semantic HTML Reference for PicoCSS

These HTML patterns produce styled output with zero classes when using PicoCSS classless:

```html
<!-- Card with header, content, and footer -->
<article>
  <header>Step 3</header>
  <p>Clicked the "Save" button on the contact form.</p>
  <footer>
    <button>Edit</button>
    <button class="secondary">Delete</button>
  </footer>
</article>

<!-- Modal dialog -->
<dialog open>
  <article>
    <header>Screenshot</header>
    <img src="..." alt="...">
    <footer>
      <button>Close</button>
    </footer>
  </article>
</dialog>

<!-- Form inputs for inline editing -->
<input type="text" value="Step title" aria-label="Step title">
<textarea aria-label="Step description">Description text</textarea>

<!-- Navigation header -->
<nav>
  <ul>
    <li><button>← Back</button></li>
  </ul>
  <ul>
    <li><strong>SOP Title</strong></li>
  </ul>
  <ul>
    <li><button>Export</button></li>
  </ul>
</nav>

<!-- Status indicators -->
<small>12 steps · March 18, 2026</small>
```

---

## Appendix B: Keyboard Shortcut Summary

| Shortcut | Scope | Action |
|----------|-------|--------|
| Alt+Shift+R | Global (Chrome extension command) | Toggle recording start/stop |
| Tab / Shift+Tab | Side panel | Navigate between interactive elements |
| Enter | Focused button | Activate |
| Enter | Editing title | Save and exit edit mode |
| Escape | Editing text | Cancel edit |
| Escape | Lightbox open | Close lightbox |
| Escape | Dropdown open | Close dropdown |
| Left/Right Arrow | Lightbox open | Previous/next screenshot |
| Alt+Up | Step card focused | Move step up |
| Alt+Down | Step card focused | Move step down |
| Delete | Step card focused | Delete step (with undo) |
