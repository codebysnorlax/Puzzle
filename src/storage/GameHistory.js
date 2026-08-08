import { dbManager } from './IndexedDB.js';

/**
 * GameHistory — Stores solved puzzle statistics and history records in IndexedDB
 */
export class GameHistory {
  static async saveMatch(record) {
    const store = await dbManager.getStore('history', 'readwrite');
    const entry = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      completedAt: Date.now(),
      ...record
    };

    return new Promise((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve(entry);
      req.onerror = () => reject(req.error);
    });
  }

  static async getHistory() {
    const store = await dbManager.getStore('history', 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        results.sort((a, b) => b.completedAt - a.completedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }
}
