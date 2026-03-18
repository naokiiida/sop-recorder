import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RecordingMetadata } from '../core/types.js';
import { icon, EllipsisVertical, Trash2, Download } from './icons.js';

/**
 * Home view — "Start Recording" CTA + saved recordings list (title only).
 */
@customElement('sop-home')
export class SopHome extends LitElement {
  @property({ type: Array }) recordings: RecordingMetadata[] = [];

  @state() private openMenuId: string | null = null;

  private boundCloseMenu = this.closeMenuOnClickOutside.bind(this);

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.boundCloseMenu);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.boundCloseMenu);
  }

  private closeMenuOnClickOutside() {
    if (this.openMenuId) {
      this.openMenuId = null;
    }
  }

  override render() {
    return html`
      <section>
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
      <div style="display:flex;flex-direction:column;gap:var(--sop-gap-card);">
        ${this.recordings.map((rec) => this.renderCard(rec))}
      </div>
    `;
  }

  private renderCard(rec: RecordingMetadata) {
    const meta = rec as RecordingMetadata & { id?: string; title?: string };
    const id = meta.id ?? '';
    const title = meta.title ?? meta.startPageTitle ?? 'Untitled SOP';

    return html`
      <article
        style="cursor:pointer;position:relative;margin:0;padding:10px 12px;"
        @click=${() => this.handleLoad(id)}
        role="button"
        tabindex="0"
        aria-label="Open ${title}"
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleLoad(id);
          }
        }}
      >
        <div class="sop-flex-between">
          <strong class="sop-truncate" style="flex:1;min-width:0;">${title}</strong>

          <div class="sop-hover-actions" style="position:relative;">
            <button
              @click=${(e: Event) => { e.stopPropagation(); this.toggleMenu(id); }}
              aria-label="Actions for ${title}"
            >${icon(EllipsisVertical, 16)}</button>
          </div>
        </div>

        ${this.openMenuId === id
          ? html`
            <nav
              @click=${(e: Event) => e.stopPropagation()}
              style="position:absolute;right:12px;top:100%;background:var(--pico-card-background-color);border:1px solid var(--pico-muted-border-color);border-radius:6px;z-index:10;min-width:120px;box-shadow:0 4px 12px rgba(0,0,0,0.25);overflow:hidden;"
            >
              <ul style="list-style:none;margin:0;padding:4px 0;">
                <li>
                  <button
                    @click=${(e: Event) => { e.stopPropagation(); this.handleExport(id); }}
                    style="display:flex;align-items:center;gap:6px;width:100%;text-align:left;background:none;border:none;padding:8px 12px;cursor:pointer;font-size:0.85rem;color:var(--pico-color);"
                  >${icon(Download, 14)} Export</button>
                </li>
                <li>
                  <button
                    @click=${(e: Event) => { e.stopPropagation(); this.handleDelete(id); }}
                    style="display:flex;align-items:center;gap:6px;width:100%;text-align:left;background:none;border:none;padding:8px 12px;cursor:pointer;font-size:0.85rem;color:var(--sop-recording-color);"
                  >${icon(Trash2, 14)} Delete</button>
                </li>
              </ul>
            </nav>
          `
          : nothing}
      </article>
    `;
  }

  private toggleMenu(id: string) {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  private handleStart() {
    this.dispatchEvent(new CustomEvent('start-recording', { bubbles: true, composed: true }));
  }

  private handleLoad(id: string) {
    if (!id || this.openMenuId) return;
    this.dispatchEvent(
      new CustomEvent('load-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }

  private handleDelete(id: string) {
    this.openMenuId = null;
    this.dispatchEvent(
      new CustomEvent('delete-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }

  private handleExport(id: string) {
    this.openMenuId = null;
    this.dispatchEvent(
      new CustomEvent('export-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }
}
