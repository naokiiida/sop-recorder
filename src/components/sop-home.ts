import { LitElement, html } from 'lit';
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

  @state() private selecting = false;
  @state() private selected: Set<string> = new Set();

  private pressTimer?: ReturnType<typeof setTimeout>;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <section>
        ${this.selecting ? this.renderBatchBar() : html``}

        <button class="contrast" style="width:100%;margin-bottom:var(--sop-gap-section);" @click=${this.handleStart}>
          Start Recording
        </button>

        ${this.recordings.length === 0 ? this.renderEmpty() : this.renderList()}
      </section>
    `;
  }

  private renderEmpty() {
    return html`
      <div style="text-align:center;padding:2rem 0;">
        <p><strong>Record your first SOP</strong></p>
        <p class="sop-muted">Click "Start Recording" and interact with any web page.</p>
      </div>
    `;
  }

  private renderList() {
    return html`
      <h2>Saved Recordings</h2>
      <div class="sop-stack sop-stack--tight">
        ${this.recordings.map((rec) => this.renderCard(rec))}
      </div>
    `;
  }

  private renderCard(rec: RecordingMetadata) {
    const meta = rec as RecordingMetadata & { id?: string; title?: string };
    const id = meta.id ?? '';
    const title = meta.title ?? meta.startPageTitle ?? 'Untitled SOP';
    const isSelected = this.selected.has(id);

    if (this.selecting) {
      return html`
        <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;">
          <input type="checkbox" .checked=${isSelected} @change=${() => this.toggleSelect(id)} />
          <span class="sop-truncate">${title}</span>
        </label>
      `;
    }

    return html`
      <a href="#" class="sop-truncate" style="display:block;padding:8px 12px;"
        @click=${(e: Event) => { e.preventDefault(); this.handleLoad(id); }}
        @pointerdown=${() => this.handlePointerDown(id)}
        @pointerup=${this.handlePointerUp}
        @pointermove=${this.handlePointerMove}
        @pointerleave=${this.handlePointerUp}
      >${title}</a>
    `;
  }

  // ── Batch action bar ────────────────────────────────────────────────────

  private renderBatchBar() {
    return html`
      <nav style="display:flex;gap:8px;align-items:center;margin-bottom:var(--sop-gap-section);">
        <button class="outline secondary" @click=${this.cancelSelect}>Cancel</button>
        <span class="sop-muted">${this.selected.size} selected</span>
        <span style="flex:1;"></span>
        <button class="outline secondary" @click=${this.batchExport}>
          ${icon(Download, 14)} Export
        </button>
        <button class="sop-btn-danger" @click=${this.batchDelete}>
          ${icon(Trash2, 14)} Delete
        </button>
      </nav>
    `;
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

  private cancelSelect() {
    this.selecting = false;
    this.selected = new Set();
  }

  // ── Batch actions ───────────────────────────────────────────────────────

  private batchDelete() {
    for (const id of this.selected) {
      this.dispatchEvent(
        new CustomEvent('delete-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
      );
    }
    this.cancelSelect();
  }

  private batchExport() {
    for (const id of this.selected) {
      this.dispatchEvent(
        new CustomEvent('export-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
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
      new CustomEvent('load-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }
}
