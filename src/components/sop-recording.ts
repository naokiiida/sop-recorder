import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RecordedStep, RecordingState } from '../core/types.js';
import './sop-step-card.js';

/**
 * Active recording view — shows recording indicator, live step feed, pause/stop controls.
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
    const indicatorColor = isPaused ? 'var(--sop-paused-color)' : 'var(--sop-recording-color)';
    const statusText = isPaused ? 'Paused' : 'Recording';

    return html`
      <section>
        <!-- Recording indicator -->
        <div class="sop-flex" style="margin-bottom:0.75rem;">
          <span
            class="${isPaused ? '' : 'sop-pulse'}"
            style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${indicatorColor};"
            aria-hidden="true"
          ></span>
          <strong style="color:${indicatorColor};">${statusText}</strong>
          <span class="sop-muted">${this.steps.length} step${this.steps.length !== 1 ? 's' : ''}</span>
        </div>

        <!-- Controls -->
        <div class="sop-flex" style="margin-bottom:0.75rem;">
          ${isPaused
            ? html`<button @click=${this.handleResume} style="flex:1;">&#9654; Resume</button>`
            : html`<button @click=${this.handlePause} style="flex:1;" class="secondary">&#10074;&#10074; Pause</button>`}
          <button @click=${this.handleStop} style="flex:1;" class="contrast">&#9632; Stop</button>
        </div>

        <!-- Live step feed (newest first) -->
        <div class="sop-stack" role="log" aria-label="Captured steps" aria-live="polite">
          ${[...this.steps].reverse().map(
            (step) => html`
              <sop-step-card .step=${step} mode="live"></sop-step-card>
            `,
          )}
        </div>

        ${this.steps.length === 0
          ? html`<p class="sop-muted" style="text-align:center;padding:1rem;">
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
