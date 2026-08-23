import { dbManager } from './IndexedDB.js';
import { validateImageFile, sanitizeFilename } from '../utils/security.js';

/**
 * ImageStore — IndexedDB-first image cache for Cloudflare Pages deployment.
 *
 * First visit:  fetch each image one-by-one from CDN → store Blob in IndexedDB → mark localStorage flag.
 * Return visit: load all images from IndexedDB — zero network requests.
 */

/** Full catalog of built-in puzzle images (WebP) */
const BUILTIN_CATALOG = Array.from({ length: 37 }, (_, i) => ({
  id: `puzzle_${i + 1}`,
  name: `Puzzle ${i + 1}`,
  url: `./assets/puzzle/puzzle_${i + 1}.webp`
}));



/** Chaos Catalog — Extra 19 puzzles loaded on demand in the Chaos Tab */
const CHAOS_CATALOG = Array.from({ length: 19 }, (_, i) => ({
  id: `chaos_${i + 1}`,
  name: `Chaos Puzzle ${i + 1}`,
  url: `./assets/chaos/call_chaos${i + 1}.webp`,
  isChaos: true
}));

// Calm Catalog — Extra 8 puzzles loaded on demand in the Calm Tab
const CALM_CATALOG = Array.from({ length: 8 }, (_, i) => ({
  id: `calm_${i + 1}`,
  name: `Calm Puzzle ${i + 1}`,
  url: `/assets/calm/calm_${i + 1}.webp`,
  isCalm: true
}));

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
   * Get On-Call catalog definition.
   */


  /**
   * Get Chaos catalog definition.
   */
  static getChaosCatalog() {
    return CHAOS_CATALOG;
  }

  /**
   * Get all Chaos puzzles that are ALREADY stored in IndexedDB.
   */
  static async getChaosPuzzlesFromDB() {
    const results = [];
    for (const item of CHAOS_CATALOG) {
      const cached = await this.getImage(item.id);
      if (cached && cached.blob && cached.blob.size > 0) {
        results.push({ ...cached, isCustom: false, isChaos: true });
      }
    }
    return results;
  }

  /**
   * Fetch and cache a SINGLE Chaos puzzle item. DB-first.
   */
  static async fetchAndCacheSingleChaos(item) {
    const existing = await this.getImage(item.id);
    if (existing && existing.blob && existing.blob.size > 0) {
      return { ...existing, isCustom: false, isChaos: true };
    }

    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let blob = await res.blob();

    if (!blob.type || !blob.type.startsWith('image/')) {
      throw new Error(`Fetched resource is not a valid image (${blob.type || 'unknown type'})`);
    }

    const store = await dbManager.getStore('images', 'readwrite');
    await new Promise((resolve, reject) => {
      const req = store.put({ id: item.id, name: item.name, blob, createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });

    const cached = await this.getImage(item.id);
    if (cached) return { ...cached, isCustom: false, isChaos: true };
    return { id: item.id, name: item.name, url: item.url, blob, isCustom: false, isChaos: true };
  }

  /**
   * Get Calm catalog definition.
   */
  static getCalmCatalog() {
    return CALM_CATALOG;
  }

  /**
   * Get all Calm puzzles that are ALREADY stored in IndexedDB.
   */
  static async getCalmPuzzlesFromDB() {
    const results = [];
    for (const item of CALM_CATALOG) {
      const cached = await this.getImage(item.id);
      if (cached && cached.blob && cached.blob.size > 0) {
        results.push({ ...cached, isCustom: false, isCalm: true });
      }
    }
    return results;
  }

  /**
   * Fetch and cache a SINGLE Calm puzzle item. DB-first.
   */
  static async fetchAndCacheSingleCalm(item) {
    const existing = await this.getImage(item.id);
    if (existing && existing.blob && existing.blob.size > 0) {
      return { ...existing, isCustom: false, isCalm: true };
    }

    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let blob = await res.blob();

    if (!blob.type || !blob.type.startsWith('image/')) {
      throw new Error(`Fetched resource is not a valid image (${blob.type || 'unknown type'})`);
    }

    const store = await dbManager.getStore('images', 'readwrite');
    await new Promise((resolve, reject) => {
      const req = store.put({ id: item.id, name: item.name, blob, createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });

    const cached = await this.getImage(item.id);
    if (cached) return { ...cached, isCustom: false, isCalm: true };
    return { id: item.id, name: item.name, url: item.url, blob, isCustom: false, isCalm: true };
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
    
    // Step 1: Check existing status in parallel
    const checkPromises = BUILTIN_CATALOG.map(async (item) => {
      const existing = await this.getImage(item.id);
      const isCached = existing && existing.blob && existing.blob.size > 0;
      return { item, isCached };
    });
    const checked = await Promise.all(checkPromises);
    const missing = checked.filter(c => !c.isCached).map(c => c.item);

    if (missing.length === 0) {
      localStorage.setItem(LS_KEY, 'true');
      if (onProgress) onProgress(total, total);
      return;
    }

    let cachedCount = total - missing.length;
    if (onProgress) onProgress(cachedCount, total);

    // Step 2: Fetch missing images in parallel
    const fetchPromises = missing.map(async (item) => {
      try {
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let blob = await res.blob();
        if (!blob.type || !blob.type.startsWith('image/')) {
          throw new Error('Not a valid image');
        }
        return { item, blob };
      } catch (err) {
        console.warn(`[ImageStore] Failed to cache ${item.id}:`, err);
        return null;
      }
    });

    const fetchedResults = await Promise.all(fetchPromises);
    const validResults = fetchedResults.filter(r => r !== null);

    // Step 3: Store all in a SINGLE transaction
    if (validResults.length > 0) {
      const db = await dbManager.open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('images', 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);

        const store = tx.objectStore('images');
        for (const res of validResults) {
          store.put({
            id: res.item.id,
            name: res.item.name,
            blob: res.blob,
            createdAt: Date.now()
          });
          cachedCount++;
          if (onProgress) onProgress(cachedCount, total);
        }
      });
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

    const chaosItem = CHAOS_CATALOG.find(c => c.id === id);
    if (chaosItem) return { id, name: chaosItem.name, url: chaosItem.url, blob: null };

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
        results.push({ ...cached, isCustom: false, isCallPuzzle: item.id.startsWith('puzzle_') });
      } else {
        results.push({ id: item.id, name: item.name, url: item.url, blob: null, isCustom: false, isCallPuzzle: item.id.startsWith('puzzle_') });
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
          isCustom: true,
          createdAt: rec.createdAt || 0
        }))
        .sort((a, b) => {
          if (b.createdAt !== a.createdAt) {
            return b.createdAt - a.createdAt;
          }
          return b.id.localeCompare(a.id);
        });
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

      // Step 1: Close active IDB connection
      dbManager.close();

      // Step 2: Open and clear object stores within explicit transaction
      try {
        const db = await dbManager.open();
        if (db) {
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.length > 0) {
            await new Promise((resolve) => {
              const tx = db.transaction(storeNames, 'readwrite');
              tx.oncomplete = () => resolve();
              tx.onerror = () => resolve();
              tx.onabort = () => resolve();

              for (const name of storeNames) {
                try {
                  tx.objectStore(name).clear();
                } catch (err) {}
              }
            });
          }
        }
      } catch (e) {}

      // Step 3: Close connection BEFORE deleting database
      dbManager.close();

      // Step 4: Delete IndexedDB database 'PuzzleDB'
      await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('PuzzleDB');
        req.onsuccess = () => {
          console.log('[ImageStore] IndexedDB PuzzleDB deleted successfully.');
          resolve();
        };
        req.onerror = () => resolve();
        req.onblocked = () => {
          console.warn('[ImageStore] IndexedDB delete blocked, closing connection...');
          dbManager.close();
          resolve();
        };
      });

      // Step 5: Clear CacheStorage
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        } catch (e) {}
      }

      // Step 6: Unregister Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
          }
        } catch (e) {}
      }

      // Step 7: Clear localStorage & sessionStorage completely
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}

      document.documentElement.setAttribute('data-theme', 'light');
      console.log('[ImageStore] 100% Brand new user fresh wipe complete!');
    } catch (err) {
      console.error('[ImageStore] Error during clearAllDatabaseData:', err);
    }
  }
}
