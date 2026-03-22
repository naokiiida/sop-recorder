# Story 8.1: Create Extension Icons and CWS Store Assets

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want extension icons derived from the existing SVG logo and Chrome Web Store listing assets,
so that the extension ("nuknow") has a professional appearance in the browser toolbar, extensions page, and CWS listing.

## Acceptance Criteria

1. **Icon Generation:** `public/icons/` contains `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` generated from the source SVG at `docs/output-stroke-105-512px.svg`
2. **Icon Legibility:** The "nu" letterform is recognizable at 48px and above; at 16px the icon reads as a distinct shape (not blurred noise)
3. **WXT Icon Config:** `wxt.config.ts` manifest section includes `icons` map (`16`, `32`, `48`, `128`) pointing to `/icons/*.png` and `action.default_icon` with the same map
4. **Extension Rename:** `wxt.config.ts` manifest `name` is changed from "SOP Recorder" to "nuknow"
5. **CWS Description:** A `store/` directory contains `description.txt` with CWS listing copy emphasizing: "100% local, zero data collection", "No account required", "Free, open source, no limits", "Export to Markdown"
6. **CWS Screenshots:** `store/` contains placeholder specs (a markdown file `store/screenshots.md` listing the required screenshots with exact dimensions and content descriptions) for: 1280x800 screenshot of side panel in recording state, 1280x800 screenshot of editing steps, 1280x800 screenshot of exported SOP result, 440x280 small promo tile
7. **Build Validation:** `pnpm build` succeeds and the output manifest at `.output/chrome-mv3/manifest.json` contains the correct `icons` and `action.default_icon` entries

## Tasks / Subtasks

- [x] Task 1: Generate PNG icons from SVG (AC: #1, #2)
  - [x] Use a build script or CLI tool (e.g., `sharp-cli` or a Node script with `sharp`) to convert `docs/output-stroke-105-512px.svg` to PNG at 16, 32, 48, 128px
  - [x] The SVG has dark fill (#111827) on transparent background — add a white or light background circle/rounded-rect behind the letterform for visibility on dark browser toolbars, OR keep transparent and verify legibility on both light and dark Chrome themes
  - [x] Place output PNGs in `public/icons/icon-{size}.png`
  - [x] Verify 16px icon is distinguishable (not a dark blob) — may need to simplify or add padding
- [x] Task 2: Configure WXT icons and rename extension (AC: #3, #4)
  - [x] Update `wxt.config.ts` manifest to add `icons: { 16: '/icons/icon-16.png', 32: '/icons/icon-32.png', 48: '/icons/icon-48.png', 128: '/icons/icon-128.png' }`
  - [x] Add `action: { default_icon: { 16: '/icons/icon-16.png', 32: '/icons/icon-32.png', 48: '/icons/icon-48.png', 128: '/icons/icon-128.png' } }`
  - [x] Change manifest `name` from `'SOP Recorder'` to `'nuknow'`
- [x] Task 3: Create CWS store listing copy (AC: #5)
  - [x] Create `store/description.txt` with CWS listing text
  - [x] Include key selling points: 100% local privacy, no account, free/open-source, Markdown export
  - [x] Keep under CWS 132-character short description limit for the summary line
  - [x] Full description can be up to 16,000 characters
- [x] Task 4: Create CWS screenshot specs (AC: #6)
  - [x] Create `store/screenshots.md` documenting each required asset with dimensions, content, and purpose
  - [x] Screenshots are NOT generated in this story — just the spec for manual capture later
- [x] Task 5: Build validation (AC: #7)
  - [x] Run `pnpm build` and verify `.output/chrome-mv3/manifest.json` has correct icon entries
  - [x] Verify icon PNGs are copied to `.output/chrome-mv3/icons/`
  - [x] Load the built extension in Chrome and verify the icon appears in the toolbar

## Dev Notes

### Source Icon

The source SVG is at `docs/output-stroke-105-512px.svg` — a 512x512 SVG with two paths forming an "nu" letterform in `#111827` (near-black) on a transparent background. This is the user's chosen icon for the extension named "nuknow".

### WXT Icon Handling

WXT auto-copies files from `public/` to the build output root. Place icons at `public/icons/icon-{size}.png` and reference them in the manifest as `/icons/icon-{size}.png`. WXT resolves these paths relative to the public directory.

Currently `public/` does not exist — it must be created.

### Icon Generation Approach

Use `sharp` (already available in the Node ecosystem, no new runtime dependency needed) via a one-off Node script to rasterize the SVG to multiple PNG sizes. Do NOT add `sharp` as a project dependency — use `npx` or a standalone script. Alternatively, use `@aspect-ratio/svg2png` or `svg2png-wasm`.

**Critical at 16px:** The "nu" SVG letterform has thin strokes. At 16px, detail may be lost. Options:
- Add a colored background (e.g., rounded square in brand color) to improve contrast
- Increase stroke weight for the 16px variant
- Accept minor detail loss if the overall shape remains distinctive

### Existing Manifest Config

Current `wxt.config.ts` has `manifest.name: 'SOP Recorder'` — this changes to `'nuknow'`. The `description` can remain as-is or be updated to match the CWS short description. The `action: {}` empty object needs to be replaced with the `default_icon` configuration.

### Legacy .plasmo Directory

`.plasmo/` contains old build artifacts with auto-generated placeholder icons. These are NOT used by WXT and should be ignored (they're in `.gitignore` or build output).

### CWS Listing Requirements Reference

- **Icon sizes:** 128x128 required for CWS listing, 16/32/48 for browser UI
- **Screenshots:** 1280x800 or 640x400, JPEG or PNG, max 5 screenshots
- **Small promo tile:** 440x280 PNG
- **Short description:** Max 132 characters
- **Detailed description:** Max 16,000 characters
- **Category:** Productivity

### Project Structure Notes

- `public/icons/` is a new directory — consistent with WXT convention for static assets
- `store/` is a new top-level directory for CWS listing assets — keeps store assets separate from source code
- No changes to `src/` directory structure needed

### References

- [Source: docs/output-stroke-105-512px.svg] — Source SVG icon
- [Source: wxt.config.ts] — WXT manifest configuration (lines 1-20)
- [Source: _bmad-output/planning-artifacts/architecture.md#2.1] — WXT configuration spec
- [Source: _bmad-output/planning-artifacts/epics-and-stories.md#Epic8] — Story requirements and AC
- [Source: _bmad-output/planning-artifacts/architecture.md#12] — Security model and permissions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Used ImageMagick (`magick`) instead of `sharp` for SVG-to-PNG conversion (user preference)
- White rounded-rect background added to all icon sizes for dark toolbar visibility
- 8% padding applied to prevent letterform from touching edges

### Completion Notes List

- Task 1: Generated 4 PNG icons (16, 32, 48, 128px) from source SVG using `scripts/generate-icons.sh` (ImageMagick). White background with rounded corners and 8% padding for toolbar legibility.
- Task 2: Updated `wxt.config.ts` — renamed extension to "nuknow", added `icons` and `action.default_icon` maps.
- Task 3: Created `store/description.txt` with CWS listing copy covering all required selling points. Summary line under 132 chars.
- Task 4: Created `store/screenshots.md` with specs for 3 screenshots (1280x800) and 1 promo tile (440x280).
- Task 5: `pnpm build` succeeds. Built manifest contains correct `name`, `icons`, and `action.default_icon`. Icon PNGs copied to `.output/chrome-mv3/icons/`. All 262 unit tests pass. Lint clean.

### Change Log

- 2026-03-22: Implemented Story 8.1 — extension icons, WXT config, CWS store assets

### File List

- scripts/generate-icons.sh (new) — Shell script for SVG-to-PNG icon generation
- public/icons/icon-16.png (new) — 16px extension icon
- public/icons/icon-32.png (new) — 32px extension icon
- public/icons/icon-48.png (new) — 48px extension icon
- public/icons/icon-128.png (new) — 128px extension icon
- wxt.config.ts (modified) — Added icons, action.default_icon, renamed to "nuknow"
- store/description.txt (new) — CWS listing description
- store/screenshots.md (new) — CWS screenshot specifications
