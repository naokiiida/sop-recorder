import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { IndexedDBBlobStore } from '../adapters/chrome/blob-store.js';

/**
 * Full-size screenshot lightbox overlay.
 * Uses semantic <dialog> for PicoCSS styling (backdrop, centering, close button).
 */
@customElement('sop-screenshot-lightbox')
export class SopScreenshotLightbox extends LitElement {
  @property({ type: String }) blobKey = '';

  @state() private imageUrl: string | null = null;
  @state() private loading = true;

  private blobStore = new IndexedDBBlobStore();

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeydown);
    this.loadImage();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeydown);
    this.revokeUrl();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('blobKey')) {
      this.loadImage();
    }
  }

  override render() {
    return html`
      <dialog open @click=${this.handleBackdropClick}>
        <article @click=${(e: Event) => e.stopPropagation()} style="max-width:95vw;max-height:95vh;overflow:auto;">
          <header>
            <button aria-label="Close" rel="prev" @click=${this.close}></button>
            <p><strong>Screenshot</strong></p>
          </header>
          ${this.loading
            ? html`<p>Loading...</p>`
            : this.imageUrl
              ? html`<img
                  src=${this.imageUrl}
                  alt="Full-size screenshot"
                  style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:4px;"
                />`
              : html`<p>Screenshot not available</p>`}
        </article>
      </dialog>
    `;
  }

  private async loadImage() {
    this.loading = true;
    this.revokeUrl();

    if (!this.blobKey) {
      this.loading = false;
      return;
    }

    try {
      const blob = await this.blobStore.get(this.blobKey);
      if (blob) {
        this.imageUrl = URL.createObjectURL(blob);
      } else {
        this.imageUrl = null;
      }
    } catch {
      this.imageUrl = null;
    }

    this.loading = false;
  }

  private revokeUrl() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
  }

  private handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  };

  private handleBackdropClick(e: Event) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-lightbox', { bubbles: true, composed: true }));
  }
}
