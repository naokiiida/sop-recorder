# Remediation Plan: Story 7.5 — E2E Tests for Critical Path

Address architectural violations, fix broken test helpers, improve test reliability, and ensure full compliance with acceptance criteria as identified in code reviews.

## Objective
Fix critical issues in E2E tests and production code to ensure a robust, maintainable, and spec-compliant implementation of the SOP Recorder critical journey.

## Key Files & Context
- `src/components/recording-controller.ts`: Centralizes state and command logic.
- `src/components/sop-app.ts`: Root component handling view transitions.
- `src/components/sop-editor.ts`: Editor view where deletion is triggered.
- `tests/e2e/fixtures/side-panel.ts`: Page Object helper for E2E tests.
- `tests/e2e/*.spec.ts`: E2E test specifications.

## Implementation Steps

### 1. Encapsulate State Management & Navigation
- **`src/components/recording-controller.ts`**:
  - Add `deleteAndNavigateHome(recordingId: string)`:
    - Call `this.deleteRecording(recordingId)`.
    - Set `this.loadedRecording = null`.
    - Set `this.steps = []` (to clear stale data).
    - Call `this.navigateTo('home')`.
    - Call `this.listRecordings()`.
- **`src/components/sop-app.ts`**:
  - Update `handleDeleteFromEditor` to use `this.ctrl.deleteAndNavigateHome(recordingId)`.
  - Wrap the navigation/cleanup in `document.startViewTransition()` if available for consistent UX.

### 2. Add Deletion Confirmation
- **`src/components/sop-editor.ts`**:
  - In `handleDeleteRecording`, add `if (!window.confirm('Are you sure you want to delete this recording?')) return;` before dispatching the event.

### 3. Fix E2E Test Helpers (`tests/e2e/fixtures/side-panel.ts`)
- **Add Missing Method**: Implement `startRecordingWithPage()`:
  ```typescript
  async startRecordingWithPage(): Promise<Page> {
    await this.startRecording();
    return this.openTestPage();
  }
  ```
- **Fix Scoping Bug**: In `editStepTitle(index, newTitle)`, scope the input locator to the specific step card:
  ```typescript
  const card = this.page.locator('article.sop-step-card').nth(index);
  await card.locator('strong.sop-editable[aria-label="Edit step title"]').click();
  const input = card.locator('input[type="text"]'); // scoped to card
  await input.fill(newTitle);
  await input.press('Enter');
  ```
- **Improve API Consistency**: Update `deleteRecording()` to wait for the home view transition:
  ```typescript
  async deleteRecording(): Promise<void> {
    await this.page.getByRole('button', { name: /Delete Recording/ }).click();
    // Wait for home view to appear (consistent with goBack)
    await this.page.waitForSelector('button.contrast', { timeout: 5000 });
  }
  ```

### 4. Improve Test Reliability & Compliance
- **`tests/e2e/critical-path.spec.ts`**:
  - Replace `waitForTimeout` calls with event-driven waits using `panel.waitForStepCount(count)`.
  - Use specific step titles in assertions to verify content.
- **`tests/e2e/saved-recordings.spec.ts`**:
  - Add assertion to verify the recording title in the home view card matches the expected title (AC #3).
- **`tests/e2e/delete-recording.spec.ts`**:
  - Update locators to use `.sop-btn-danger` classes where mandated by the spec.
  - Handle the new `window.confirm` dialog in the test:
    ```typescript
    page.on('dialog', dialog => dialog.accept());
    ```

## Verification & Testing
1. **Build Extension**: `pnpm run build`
2. **Run All E2E Tests**: `pnpm run test:e2e`
3. **Manual Verification**:
   - Open side panel.
   - Start recording on a test page.
   - Stop recording.
   - Delete recording from editor.
   - Verify: Confirmation dialog appears, view transitions smoothly to home, list is updated, memory is cleared.
