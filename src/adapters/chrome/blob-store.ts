import type { IBlobStore } from '../interfaces/index.js';

const DB_NAME = 'sop-recorder-screenshots';
const DB_VERSION = 1;
const STORE_NAME = 'screenshots';

/**
 * IndexedDB-based blob store for screenshot storage.
 * Stores Blobs by key, avoids base64 overhead.
 */
export class IndexedDBBlobStore implements IBlobStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async put(key: string, blob: Blob): Promise<void> {
    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async get(key: string): Promise<Blob | null> {
    const db = await this.openDB();
    return new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const result = request.result as Blob | undefined;
        resolve(result ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const key of keys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getUsage(): Promise<number> {
    const db = await this.openDB();
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor();
      let totalSize = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const value = cursor.value;
          if (value instanceof Blob) {
            totalSize += value.size;
          }
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}
