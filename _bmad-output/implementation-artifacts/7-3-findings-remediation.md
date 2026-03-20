# Quick Tech Spec: Story 7.3 Findings Remediation

**Objective**: Fix 3 findings identified during the code review of Story 7.3 (Performance Optimization).
**Base Commit**: `fe388fbb`
**Status**: Ready for Implementation

## 1. Patch: Screenshot Latency Measurement Only Covers Success Path

Add latency logging for failed screenshot captures so diagnostics are not biased toward successful (fast) captures only.

- **File**: `src/entrypoints/background.ts`
- **Location**: Inside `handleStepCaptured`, after the `if (screenshotBlob)` block (~line 377)
- **Fix**: Add an `else` branch that logs the capture failure with timing:
  ```ts
  } else {
    const captureLatency = performance.now() - captureStart;
    console.debug(`[SOP Recorder] Screenshot capture failed after ${captureLatency.toFixed(1)}ms`);
  }
  ```
- **Why**: `captureStart` is set before `captureScreenshotSafe()` but the timing log is only inside the success branch. When capture fails (returns null), no latency data is emitted. This creates survivorship bias — slow/failing captures are invisible in diagnostics.

## 2. Patch: `performance.mark('sw-start')` Placement Relies on Bundler Behavior

Add a comment clarifying that the measurement depends on WXT's bundling inlining imports.

- **File**: `src/entrypoints/background.ts`
- **Location**: Line 1 (`performance.mark('sw-start')`)
- **Fix**: Add a clarifying comment:
  ```ts
  // NOTE: ES module spec hoists import declarations before body code.
  // This mark measures cold start correctly only because WXT's bundler
  // inlines imports, placing this call at the true top of the bundle.
  performance.mark('sw-start');
  ```
- **Why**: Per ES module spec, `import` declarations are hoisted and evaluated before module body statements. In an unbundled context, `performance.mark('sw-start')` would execute *after* all imports resolve, making it useless for measuring import evaluation time. WXT bundles the code, which inlines imports and preserves the source-order position. The comment prevents future maintainers from misunderstanding what the mark actually measures.

## 3. Patch: Screenshot Latency Log Message Misrepresents Measurement Scope

Rename the log message to accurately reflect that the measurement includes the full pipeline (capture + thumbnail + badge + IndexedDB write), not just "capture latency."

- **File**: `src/entrypoints/background.ts`
- **Location**: Inside `handleStepCaptured`, the `console.debug` at ~line 377
- **Fix**: Change the log message:
  ```ts
  // Before:
  console.debug(`[SOP Recorder] Screenshot capture latency: ${captureLatency.toFixed(1)}ms (target: <300ms)`);
  // After:
  console.debug(`[SOP Recorder] Screenshot pipeline (capture+thumb+badge+store): ${captureLatency.toFixed(1)}ms (target: <300ms)`);
  ```
- **Why**: The measurement wraps `captureScreenshotSafe()` + `generateThumbnail()` + badge rendering + `blobStore.put()` (IndexedDB write). AC #3 targets "screenshot capture latency < 300ms" but the measured span includes I/O. If IndexedDB is slow, the log could exceed 300ms and create a false alarm. Accurate labeling prevents misdiagnosis.

## Review Summary

| Category | Count |
|----------|-------|
| Intent Gap | 0 |
| Bad Spec | 0 |
| Patch | 3 |
| Defer | 0 |
| Rejected (noise) | 6 |

Three review layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) plus a cross-review with a second agent raised findings. After deduplication and triage, 6 were rejected as noise and 3 actionable patches remain. Findings #2 and #3 were surfaced by cross-review.

### Notable Rejections

- **`loading="lazy"` on data URL images**: No-op since thumbnails are inline data URLs, not network resources. Harmless.
- **AC #4 false alarm**: Acceptance Auditor flagged lazy thumbnail loading as failing, but thumbnails are inline data URLs on the step object — never fetched from IndexedDB. Spec Task 4.3 explicitly confirms this architecture. AC #4 is satisfied.
- **`performance.mark` asymmetry**: Start mark at module top, ready mark inside `defineBackground()`. Chrome re-evaluates SW module scope on each activation, so no practical issue. (Note: the bundler-dependency aspect of this was promoted to Patch #2.)
- **Array allocation in `repeat` with `.reverse()`**: Unavoidable since `.reverse()` is mutating. `repeat` still benefits from keyed DOM reuse.
