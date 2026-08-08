import { dbManager } from './IndexedDB.js';

/**
 * ImageStore — Manages local-first custom & cached image Blobs in IndexedDB
 * Prevents Cloudflare bandwidth spikes by serving cached Blobs locally after first load.
 */
export class ImageStore {
  /**
   * Save a user-uploaded or cached image Blob/File into IndexedDB
   * @param {File|Blob} fileOrBlob 
   * @param {string} fileName 
   * @param {string} customId 
   * @returns {Promise<{ id: string, name: string, blob: Blob, url: string, isCustom: boolean }>}
   */
  static async saveImage(fileOrBlob, fileName = 'Custom Image', customId = null) {
    try {
      const store = await dbManager.getStore('images', 'readwrite');
      const id = customId || `custom_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const name = fileOrBlob.name || fileName;

      const record = {
        id,
        name,
        blob: fileOrBlob,
        createdAt: Date.now()
      };

      await new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
      });

      const url = URL.createObjectURL(fileOrBlob);
      console.log(`[ImageStore] Saved image to IndexedDB: ${id} (${name})`);
      return { id, name, blob: fileOrBlob, url, isCustom: true };
    } catch (err) {
      console.error('[ImageStore] Failed to save image to IndexedDB:', err);
      throw err;
    }
  }

  /**
   * Get a single cached image by ID from IndexedDB
   * @param {string} id 
   * @returns {Promise<{ id: string, name: string, blob: Blob, url: string }|null>}
   */
  static async getImage(id) {
    try {
      const store = await dbManager.getStore('images', 'readonly');
      const record = await new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
      });

      if (!record) return null;
      return {
        id: record.id,
        name: record.name,
        blob: record.blob,
        url: URL.createObjectURL(record.blob)
      };
    } catch (err) {
      console.warn(`[ImageStore] Error fetching image ${id} from IndexedDB:`, err);
      return null;
    }
  }

  /**
   * Automatically cache a remote image URL in IndexedDB to eliminate future Cloudflare bandwidth usage
   * @param {string} id Unique image ID
   * @param {string} name Display name
   * @param {string} remoteUrl Remote HTTP URL
   * @returns {Promise<{ id: string, name: string, blob: Blob, url: string, isCached: boolean }>}
   */
  static async cacheRemoteImage(id, name, remoteUrl) {
    try {
      // 1. Check if already cached in IndexedDB
      const existing = await this.getImage(id);
      if (existing) {
        console.log(`[ImageStore] Served cached image directly from IndexedDB (0 network bytes): ${id}`);
        return { ...existing, isCached: true };
      }

      // 2. Fetch remote image Blob over HTTP once
      console.log(`[ImageStore] Fetching remote image for initial local caching: ${remoteUrl}`);
      const res = await fetch(remoteUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${remoteUrl}`);
      const blob = await res.blob();

      // 3. Save Blob to IndexedDB
      const saved = await this.saveImage(blob, name, id);
      return { ...saved, isCached: true };

    } catch (err) {
      console.warn(`[ImageStore] Local caching failed for ${remoteUrl}, falling back to direct URL:`, err);
      return { id, name, url: remoteUrl, isCached: false };
    }
  }

  /**
   * Retrieve all saved custom images from IndexedDB
   * @returns {Promise<Array<{ id: string, name: string, blob: Blob, url: string, isCustom: boolean }>>}
   */
  static async getAllImages() {
    try {
      const store = await dbManager.getStore('images', 'readonly');
      const records = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
      });

      return records.map(rec => ({
        id: rec.id,
        name: rec.name,
        blob: rec.blob,
        url: URL.createObjectURL(rec.blob),
        isCustom: rec.id.startsWith('custom_img_')
      }));
    } catch (err) {
      console.warn('[ImageStore] Failed to fetch custom images from IndexedDB:', err);
      return [];
    }
  }

  /**
   * Delete a custom image by ID from IndexedDB
   * @param {string} id 
   */
  static async deleteImage(id) {
    try {
      const store = await dbManager.getStore('images', 'readwrite');
      await new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
      });
      console.log(`[ImageStore] Deleted custom image from IndexedDB: ${id}`);
    } catch (err) {
      console.error(`[ImageStore] Failed to delete image ${id} from IndexedDB:`, err);
    }
  }
}
