import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RecordingController } from './recording-controller.js';
import { icon, ArrowLeft } from './icons.js';
import { Logger } from '../core/logger.js';
import './sop-home.js';
import './sop-recording.js';
import './sop-editor.js';
import './sop-screenshot-lightbox.js';

/**
 * Announce a message to screen readers via the live region.
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = document.getElementById('sop-announcer');
  if (!el) return;
  el.setAttribute('aria-live', priority);
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

/**
 * Root application shell with state-driven view routing.
 * Uses light DOM for PicoCSS compatibility.
 * Includes top-level error boundary to prevent white screens.
 */
@customElement('sop-app')
export class SopApp extends LitElement {
  public ctrl = new RecordingController(this);

  @state() private error: string | null = null;

  @state() private renderError: string | null = null;
  @state() private lightboxBlobKey: string | null = null;
  private lightboxTrigger: HTMLElement | null = null;
  private previousView: string | null = null;
  private reconnectDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  @state() private showReconnecting = false;

  constructor() {
    super();
    this.addEventListener('error', (e: Event) => {
      Logger.error('sop-app', 'Render error caught by boundary', { event: String(e) });
      this.renderError = 'A rendering error occurred.';
    });
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    if (this.renderError) {
      return html`
        <section style="padding:16px;">
          <p role="alert" style="color:var(--sop-danger-color);font-size:0.85rem;">
            Something went wrong. Please try reloading the extension.
          </p>
          <button
            class="outline"
            @click=${() => {
              this.renderError = null;
            }}
          >
            Try Again
          </button>
        </section>
      `;
    }
    return html`
      <div role="application" aria-label="nuknow">
        ${this.ctrl.viewState === 'edit'
          ? html`<button
              class="sop-back-button"
              style="margin-bottom:var(--sop-gap-card);"
              @click=${this.handleBack}
              aria-label="Back to recordings"
            >
              ${icon(ArrowLeft, 18)}
            </button>`
          : nothing}
        ${this.showReconnecting
          ? html`<p
              role="status"
              style="color:var(--pico-muted-color);font-size:0.85rem;margin:0 0 8px;"
            >
              Reconnecting...
            </p>`
          : nothing}
        ${this.ctrl.error
          ? html`<p
              role="alert"
              style="color:var(--sop-danger-color);font-size:0.85rem;margin:0 0 8px;"
            >
              ${this.ctrl.error}
            </p>`
          : nothing}
        ${this.renderView()}
        ${this.lightboxBlobKey
          ? html`<sop-screenshot-lightbox
              .blobKey=${this.lightboxBlobKey}
              @close-lightbox=${this.handleCloseLightbox}
            ></sop-screenshot-lightbox>`
          : nothing}

        <div id="sop-announcer" class="sr-only" role="status" aria-live="polite"></div>
      </div>
    `;
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    // Debounce reconnecting indicator to prevent flickering
    if (this.ctrl.reconnecting && !this.showReconnecting) {
      if (!this.reconnectDebounceTimer) {
        this.reconnectDebounceTimer = setTimeout(() => {
          this.showReconnecting = true;
          this.reconnectDebounceTimer = null;
        }, 500);
      }
    } else if (!this.ctrl.reconnecting && this.showReconnecting) {
      if (this.reconnectDebounceTimer) {
        clearTimeout(this.reconnectDebounceTimer);
        this.reconnectDebounceTimer = null;
      }
      this.showReconnecting = false;
    }

    // Focus management after view transitions
    const currentView = this.ctrl.viewState;
    if (this.previousView && this.previousView !== currentView) {
      this.manageFocusForTransition(this.previousView, currentView);
    }
    this.previousView = currentView;
  }

  private manageFocusForTransition(from: string, to: string): void {
    requestAnimationFrame(() => {
      if (to === 'recording') {
        // Home → Recording: focus the pause button
        const pauseBtn = this.querySelector('.sop-control-grid button');
        (pauseBtn as HTMLElement)?.focus();
      } else if (to === 'edit' && from === 'recording') {
        // Recording → Edit: focus the first step card
        const firstCard = this.querySelector('sop-step-card article');
        (firstCard as HTMLElement)?.focus();
      } else if (to === 'home') {
        // Edit → Home: focus the "Start Recording" button
        const startBtn = this.querySelector('button.contrast');
        (startBtn as HTMLElement)?.focus();
      }
    });
  }

  private renderView() {
    try {
      return this.renderViewInner();
    } catch (err) {
      Logger.error('sop-app', 'Synchronous render exception', { error: String(err) });
      this.renderError = 'A rendering error occurred.';
      return nothing;
    }
  }

  private renderViewInner() {
    switch (this.ctrl.viewState) {
      case 'home':
        return html`<sop-home
          .recordings=${this.ctrl.recordings}
          .storagePercentUsed=${this.ctrl.storagePercentUsed}
          @start-recording=${this.handleStartRecording}
          @load-recording=${this.handleLoadRecording}
          @delete-recording=${this.handleDeleteRecording}
        ></sop-home>`;

      case 'recording':
        return html`<sop-recording
          .steps=${this.ctrl.steps}
          .recordingState=${this.ctrl.recordingState}
          @pause-recording=${() => this.ctrl.pauseRecording()}
          @resume-recording=${() => this.ctrl.resumeRecording()}
          @stop-recording=${this.handleStopRecording}
        ></sop-recording>`;

      case 'edit':
        return html`<sop-editor
          .steps=${this.ctrl.steps}
          .recording=${this.ctrl.loadedRecording}
          @save-recording=${() => this.ctrl.saveRecording()}
          @delete-step=${this.handleDeleteStep}
          @update-step=${this.handleUpdateStep}
          @reorder-steps=${this.handleReorderSteps}
          @export-recording=${this.handleExportRecording}
          @delete-recording=${this.handleDeleteFromEditor}
          @show-lightbox=${this.handleShowLightbox}
          @show-error=${this.handleShowError}
        ></sop-editor>`;
    }
  }

  private handleStartRecording() {
    this.ctrl.startRecording();
  }

  private handleStopRecording() {
    this.ctrl.stopRecording();
    this.ctrl.saveRecording();
  }

  private handleLoadRecording(e: CustomEvent<{ recordingId: string }>) {
    this.ctrl.loadRecording(e.detail.recordingId);
  }

  private handleDeleteRecording(e: CustomEvent<{ recordingId: string }>) {
    this.ctrl.deleteRecording(e.detail.recordingId);
  }

  private handleDeleteFromEditor(e: CustomEvent<{ recordingId: string }>) {
    const transition = () => {
      this.ctrl.deleteAndNavigateHome(e.detail.recordingId);
    };

    if (document.startViewTransition) {
      document.startViewTransition(transition);
    } else {
      transition();
    }
  }

  private handleDeleteStep(e: CustomEvent<{ stepId: string }>) {
    this.ctrl.deleteStep(e.detail.stepId);
  }

  private handleUpdateStep(e: CustomEvent<{ stepId: string; changes: Record<string, unknown> }>) {
    this.ctrl.updateStep(e.detail.stepId, e.detail.changes);
  }

  private handleReorderSteps(e: CustomEvent<{ stepIds: string[] }>) {
    this.ctrl.reorderSteps(e.detail.stepIds);
  }

  private handleExportRecording() {
    if (this.ctrl.loadedRecording) {
      this.ctrl.exportRecording(this.ctrl.loadedRecording.id);
    } else {
      Logger.warn('sop-app', 'Export skipped: no loaded recording');
    }
  }

  private handleShowLightbox(e: CustomEvent<{ blobKey: string }>) {
    this.lightboxTrigger = e.target as HTMLElement;
    this.lightboxBlobKey = e.detail.blobKey;
  }

  private handleCloseLightbox() {
    this.lightboxBlobKey = null;
    // Restore focus to the element that opened the lightbox
    if (this.lightboxTrigger) {
      requestAnimationFrame(() => {
        this.lightboxTrigger?.focus();
        this.lightboxTrigger = null;
      });
    }
  }

  private handleShowError(e: CustomEvent<{ message: string }>) {
    this.ctrl.error = e.detail.message;
    this.requestUpdate();
    setTimeout(() => {
      this.ctrl.error = null;
      this.requestUpdate();
    }, 5000);
  }

  private handleBack() {
    const transition = () => {
      this.ctrl.navigateTo('home');
      this.ctrl.loadedRecording = null;
      this.ctrl.listRecordings();
    };

    if (document.startViewTransition) {
      document.startViewTransition(transition);
    } else {
      transition();
    }
  }
}
