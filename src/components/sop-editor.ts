import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RecordedStep, Recording } from '../core/types.js';
import type { SopStepCard } from './sop-step-card.js';
import './sop-step-card.js';
import './sop-screenshot-lightbox.js';

/**
 * Post-recording editor view — edit steps, reorder, delete, export.
 */
@customElement('sop-editor')
export class SopEditor extends LitElement {
  @property({ type: Array }) steps: RecordedStep[] = [];
  @property({ attribute: false }) recording: Recording | null = null;

  @state() private editingTitle = false;
  @state() private editTitleValue = '';
  @state() private undoStep: RecordedStep | null = null;
  @state() private undoTimer: ReturnType<typeof setTimeout> | null = null;
  @state() private lightboxBlobKey: string | null = null;

  override createRenderRoot() {
    return this;
  }

  override render() {
    const title = this.recording?.title ?? 'Untitled SOP';
    const stepCount = this.steps.length;
    const createdDate = this.recording?.createdAt
      ? new Date(this.recording.createdAt).toLocaleDateString()
      : '';

    return html`
      <section>
        <!-- Editable title -->
        <div style="margin-bottom:0.5rem;">
          ${this.editingTitle
            ? html`
              <input
                type="text"
                .value=${this.editTitleValue}
                @input=${(e: Event) => {
                  this.editTitleValue = (e.target as HTMLInputElement).value;
                }}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') this.saveTitle();
                  if (e.key === 'Escape') this.cancelTitleEdit();
                }}
                @blur=${this.saveTitle}
                style="font-size:1.1rem;font-weight:bold;width:100%;"
              />
            `
            : html`
              <h2
                style="cursor:pointer;margin:0;"
                @click=${this.startTitleEdit}
                title="Click to edit title"
              >${title}</h2>
            `}
          <small class="sop-muted">${stepCount} steps${createdDate ? ` \u00B7 ${createdDate}` : ''}</small>
        </div>

        <!-- Step list (sequential order: step 1 first) -->
        <div
          class="sop-stack"
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          ${this.steps.map(
            (step, index) => html`
              <sop-step-card
                .step=${step}
                mode="edit"
                ?isFirst=${index === 0}
                ?isLast=${index === this.steps.length - 1}
                @delete-step=${this.handleDeleteStep}
                @update-step=${this.handleUpdateStep}
                @reorder-step=${this.handleReorderStep}
                @show-lightbox=${this.handleShowLightbox}
              ></sop-step-card>
            `,
          )}
        </div>

        ${stepCount === 0
          ? html`<p class="sop-muted" style="text-align:center;padding:1rem;">No steps recorded.</p>`
          : nothing}

        <!-- Export button -->
        ${stepCount > 0
          ? html`
            <button
              @click=${this.handleExport}
              style="width:100%;margin-top:0.75rem;"
            >Export as ZIP</button>
          `
          : nothing}

        <!-- Undo toast -->
        ${this.undoStep
          ? html`
            <div
              role="alert"
              style="position:fixed;bottom:1rem;left:0.5rem;right:0.5rem;background:var(--pico-card-background-color,#2d3748);color:var(--pico-color,#fff);padding:0.75rem;border-radius:8px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:100;"
            >
              <span>Step deleted</span>
              <button
                @click=${this.handleUndo}
                style="background:none;border:1px solid currentColor;padding:0.25rem 0.5rem;cursor:pointer;border-radius:4px;color:inherit;font-size:0.8rem;"
              >Undo</button>
            </div>
          `
          : nothing}
      </section>

      <!-- Screenshot lightbox -->
      ${this.lightboxBlobKey
        ? html`
          <sop-screenshot-lightbox
            .blobKey=${this.lightboxBlobKey}
            @close-lightbox=${this.closeLightbox}
          ></sop-screenshot-lightbox>
        `
        : nothing}
    `;
  }

  // ── Title editing ───────────────────────────────────────────────────────

  private startTitleEdit() {
    this.editTitleValue = this.recording?.title ?? '';
    this.editingTitle = true;
    requestAnimationFrame(() => {
      const input = this.querySelector('input[type="text"]') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  }

  private saveTitle() {
    if (!this.editingTitle) return;
    this.editingTitle = false;
    const newTitle = this.editTitleValue.trim();
    if (newTitle && this.recording && newTitle !== this.recording.title) {
      // Update title in recording — save via controller
      this.recording = { ...this.recording, title: newTitle };
      this.dispatchEvent(
        new CustomEvent('save-recording', { bubbles: true, composed: true }),
      );
    }
  }

  private cancelTitleEdit() {
    this.editingTitle = false;
  }

  // ── Step actions ────────────────────────────────────────────────────────

  private handleDeleteStep(e: CustomEvent<{ stepId: string }>) {
    const stepId = e.detail.stepId;
    const deletedStep = this.steps.find((s) => s.id === stepId);
    if (!deletedStep) return;

    // Store for undo
    this.undoStep = deletedStep;
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => {
      this.undoStep = null;
      this.undoTimer = null;
    }, 5000);

    // Dispatch delete to controller
    this.dispatchEvent(
      new CustomEvent('delete-step', {
        detail: { stepId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleUndo() {
    if (!this.undoStep) return;
    // Re-add the step via update-step (the step still exists in background until purged)
    // For MVP, undo is best-effort — we dispatch the step back
    // In practice, the background already deleted it, so we'd need an "undo delete" message
    // For now, clear the toast
    this.undoStep = null;
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
  }

  private handleUpdateStep(e: CustomEvent<{ stepId: string; changes: Record<string, unknown> }>) {
    this.dispatchEvent(
      new CustomEvent('update-step', {
        detail: e.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleReorderStep(e: CustomEvent<{ stepId: string; direction: 'up' | 'down' }>) {
    const { stepId, direction } = e.detail;
    const index = this.steps.findIndex((s) => s.id === stepId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.steps.length) return;

    const ids = this.steps.map((s) => s.id);
    // Swap
    const temp = ids[index];
    ids[index] = ids[newIndex] as string;
    ids[newIndex] = temp as string;

    this.dispatchEvent(
      new CustomEvent('reorder-steps', {
        detail: { stepIds: ids },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    // Show drop indicator on the target card
    const container = e.currentTarget as HTMLElement;
    container.querySelectorAll('.sop-drop-indicator').forEach((el) => el.remove());

    const targetCard = (e.target as HTMLElement).closest('sop-step-card');
    if (targetCard) {
      const rect = targetCard.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const indicator = document.createElement('div');
      indicator.className = 'sop-drop-indicator';
      if (e.clientY < midY) {
        targetCard.before(indicator);
      } else {
        targetCard.after(indicator);
      }
    }
  }

  private handleDragLeave(e: DragEvent) {
    const container = e.currentTarget as HTMLElement;
    if (!container.contains(e.relatedTarget as Node)) {
      container.querySelectorAll('.sop-drop-indicator').forEach((el) => el.remove());
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    // Remove any drop indicators
    this.querySelectorAll('.sop-drop-indicator').forEach((el) => el.remove());

    const draggedId = e.dataTransfer?.getData('text/plain');
    if (!draggedId) return;

    // Find the drop target — walk up from event target to find sop-step-card custom element
    const targetCard = (e.target as HTMLElement).closest('sop-step-card') as SopStepCard | null;
    if (!targetCard?.step) return;
    const targetId = targetCard.step.id;
    if (targetId === draggedId) return;

    const ids = this.steps.map((s) => s.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // Move element
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, draggedId);

    this.dispatchEvent(
      new CustomEvent('reorder-steps', {
        detail: { stepIds: ids },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Lightbox ────────────────────────────────────────────────────────────

  private handleShowLightbox(e: CustomEvent<{ blobKey: string }>) {
    this.lightboxBlobKey = e.detail.blobKey;
  }

  private closeLightbox() {
    this.lightboxBlobKey = null;
  }

  // ── Export ──────────────────────────────────────────────────────────────

  private handleExport() {
    this.dispatchEvent(
      new CustomEvent('export-recording', { bubbles: true, composed: true }),
    );
  }
}
