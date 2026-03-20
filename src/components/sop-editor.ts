import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { RecordedStep, Recording } from '../core/types.js';
import { generateMarkdown } from '../core/export-engine.js';
import { announce } from './sop-app.js';
import type { SopStepCard } from './sop-step-card.js';
import { icon, Trash2 } from './icons.js';
import './sop-step-card.js';

/**
 * Post-recording editor — edit title, reorder/delete steps, export.
 * Metadata (step count, date) is shown here (not in home list).
 * Delete uses 🗑 trash icon consistently.
 */
@customElement('sop-editor')
export class SopEditor extends LitElement {
  @property({ type: Array }) steps: RecordedStep[] = [];
  @property({ attribute: false }) recording: Recording | null = null;

  @state() private editingTitle = false;
  @state() private editTitleValue = '';
  @state() private undoStep: RecordedStep | null = null;
  @state() private undoTimer: ReturnType<typeof setTimeout> | null = null;
  @state() private copyFeedback = false;
  @state() private exportError: string | null = null;
  @state() private exportRetryCount = 0;

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
        <header style="margin-bottom:var(--sop-gap-section);">
          ${this.editingTitle
            ? html`<input
                type="text"
                .value=${this.editTitleValue}
                @input=${(e: Event) => { this.editTitleValue = (e.target as HTMLInputElement).value; }}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') this.saveTitle();
                  if (e.key === 'Escape') this.cancelTitleEdit();
                }}
                @blur=${this.saveTitle}
              />`
            : html`<h2
                class="sop-editable"
                style="cursor:pointer;margin:0 0 4px;"
                tabindex="0"
                role="button"
                aria-label="Edit recording title"
                @click=${this.startTitleEdit}
                @keydown=${this.handleTitleKeydown}
              >${title}</h2>`}
          <small class="sop-muted">
            ${stepCount} step${stepCount !== 1 ? 's' : ''}${createdDate ? ` \u00B7 ${createdDate}` : ''}
          </small>
        </header>

        <!-- Step list (sequential: step 1 first) -->
        <section
          class="sop-stack sop-stack--tight"
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          ${repeat(
            this.steps,
            (step) => step.id,
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
        </section>

        ${stepCount === 0
          ? html`<p class="sop-muted sop-empty-state">No steps recorded.</p>`
          : nothing}

        ${stepCount > 0
          ? html`
            ${this.exportError
              ? html`<p role="alert" style="color:var(--sop-danger-color);font-size:0.85rem;margin:var(--sop-gap-section) 0 8px;">${this.exportError}</p>`
              : nothing}
            <button class="contrast" style="width:100%;margin-top:${this.exportError ? '0' : 'var(--sop-gap-section)'};" @click=${this.handleExport}>
              ${this.exportError ? 'Retry Export' : 'Export as ZIP'}
            </button>
            <button class="outline" style="width:100%;margin-top:var(--sop-gap-card);" @click=${this.handleCopyMarkdown}>
              ${this.copyFeedback ? 'Copied!' : 'Copy Markdown'}
            </button>`
          : nothing}

        <button class="sop-btn-danger" style="width:100%;margin-top:var(--sop-gap-card);" @click=${this.handleDeleteRecording}>
          ${icon(Trash2, 14)} Delete Recording
        </button>

        <!-- Undo toast (🗑 consistent delete feedback) -->
        ${this.undoStep
          ? html`
            <aside class="sop-undo-toast" role="status" aria-live="polite" aria-atomic="true">
              <span>${icon(Trash2, 14)} Step deleted</span>
              <button class="secondary outline" style="padding:4px 10px;font-size:0.8rem;" @click=${this.handleUndo}>Undo</button>
            </aside>
          `
          : nothing}
      </section>
    `;
  }

  // ── Title editing ───────────────────────────────────────────────────────

  private handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.startTitleEdit();
    }
  }

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
      this.recording = { ...this.recording, title: newTitle };
      this.dispatchEvent(new CustomEvent('save-recording', { bubbles: true, composed: true }));
    }
  }

  private cancelTitleEdit() {
    this.editingTitle = false;
  }

  // ── Step actions (🗑 delete with undo toast) ───────────────────────────

  private handleDeleteStep(e: CustomEvent<{ stepId: string }>) {
    const stepId = e.detail.stepId;
    const deletedIndex = this.steps.findIndex((s) => s.id === stepId);
    const deletedStep = deletedIndex >= 0 ? this.steps[deletedIndex] : undefined;
    if (!deletedStep) return;

    this.undoStep = deletedStep;
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => {
      this.undoStep = null;
      this.undoTimer = null;
    }, 5000);

    this.dispatchEvent(
      new CustomEvent('delete-step', { detail: { stepId }, bubbles: true, composed: true }),
    );

    announce('Step deleted. Press Ctrl+Z to undo.');

    // Focus next step card (or previous if last was deleted)
    requestAnimationFrame(() => {
      const cards = this.querySelectorAll('sop-step-card');
      const focusIndex = Math.min(deletedIndex, cards.length - 1);
      const card = focusIndex >= 0 ? cards[focusIndex] : undefined;
      if (card) {
        const article = card.querySelector('article');
        (article as HTMLElement)?.focus();
      }
    });
  }

  private handleUndo() {
    this.undoStep = null;
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
  }

  private handleUpdateStep(e: CustomEvent<{ stepId: string; changes: Record<string, unknown> }>) {
    this.dispatchEvent(
      new CustomEvent('update-step', { detail: e.detail, bubbles: true, composed: true }),
    );
  }

  private handleReorderStep(e: CustomEvent<{ stepId: string; direction: 'up' | 'down' }>) {
    const { stepId, direction } = e.detail;
    const index = this.steps.findIndex((s) => s.id === stepId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.steps.length) return;

    const ids = this.steps.map((s) => s.id);
    const temp = ids[index];
    ids[index] = ids[newIndex] as string;
    ids[newIndex] = temp as string;

    this.dispatchEvent(
      new CustomEvent('reorder-steps', { detail: { stepIds: ids }, bubbles: true, composed: true }),
    );

    // Announce and focus the moved step card after reorder
    const movedToPosition = ids.indexOf(stepId) + 1;
    announce(`Step moved to position ${movedToPosition}`);

    requestAnimationFrame(() => {
      const cards = this.querySelectorAll('sop-step-card');
      const targetCard = Array.from(cards).find(
        (card) => (card as import('./sop-step-card.js').SopStepCard).step?.id === stepId,
      );
      const article = targetCard?.querySelector('article');
      article?.focus();
    });
  }

  // ── D&D (implicit — cursor change + drop indicator) ────────────────────

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const container = e.currentTarget as HTMLElement;
    container.querySelectorAll('.sop-drop-indicator').forEach((el) => el.remove());

    const targetCard = (e.target as HTMLElement).closest('sop-step-card');
    if (targetCard) {
      const rect = targetCard.getBoundingClientRect();
      const indicator = document.createElement('div');
      indicator.className = 'sop-drop-indicator';
      if (e.clientY < rect.top + rect.height / 2) {
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
    (e.currentTarget as HTMLElement).querySelectorAll('.sop-drop-indicator').forEach((el) => el.remove());

    const draggedId = e.dataTransfer?.getData('text/plain');
    if (!draggedId) return;

    const targetCard = (e.target as HTMLElement).closest('sop-step-card') as SopStepCard | null;
    if (!targetCard?.step) return;
    const targetId = targetCard.step.id;
    if (targetId === draggedId) return;

    const ids = this.steps.map((s) => s.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, draggedId);

    this.dispatchEvent(
      new CustomEvent('reorder-steps', { detail: { stepIds: ids }, bubbles: true, composed: true }),
    );
  }

  // ── Lightbox & Export ──────────────────────────────────────────────────

  private handleShowLightbox(e: CustomEvent<{ blobKey: string }>) {
    this.dispatchEvent(
      new CustomEvent('show-lightbox', { detail: e.detail, bubbles: true, composed: true }),
    );
  }

  private handleExport() {
    this.exportRetryCount++;

    if (this.exportRetryCount > 1) {
      // Second failure — fallback to Markdown-only export
      this.handleMarkdownFallbackExport();
      return;
    }

    this.exportError = null;
    announce('Generating export...');
    this.dispatchEvent(new CustomEvent('export-recording', { bubbles: true, composed: true }));
  }

  private async handleMarkdownFallbackExport() {
    const recording = this.recording ?? this.buildFallbackRecording();
    if (!recording) return;
    try {
      const markdown = generateMarkdown(recording, 'clipboard');
      await navigator.clipboard.writeText(markdown);
      this.exportError = null;
      this.exportRetryCount = 0;
      this.copyFeedback = true;
      setTimeout(() => { this.copyFeedback = false; }, 2000);
      announce('Markdown copied to clipboard (ZIP export failed)');
      console.warn('[SOP Recorder] Export fallback: copied Markdown to clipboard (ZIP export failed)');
    } catch (err) {
      console.error('[SOP Recorder] Markdown fallback export also failed:', err);
      this.exportError = 'All export methods failed. Try reloading the extension.';
      this.exportRetryCount = 0;
      announce('Export failed', 'assertive');
    }
  }

  private async handleCopyMarkdown() {
    const recording = this.recording ?? this.buildFallbackRecording();
    if (!recording) return;
    try {
      const markdown = generateMarkdown(recording, 'clipboard');
      await navigator.clipboard.writeText(markdown);
      this.copyFeedback = true;
      announce('Markdown copied to clipboard');
      setTimeout(() => {
        this.copyFeedback = false;
      }, 2000);
    } catch {
      this.dispatchEvent(
        new CustomEvent('show-error', {
          detail: { message: 'Failed to copy to clipboard' },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private buildFallbackRecording(): Recording | null {
    const firstStep = this.steps[0];
    if (!firstStep) return null;
    return {
      id: '',
      title: 'Untitled SOP',
      createdAt: firstStep.timestamp,
      updatedAt: Date.now(),
      steps: this.steps,
      metadata: {
        startUrl: firstStep.pageUrl,
        startPageTitle: firstStep.pageTitle,
        browserVersion: '',
        stepCount: this.steps.length,
      },
    };
  }

  private handleDeleteRecording() {
    const recordingId = this.recording?.id;
    if (!recordingId) return;
    this.dispatchEvent(
      new CustomEvent('delete-recording', { detail: { recordingId }, bubbles: true, composed: true }),
    );
  }
}
