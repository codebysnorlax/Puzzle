/**
 * IndexedDB — PuzzleDB database wrapper for storing user image Blobs and match history
 */
export class IndexedDBManager {
  constructor(dbName = 'PuzzleDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store 1: images (User uploaded Blobs)
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('createdAt', 'createdAt', { unique: false });
          imageStore.createIndex('name', 'name', { unique: false });
        }

        // Store 2: history (Match stats)
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('imageId', 'imageId', { unique: false });
          historyStore.createIndex('mode', 'mode', { unique: false });
          historyStore.createIndex('completedAt', 'completedAt', { unique: false });
        }

        // Store 3: savedPuzzles (Metadata)
        if (!db.objectStoreNames.contains('savedPuzzles')) {
          db.createObjectStore('savedPuzzles', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[IndexedDB] Failed to open database:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    const db = await this.open();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }
}

export const dbManager = new IndexedDBManager();
