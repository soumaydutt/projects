import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

interface AutosaveOptions<T> {
  key: string;
  data: T;
  onRestore?: (data: T) => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutosave<T>({
  key,
  data,
  onRestore,
  debounceMs = 1000,
  enabled = true,
}: AutosaveOptions<T>) {
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const storageKey = `autosave_${key}`;

  // Save to localStorage
  const save = useCallback(
    (dataToSave: T) => {
      if (!enabled) return;

      const serialized = JSON.stringify(dataToSave);

      // Don't save if data hasn't changed
      if (serialized === lastSavedRef.current) return;

      try {
        const saveData = {
          data: dataToSave,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        lastSavedRef.current = serialized;
      } catch (error) {
        console.error('Failed to autosave:', error);
      }
    },
    [storageKey, enabled]
  );

  // Debounced save
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs, enabled]);

  // Check for saved data on mount
  useEffect(() => {
    if (!enabled || hasRestoredData) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { data: savedData, timestamp } = JSON.parse(saved);
        const age = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge && onRestore) {
          setHasRestoredData(true);
          toast.info('Draft restored', {
            description: 'Your unsaved changes have been restored.',
            action: {
              label: 'Discard',
              onClick: () => clearSaved(),
            },
          });
          onRestore(savedData);
        } else {
          // Clear old data
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to restore autosave:', error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, onRestore, enabled, hasRestoredData]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    localStorage.removeItem(storageKey);
    lastSavedRef.current = '';
  }, [storageKey]);

  // Check if there's saved data
  const hasSavedData = useCallback(() => {
    return localStorage.getItem(storageKey) !== null;
  }, [storageKey]);

  // Get saved timestamp
  const getSavedTimestamp = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { timestamp } = JSON.parse(saved);
        return new Date(timestamp);
      }
    } catch {
      return null;
    }
    return null;
  }, [storageKey]);

  return {
    clearSaved,
    hasSavedData,
    getSavedTimestamp,
    saveNow: () => save(data),
  };
}

// Hook for managing form drafts with explicit restore prompt
export function useFormDraft<T>(
  formId: string,
  defaultValues: T
): {
  initialValues: T;
  clearDraft: () => void;
  saveDraft: (data: T) => void;
} {
  const [initialValues, setInitialValues] = useState<T>(defaultValues);
  const storageKey = `draft_${formId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        const age = Date.now() - timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age < maxAge) {
          setInitialValues(data);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const saveDraft = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    },
    [storageKey]
  );

  return {
    initialValues,
    clearDraft,
    saveDraft,
  };
}
