# Code Review — Story 8.2: Create README and Repository Setup

- **Date:** 2026-03-22
- **Reviewer:** OpenCode (Claude Opus 4.6)
- **Review Mode:** full (with spec)
- **Diff Scope:** Uncommitted changes (10 files: 5 new, 5 modified, ~328 lines added)
- **Spec File:** `_bmad-output/implementation-artifacts/8-2-create-readme-and-repository-setup.md`

## Review Layers

| Layer | Status |
|-------|--------|
| Blind Hunter | Completed (14 raw findings) |
| Edge Case Hunter | Completed (3 raw findings) |
| Acceptance Auditor | Completed (7 raw findings) |

## Summary

| Category | Count |
|----------|-------|
| Intent Gap | 2 |
| Bad Spec | 3 |
| Patch | 4 |
| Defer | 4 |
| Rejected | 8 |
| **Total raw** | **21** |

---

## Intent Gaps

> These findings suggest the captured intent is incomplete. Consider clarifying intent before proceeding.

### IG-1: README lacks actual screenshot images

AC1 requires "usage guide with screenshots" but the README contains only an HTML comment placeholder (`<!-- Screenshots: see store/screenshots.md -->`). Task 2 accepts "screenshot placeholders" referencing Story 8.1 specs, but the AC wording implies actual images. Clarify whether placeholders satisfy the AC or if screenshots must be added before the story is done.

### IG-2: Issue template format ambiguity

AC2 says templates must use "GitHub's YAML frontmatter format." The templates use `.md` files with YAML frontmatter (the legacy format). GitHub also supports a newer `.yml` form-based template schema. The current implementation is functional but uses the older format. Clarify which format was intended.

---

## Bad Spec

> These findings suggest the spec should be amended. The implementation followed the task list correctly in all three cases; the contradictions are within the spec itself.

### BS-1: Spec self-contradiction — `package.json` name change

The Dev Notes say "modify license field only" for `package.json`, but Task 5 explicitly says to update the `package.json` `name` field to `"nuknow"`. The Dev Notes also say "The repository/package name remains `sop-recorder`." The implementation followed Task 5.

**Suggested amendment:** Remove the "modify license field only" constraint from File Locations, and clarify that the repo slug remains `sop-recorder` while the package name may be `nuknow`.

### BS-2: Spec self-contradiction — `src/` modifications

File Locations says "Do NOT modify `src/`, `tests/`, or any existing source files," but Task 5 explicitly lists modifying `src/components/sop-app.ts` and `src/entrypoints/sidepanel/index.html`. The implementation followed the tasks.

**Suggested amendment:** Update File Locations to list the `src/` files modified by Task 5.

### BS-3: Spec self-contradiction — `scripts/` modification

File Locations prohibits modifying existing source files, but Task 6 ("Fix icon generation script from Story 8.1") explicitly modifies `scripts/generate-icons.sh`.

**Suggested amendment:** Add `scripts/generate-icons.sh` to the File Locations list as a modified file.

---

## Patch

> These are fixable code issues.

### P-1: Temp files not cleaned up in icon script

**Location:** `scripts/generate-icons.sh:26`

Writes `/tmp/claude-icon-letter-${SIZE}.png` but never removes it. Also, "claude" in the filename leaks the generation tool.

**Fix:** Add `trap 'rm -f /tmp/nuknow-icon-letter-*.png' EXIT` and rename the temp file pattern from `claude-icon-letter` to `nuknow-icon-letter`.

### P-2: No ImageMagick availability check

**Location:** `scripts/generate-icons.sh` (top of file)

Calls `magick` without verifying it's installed.

**Fix:** Add `command -v magick >/dev/null || { echo "Error: ImageMagick required" >&2; exit 1; }` near the top of the script.

### P-3: No SVG file existence check

**Location:** `scripts/generate-icons.sh` (before loop)

Uses `$SVG` without verifying the file exists.

**Fix:** Add `[[ -f "$SVG" ]] || { echo "Error: SVG not found: $SVG" >&2; exit 1; }`.

### P-4: README and CONTRIBUTING.md duplicate setup instructions

Both contain identical clone/install/dev instructions. When one is updated, the other will drift.

**Fix:** Have CONTRIBUTING.md reference the README's Development section instead of duplicating content.

---

## Defer

> Pre-existing issues surfaced by this review (not caused by current changes).

### D-1: `package.json` `description` still references "SOP"

The description reads "Chrome extension that records browser interactions and produces documented SOPs with annotated screenshots." Not user-facing, low priority.

### D-2: No CHANGELOG or migration note for rename

The product rename from "SOP Recorder" to "nuknow" plus the ISC to MIT license change have no CHANGELOG entry.

### D-3: No `.github/ISSUE_TEMPLATE/config.yml`

Standard practice for repos with issue templates is to include a `config.yml` to configure the template chooser (e.g., disable blank issues). Nice-to-have.

### D-4: Icon script transparent corners

The script uses `xc:none` (transparent) canvas with a white rounded rect. If downstream consumers expect fully opaque PNGs, transparent corners could cause display issues. Chrome extensions support transparency, so this is likely fine.
