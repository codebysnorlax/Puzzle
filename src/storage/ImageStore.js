import { dbManager } from './IndexedDB.js';

/**
 * ImageStore — Manages local-first custom uploaded image Blobs in IndexedDB
 */
export class ImageStore {
  /**
   * Save a user-uploaded image Blob/File into IndexedDB
   * @param {File|Blob} fileOrBlob 
   * @param {string} fileName 
   * @returns {Promise<{ id: string, name: string, blob: Blob, url: string, isCustom: boolean }>}
   */
  static async saveImage(fileOrBlob, fileName = 'Custom Image') {
    try {
      const store = await dbManager.getStore('images', 'readwrite');
      const id = `custom_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
      console.log(`[ImageStore] Saved custom image to IndexedDB: ${id} (${name})`);
      return { id, name, blob: fileOrBlob, url, isCustom: true };
    } catch (err) {
      console.error('[ImageStore] Failed to save image to IndexedDB:', err);
      throw err;
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
        isCustom: true
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
