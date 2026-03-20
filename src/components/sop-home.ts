import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RecordingMetadata } from '../core/types.js';
import { icon, Trash2, Download } from './icons.js';

/**
 * Home view — "Start Recording" CTA + saved recordings list.
 * Long-press (500ms) enters multi-select mode for batch delete/export.
 */
@customElement('sop-home')
export class SopHome extends LitElement {
  @property({ type: Array }) recordings: RecordingMetadata[] = [];
  @property({ type: Number }) storagePercentUsed = 0;

  @state() private selecting = false;
  @state() private selected: Set<string> = new Set();

  private pressTimer?: ReturnType<typeof setTimeout>;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <section>
        ${this.storagePercentUsed >= 0.8
          ? html`<p
              role="alert"
              class="sop-storage-banner"
              style="color:var(--sop-danger-color);background:color-mix(in srgb, var(--sop-danger-color) 10%, transparent);border:1px solid var(--sop-danger-color);border-radius:var(--sop-card-radius, 8px);padding:8px 12px;font-size:0.85rem;margin-bottom:var(--sop-gap-section);"
            >
              Storage is ${Math.round(this.storagePercentUsed * 100)}% full. Export or delete old
              recordings to free space.
            </p>`
          : nothing}
        ${this.selecting ? this.renderBatchBar() : html``}

        <button
          class="contrast"
          style="width:100%;margin-bottom:var(--sop-gap-section);"
          @click=${this.handleStart}
        >
          Start Recording
        </button>

        ${this.recordings.length === 0 ? this.renderEmpty() : this.renderList()}
      </section>
    `;
  }

  private renderEmpty() {
    return html`
      <section class="sop-empty-state">
        <p><strong>Record your first SOP</strong></p>
        <p class="sop-muted">Click "Start Recording" and interact with any web page.</p>
      </section>
    `;
  }

  private renderList() {
    const allIds = this.recordings.map((r) => (r as RecordingMetadata & { id?: string }).id ?? '');
    const allSelected =
      this.selecting && allIds.length > 0 && allIds.every((id) => this.selected.has(id));

    return html`
      <div class="sop-flex-between" style="margin-bottom:0.5rem;">
        <h2 style="margin-bottom:0;">
          Saved
          Recordings${this.selecting
            ? html` <span class="sop-muted" style="font-weight:400;">(${this.selected.size})</span>`
            : nothing}
        </h2>
        ${this.selecting
          ? html`<input
              type="checkbox"
              .checked=${allSelected}
              @change=${() => this.toggleSelectAll(allIds)}
              aria-label="Select all"
            />`
          : nothing}
      </div>
      <section class="sop-stack sop-stack--tight">
        ${this.recordings.map((rec) => this.renderCard(rec))}
      </section>
    `;
  }

  private renderCard(rec: RecordingMetadata) {
    const meta = rec as RecordingMetadata & { id?: string; title?: string };
    const id = meta.id ?? '';
    const title = meta.title ?? meta.startPageTitle ?? 'Untitled SOP';
    const isSelected = this.selected.has(id);
    const stepLabel = `${meta.stepCount ?? 0} step${(meta.stepCount ?? 0) !== 1 ? 's' : ''}`;

    return html`
      <article
        class="sop-rec-card ${this.selecting ? 'sop-rec-card--select' : ''}"
        tabindex="0"
        role="button"
        aria-label="${this.selecting && isSelected ? 'Selected, ' : ''}${title}, ${stepLabel}"
        @click=${this.selecting ? () => this.toggleSelect(id) : () => this.handleLoad(id)}
        @keydown=${(e: KeyboardEvent) => this.handleCardKeydown(e, id)}
        @pointerdown=${this.selecting ? undefined : () => this.handlePointerDown(id)}
        @pointerup=${this.selecting ? undefined : this.handlePointerUp}
        @pointermove=${this.selecting ? undefined : this.handlePointerMove}
        @pointerleave=${this.selecting ? undefined : this.handlePointerUp}
      >
        <div class="sop-flex" style="gap:10px;min-width:0;">
          ${this.selecting
            ? html`<input
                type="checkbox"
                .checked=${isSelected}
                tabindex="-1"
                aria-hidden="true"
              />`
            : nothing}
          <div style="min-width:0;flex:1;overflow:hidden;">
            <strong class="sop-truncate" style="display:block;">${title}</strong>
            <small class="sop-muted">${stepLabel}</small>
          </div>
        </div>
      </article>
    `;
  }

  // ── Batch action bar ────────────────────────────────────────────────────

  private renderBatchBar() {
    return html`
      <nav style="display:flex;gap:6px;align-items:center;margin-bottom:var(--sop-gap-section);">
        <button class="outline secondary" style="white-space:nowrap;" @click=${this.cancelSelect}>
          Cancel
        </button>
        <span style="flex:1;"></span>
        <button
          class="outline secondary sop-flex"
          style="white-space:nowrap;gap:4px;"
          @click=${this.batchExport}
        >
          ${icon(Download, 14)} Export
        </button>
        <button
          class="sop-btn-danger sop-flex"
          style="white-space:nowrap;gap:4px;"
          @click=${this.batchDelete}
        >
          ${icon(Trash2, 14)} Delete
        </button>
      </nav>
    `;
  }

  // ── Keyboard navigation ─────────────────────────────────────────────────

  private handleCardKeydown(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter enters select mode and toggles this card
        if (!this.selecting) {
          this.selecting = true;
          this.selected = new Set([id]);
        } else {
          this.toggleSelect(id);
        }
      } else if (this.selecting) {
        this.toggleSelect(id);
      } else {
        this.handleLoad(id);
      }
    } else if (e.key === 'Escape' && this.selecting) {
      e.preventDefault();
      this.cancelSelect();
    }
  }

  // ── Long-press detection ────────────────────────────────────────────────

  private handlePointerDown(id: string) {
    this.pressTimer = setTimeout(() => {
      this.selecting = true;
      this.selected = new Set([id]);
    }, 500);
  }

  private handlePointerUp() {
    clearTimeout(this.pressTimer);
  }

  private handlePointerMove() {
    clearTimeout(this.pressTimer);
  }

  // ── Selection helpers ───────────────────────────────────────────────────

  private toggleSelect(id: string) {
    const next = new Set(this.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selected = next;
  }

  private toggleSelectAll(allIds: string[]) {
    const allSelected = allIds.every((id) => this.selected.has(id));
    this.selected = allSelected ? new Set() : new Set(allIds);
  }

  private cancelSelect() {
    this.selecting = false;
    this.selected = new Set();
  }

  // ── Batch actions ───────────────────────────────────────────────────────

  private batchDelete() {
    for (const id of this.selected) {
      this.dispatchEvent(
        new CustomEvent('delete-recording', {
          detail: { recordingId: id },
          bubbles: true,
          composed: true,
        }),
      );
    }
    this.cancelSelect();
  }

  private batchExport() {
    for (const id of this.selected) {
      this.dispatchEvent(
        new CustomEvent('export-recording', {
          detail: { recordingId: id },
          bubbles: true,
          composed: true,
        }),
      );
    }
    this.cancelSelect();
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  private handleStart() {
    this.dispatchEvent(new CustomEvent('start-recording', { bubbles: true, composed: true }));
  }

  private handleLoad(id: string) {
    if (!id) return;
    this.dispatchEvent(
      new CustomEvent('load-recording', {
        detail: { recordingId: id },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
