import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { IndexedDBBlobStore } from '../adapters/chrome/blob-store.js';

/**
 * Full-size screenshot lightbox overlay.
 * Fetches the screenshot blob from IndexedDB and displays it.
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
      <div
        role="dialog"
        aria-label="Screenshot preview"
        aria-modal="true"
        style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);cursor:pointer;"
        @click=${this.handleBackdropClick}
      >
        <button
          @click=${this.close}
          aria-label="Close"
          style="position:absolute;top:0.5rem;right:0.5rem;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;z-index:1001;padding:0.5rem;"
        >&times;</button>

        ${this.loading
          ? html`<p style="color:#fff;">Loading...</p>`
          : this.imageUrl
            ? html`<img
                src=${this.imageUrl}
                alt="Full-size screenshot"
                style="max-width:95%;max-height:95%;object-fit:contain;cursor:default;border-radius:4px;"
                @click=${(e: Event) => e.stopPropagation()}
              />`
            : html`<p style="color:#fff;">Screenshot not available</p>`}
      </div>
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
