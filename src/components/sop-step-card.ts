import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RecordedStep } from '../core/types.js';
import { icon, ChevronUp, ChevronDown, Trash2 } from './icons.js';

type CardMode = 'live' | 'edit';

/**
 * Step card — live (compact, read-only) and edit (interactive) modes.
 *
 * Cohesion rules applied:
 * - 🗑 trash icon for delete (not ✕)
 * - ▲▼🗑 actions are hover-reveal (.sop-hover-actions)
 * - URL hidden in live mode, secondary text in edit mode
 * - Step badge [N] in edit mode
 * - .sop-editable for clickable title/description
 */
@customElement('sop-step-card')
export class SopStepCard extends LitElement {
  @property({ attribute: false }) step!: RecordedStep;
  @property({ type: String }) mode: CardMode = 'live';
  @property({ type: Boolean }) isFirst = false;
  @property({ type: Boolean }) isLast = false;

  @state() private editingTitle = false;
  @state() private editingDescription = false;
  @state() private editTitleValue = '';
  @state() private editDescriptionValue = '';

  override createRenderRoot() {
    return this;
  }

  override render() {
    if (!this.step) return nothing;

    const thumbClass = this.mode === 'live'
      ? 'sop-thumbnail sop-thumbnail--live'
      : 'sop-thumbnail sop-thumbnail--edit';

    return html`
      <div class="sop-step-card"
        draggable=${this.mode === 'edit' ? 'true' : 'false'}
        @dragstart=${this.mode === 'edit' ? this.handleDragStart : nothing}
        @dragend=${this.mode === 'edit' ? this.handleDragEnd : nothing}
      >
        <!-- Thumbnail -->
        <div>
          ${this.step.thumbnailDataUrl
            ? html`<img
                src=${this.step.thumbnailDataUrl}
                alt="Step ${this.step.sequenceNumber}"
                class=${thumbClass}
                @click=${this.mode === 'edit' ? this.handleThumbnailClick : nothing}
              />`
            : html`<div class=${thumbClass} style="background:var(--pico-muted-border-color);display:flex;align-items:center;justify-content:center;color:var(--sop-text-tertiary);font-size:0.65rem;">No img</div>`}
        </div>

        <!-- Content -->
        <div style="min-width:0;display:flex;flex-direction:column;gap:4px;">
          <!-- Header row: badge + title + hover actions -->
          <div class="sop-flex-between">
            <div class="sop-flex" style="min-width:0;flex:1;gap:6px;">
              ${this.mode === 'edit'
                ? html`<span class="sop-step-badge">${this.step.sequenceNumber}</span>`
                : nothing}
              ${this.renderTitle()}
            </div>

            ${this.mode === 'edit'
              ? html`
                <div class="sop-hover-actions">
                  <button @click=${this.handleMoveUp} ?disabled=${this.isFirst} aria-label="Move up">${icon(ChevronUp, 14)}</button>
                  <button @click=${this.handleMoveDown} ?disabled=${this.isLast} aria-label="Move down">${icon(ChevronDown, 14)}</button>
                  <button class="sop-danger" @click=${this.handleDelete} aria-label="Delete step">${icon(Trash2, 14)}</button>
                </div>
              `
              : nothing}
          </div>

          <!-- URL: hidden in live, secondary in edit -->
          ${this.mode === 'edit'
            ? html`<div class="sop-muted sop-truncate" style="font-size:0.8rem;color:var(--sop-text-tertiary);" title=${this.step.pageUrl}>
                ${this.truncateUrl(this.step.pageUrl)}
              </div>`
            : nothing}

          <!-- Description: edit mode only -->
          ${this.mode === 'edit' ? this.renderDescription() : nothing}
        </div>
      </div>
    `;
  }

  // ── Title ─────────────────────────────────────────────────────────────

  private renderTitle() {
    if (this.mode === 'edit' && this.editingTitle) {
      return html`
        <input
          type="text"
          .value=${this.editTitleValue}
          @input=${(e: Event) => { this.editTitleValue = (e.target as HTMLInputElement).value; }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter') this.saveTitle();
            if (e.key === 'Escape') this.cancelTitleEdit();
          }}
          @blur=${this.saveTitle}
          style="flex:1;min-width:0;"
        />
      `;
    }

    if (this.mode === 'edit') {
      return html`
        <strong
          class="sop-truncate sop-editable"
          style="flex:1;min-width:0;font-size:0.9rem;"
          @click=${this.startTitleEdit}
          title="Click to edit"
        >${this.step.title}</strong>
      `;
    }

    // Live mode: plain title
    return html`<strong class="sop-truncate" style="flex:1;min-width:0;font-size:0.85rem;">${this.step.title}</strong>`;
  }

  private startTitleEdit() {
    this.editTitleValue = this.step.title;
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
    if (newTitle && newTitle !== this.step.title) {
      this.dispatchEvent(
        new CustomEvent('update-step', {
          detail: { stepId: this.step.id, changes: { title: newTitle } },
          bubbles: true, composed: true,
        }),
      );
    }
  }

  private cancelTitleEdit() {
    this.editingTitle = false;
  }

  // ── Description ─────────────────────────────────────────────────────────

  private renderDescription() {
    if (this.editingDescription) {
      return html`
        <textarea
          .value=${this.editDescriptionValue}
          @input=${(e: Event) => { this.editDescriptionValue = (e.target as HTMLTextAreaElement).value; }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Escape') this.cancelDescriptionEdit(); }}
          @blur=${this.saveDescription}
          rows="2"
          placeholder="Add a description..."
          style="width:100%;resize:vertical;"
        ></textarea>
      `;
    }

    const hasDesc = this.step.description && this.step.description.length > 0;
    return html`
      <div
        class="sop-editable ${hasDesc ? '' : 'sop-editable--placeholder'}"
        style="font-size:0.85rem;min-height:1.2em;"
        @click=${this.startDescriptionEdit}
        title="Click to edit description"
      >${hasDesc ? this.step.description : '\u270E Add description'}</div>
    `;
  }

  private startDescriptionEdit() {
    this.editDescriptionValue = this.step.description;
    this.editingDescription = true;
    requestAnimationFrame(() => {
      const textarea = this.querySelector('textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    });
  }

  private saveDescription() {
    if (!this.editingDescription) return;
    this.editingDescription = false;
    const newDesc = this.editDescriptionValue.trim();
    if (newDesc !== this.step.description) {
      this.dispatchEvent(
        new CustomEvent('update-step', {
          detail: { stepId: this.step.id, changes: { description: newDesc } },
          bubbles: true, composed: true,
        }),
      );
    }
  }

  private cancelDescriptionEdit() {
    this.editingDescription = false;
  }

  // ── Actions (🗑 trash, ▲▼ reorder — all hover-reveal) ─────────────────

  private handleMoveUp() {
    this.dispatchEvent(
      new CustomEvent('reorder-step', { detail: { stepId: this.step.id, direction: 'up' }, bubbles: true, composed: true }),
    );
  }

  private handleMoveDown() {
    this.dispatchEvent(
      new CustomEvent('reorder-step', { detail: { stepId: this.step.id, direction: 'down' }, bubbles: true, composed: true }),
    );
  }

  private handleDelete() {
    this.dispatchEvent(
      new CustomEvent('delete-step', { detail: { stepId: this.step.id }, bubbles: true, composed: true }),
    );
  }

  private handleThumbnailClick() {
    if (this.step.screenshotBlobKey) {
      this.dispatchEvent(
        new CustomEvent('show-lightbox', { detail: { blobKey: this.step.screenshotBlobKey }, bubbles: true, composed: true }),
      );
    }
  }

  // ── D&D (implicit — no grip handle, cursor change is enough) ──────────

  private handleDragStart(e: DragEvent) {
    e.dataTransfer?.setData('text/plain', this.step.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  }

  private handleDragEnd(e: DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private truncateUrl(url: string): string {
    try {
      const u = new URL(url);
      const path = u.pathname.length > 25 ? u.pathname.slice(0, 25) + '...' : u.pathname;
      return u.hostname + path;
    } catch {
      return url.slice(0, 40);
    }
  }
}
