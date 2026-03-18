# UX Final Implementation Spec -- SOP Recorder

**Date:** 2026-03-19
**Status:** Approved for implementation
**Based on:** 3 UX reviews (minimalist, interaction, visual) + user decisions

---

## Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| h1 title | **Remove** | Chrome shows "SOP Recorder" in panel header |
| Back navigation | **← button** | Side panel has no browser back; user needs explicit escape hatch |
| Step card actions | **Hover-reveal** | Progressive disclosure; no extra click (vs overflow menu) |
| Delete icon | **Trash** | Universal; X conflicts with sidebar close |
| URL | **Hidden** (tooltip on hover) | Users see the page; URL is noise in narrow panel |
| D&D handle | **Implicit** | Cursor change + divider color is enough |
| Recording card metadata | **Title only** | Step count/date not essential for choosing; detail in editor |
| Start vs Cards color | **Blue button, neutral cards** | Clear primary CTA distinction |
| Input padding | **Use PicoCSS properly** | Don't override; leverage semantic HTML |
| Hover reflow | **Never** | Hover must not change card size |

---

## 1. Back Button

### Why It's Essential

The side panel is a constrained context:
- No browser back button (side panel is not a browser tab)
- No URL bar or tab navigation
- 3 discrete views (home/recording/edit) with no visible nav
- Without back, user in editor view is trapped

### Design

- Location: top-left, only in edit view
- Form: ← arrow only (no text label -- space constraint)
- Touch target: 44px via padding
- Hover: arrow lightens to primary color + subtle bg

```css
.sop-back-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--pico-muted-color);
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.sop-back-button:hover {
  color: var(--pico-primary);
  background: rgba(16, 149, 193, 0.08);
}
```

---

## 2. Color Palette

```css
:root {
  /* Text hierarchy */
  --sop-text-secondary: #cbd5e0;    /* Up from #a0aec0 -- WCAG fix */
  --sop-text-tertiary: #a0aec0;     /* Very faint hints */

  /* Actions */
  --sop-recording-color: #e53e3e;
  --sop-paused-color: #d69e2e;

  /* Cards */
  --sop-card-hover: #3a4556;        /* Slightly lighter on hover */
}
```

Key change: muted text #a0aec0 -> #cbd5e0 for WCAG AA contrast (4.5:1+).

---

## 3. Home View

```
[● Start Recording]           Primary blue, full width
                               1rem margin below

Saved Recordings               h2

+----------------------------+
| My Design System       (⋮) |  Neutral card bg, white text
+----------------------------+  Title only. No step count. No date.

+----------------------------+
| Login Flow             (⋮) |
+----------------------------+
```

- **Start Recording**: Primary blue button (`class="contrast"` in PicoCSS or custom)
- **Recording cards**: `<article>` with neutral background -- NOT blue
- **Card content**: Title only (bold). No metadata in list.
- **(⋮) menu**: Always visible; click opens Export/Delete options
- **Empty state**: "Record your first SOP" + Start button

---

## 4. Recording View

```
● Recording          3 steps    Pulsing red dot + counter

[⏸ Pause] [■ Stop]             Grid: 1fr 1fr, 8px gap
                                Pause=secondary outline, Stop=danger red

[70x45]  Clicked button         Newest first, live feed
[70x45]  Form submitted...
```

- Buttons: use `<div role="group">` for PicoCSS group styling
- Stop button: danger red (not contrast/dark)
- Step cards: live mode, read-only, compact
- URL: hidden in live mode

---

## 5. Editor View

```
←                               Back button (only element in header row)

My Design System                h2, click-to-edit (dashed border on hover)
5 steps · Created Mar 15        Metadata shown here (not in home list)

+----------------------------+
| [160x90] [1] Title    (⋮) |  Badge + title + hover-reveal menu
|          URL (secondary)   |  URL visible in edit mode (secondary color)
|          + Add description |  Editable affordance (dashed border)
+----------------------------+

+----------------------------+
| [160x90] [2] Another  (⋮) |
|          ...               |
+----------------------------+

[Export as ZIP]                  Primary button, full width
```

- Title editing: click h2 -> input appears. Use PicoCSS input default styling.
- Step number: blue badge (24px square, white text)
- Actions (⋮): hover-reveal on desktop, always visible on touch
- Menu options: Move Up, Move Down, Delete (trash icon)
- D&D: implicit (whole card draggable), blue divider line on dragover

---

## 6. Step Card

### Live Mode (Recording View)

| Element | Visible | Style |
|---------|---------|-------|
| Thumbnail | Yes (70x45) | border-radius 4px |
| Title | Yes | 0.9rem bold |
| URL | **No** | Hidden. Title attr for tooltip. |
| Step number | Implicit (list order) | Not shown |
| Actions | None | Read-only |

### Edit Mode (Editor View)

| Element | Visible | Style |
|---------|---------|-------|
| Thumbnail | Yes (160x90) | Clickable for lightbox |
| Title | Yes, editable | Click-to-edit, dashed border on hover |
| URL | Yes (secondary) | 0.8rem, tertiary color |
| Description | Yes, editable | Dashed border, "Add description" placeholder |
| Step badge | Yes | 24px blue square, white number |
| Actions (⋮) | Hover-reveal | Menu: Move Up/Down, Delete |

### Hover-Reveal Actions

```css
.sop-step-actions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}

.sop-step-card:hover .sop-step-actions {
  opacity: 1;
  pointer-events: auto;
}

@media (hover: none) {
  .sop-step-actions {
    opacity: 1;
    pointer-events: auto;
  }
}
```

### Menu Content (on ⋮ click)

```
+------------------+
| ↑ Move up        |
| ↓ Move down      |
| 🗑 Delete         |  (danger red text)
+------------------+
```

---

## 7. Editable Field Affordance

Display state: text with dashed border + light bg on hover
Edit state: PicoCSS native input/textarea (don't override padding)

```css
.sop-editable {
  padding: 0.2rem 0.35rem;
  border: 1px dashed transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.sop-editable:hover {
  border-color: var(--pico-primary);
  background: rgba(16, 149, 193, 0.05);
}
```

For empty description placeholder:
```
✎ Add description    (italic, tertiary color, dashed border)
```

---

## 8. D&D (Drag and Drop)

- Whole card is draggable in edit mode (`draggable="true"`)
- No explicit grip handle (cursor change is sufficient)
- Dragging: card opacity 0.4
- Drop indicator: 3px blue line between cards

```css
.sop-drop-indicator {
  height: 3px;
  background: var(--pico-primary);
  border-radius: 2px;
  margin: -1.5px 0;
}
```

---

## 9. Implementation Phases

### Phase 1 (Do Now)

1. Remove h1 "SOP Recorder"
2. Add ← back button (edit mode only)
3. Start Recording: primary blue, cards: neutral
4. Recording cards: title only (remove metadata)
5. Step card: hover-reveal ⋮ menu with Move Up/Down/Delete
6. Delete icon: 🗑 trash
7. URL: hidden in live, secondary in edit
8. Text contrast fix: secondary text to #cbd5e0
9. Step badge: blue square with number

### Phase 2 (Polish)

1. Undo toast animation (slide up/down)
2. Step entrance animation (fade in)
3. Drop indicator for D&D
4. Touch fallback (@media hover: none)
5. Width testing: 280px, 350px, 500px
