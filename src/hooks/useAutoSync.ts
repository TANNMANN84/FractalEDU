import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import { fileSystemSync } from '@/services/fileSystemSync';

export const useAutoSync = () => {
  const store = useAppStore(); // Watch the whole store
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout>();

  // 1. Check Connection Status (Robust)
  const checkConnection = useCallback(async () => {
    const restored = await fileSystemSync.restoreConnection();
    setIsConnected(restored);
  }, []);

  // 2. Lifecycle Checks: Mount, Focus, Navigation
  useEffect(() => {
    checkConnection();
    
    const onFocus = () => checkConnection();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkConnection, location.pathname]);

  // Helper: Perform Save
  const saveNow = useCallback(async () => {
    if (!isConnected) return;

    console.log("☁️ Syncing...");

    // Prepare data (exclude UI state, just save data)
    const dataToSave = {
      students: store.students,
      classes: store.classes,
      assessments: store.exams, // Adjust based on your store keys
    };

    try {
      const success = await fileSystemSync.quickSave(dataToSave);
      if (success) {
        console.log("✅ Sync complete");
        setHasUnsavedChanges(false);
        setIsConnected(true); // Re-affirm connection
      } else {
        console.warn("⚠️ Sync failed - likely disconnected");
        setIsConnected(false); // Update state to disconnected
      }
    } catch (error) {
      console.error("Sync error:", error);
      setIsConnected(false);
    }
  }, [isConnected, store.students, store.classes, store.exams]);

  // 2. Watch for changes
  useEffect(() => {
    if (!isConnected) return;

    setHasUnsavedChanges(true);

    // Debounce: Wait 5 seconds after the last change
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      console.log("☁️ Auto-syncing...");
      await saveNow();
    }, 5000); // 5 Seconds delay

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [saveNow, isConnected]); // Triggers

  const reconnect = async () => {
    let success = false;
    
    // Force the directory picker to ensure a fresh, valid connection.
    // @ts-ignore
    if (typeof (fileSystemSync as any).selectDirectory === 'function') {
       // @ts-ignore
       success = await (fileSystemSync as any).selectDirectory();
    } else {
       success = await fileSystemSync.restoreConnection();
    }
    
    setIsConnected(success);
    if (success && hasUnsavedChanges) {
        saveNow();
    }
  };

  return { isConnected, hasUnsavedChanges, saveNow, reconnect };
};