# SOP Recorder — Claude Code Instructions

## Stack
- WXT (Chrome extension framework) + Lit + PicoCSS + plain TypeScript
- No React, no heavy frameworks
- pnpm for package management

## Architecture
- Backend-frontend separation with adapter pattern
- Core logic must be reusable as MCP server tools / agent skills
- Chrome APIs injected via adapters, not imported in core modules

## UI Implementation Rules

### BEFORE writing any UI code:
1. Read `feedback_ui_preferences.md` from memory
2. Read existing components (sop-step-card, sop-home, sop-recording) to understand current patterns
3. Plan CSS reuse FIRST — identify which existing CSS variables, classes, and patterns apply

### Design system (non-negotiable):
- Card-based layouts using PicoCSS `<article>` with shared border/radius/hover vocabulary
- `--sop-*` CSS custom properties for all project values
- Lucide SVG icons, never emoji
- Theme-aware colors via `--pico-*` variables, never hardcoded
- Compact density: 0.85-0.9rem fonts, 12px card padding, 8px gaps
- Hover-reveal actions with `@media (hover: none)` fallback

### CSS variable naming:
- `--sop-recording-color` / `--sop-paused-color` — recording state indicators ONLY
- `--sop-danger-color` — destructive actions, errors, danger buttons
- `--sop-card-border` — shared border for all card-like elements
- `--sop-subtle-hover-bg` — subtle background highlight on hover (editable fields, nav buttons)
- Never repurpose a state-specific variable (recording, paused) for unrelated UI concerns

### Consistency rule:
**All card-like elements (home recording cards, step cards, editor) MUST share the same CSS vocabulary.** Before creating new CSS for a card, check if existing `--sop-step-*` or `--sop-card-*` variables already cover it. Extract shared styles if needed rather than duplicating.

## Workflow Rules

### Plan before implement:
- For UI changes: describe the HTML structure, CSS approach, and which existing patterns you'll reuse BEFORE writing code
- Get user confirmation on the approach if there are trade-offs

### No patchwork:
- Read the full target file before editing
- Make cohesive changes, not incremental fix-upon-fix cycles
- If a build fails, understand WHY before retrying — don't just tweak and rebuild

### Insights:
- Skip `★ Insight` blocks during straightforward UI implementation
- Only provide insights when there's a genuinely non-obvious architectural decision
