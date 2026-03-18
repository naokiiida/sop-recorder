# Visual Design Review -- SOP Recorder

**Reviewer:** UX Design Lead
**Date:** 2026-03-19
**Scope:** Home, Recording, and Editor views + Step Card component
**Focus:** Layout, spacing, typography, color, contrast, and side-panel-specific constraints

---

## Executive Summary

The current implementation has solid semantic HTML foundations and good component architecture, but suffers from **visual clarity issues** due to cramped spacing, insufficient color contrast, and conflicting visual hierarchies. The primary issues:

1. **Redundant title** -- "SOP Recorder" h1 duplicates Chrome's panel label
2. **Color confusion** -- "Start Recording" button and recording cards both use primary blue
3. **Weak contrast** -- Step count/date text (grey on blue) is nearly unreadable (~3.2:1 ratio)
4. **Typographic inconsistency** -- Title in editor (h2) vs title input have vastly different sizes
5. **Cramped step cards** -- Dense layouts with insufficient breathing room
6. **Unclear edit affordance** -- Editable text looks same as display text

---

## 1. Layout & Spacing System

### 1.1 Proposed Spacing Scale (4px base)

```
--sop-unit-xs:    4px;   Tiny gaps (icon spacing, label-to-label)
--sop-unit-sm:    8px;   Small gaps (within cards)
--sop-unit-md:   12px;   Normal gaps (between cards)
--sop-unit-lg:   16px;   Large gaps (between sections)
--sop-unit-xl:   20px;   XL gaps (top-level separation)
```

### 1.2 Key Changes

- Card internal gaps: 12px -> 8px (tighter within cards)
- Section gaps: 12px -> 16px (more breathing between sections)
- Line-height body: 1.5 -> 1.6 (dark mode readability)
- Keep panel padding at 12px

### 1.3 Step Card Grid

**Keep horizontal layout** (thumbnail left, content right) -- works for 350px+ target width.

- Live mode thumbnail: 80px -> 70px (saves 10px horizontal)
- Edit mode thumbnail: keep 160px
- Internal gap: 8px between thumbnail and content

---

## 2. Typography Hierarchy

### 2.1 Proposed Font Scale

```
Large (h1):    1.4rem   (22.4px) -- View titles (rarely used)
Medium (h2):   1.15rem  (18.4px) -- Section headers
Normal (body): 0.9rem   (14.4px) -- Paragraph text (base)
Small (h3):    0.85rem  (13.6px) -- Card titles, labels
XSmall:        0.8rem   (12.8px) -- Secondary text, metadata, URLs

Scale ratio: 1.15-1.2x per step (perceptible hierarchy)
```

### 2.2 Font Weight Strategy

```
Headlines:     700 (bold) for h1, 600 (semibold) for h2/h3
Body:          400 (regular)
Labels:        500 (medium) for "Step 1", metadata
Emphasis:      600 (semibold)
Muted:         400 (regular, lower opacity: 0.7-0.8)
```

### 2.3 Key Fix: Editor Title Input

- Display: h2 = 1.15rem
- Input: same 1.15rem font-size, padding: 0.35rem 0.5rem (override PicoCSS default 0.75rem)
- Result: display and edit modes have same visual size

### 2.4 URL Font Size

- Current: 0.75rem -- too small, accessibility risk
- Proposed: 0.8rem -- matches muted text, still visually subordinate

---

## 3. Color & Contrast

### 3.1 Current Issues

**FAIL:** Grey text on blue card background
- Current: muted text (#a0aec0) on card bg (#2d3748) = ~3.2:1 contrast
- WCAG AA requires 4.5:1 minimum
- **Fix:** Use lighter muted color #cbd5e0 or increase opacity

**WEAK:** Step number label blends with other blues in UI

### 3.2 Proposed Color Roles

```
PRIMARY ACTION:
  Background: #1095c1 (keep)
  Text:       #ffffff
  Hover:      darken to #0a7aa8

SECONDARY ACTION:
  Background: transparent
  Border:     1px #1095c1
  Text:       #1095c1
  Hover:      fills with primary blue

CONTENT CARDS:
  Background: #2d3748 (keep)
  Border:     1px solid #4a5568

TEXT LEVELS:
  Primary:    #e2e8f0 (current body)
  Secondary:  #cbd5e0 (lighter, up from #a0aec0)
  Tertiary:   #a0aec0 (very muted, hints only)

ACCENT COLORS:
  Recording:  #e53e3e (red, keep)
  Paused:     #d69e2e (orange, keep)
  Success:    #38a169 (green, for future use)

KEY CHANGE:
  Recording cards: Use neutral background (#2d3748), NOT primary blue
  "Start Recording" button: Stands out as the ONLY blue primary element
```

### 3.3 Step Number Visual Emphasis

**Proposal: Numeric badge**
- 20px square, primary blue background, white text, centered
- Creates visual anchor for scanning vertical step lists
- Much clearer than current "STEP 1" text label

---

## 4. Component Redesign Proposals

### 4.1 Home View

**Before:**
```
SOP Recorder (h1 -- redundant)
[Start Recording] (blue button)
Saved Recordings
[Recording card] (blue, same as button)
[Recording card] (blue, same as button)
```

**After:**
```
[Start Recording] (primary blue -- ONLY blue element)

Saved Recordings (h2, more top spacing)
[Recording card] (neutral bg, white text, readable)
[Recording card] (neutral bg, white text, readable)
```

**Changes:**
- Remove h1 "SOP Recorder" (Chrome shows it above)
- "Start Recording": primary blue, full width, clear CTA
- Recording cards: neutral background, NOT blue
- Card text: primary white on neutral -- contrast 8.5:1+
- Card metadata: secondary grey, visible
- More spacing between button and list (16px)

### 4.2 Recording View

**Minor refinements:**
- Stop button: danger red (not contrast/dark)
- Resume button: secondary outline
- Step feed: 8px gaps between cards (tighter for scanning)
- Newest card: subtle highlight that fades after 2-3 cards

### 4.3 Editor View

**Before:**
```
<- SOP Recorder (cramped)
Title (h2) -- clicks to HUGE input
3 steps . date (cramped below)
[STEP 1  Up Down X] (cluttered header)
```

**After:**
```
<- (small breadcrumb text, secondary color)

Title (h2, editable, consistent size)
5 steps . Created Mar 15 (metadata, breathing room)

[1] Title .............. Up Down Trash (hover-reveal actions)
    URL (secondary)
    + Add description (editable affordance)
    [thumbnail 160x90]
```

**Changes:**
- Back breadcrumb: small, secondary color
- Title -> input: same visual size (fixed padding)
- Metadata to first card: 16px gap (breathing room)
- Step number: badge instead of "STEP 1" label
- Actions: revealed on hover, trash icon instead of X

### 4.4 Step Card

**Live mode:**
- Thumbnail: 70x45px (down from 80)
- Step number: small badge
- Title: 0.9rem bold
- URL: 0.8rem secondary, truncated

**Edit mode:**
- Thumbnail: 160x90px
- Step number: 20px blue badge
- Title: 0.9rem bold, click-to-edit (dashed border + hover)
- URL: 0.8rem secondary
- Description: 0.85rem, "+" prefix for empty state, editable affordance
- Actions: hover-reveal (Up, Down, Trash)

---

## 5. Visual Language & Component Patterns

### 5.1 Four Levels of Emphasis

```
Level 1 -- Primary Action:   Blue bg (#1095c1), white text
Level 2 -- Secondary Action: Transparent, blue outline/text
Level 3 -- Tertiary Action:  Transparent, no border, muted text
Level 4 -- Danger Action:    Red bg (#e53e3e), white text
```

### 5.2 Card Styles

For narrow panels, use **flat cards** (border, no shadow):
```css
border: 1px solid #4a5568;
border-radius: 8px;
background: var(--pico-card-background-color);
```

### 5.3 Editable Fields

```css
.sop-editable {
  dashed border + light background (default)
  solid border + primary color (hover)
  input field with focus ring (editing)
}
```

---

## 6. Side Panel Specific Constraints

### 6.1 Width Considerations

- Design for 350px minimum, test at 280px and 500px
- At 280px: content area is ~166px (after thumbnail + padding)
- At 350px: content area is ~238px (comfortable)

### 6.2 Scroll Behavior

- Full body scroll (no sticky header) -- SOPs are small enough
- Simplifies layout, maximizes content space

### 6.3 Overflow Handling

- Single-line: `text-overflow: ellipsis`
- URLs: domain + first 20 chars of path
- Descriptions: `line-clamp: 3`
- No horizontal scroll ever

---

## 7. Before/After Layouts

### Home View After

```
[Start Recording]         (primary blue, full width, clear CTA)

Saved Recordings           (h2, 16px gap above)

+----------------------------+
| My Design System       (...)|  (neutral bg, white text)
| 5 steps   Mar 15, 2026    |  (secondary grey, readable)
+----------------------------+

+----------------------------+
| Login Flow             (...)|
| 12 steps   Mar 10, 2026   |
+----------------------------+
```

### Editor View After

```
<- SOP Recorder              (small, secondary, breadcrumb)

My Design System              (h2, editable, consistent size)
5 steps . Created Mar 15      (metadata, secondary)

+----------------------------+
| [1] Clicked button    (...)| (badge + hover actions)
|     example.com/path       |
|     + Add description      |
| [thumbnail 160x90]        |
+----------------------------+

+----------------------------+
| [2] Link hovered      (...)|
|     example.com/about      |
|     Description text here  |
| [thumbnail 160x90]        |
+----------------------------+

[Export as ZIP]               (primary button, full width)
```

---

## 8. Implementation Summary

### Key CSS Changes

| Property | Current | Proposed | Reason |
|----------|---------|----------|--------|
| --sop-gap | 0.75rem | 8px (cards), 16px (sections) | Better hierarchy |
| body line-height | 1.5 | 1.6 | Dark mode readability |
| muted text color | #a0aec0 | #cbd5e0 | WCAG AA compliance |
| url font-size | 0.75rem | 0.8rem | Accessibility |
| input padding | PicoCSS default | 0.35rem 0.5rem | Match display size |
| h2 margin-bottom | 0.25rem | 0.5rem | Breathing room |

### Key Component Changes

| Component | Change |
|-----------|--------|
| sop-app | Remove h1 "SOP Recorder" |
| sop-home | Primary button styling, neutral card backgrounds |
| sop-step-card | Step number badge, hover-reveal actions, trash icon |
| sop-editor | Breadcrumb nav, fixed input padding, section spacing |
| global.css | Spacing scale, text colors, button classes |

### Testing Checklist

- [ ] Contrast ratios (4.5:1 minimum for all text)
- [ ] Width testing: 280px, 350px, 500px
- [ ] Dark mode (default)
- [ ] Keyboard navigation
- [ ] Touch targets (44px minimum)
- [ ] prefers-reduced-motion
