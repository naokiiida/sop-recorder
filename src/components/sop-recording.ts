import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RecordedStep, RecordingState } from '../core/types.js';
import './sop-step-card.js';

/**
 * Active recording view — indicator, live step feed, pause/stop controls.
 */
@customElement('sop-recording')
export class SopRecording extends LitElement {
  @property({ type: Array }) steps: RecordedStep[] = [];
  @property({ type: String }) recordingState: RecordingState = 'recording';

  override createRenderRoot() {
    return this;
  }

  override render() {
    const isPaused = this.recordingState === 'paused';

    return html`
      <section>
        <!-- Recording indicator -->
        <div class="sop-flex" style="margin-bottom:var(--sop-gap-section);">
          <span
            class="sop-recording-dot ${isPaused ? '' : 'sop-pulse'}"
            style="background:${isPaused ? 'var(--sop-paused-color)' : 'var(--sop-recording-color)'};"
            aria-hidden="true"
          ></span>
          <strong style="color:${isPaused ? 'var(--sop-paused-color)' : 'var(--sop-recording-color)'};">
            ${isPaused ? 'Paused' : 'Recording'}
          </strong>
          <span class="sop-muted" style="margin-left:auto;">
            ${this.steps.length} step${this.steps.length !== 1 ? 's' : ''}
          </span>
        </div>

        <!-- Controls: PicoCSS group -->
        <div role="group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:var(--sop-gap-section);">
          ${isPaused
            ? html`<button class="secondary" @click=${this.handleResume}>&#9654; Resume</button>`
            : html`<button class="secondary" @click=${this.handlePause}>&#10074;&#10074; Pause</button>`}
          <button style="background:var(--sop-recording-color);border-color:var(--sop-recording-color);color:#fff;" @click=${this.handleStop}>&#9632; Stop</button>
        </div>

        <!-- Live step feed (newest first) -->
        <div style="display:flex;flex-direction:column;gap:var(--sop-gap-card);" role="log" aria-label="Captured steps" aria-live="polite">
          ${[...this.steps].reverse().map(
            (step) => html`<sop-step-card .step=${step} mode="live"></sop-step-card>`,
          )}
        </div>

        ${this.steps.length === 0
          ? html`<p class="sop-muted" style="text-align:center;padding:2rem 0;">
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
