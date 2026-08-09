import { dbManager } from './IndexedDB.js';
import { validateImageFile, sanitizeFilename } from '../utils/security.js';

/**
 * ImageStore — IndexedDB-first image cache for Cloudflare Pages deployment.
 *
 * First visit:  fetch each image one-by-one from CDN → store Blob in IndexedDB → mark localStorage flag.
 * Return visit: load all images from IndexedDB — zero network requests.
 */

/** Full catalog of built-in puzzle images (WebP) */
const BUILTIN_CATALOG = [
  { id: 'demo1', name: 'Mountain Landscape', url: './images/demo.webp' },
  { id: 'demo2', name: 'Scenic Sunset', url: './images/demo2.webp' },
  { id: 'snorlax', name: 'Snorlax', url: './images/snorlax.webp' },
  { id: 'test', name: 'Vibrant Artwork', url: './images/test.webp' },
  ...Array.from({ length: 19 }, (_, i) => ({
    id: `call_puzzle_${i + 1}`,
    name: `Puzzle ${i + 1}`,
    url: `./images/puzzle${i + 1}.webp`
  }))
];

const LS_KEY = 'puzzles_cached';
const activeObjectUrls = new Set();

export class ImageStore {

  /**
   * Helper to create and track Blob URLs safely.
   */
  static createTrackedUrl(blob) {
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    activeObjectUrls.add(url);
    return url;
  }

  /**
   * Helper to revoke a single Object URL.
   */
  static revokeTrackedUrl(url) {
    if (url && activeObjectUrls.has(url)) {
      URL.revokeObjectURL(url);
      activeObjectUrls.delete(url);
    }
  }

  /**
   * Revoke all active tracked Object URLs (useful for memory cleanup).
   */
  static revokeAllTrackedUrls() {
    for (const url of activeObjectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    }
    activeObjectUrls.clear();
  }

  /**
   * Get the full built-in catalog definition (without blobs).
   */
  static getCatalog() {
    return BUILTIN_CATALOG;
  }

  /**
   * Ensure all built-in puzzles are cached in IndexedDB.
   * Fetches them one-by-one on first visit, then sets a localStorage flag.
   * @param {function} onProgress - optional callback(current, total) for UI progress
   * @returns {Promise<void>}
   */
  static async ensureAllCached(onProgress = null) {
    // Already cached? Skip entirely.
    if (localStorage.getItem(LS_KEY) === 'true') return;

    const total = BUILTIN_CATALOG.length;
    for (let i = 0; i < total; i++) {
      const item = BUILTIN_CATALOG[i];
      try {
        const existing = await this.getImage(item.id);
        if (existing && existing.blob && existing.blob.size > 0) {
          if (onProgress) onProgress(i + 1, total);
          continue; // Already cached this one
        }

        // Fetch from CDN
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let blob = await res.blob();

        // Ensure image/webp MIME
        if (!blob.type || !blob.type.startsWith('image/')) {
          blob = blob.slice(0, blob.size, 'image/webp');
        }

        // Store in IndexedDB
        const store = await dbManager.getStore('images', 'readwrite');
        await new Promise((resolve, reject) => {
          const req = store.put({ id: item.id, name: item.name, blob, createdAt: Date.now() });
          req.onsuccess = () => resolve();
          req.onerror = (e) => reject(e.target.error);
        });
      } catch (err) {
        console.warn(`[ImageStore] Failed to cache ${item.id}:`, err);
      }
      if (onProgress) onProgress(i + 1, total);
    }

    localStorage.setItem(LS_KEY, 'true');
  }

  /**
   * Get a single image Blob from IndexedDB by ID.
   */
  static async getImage(id) {
    try {
      const store = await dbManager.getStore('images', 'readonly');
      const record = await new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
      });
      if (!record || !record.blob) return null;
      return {
        id: record.id,
        name: record.name,
        blob: record.blob,
        url: this.createTrackedUrl(record.blob)
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Get a built-in image — tries IndexedDB first, falls back to CDN URL.
   */
  static async getBuiltinImage(id) {
    const cached = await this.getImage(id);
    if (cached) return cached;

    // Fallback: find from catalog and return raw URL
    const catalogItem = BUILTIN_CATALOG.find(c => c.id === id);
    if (catalogItem) return { id, name: catalogItem.name, url: catalogItem.url, blob: null };
    return null;
  }

  /**
   * Get ALL built-in images with IndexedDB blob URLs where available.
   * Returns array in catalog order.
   */
  static async getAllBuiltinImages() {
    const results = [];
    for (const item of BUILTIN_CATALOG) {
      const cached = await this.getImage(item.id);
      if (cached) {
        results.push({ ...cached, isCustom: false, isCallPuzzle: item.id.startsWith('call_puzzle_') });
      } else {
        results.push({ id: item.id, name: item.name, url: item.url, blob: null, isCustom: false, isCallPuzzle: item.id.startsWith('call_puzzle_') });
      }
    }
    return results;
  }

  /**
   * Save a user-uploaded image to IndexedDB with security validation.
   */
  static async saveImage(fileOrBlob, fileName = 'Custom Image', customId = null) {
    // 1. Validation check
    const validation = validateImageFile(fileOrBlob);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file.');
    }

    const safeName = sanitizeFilename(fileName || validation.sanitizedName);

    try {
      const store = await dbManager.getStore('images', 'readwrite');
      const id = customId || `custom_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      let processedBlob = fileOrBlob;
      if (fileOrBlob && (!fileOrBlob.type || !fileOrBlob.type.startsWith('image/'))) {
        const mime = safeName.endsWith('.jpg') || safeName.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
        processedBlob = fileOrBlob.slice(0, fileOrBlob.size, mime);
      }

      const record = { id, name: safeName, blob: processedBlob, createdAt: Date.now() };
      await new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
      });

      const url = this.createTrackedUrl(processedBlob);
      return { id, name: safeName, blob: processedBlob, url, isCustom: true };
    } catch (err) {
      console.error('[ImageStore] Failed to save image:', err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        throw new Error('Device storage limit reached. Please delete old custom images to save new ones.');
      }
      throw err;
    }
  }

  /**
   * Get all user-uploaded custom images from IndexedDB.
   */
  static async getCustomImages() {
    try {
      const store = await dbManager.getStore('images', 'readonly');
      const records = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
      });

      return records
        .filter(rec => rec.id.startsWith('custom_img_'))
        .map(rec => ({
          id: rec.id,
          name: sanitizeFilename(rec.name),
          blob: rec.blob,
          url: this.createTrackedUrl(rec.blob),
          isCustom: true
        }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Delete an image by ID from IndexedDB.
   */
  static async deleteImage(id) {
    try {
      const store = await dbManager.getStore('images', 'readwrite');
      await new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error(`[ImageStore] Failed to delete image ${id}:`, err);
    }
  }

  /**
   * Reset database completely from fresh (deletes all IndexedDB stores, SW caches & localStorage data).
   */
  static async clearAllDatabaseData() {
    console.log('[ImageStore] Starting deep database & cache wipe...');
    try {
      this.revokeAllTrackedUrls();
      const activeTheme = SettingsStore.getSettings().theme || 'light';

      // Step 1: Open DB and clear all object stores within an explicit transaction that WAITS FOR ONCOMPLETE
      try {
        const db = await dbManager.open();
        if (db) {
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.length > 0) {
            await new Promise((resolve) => {
              const tx = db.transaction(storeNames, 'readwrite');
              tx.oncomplete = () => {
                console.log('[ImageStore] IDB Transaction committed successfully.');
                resolve();
              };
              tx.onerror = (e) => {
                console.warn('[ImageStore] IDB Transaction error:', e);
                resolve();
              };
              tx.onabort = () => {
                console.warn('[ImageStore] IDB Transaction aborted');
                resolve();
              };

              for (const name of storeNames) {
                try {
                  tx.objectStore(name).clear();
                } catch (err) {
                  console.warn(`[ImageStore] Failed to clear objectStore ${name}:`, err);
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('[ImageStore] Error clearing IDB objectStores:', e);
      }

      // Step 2: Close database connection
      if (dbManager.db) {
        try {
          dbManager.db.close();
        } catch (e) {}
        dbManager.db = null;
      }

      // Step 3: Delete IndexedDB database 'PuzzleDB' with explicit blocked/success handler
      await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('PuzzleDB');
        req.onsuccess = () => {
          console.log('[ImageStore] IndexedDB PuzzleDB deleted successfully.');
          resolve();
        };
        req.onerror = () => resolve();
        req.onblocked = () => {
          console.warn('[ImageStore] IndexedDB delete blocked, proceeding...');
          resolve();
        };
      });

      // Step 4: Clear all Service Worker caches (CacheStorage)
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
          console.log('[ImageStore] CacheStorage cleared.');
        } catch (e) {
          console.warn('[ImageStore] Failed to clear CacheStorage:', e);
        }
      }

      // Step 5: Unregister Service Worker instances
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
          }
        } catch (e) {}
      }

      // Step 6: Complete 100% purge of localStorage, sessionStorage, and cookies
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('[ImageStore] LocalStorage clear error:', e);
      }

      // Step 7: Apply fresh default Light Theme
      document.documentElement.setAttribute('data-theme', 'light');

      console.log('[ImageStore] 100% Brand new user fresh wipe complete!');
    } catch (err) {
      console.error('[ImageStore] Error during deep clearAllDatabaseData:', err);
    }
  }
}
