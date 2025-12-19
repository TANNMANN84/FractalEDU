import { FileUpload } from '@/types';

const DB_NAME = 'FractalEduFiles';
const STORE_NAME = 'files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
    return dbPromise;
};

const getFileStore = (db: IDBDatabase, mode: IDBTransactionMode) => {
    const tx = db.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
}

export const storageService = {
  // --- IndexedDB File Storage ---
  initDB,

  saveFileContent: async (id: string, content: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const store = getFileStore(db, 'readwrite');
        const request = store.put(content, id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },

  getFileContent: async (id: string): Promise<string | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const store = getFileStore(db, 'readonly');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },

  getAllFileContents: async (): Promise<{ [id: string]: string }> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const store = getFileStore(db, 'readonly');
        const keyRequest = store.getAllKeys();
        keyRequest.onsuccess = () => {
            const keys = keyRequest.result as string[];
            const contentRequest = store.getAll();
            contentRequest.onsuccess = () => {
                const values = contentRequest.result;
                const files: { [id: string]: string } = {};
                keys.forEach((key, index) => {
                    files[key] = values[index];
                });
                resolve(files);
            };
             contentRequest.onerror = () => reject(contentRequest.error);
        };
        keyRequest.onerror = () => reject(keyRequest.error);
    });
  },
  
  clearFileContent: async (): Promise<void> => {
      const db = await initDB();
      return new Promise((resolve, reject) => {
          const store = getFileStore(db, 'readwrite');
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  },

  deleteFiles: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        ids.forEach(id => store.delete(id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },
  
  triggerDownload: async (file: FileUpload): Promise<void> => {
    if (!file || !file.id) return;
    try {
        const content = await storageService.getFileContent(file.id);
        if (content) {
            const link = document.createElement("a");
            link.href = content;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(`Could not find data for file: ${file.name}`);
        }
    } catch (error) {
        console.error("Failed to download file", error);
        alert("An error occurred while trying to download the file.");
    }
  }
};