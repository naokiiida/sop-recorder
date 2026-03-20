# Quick Tech Spec: Story 7.1 Findings Remediation

**Objective**: Fix 14 findings identified during the code review of Story 7.1 (Comprehensive Error Handling).
**Base Commit**: `7015aca9242cae6a7eded9e755d5a3fd4683785d`
**Status**: Ready for Implementation

## 1. Intent Gap: Storage Warning Banner (AC #2)

Implement the missing storage warning banner in the home view when storage usage is high.

- **File**: `src/components/sop-home.ts`
- **Logic**: 
  - Receive `percentUsed` from `RecordingController`.
  - If `percentUsed >= 0.8`, display a persistent banner: "Storage is [X]% full. Export or delete old recordings to free space."
  - Use `--sop-danger-color` for the text/background and ensure it's accessible (`role="alert"`).

## 2. Security & Robustness Patches

### 2.1. URL Restriction Hardening
- **File**: `src/adapters/chrome/tab-adapter.ts`
- **Fix**: 
  - Anchor `RESTRICTED_URL_PATTERNS` with `^` and ensure `isRestrictedUrl` handles `undefined` or `null` URLs gracefully.
  - Test case: Ensure `chrome-extension://...` is blocked but `https://some-site.com/chrome-extension/` is allowed.

### 2.2. Content Script Buffer Management
- **File**: `src/content/recorder.ts`
- **Fix**: 
  - Remove the `break` from `flushBuffer` while loop to ensure all buffered events are replayed.
  - Add a reconnection listener or trigger `flushBuffer` proactively when a successful message is acknowledged, rather than just on the *next* event.

### 2.3. Memory Leak Prevention
- **File**: `src/components/sop-app.ts`
- **Fix**: Ensure the `error` event listener added in `updated()` is managed correctly. Use a single listener at the constructor level or ensure it's not duplicated on every update.

## 3. UI & State Management Patches

### 3.1. Persistent Error Protection
- **File**: `src/components/recording-controller.ts`
- **Fix**: In the `SCREENSHOT_UNAVAILABLE` case, do not overwrite `this.error` if it currently contains a critical persistent error (`QUOTA_FULL`, `PAGE_RESTRICTED`).

### 3.2. Reconnection Timer Cleanup
- **File**: `src/components/recording-controller.ts`
- **Fix**: Clear existing `setTimeout` timers for reconnection if a new disconnection occurs or a connection is successfully established.

### 3.3. Export Fallback Calibration
- **File**: `src/components/sop-editor.ts`
- **Fix**: 
  - Trigger Markdown fallback after the **second** failure (`exportRetryCount > 1`).
  - Add a final error state if the clipboard copy also fails.

### 3.4. Reconnection UX
- **File**: `src/components/sop-app.ts`
- **Fix**: Add a small debounce or threshold to the "Reconnecting..." status to prevent flickering during rapid port toggles.

## 4. Architectural & Core Patches

### 4.1. Structured Logging Adoption
- **Files**: `src/components/recording-controller.ts`, `src/components/sop-app.ts`
- **Fix**: Replace all `console.error('[SOP Recorder] ...')` calls with the `Logger` utility from `src/core/logger.ts`.

### 4.2. Storage Quota Race Condition
- **File**: `src/entrypoints/background.ts`
- **Fix**: `await` the `quotaManager.checkQuota()` call after storing a step to ensure the state is consistent before the next operation starts.

### 4.3. Render Safety
- **File**: `src/components/sop-app.ts`
- **Fix**: Wrap the contents of `renderView()` in a try/catch block to ensure the error boundary catches synchronous rendering exceptions.

## 5. Verification
- Run `pnpm test` to ensure no regressions in existing logger and tab-adapter tests.
- Verify storage banner appears in `sop-home` by manually mocking a high quota in the background.
- Verify restricted URL auto-pause/resume logic in the browser.
