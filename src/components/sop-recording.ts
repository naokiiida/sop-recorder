import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { RecordedStep, RecordingState } from '../core/types.js';
import { announce } from './sop-app.js';
import './sop-step-card.js';

/**
 * Active recording view — indicator, live step feed, pause/stop controls.
 */
@customElement('sop-recording')
export class SopRecording extends LitElement {
  @property({ type: Array }) steps: RecordedStep[] = [];
  @property({ type: String }) recordingState: RecordingState = 'recording';

  private previousStepCount = 0;
  private previousState: RecordingState | null = null;

  override createRenderRoot() {
    return this;
  }

  override updated() {
    // Announce recording state changes
    if (this.previousState !== null && this.previousState !== this.recordingState) {
      if (this.recordingState === 'recording' && this.previousState === 'idle') {
        announce('Recording started', 'assertive');
      } else if (this.recordingState === 'paused') {
        announce('Recording paused', 'assertive');
      } else if (this.recordingState === 'recording' && this.previousState === 'paused') {
        announce('Recording resumed', 'assertive');
      } else if (this.recordingState === 'idle') {
        announce(
          `Recording stopped. ${this.steps.length} step${this.steps.length !== 1 ? 's' : ''} captured.`,
          'assertive',
        );
      }
    }
    this.previousState = this.recordingState;

    // Announce new step captured
    if (this.steps.length > this.previousStepCount && this.previousStepCount >= 0) {
      const latest = this.steps[this.steps.length - 1];
      if (latest) {
        announce(`Step ${latest.sequenceNumber} captured: ${latest.title}`);
      }
    }
    this.previousStepCount = this.steps.length;
  }

  override render() {
    const isPaused = this.recordingState === 'paused';

    return html`
      <section>
        <!-- Recording indicator -->
        <header class="sop-flex" style="margin-bottom:var(--sop-gap-section);">
          <span
            class="sop-recording-dot ${isPaused ? '' : 'sop-pulse'}"
            style="background:${isPaused
              ? 'var(--sop-paused-color)'
              : 'var(--sop-recording-color)'};"
            aria-hidden="true"
          ></span>
          <strong
            role="status"
            aria-live="assertive"
            style="color:${isPaused ? 'var(--sop-paused-color)' : 'var(--sop-recording-color)'};"
          >
            ${isPaused ? 'Paused' : 'Recording'}
          </strong>
          <small style="margin-left:auto;">
            ${this.steps.length} step${this.steps.length !== 1 ? 's' : ''}
          </small>
        </header>

        <!-- Controls: PicoCSS group -->
        <div class="sop-control-grid">
          ${isPaused
            ? html`<button class="secondary" @click=${this.handleResume}>&#9654; Resume</button>`
            : html`<button class="secondary" @click=${this.handlePause}>
                &#10074;&#10074; Pause
              </button>`}
          <button class="sop-btn-danger" @click=${this.handleStop}>&#9632; Stop</button>
        </div>

        <!-- Live step feed (newest first) -->
        <section
          class="sop-stack sop-stack--tight"
          role="log"
          aria-label="Captured steps"
          aria-live="polite"
        >
          ${repeat(
            [...this.steps].reverse(),
            (step) => step.id,
            (step) => html`<sop-step-card .step=${step} mode="live"></sop-step-card>`,
          )}
        </section>

        ${this.steps.length === 0
          ? html`<p class="sop-muted sop-empty-state">
              Interact with the page to capture steps...
            </p>`
          : ''}
      </section>
    `;
  }

  private handlePause() {
    this.dispatchEvent(new CustomEvent('pause-recording', { bubbles: true, composed: true }));
  }

  private handleResume() {
    this.dispatchEvent(new CustomEvent('resume-recording', { bubbles: true, composed: true }));
  }

  private handleStop() {
    this.dispatchEvent(new CustomEvent('stop-recording', { bubbles: true, composed: true }));
  }
}
