import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RecordingMetadata } from '../core/types.js';

/**
 * Home view — shows saved recordings list or empty state with a Start button.
 */
@customElement('sop-home')
export class SopHome extends LitElement {
  @property({ type: Array }) recordings: RecordingMetadata[] = [];

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <section>
        <button @click=${this.handleStart} style="width:100%;">
          &#9679; Start Recording
        </button>

        ${this.recordings.length === 0 ? this.renderEmpty() : this.renderList()}
      </section>
    `;
  }

  private renderEmpty() {
    return html`
      <div style="text-align:center;padding:2rem 0;">
        <p style="font-size:2rem;margin-bottom:0.5rem;">&#128221;</p>
        <p><strong>Record your first SOP</strong></p>
        <p class="sop-muted">Click "Start Recording" and interact with any web page.</p>
      </div>
    `;
  }

  private renderList() {
    return html`
      <h2>Saved Recordings</h2>
      <div class="sop-stack">
        ${this.recordings.map((rec) => this.renderCard(rec))}
      </div>
    `;
  }

  private renderCard(rec: RecordingMetadata) {
    // RecordingMetadata from listRecordings has: startUrl, startPageTitle, browserVersion, stepCount
    // But we also need id, title, updatedAt — these come through as extra fields from storage adapter
    const meta = rec as RecordingMetadata & { id?: string; title?: string; updatedAt?: number };
    const id = meta.id ?? '';
    const title = meta.title ?? meta.startPageTitle ?? 'Untitled SOP';
    const date = meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString() : '';

    return html`
      <article
        style="cursor:pointer;position:relative;"
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
          <div style="min-width:0;flex:1;">
            <strong class="sop-truncate" style="display:block;">${title}</strong>
            <small class="sop-muted">${rec.stepCount} steps${date ? ` \u00B7 ${date}` : ''}</small>
          </div>
          <div style="position:relative;">
            <button
              @click=${(e: Event) => {
                e.stopPropagation();
                this.toggleMenu(id);
              }}
              aria-label="Actions for ${title}"
              style="background:none;border:none;padding:0.25rem 0.5rem;cursor:pointer;font-size:1rem;"
            >&#8230;</button>
            ${this.openMenuId === id
              ? html`
                <nav
                  style="position:absolute;right:0;top:100%;background:var(--pico-card-background-color,#fff);border:1px solid var(--pico-muted-border-color,#e2e8f0);border-radius:4px;z-index:10;min-width:120px;box-shadow:0 2px 8px rgba(0,0,0,0.15);"
                >
                  <ul style="list-style:none;margin:0;padding:0.25rem 0;">
                    <li>
                      <button
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.handleExport(id);
                        }}
                        style="background:none;border:none;width:100%;text-align:left;padding:0.5rem 0.75rem;cursor:pointer;"
                      >Export</button>
                    </li>
                    <li>
                      <button
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.handleDelete(id);
                        }}
                        style="background:none;border:none;width:100%;text-align:left;padding:0.5rem 0.75rem;cursor:pointer;color:var(--sop-recording-color);"
                      >Delete</button>
                    </li>
                  </ul>
                </nav>
              `
              : nothing}
          </div>
        </div>
      </article>
    `;
  }

  // ── Menu state ──────────────────────────────────────────────────────────

  private openMenuId: string | null = null;

  private toggleMenu(id: string) {
    this.openMenuId = this.openMenuId === id ? null : id;
    this.requestUpdate();
  }

  // ── Events ──────────────────────────────────────────────────────────────

  private handleStart() {
    this.dispatchEvent(new CustomEvent('start-recording', { bubbles: true, composed: true }));
  }

  private handleLoad(id: string) {
    if (!id) return;
    this.openMenuId = null;
    this.dispatchEvent(
      new CustomEvent('load-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }

  private handleDelete(id: string) {
    this.openMenuId = null;
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent('delete-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }

  private handleExport(id: string) {
    this.openMenuId = null;
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent('export-recording', { detail: { recordingId: id }, bubbles: true, composed: true }),
    );
  }
}
