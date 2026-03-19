import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RecordingController } from './recording-controller.js';
import { icon, ArrowLeft } from './icons.js';
import './sop-home.js';
import './sop-recording.js';
import './sop-editor.js';
import './sop-screenshot-lightbox.js';

/**
 * Root application shell with state-driven view routing.
 * Uses light DOM for PicoCSS compatibility.
 */
@customElement('sop-app')
export class SopApp extends LitElement {
  private ctrl = new RecordingController(this);

  @state() private lightboxBlobKey: string | null = null;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      ${this.ctrl.viewState === 'edit'
        ? html`<button class="sop-back-button" style="margin-bottom:var(--sop-gap-card);" @click=${this.handleBack} aria-label="Back to recordings">${icon(ArrowLeft, 18)}</button>`
        : nothing}

      ${this.ctrl.error
        ? html`<p role="alert" style="color:var(--sop-recording-color);font-size:0.85rem;margin:0 0 8px;">${this.ctrl.error}</p>`
        : nothing}

      ${this.renderView()}

      ${this.lightboxBlobKey
        ? html`<sop-screenshot-lightbox
            .blobKey=${this.lightboxBlobKey}
            @close-lightbox=${() => { this.lightboxBlobKey = null; }}
          ></sop-screenshot-lightbox>`
        : nothing}
    `;
  }

  private renderView() {
    switch (this.ctrl.viewState) {
      case 'home':
        return html`<sop-home
          .recordings=${this.ctrl.recordings}
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
          @show-lightbox=${this.handleShowLightbox}
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
    }
  }

  private handleShowLightbox(e: CustomEvent<{ blobKey: string }>) {
    this.lightboxBlobKey = e.detail.blobKey;
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
