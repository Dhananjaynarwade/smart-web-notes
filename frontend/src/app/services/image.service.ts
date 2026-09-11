import { Injectable } from '@angular/core';

interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
}

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly dbName = 'smart-web-notes-images';
  private readonly storeName = 'images';
  private db: IDBDatabase | null = null;

  async upload(file: File): Promise<{ url: string }> {
    const id = crypto.randomUUID();
    await this.saveBlob(id, file, file.type);
    return { url: this.toLocalUrl(id) };
  }

  toLocalUrl(id: string): string {
    return `local-image://${id}`;
  }

  extractId(url: string): string | null {
    const match = url.match(/^local-image:\/\/(.+)$/);
    return match ? match[1] : null;
  }

  async resolveUrl(url: string): Promise<string> {
    const id = this.extractId(url);
    if (!id) {
      return url;
    }
    const blob = await this.getBlob(id);
    return blob ? URL.createObjectURL(blob) : url;
  }

  async resolveHtml(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img[src^="local-image://"]');

    for (const img of Array.from(images)) {
      const src = img.getAttribute('src') ?? '';
      const resolved = await this.resolveUrl(src);
      img.setAttribute('src', resolved);
    }

    return doc.body.innerHTML;
  }

  normalizeHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img[src^="blob:"]');

    for (const img of Array.from(images)) {
      const storedId = img.getAttribute('data-image-id');
      if (storedId) {
        img.setAttribute('src', this.toLocalUrl(storedId));
      }
    }

    return doc.body.innerHTML;
  }

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async saveBlob(id: string, blob: Blob, mimeType: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put({ id, blob, mimeType } satisfies StoredImage);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async getBlob(id: string): Promise<Blob | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).get(id);
      request.onsuccess = () => {
        const record = request.result as StoredImage | undefined;
        resolve(record?.blob ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
