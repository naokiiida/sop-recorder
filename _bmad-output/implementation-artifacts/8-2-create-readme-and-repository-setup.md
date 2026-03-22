# Story 8.2: Create README and Repository Setup

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a comprehensive README and GitHub repository configuration,
so that the project is accessible and welcoming to users and contributors.

## Acceptance Criteria

1. **README.md** exists at repo root with: project description, feature highlights, installation instructions (CWS + manual dev load), usage guide with screenshots, development setup, testing instructions, architecture overview, contributing guidelines, license (MIT)
2. **`.github/ISSUE_TEMPLATE/`** contains `bug_report.md` and `feature_request.md` issue templates using GitHub's YAML frontmatter format
3. **`LICENSE`** file contains MIT license text with copyright holder "Naokiiida" and year 2026
4. **`CONTRIBUTING.md`** provides contribution guidelines covering: dev setup, code style, PR process, testing requirements, commit conventions
5. **Repository metadata** — the README includes appropriate badges (CI status, license) and suggests GitHub topics in a comment for manual setup (e.g., `chrome-extension`, `sop`, `documentation`, `productivity`, `local-first`, `open-source`)

## Tasks / Subtasks

- [x] Task 1: Create LICENSE file (AC: #3)
  - [x] Create `LICENSE` at repo root with MIT license text
  - [x] Copyright: `2026 Naokiiida`
  - [x] Update `package.json` license field from `"ISC"` to `"MIT"` for consistency

- [x] Task 2: Create README.md (AC: #1, #5)
  - [x] Project header: extension name "nuknow" with tagline, badges (CI workflow, MIT license)
  - [x] Feature highlights: Record/Edit/Export workflow, privacy-first, zero config
  - [x] Installation section: Chrome Web Store link placeholder + manual dev load instructions
  - [x] Usage guide: keyboard shortcut (Alt+Shift+R), recording flow, editing, export options
  - [x] Screenshot placeholders: reference `store/screenshots.md` specs from Story 8.1
  - [x] Development setup: prerequisites (Node 22, pnpm), clone, install, dev/build commands
  - [x] Testing section: unit tests (`pnpm test:unit`), E2E tests (`pnpm test:e2e`), lint (`pnpm lint`)
  - [x] Architecture overview: core-shell separation, adapter pattern, tech stack table
  - [x] Privacy & security section: zero network, zero telemetry, minimal permissions with rationale
  - [x] Contributing link to CONTRIBUTING.md
  - [x] License section linking to LICENSE file

- [x] Task 3: Create CONTRIBUTING.md (AC: #4)
  - [x] Development environment setup (Node 22, pnpm, `pnpm install`, `pnpm dev`)
  - [x] Code style: ESLint flat config + Prettier (auto-enforced by CI)
  - [x] Architecture rules: pure core modules (no Chrome APIs), adapter pattern for browser APIs
  - [x] UI rules: Lit web components, PicoCSS, no React/heavy frameworks, light DOM
  - [x] PR process: branch naming, commit message conventions, CI must pass
  - [x] Testing requirements: unit tests for core modules (Vitest), E2E for user flows (Playwright)
  - [x] Issue reporting: link to templates

- [x] Task 4: Create GitHub issue templates (AC: #2)
  - [x] Create `.github/ISSUE_TEMPLATE/bug_report.md` with fields: description, steps to reproduce, expected/actual behavior, Chrome version, OS
  - [x] Create `.github/ISSUE_TEMPLATE/feature_request.md` with fields: problem description, proposed solution, alternatives considered
  - [x] Use GitHub issue template YAML frontmatter (`---` block with `name`, `about`, `labels`)

- [x] Task 5: Rename scope — update remaining "SOP Recorder" references to "nuknow" (AC: #1)
  - [x] Update `src/entrypoints/sidepanel/index.html` `<title>` to "nuknow"
  - [x] Update `src/components/sop-app.ts` aria-label from "SOP Recorder" to "nuknow"
  - [x] Update `package.json` `name` field from `"sop-recorder"` to `"nuknow"` (or keep as repo slug — decide based on whether npm name matters for a private package)

- [x] Task 6: Fix icon generation script from Story 8.1 (housekeeping)
  - [x] Run `chmod +x scripts/generate-icons.sh` to make the script executable
  - [x] Fix the white-on-white rounded rect issue (icons currently render as plain white squares — the letterform background and the icon background are both white; add contrast or use transparent background with dark letterform)

- [x] Task 7: Verify consistency (AC: #1-#5)
  - [x] Verify `package.json` license field is `"MIT"`
  - [x] Verify all internal links in README resolve (CONTRIBUTING.md, LICENSE)
  - [x] Verify `pnpm build` still succeeds
  - [x] Verify `pnpm lint` passes on all new/modified files

## Dev Notes

### Extension Identity

The extension's display name is **"nuknow"** (set in `wxt.config.ts` manifest, Story 8.1). The repository/package name remains `sop-recorder`. The README should use "nuknow" as the product name and "sop-recorder" only when referencing the repo/package.

### Rename Scope (from Story 8.1 Review)

Story 8.1 renamed `wxt.config.ts` manifest `name` to "nuknow" but several other references to "SOP Recorder" remain:
- `src/entrypoints/sidepanel/index.html` `<title>` still says "SOP Recorder"
- `src/components/sop-app.ts` has an aria-label referencing "SOP Recorder"
- `package.json` `name` field is `"sop-recorder"` — this is fine as a repo/package slug, but could be updated to `"nuknow"` for consistency (it's a private package, so npm naming rules don't apply)

These are small consistency fixes that belong in this story since the README will reference the extension name throughout.

### Icon Script Fix (from Story 8.1 Review)

`scripts/generate-icons.sh` has two issues:
1. **Not executable** — needs `chmod +x`
2. **White-on-white rendering** — the script adds a white rounded-rect background behind the dark letterform, but the letterform itself appears to render as white, producing plain white square icons. The fix should ensure the dark `#111827` SVG paths render correctly over the white background. Likely cause: ImageMagick SVG rendering issue with the fill color. Verify by inspecting the generated PNGs and adjusting the `magick` command if needed.

### License Discrepancy — MUST FIX

`package.json` currently has `"license": "ISC"`. The PRD explicitly positions MIT as a differentiator ("Free, open source, no limits"). Change `package.json` to `"MIT"` and create the LICENSE file with MIT text. This is a deliberate correction, not a regression.

### Existing Store Assets (from Story 8.1)

Story 8.1 created:
- `store/description.txt` — CWS listing copy (can be referenced for README feature copy)
- `store/screenshots.md` — Screenshot specs (README can reference these as placeholders)
- `public/icons/icon-128.png` — Can be referenced in README header
- `docs/output-stroke-105-512px.svg` — Source SVG logo

### Available Scripts (from `package.json`)

Reference these in the README development section:
- `pnpm dev` — Start WXT dev server with hot reload
- `pnpm build` — Production build for Chrome
- `pnpm test:unit` — Run Vitest unit tests
- `pnpm test:e2e` — Run Playwright E2E tests
- `pnpm lint` — ESLint + Prettier check
- `pnpm lint:fix` — Auto-fix lint issues
- `pnpm typecheck` — TypeScript strict mode check

### Tech Stack for Architecture Section

| Layer | Technology | Version |
|-------|-----------|---------|
| Extension Framework | WXT | 0.20.20 |
| Build Tool | Vite | 8 (Rolldown) |
| Language | TypeScript | 5.x (strict) |
| UI Components | Lit | 3.3.2 |
| Base Styling | PicoCSS | 2.1.1 |
| ZIP Export | JSZip | 3.10.1 |
| Unit Tests | Vitest | 4.1.0 |
| E2E Tests | Playwright | 1.58.2 |
| Linting | ESLint + Prettier | flat config |
| CI | GitHub Actions | Node 22, pnpm |

### Key Architecture Talking Points for README

1. **Core-Shell Separation:** All business logic in `src/core/` is pure TypeScript with zero Chrome API dependencies. Chrome APIs accessed only through adapter interfaces in `src/adapters/`.
2. **Local-First, Zero-Trust:** No network permissions in manifest. Data leaves device only through explicit file download.
3. **Minimal JS Philosophy:** Lit (~5.8 KB gz) + PicoCSS (~3 KB gz). No React, no virtual DOM overhead.
4. **Record Rich, Export Thin:** Internal model captures maximum context; export adapters select relevant fields per format.

### Permissions Rationale (for README security section)

| Permission | Why |
|-----------|-----|
| `activeTab` | Capture screenshots of active tab |
| `tabs` | Detect navigation events |
| `scripting` | Inject content script for event capture |
| `storage` | Persist recordings locally |
| `sidePanel` | Host the editing UI |
| `alarms` | Keep service worker alive during recording |
| `downloads` | Save exported ZIP/Markdown files |

### CI Pipeline Overview (for README)

GitHub Actions runs on every push to main and every PR:
1. Lint & format check (ESLint + Prettier)
2. TypeScript strict type check
3. Unit tests (Vitest with coverage)
4. Production build + bundle size validation (size-limit)
5. E2E tests (Playwright with Chrome extension loaded)

### File Locations

All new files go at repo root or in `.github/`:
- `README.md` — repo root (new file)
- `LICENSE` — repo root (new file)
- `CONTRIBUTING.md` — repo root (new file)
- `.github/ISSUE_TEMPLATE/bug_report.md` — new directory + file
- `.github/ISSUE_TEMPLATE/feature_request.md` — new directory + file
- `package.json` — modify license field only

**Do NOT modify** `src/`, `tests/`, or any existing source files.

### README Tone & Style

- Professional but approachable, targeting developers and technical users
- Lead with the privacy/local-first value proposition
- Keep sections scannable with clear headings and bullet points
- Use tables for structured info (tech stack, permissions)
- Include badges at top: CI status, license, Chrome Web Store (placeholder URL)

### Project Structure Notes

- `.github/ISSUE_TEMPLATE/` is a new directory — `.github/workflows/` already exists with `ci.yml`
- No existing README.md, LICENSE, or CONTRIBUTING.md to overwrite — all are fresh creates
- The `store/description.txt` from Story 8.1 has polished marketing copy that can inform README feature descriptions

### References

- [Source: _bmad-output/planning-artifacts/epics-and-stories.md#Epic8] — Story requirements and AC
- [Source: _bmad-output/planning-artifacts/prd.md] — Product vision, features, privacy model, NFRs
- [Source: _bmad-output/planning-artifacts/architecture.md] — Tech stack, project structure, testing standards
- [Source: _bmad-output/implementation-artifacts/8-1-create-extension-icons-and-cws-store-assets.md] — Previous story: icons, store assets, extension rename
- [Source: package.json] — Scripts, dependencies, current license field
- [Source: wxt.config.ts] — Extension name "nuknow", manifest config
- [Source: .github/workflows/ci.yml] — CI pipeline configuration
- [Source: store/description.txt] — CWS listing copy for feature description reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None required.

### Completion Notes List

- Task 1: Created MIT LICENSE file at repo root with copyright 2026 Naokiiida. Updated package.json license from "ISC" to "MIT".
- Task 2: Created comprehensive README.md with all required sections: project header with CI/license badges, feature highlights, CWS + manual installation instructions, usage guide with keyboard shortcut, screenshot placeholders referencing store/screenshots.md, development setup, testing commands, architecture overview with tech stack table, privacy & security section with permissions rationale table, CI pipeline overview, contributing link, license link. Included GitHub topics suggestion as HTML comment.
- Task 3: Created CONTRIBUTING.md covering dev setup, code style (ESLint + Prettier), architecture rules (core-shell separation, adapter pattern), UI rules (Lit, PicoCSS, no React), PR process with branch naming and commit conventions, testing requirements (Vitest + Playwright), issue template links.
- Task 4: Created .github/ISSUE_TEMPLATE/bug_report.md and feature_request.md with YAML frontmatter (name, about, labels fields).
- Task 5: Renamed remaining "SOP Recorder" references to "nuknow": sidepanel index.html title, sop-app.ts aria-label, package.json name field.
- Task 6: Made scripts/generate-icons.sh executable (chmod +x). Fixed white-on-white icon rendering by splitting into two-step process: rasterize SVG at high density first, then composite over rounded-rect background.
- Task 7: Verified package.json license is "MIT", internal README links resolve, pnpm build succeeds, pnpm lint passes clean, all 262 unit tests pass with no regressions.

### Change Log

- 2026-03-22: Story 8.2 implementation complete — created README.md, LICENSE, CONTRIBUTING.md, GitHub issue templates, renamed SOP Recorder references to nuknow, fixed icon generation script.

### File List

- LICENSE (new)
- README.md (new)
- CONTRIBUTING.md (new)
- .github/ISSUE_TEMPLATE/bug_report.md (new)
- .github/ISSUE_TEMPLATE/feature_request.md (new)
- package.json (modified — name: nuknow, license: MIT)
- src/entrypoints/sidepanel/index.html (modified — title: nuknow)
- src/components/sop-app.ts (modified — aria-label: nuknow)
- scripts/generate-icons.sh (modified — chmod +x, fixed white-on-white rendering)
