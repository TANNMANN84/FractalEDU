import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import { fileSystemSync } from '@/services/fileSystemSync';

export const useAutoSync = () => {
  const store = useAppStore(); // Watch the whole store
  const [isConnected, setIsConnected] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout>();

  // 1. Attempt to restore connection on App Launch
  useEffect(() => {
    const init = async () => {
      const restored = await fileSystemSync.restoreConnection();
      setIsConnected(restored);
    };
    init();
  }, []);

  // 2. Watch for changes
  useEffect(() => {
    if (!isConnected) return;

    // Debounce: Wait 5 seconds after the last change
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      console.log("☁️ Auto-syncing...");
      
      // Prepare data (exclude UI state, just save data)
      const dataToSave = {
        students: store.students,
        classes: store.classes,
        assessments: store.exams, // Adjust based on your store keys
        // Add other keys you want to save
      };

      const success = await fileSystemSync.quickSave(dataToSave);
      if (success) console.log("✅ Auto-sync complete");
      
    }, 5000); // 5 Seconds delay

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [store.students, store.classes, store.exams, isConnected]); // Triggers

  return isConnected;
};