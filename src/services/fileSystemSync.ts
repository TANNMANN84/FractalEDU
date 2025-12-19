import { get, set } from 'idb-keyval';
import { storageService } from '@/services/storageService';

// --- Types for File System Access API ---
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  queryPermission: (options?: any) => Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission: (options?: any) => Promise<'granted' | 'denied' | 'prompt'>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
  values: () => AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write: (data: any) => Promise<void>;
  close: () => Promise<void>;
}

// --- State ---
let isSimulation = false;
let activeHandle: FileSystemDirectoryHandle | null = null; // Holds the active connection

// --- Helper: Verify Permission ---
const verifyPermission = async (handle: FileSystemHandle, readWrite: boolean): Promise<boolean> => {
  const options = { mode: readWrite ? 'readwrite' : 'read' };
  
  // Check if we already have it
  if ((await handle.queryPermission(options)) === 'granted') return true;
  
  // If not, request it (Note: This usually requires a user click if not already granted)
  if ((await handle.requestPermission(options)) === 'granted') return true;
  
  return false;
};

export const fileSystemSync = {
  
  // 1. Connect (Manual Click)
  async connectFolder(): Promise<FileSystemDirectoryHandle | { name: string }> {
    try {
        // @ts-ignore - Standard API
        if (typeof window.showDirectoryPicker === 'function') {
            // @ts-ignore
            const handle = await window.showDirectoryPicker({
              id: 'fractal-edu-sync',
              mode: 'readwrite'
            });

            // SUCCESS: Save handle to memory and database
            activeHandle = handle;
            await set('fractal_sync_handle', handle); 
            isSimulation = false;
            
            return handle;
        } else {
            throw new Error("API Not Supported");
        }
    } catch (e: any) {
        if (e.name === 'AbortError') throw e;

        if (confirm("System Restricted: Enable 'Simulation Mode' to test saving to memory?")) {
            isSimulation = true;
            return { name: "Simulated Cloud Folder", kind: "directory" } as any;
        } else {
            throw new Error("Sync not available.");
        }
    }
  },

  // 2. Restore Connection (Auto on Load)
  async restoreConnection(): Promise<boolean> {
    try {
      const handle = await get<FileSystemDirectoryHandle>('fractal_sync_handle');
      if (!handle) return false;

      // Check if we still have permission
      if (await verifyPermission(handle, true)) {
        activeHandle = handle;
        isSimulation = false;
        console.log("Cloud Connection Restored Automatically");
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to restore cloud connection:", e);
      return false;
    }
  },

  // 3. Fast Auto-Save (JSON ONLY)
  // This is safe to run every 10 seconds because it skips the heavy evidence files
  async quickSave(appData: any): Promise<boolean> {
    if (isSimulation) {
        sessionStorage.setItem('fractal_sync_sim_db', JSON.stringify(appData));
        return true;
    }

    if (!activeHandle) return false;

    try {
      const fileHandle = await activeHandle.getFileHandle('fractal_db.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(appData, null, 2));
      await writable.close();
      return true;
    } catch (e) {
      console.error("Auto-save failed:", e);
      return false;
    }
  },

  // 4. Full Sync (Manual 'Push' - Includes Evidence)
  async syncUp(dirHandle: FileSystemDirectoryHandle | { name: string } | null, appData: any): Promise<void> {
    if (isSimulation) {
        // ... (Keep your existing simulation logic) ...
        sessionStorage.setItem('fractal_sync_sim_db', JSON.stringify(appData));
        const files = await storageService.getAllFileContents();
        sessionStorage.setItem('fractal_sync_sim_files', JSON.stringify(files));
        await new Promise(r => setTimeout(r, 800));
        return;
    }

    // Use passed handle OR the active persistence handle
    const handle = (dirHandle || activeHandle) as FileSystemDirectoryHandle;
    if (!handle) throw new Error("Not connected to cloud folder");

    // 1. Write DB JSON
    const fileHandle = await handle.getFileHandle('fractal_db.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(appData, null, 2));
    await writable.close();

    // 2. Sync Evidence Files
    const evidenceDir = await handle.getDirectoryHandle('evidence', { create: true });
    const files = await storageService.getAllFileContents();
    
    for (const [id, base64Content] of Object.entries(files)) {
      try {
        // Optimisation: We could check if file exists, but overwriting is safer for integrity
        const fileHandle = await evidenceDir.getFileHandle(id, { create: true });
        const writableFile = await fileHandle.createWritable();
        
        const response = await fetch(base64Content);
        const blob = await response.blob();
        
        await writableFile.write(blob);
        await writableFile.close();
      } catch (e) {
        console.warn(`Failed to sync file ${id}`, e);
      }
    }
  },

  // 5. Sync Down (Load)
  async syncDown(passedHandle?: any): Promise<{ appData: any; files: Record<string, string> }> {
      // ... (Keep your existing syncDown logic exactly as it was) ...
      // Just ensure it uses 'passedHandle || activeHandle'
      
      // For brevity in this snippet, I assume you copy-paste your existing syncDown logic here
      // but change the first line to:
      const handle = (passedHandle || activeHandle) as FileSystemDirectoryHandle;
      
      // ... rest of your syncDown code ...
      // (If you need me to write out the full syncDown again, let me know, 
      // otherwise paste your original syncDown logic here)
      
      // --- Placeholder for your existing syncDown ---
      if (isSimulation) {
        // ... sim logic ...
        return { appData: {}, files: {} }; // dummy
      }
      
      const fileHandle = await handle.getFileHandle('fractal_db.json');
      const file = await fileHandle.getFile();
      const text = await file.text();
      // ... etc ...
      return { appData: JSON.parse(text), files: {} };
  }
};