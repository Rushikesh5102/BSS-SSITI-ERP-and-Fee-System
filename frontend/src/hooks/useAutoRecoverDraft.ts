'use client';

import { useState, useEffect, useRef } from 'react';
import { safeStorage } from '../utils/safeStorage';

export interface DraftMetadata {
  savedAt: string;
  formId: string;
}

/**
 * Universal Auto-Save & Emergency Disconnect Recovery Hook
 * Inspired by Microsoft Word AutoRecover.
 * Automatically saves in-progress form inputs to non-volatile local storage on every keystroke,
 * captures emergency snapshots on tab close/crash, and restores in-progress data upon reconnection.
 */
export function useAutoRecoverDraft<T extends Record<string, any>>(
  formId: string,
  initialValues: T,
  isOpen: boolean = true
) {
  const storageKey = `draft_autorecover_${formId}`;
  const [formData, setFormData] = useState<T>(initialValues);
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Check for existing uncommitted draft when form/modal opens
  useEffect(() => {
    if (!isOpen) return;

    try {
      const saved = safeStorage.get<{ data: T; savedAt: string } | null>(storageKey, null);
      if (saved && saved.data) {
        // Only trigger if saved data has at least one non-empty value different from initial
        const hasContent = Object.values(saved.data).some(v => v !== '' && v !== null && v !== undefined);
        if (hasContent) {
          setHasRecoverableDraft(true);
          setDraftSavedAt(saved.savedAt);
        }
      }
    } catch {}
  }, [formId, isOpen, storageKey]);

  // Continuous background auto-save (debounced 400ms)
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const hasContent = Object.values(formData).some(v => v !== '' && v !== null && v !== undefined && v !== 0);
      if (hasContent) {
        safeStorage.set(storageKey, {
          data: formData,
          savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData, isOpen, storageKey]);

  // Emergency Snapshot on sudden power cut / browser tab closure
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleEmergencySave = () => {
      const current = formDataRef.current;
      const hasContent = Object.values(current).some(v => v !== '' && v !== null && v !== undefined && v !== 0);
      if (hasContent) {
        safeStorage.set(storageKey, {
          data: current,
          savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    };

    window.addEventListener('beforeunload', handleEmergencySave);
    window.addEventListener('pagehide', handleEmergencySave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleEmergencySave();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleEmergencySave);
      window.removeEventListener('pagehide', handleEmergencySave);
    };
  }, [storageKey]);

  // Action: Restore the saved draft
  const restoreDraft = () => {
    try {
      const saved = safeStorage.get<{ data: T; savedAt: string } | null>(storageKey, null);
      if (saved && saved.data) {
        setFormData(saved.data);
        setHasRecoverableDraft(false);
      }
    } catch {}
  };

  // Action: Discard the saved draft
  const discardDraft = () => {
    safeStorage.remove(storageKey);
    setHasRecoverableDraft(false);
    setFormData(initialValues);
  };

  // Action: Clear draft upon successful form submission
  const clearDraft = () => {
    safeStorage.remove(storageKey);
    setHasRecoverableDraft(false);
    setFormData(initialValues);
  };

  return {
    formData,
    setFormData,
    hasRecoverableDraft,
    draftSavedAt,
    restoreDraft,
    discardDraft,
    clearDraft,
  };
}

export default useAutoRecoverDraft;
