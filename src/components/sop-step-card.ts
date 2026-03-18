import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RecordedStep } from '../core/types.js';

type CardMode = 'live' | 'edit';

/**
 * Reusable step card with live (read-only) and edit (interactive) modes.
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

    const thumbnailClass =
      this.mode === 'live' ? 'sop-thumbnail sop-thumbnail--live' : 'sop-thumbnail sop-thumbnail--edit';

    return html`
      <div class="sop-step-card"
        draggable=${this.mode === 'edit' ? 'true' : 'false'}
        @dragstart=${this.mode === 'edit' ? this.handleDragStart : nothing}
        @dragend=${this.mode === 'edit' ? this.handleDragEnd : nothing}
      >
        <!-- Left: thumbnail -->
        <div>
          ${this.step.thumbnailDataUrl
            ? html`<img
                src=${this.step.thumbnailDataUrl}
                alt="Step ${this.step.sequenceNumber} screenshot"
                class=${thumbnailClass}
                @click=${this.mode === 'edit' ? this.handleThumbnailClick : nothing}
              />`
            : html`<div class=${thumbnailClass} style="background:var(--pico-muted-border-color,#e2e8f0);display:flex;align-items:center;justify-content:center;color:var(--pico-muted-color,#a0aec0);font-size:0.7rem;">No img</div>`}
        </div>

        <!-- Right: content -->
        <div style="min-width:0;">
          <!-- Header: step number + actions -->
          <div class="sop-flex-between" style="margin-bottom:0.25rem;">
            <span style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--pico-primary,#1095c1);">
              Step ${this.step.sequenceNumber}
            </span>
            ${this.mode === 'edit'
              ? html`
                <div class="sop-flex" style="gap:0.15rem;flex-shrink:0;">
                  <button
                    @click=${this.handleMoveUp}
                    ?disabled=${this.isFirst}
                    aria-label="Move step up"
                    style="background:none;border:none;padding:0.2rem 0.35rem;cursor:pointer;font-size:0.75rem;line-height:1;border-radius:3px;"
                  >&#9650;</button>
                  <button
                    @click=${this.handleMoveDown}
                    ?disabled=${this.isLast}
                    aria-label="Move step down"
                    style="background:none;border:none;padding:0.2rem 0.35rem;cursor:pointer;font-size:0.75rem;line-height:1;border-radius:3px;"
                  >&#9660;</button>
                  <button
                    @click=${this.handleDelete}
                    aria-label="Delete step"
                    style="background:none;border:none;padding:0.2rem 0.35rem;cursor:pointer;font-size:0.75rem;line-height:1;color:var(--sop-recording-color);border-radius:3px;"
                  >&#10005;</button>
                </div>
              `
              : nothing}
          </div>

          <!-- Title -->
          ${this.renderTitle()}

          <!-- URL -->
          <div class="sop-url sop-truncate" title=${this.step.pageUrl}>
            ${this.truncateUrl(this.step.pageUrl)}
          </div>

          <!-- Description (edit mode only) -->
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
          @input=${(e: Event) => {
            this.editTitleValue = (e.target as HTMLInputElement).value;
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter') this.saveTitle();
            if (e.key === 'Escape') this.cancelTitleEdit();
          }}
          @blur=${this.saveTitle}
          style="font-size:0.9rem;padding:0.2rem 0.35rem;margin:0 0 0.15rem;width:100%;"
        />
      `;
    }

    if (this.mode === 'edit') {
      return html`
        <strong
          class="sop-truncate sop-editable"
          style="display:block;font-size:0.9rem;margin-bottom:0.15rem;"
          @click=${this.startTitleEdit}
          title="Click to edit title"
        >${this.step.title}</strong>
      `;
    }

    return html`
      <strong class="sop-truncate" style="display:block;font-size:0.85rem;">
        ${this.step.title}
      </strong>
    `;
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
          bubbles: true,
          composed: true,
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
          @input=${(e: Event) => {
            this.editDescriptionValue = (e.target as HTMLTextAreaElement).value;
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Escape') this.cancelDescriptionEdit();
          }}
          @blur=${this.saveDescription}
          rows="2"
          style="font-size:0.85rem;padding:0.35rem;margin-top:0.35rem;width:100%;resize:vertical;"
          placeholder="Add a description..."
        ></textarea>
      `;
    }

    const hasDescription = this.step.description && this.step.description.length > 0;

    return html`
      <div
        class="sop-editable ${hasDescription ? '' : 'sop-editable--placeholder'}"
        style="font-size:0.85rem;margin-top:0.35rem;min-height:1.4em;"
        @click=${this.startDescriptionEdit}
        title="Click to edit description"
      >${hasDescription ? this.step.description : '+ Add description'}</div>
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
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private cancelDescriptionEdit() {
    this.editingDescription = false;
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  private handleMoveUp() {
    this.dispatchEvent(
      new CustomEvent('reorder-step', {
        detail: { stepId: this.step.id, direction: 'up' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleMoveDown() {
    this.dispatchEvent(
      new CustomEvent('reorder-step', {
        detail: { stepId: this.step.id, direction: 'down' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDelete() {
    this.dispatchEvent(
      new CustomEvent('delete-step', {
        detail: { stepId: this.step.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleThumbnailClick() {
    if (this.step.screenshotBlobKey) {
      this.dispatchEvent(
        new CustomEvent('show-lightbox', {
          detail: { blobKey: this.step.screenshotBlobKey },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────

  private handleDragStart(e: DragEvent) {
    e.dataTransfer?.setData('text/plain', this.step.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
    (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
  }

  private handleDragEnd(e: DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    (e.currentTarget as HTMLElement).style.transform = '';
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private truncateUrl(url: string): string {
    try {
      const u = new URL(url);
      const path = u.pathname.length > 30 ? u.pathname.slice(0, 30) + '...' : u.pathname;
      return u.hostname + path;
    } catch {
      return url.slice(0, 50);
    }
  }
}
