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

/** On-Call Catalog — Extra 14 puzzles fetched ONLY on demand when user clicks "Call More Puzzles" */
const ON_CALL_CATALOG = Array.from({ length: 14 }, (_, i) => ({
  id: `on_call_${i + 1}`,
  name: `On-Call Puzzle ${i + 1}`,
  url: `./assets/onCall/puzzle_on_call${i + 1}.webp`,
  isOnCall: true
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
  static getOnCallCatalog() {
    return ON_CALL_CATALOG;
  }

  /**
   * Fetch and cache On-Call puzzles on-demand when user clicks "Call More Puzzles".
   * STRICT DB-FIRST POLICY:
   * 1. Check IndexedDB first. If exists in DB, load directly from DB (0 network requests).
   * 2. If NOT in DB, fetch from CDN (./assets/onCall/puzzle_on_callX.webp) and store in IndexedDB.
   */
  static async fetchAndCacheOnCallPuzzles(onProgress = null) {
    const results = [];
    const total = ON_CALL_CATALOG.length;

    for (let i = 0; i < total; i++) {
      const item = ON_CALL_CATALOG[i];
      try {
        // 1. ALWAYS check IndexedDB FIRST
        const existing = await this.getImage(item.id);
        if (existing && existing.blob && existing.blob.size > 0) {
          results.push({ ...existing, isCustom: false, isOnCall: true });
          if (onProgress) onProgress(i + 1, total);
          continue;
        }

        // 2. If DB has no record, fetch from CDN URL
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let blob = await res.blob();

        if (!blob.type || !blob.type.startsWith('image/')) {
          blob = blob.slice(0, blob.size, 'image/webp');
        }

        // 3. Store in IndexedDB
        const store = await dbManager.getStore('images', 'readwrite');
        await new Promise((resolve, reject) => {
          const req = store.put({ id: item.id, name: item.name, blob, createdAt: Date.now() });
          req.onsuccess = () => resolve();
          req.onerror = (e) => reject(e.target.error);
        });

        const cached = await this.getImage(item.id);
        if (cached) {
          results.push({ ...cached, isCustom: false, isOnCall: true });
        } else {
          results.push({ id: item.id, name: item.name, url: item.url, blob, isCustom: false, isOnCall: true });
        }
      } catch (err) {
        console.warn(`[ImageStore] Failed to fetch/cache on-call puzzle ${item.id}:`, err);
        results.push({ id: item.id, name: item.name, url: item.url, blob: null, isCustom: false, isOnCall: true });
      }

      if (onProgress) onProgress(i + 1, total);
    }

    localStorage.setItem('on_call_puzzles_called', 'true');
    return results;
  }

  /**
   * Get all On-Call puzzles that are ALREADY stored in IndexedDB.
   */
  static async getOnCallPuzzlesFromDB() {
    const results = [];
    for (const item of ON_CALL_CATALOG) {
      const cached = await this.getImage(item.id);
      if (cached && cached.blob && cached.blob.size > 0) {
        results.push({ ...cached, isCustom: false, isOnCall: true });
      }
    }
    return results;
  }

  /**
   * Fetch and cache a SINGLE on-call puzzle item. DB-first.
   * Used for one-by-one progressive loading with skeleton shimmer.
   * @param {{ id: string, name: string, url: string }} item
   * @returns {Promise<object|null>}
   */
  static async fetchAndCacheSingleOnCall(item) {
    // 1. Check IndexedDB first
    const existing = await this.getImage(item.id);
    if (existing && existing.blob && existing.blob.size > 0) {
      return { ...existing, isCustom: false, isOnCall: true };
    }

    // 2. Fetch from CDN
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let blob = await res.blob();

    if (!blob.type || !blob.type.startsWith('image/')) {
      blob = blob.slice(0, blob.size, 'image/webp');
    }

    // 3. Store in IndexedDB
    const store = await dbManager.getStore('images', 'readwrite');
    await new Promise((resolve, reject) => {
      const req = store.put({ id: item.id, name: item.name, blob, createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });

    const cached = await this.getImage(item.id);
    if (cached) return { ...cached, isCustom: false, isOnCall: true };
    return { id: item.id, name: item.name, url: item.url, blob, isCustom: false, isOnCall: true };
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
          blob = blob.slice(0, blob.size, 'image/webp');
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
