import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RecordedStep } from '../core/types.js';
import { icon, ChevronUp, ChevronDown, Trash2, ImageOff } from './icons.js';

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

    if (this.mode === 'edit') return this.renderEditMode();
    return this.renderLiveMode();
  }

  private renderLiveMode() {
    return html`
      <article class="sop-step-card">
        <figure>
          ${this.step.thumbnailDataUrl
            ? html`<img
                src=${this.step.thumbnailDataUrl}
                alt="Step ${this.step.sequenceNumber}"
                class="sop-thumbnail sop-thumbnail--live"
                loading="lazy"
              />`
            : html`<div class="sop-thumbnail sop-thumbnail--live sop-screenshot-unavailable">
                ${icon(ImageOff, 16)}<span>Screenshot unavailable</span>
              </div>`}
        </figure>
        <div style="min-width:0;display:flex;flex-direction:column;gap:4px;">
          <div class="sop-flex" style="min-width:0;flex:1;gap:6px;">${this.renderTitle()}</div>
        </div>
      </article>
    `;
  }

  private renderEditMode() {
    return html`
      <article
        class="sop-step-card sop-step-card--vertical"
        tabindex="0"
        draggable="true"
        @dragstart=${this.handleDragStart}
        @dragend=${this.handleDragEnd}
        @keydown=${this.handleCardKeydown}
        aria-roledescription="Draggable step"
        aria-label="Step ${this.step.sequenceNumber}: ${this.step.title}"
      >
        <!-- Thumbnail container with badge & action overlays -->
        <div class="sop-thumbnail-container">
          ${this.step.thumbnailDataUrl
            ? html`<img
                src=${this.step.thumbnailDataUrl}
                alt="Step ${this.step.sequenceNumber}"
                class="sop-thumbnail sop-thumbnail--edit"
                loading="lazy"
                @click=${this.handleThumbnailClick}
              />`
            : html`<div class="sop-thumbnail-placeholder sop-screenshot-unavailable">
                ${icon(ImageOff, 20)}<span>Screenshot unavailable</span>
              </div>`}
          <span class="sop-step-badge">${this.step.sequenceNumber}</span>
          <div class="sop-hover-actions">
            <button
              @click=${this.handleMoveUp}
              ?disabled=${this.isFirst}
              aria-label="Move step ${this.step.sequenceNumber} up"
            >
              ${icon(ChevronUp, 14)}
            </button>
            <button
              @click=${this.handleMoveDown}
              ?disabled=${this.isLast}
              aria-label="Move step ${this.step.sequenceNumber} down"
            >
              ${icon(ChevronDown, 14)}
            </button>
            <button
              class="sop-danger"
              @click=${this.handleDelete}
              aria-label="Delete step ${this.step.sequenceNumber}"
            >
              ${icon(Trash2, 14)}
            </button>
          </div>
        </div>

        <!-- Content below thumbnail -->
        <div class="sop-step-content">
          ${this.renderTitle()}
          <small
            class="sop-muted sop-truncate"
            style="font-size:0.8rem;color:var(--pico-muted-color);"
            title=${this.step.pageUrl}
          >
            ${this.truncateUrl(this.step.pageUrl)}
          </small>
          ${this.renderDescription()}
        </div>
      </article>
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
          style="flex:1;min-width:0;"
        />
      `;
    }

    if (this.mode === 'edit') {
      return html`
        <strong
          class="sop-truncate sop-editable"
          style="flex:1;min-width:0;font-size:0.9rem;"
          tabindex="0"
          role="button"
          aria-label="Edit step title"
          @click=${this.startTitleEdit}
          @keydown=${this.handleTitleKeydown}
          >${this.step.title}</strong
        >
      `;
    }

    // Live mode: plain title
    return html`<strong class="sop-truncate" style="flex:1;min-width:0;font-size:0.85rem;"
      >${this.step.title}</strong
    >`;
  }

  private handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.startTitleEdit();
    }
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
    this.focusEditableTitle();
  }

  private cancelTitleEdit() {
    this.editingTitle = false;
    this.focusEditableTitle();
  }

  private focusEditableTitle() {
    requestAnimationFrame(() => {
      const el = this.querySelector('strong.sop-editable') as HTMLElement | null;
      el?.focus();
    });
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
          placeholder="Add a description..."
          style="width:100%;resize:vertical;"
        ></textarea>
      `;
    }

    const hasDesc = this.step.description && this.step.description.length > 0;
    return html`
      <p
        class="sop-editable ${hasDesc ? '' : 'sop-editable--placeholder'}"
        style="font-size:0.85rem;min-height:1.2em;margin:0;"
        tabindex="0"
        role="button"
        aria-label="Edit step description"
        @click=${this.startDescriptionEdit}
        @keydown=${this.handleDescriptionKeydown}
      >
        ${hasDesc ? this.step.description : '\u270E Add description'}
      </p>
    `;
  }

  private handleDescriptionKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.startDescriptionEdit();
    }
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
    this.focusEditableDescription();
  }

  private cancelDescriptionEdit() {
    this.editingDescription = false;
    this.focusEditableDescription();
  }

  private focusEditableDescription() {
    requestAnimationFrame(() => {
      const el = this.querySelector('p.sop-editable') as HTMLElement | null;
      el?.focus();
    });
  }

  // ── Keyboard shortcuts for edit mode card ──────────────────────────────

  private handleCardKeydown(e: KeyboardEvent) {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      this.handleMoveUp();
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      this.handleMoveDown();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      this.handleDelete();
    }
  }

  // ── Actions (🗑 trash, ▲▼ reorder — all hover-reveal) ─────────────────

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
