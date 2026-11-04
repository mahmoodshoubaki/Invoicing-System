'use client';

import { useCallback, useState } from 'react';

import { toggleRemoval } from '@/lib/taskFileValue';

/**
 * @param {{ existing: Array, deleteIds: string[], added: Array }|null} initial
 * @param {() => void} onEdit
 */
export function useRequestFiles(initial, onEdit) {
  const [files, setFiles] = useState(initial);

  // The uploader updates its list from timers, so it is handed the latest list each time.
  const setAddedFiles = useCallback((updater) => {
    setFiles((prev) => ({ ...prev, added: typeof updater === 'function' ? updater(prev.added) : updater }));
  }, []);

  const toggleFileRemoval = (id) => {
    setFiles((prev) => toggleRemoval(prev, id));
    onEdit();
  };

  return { files, setAddedFiles, toggleFileRemoval };
}
