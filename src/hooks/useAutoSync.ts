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
  const previousDataJson = useRef<string>("");
  const isFirstRun = useRef(true);
  const storeRef = useRef(store);

  // Keep store ref updated for async callbacks
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // 1. Check Connection Status (Robust)
  const checkConnection = useCallback(async () => {
    const restored = await fileSystemSync.restoreConnection();
    setIsConnected(restored);

    if (restored) {
      // Safety Check: If we just restored connection and local data is empty,
      // we should warn the user if remote data exists, rather than letting auto-save overwrite it.
      const currentStore = storeRef.current;
      const isEmpty = (!currentStore.students || currentStore.students.length === 0) && 
                      (!currentStore.classes || currentStore.classes.length === 0);

      if (isEmpty) {
        try {
          const { appData } = await fileSystemSync.syncDown();
          if (appData && (appData.students?.length > 0 || appData.classes?.length > 0)) {
             alert("Cloud Sync Connected: Remote data found but local data is empty.\n\nPlease go to Settings > Cloud Sync and click 'Pull Data' to restore your data.\n\nAuto-save is paused to prevent data loss.");
             setIsConnected(false); // Force disconnect to prevent auto-save loop
          }
        } catch (e) {
          // Remote file likely doesn't exist, which is fine.
        }
      }
    }
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

    // Prepare data (exclude UI state, just save data)
    const dataToSave = {
      teacherProfile: store.teacherProfile,
      students: store.students,
      classes: store.classes,
      exams: store.exams,
      results: store.results,
      rapidTests: store.rapidTests,
      rapidResults: store.rapidResults,
      monitoringDocs: store.monitoringDocs,
      schoolStructure: store.schoolStructure,
      daybookEntries: store.daybookEntries,
    };

    const currentJson = JSON.stringify(dataToSave);

    // Prevent saving if data hasn't changed since last save
    if (currentJson === previousDataJson.current) return;

    // Prevent saving empty data if this is the first run after load (Sync Loop Protection)
    // This handles the "Refresh -> Connect -> AutoSave Empty" bug.
    const isEmpty = (!store.students || store.students.length === 0) && (!store.classes || store.classes.length === 0);
    if (isFirstRun.current && isEmpty) {
        isFirstRun.current = false;
        previousDataJson.current = currentJson;
        console.log("☁️ Initial empty state detected - skipping auto-save to protect remote data.");
        return;
    }

    previousDataJson.current = currentJson;
    isFirstRun.current = false;

    console.log("☁️ Syncing...");

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
  }, [
    isConnected, 
    store.teacherProfile,
    store.students, 
    store.classes, 
    store.exams, 
    store.results,
    store.rapidTests,
    store.rapidResults,
    store.monitoringDocs,
    store.schoolStructure,
    store.daybookEntries
  ]);

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