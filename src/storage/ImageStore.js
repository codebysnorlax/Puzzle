import { dbManager } from './IndexedDB.js';

/**
 * ImageStore — Manages user image Blobs in IndexedDB
 */
export class ImageStore {
  static async saveImage({ id, blob, name, mimeType, width, height }) {
    const store = await dbManager.getStore('images', 'readwrite');
    const record = {
      id: id || `user_img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      blob,
      name: name || 'Uploaded Image',
      mimeType: mimeType || blob.type || 'image/webp',
      width,
      height,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  static async getImage(id) {
    const store = await dbManager.getStore('images', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  static async listImages() {
    const store = await dbManager.getStore('images', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  static async deleteImage(id) {
    const store = await dbManager.getStore('images', 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
}
