'use client';

import { useCallback, useMemo, useState } from 'react';

import { MIGRATION_MAX_BYTES, readSelection, selectionSignature } from '@/lib/dataMigration';

/** The picked Migrations folder: its workbook (one of the .xlsx at its top) and the files to send. */
export function useMigrationFolder() {
  const [selection, setSelection] = useState(null);
  const [workbookIndex, setWorkbookIndex] = useState(0);

  const pick = useCallback((fileList) => {
    const files = Array.from(fileList ?? []);
    setSelection(files.length ? readSelection(files) : null);
    setWorkbookIndex(0);
  }, []);

  const clear = useCallback(() => setSelection(null), []);

  const workbook = selection?.workbooks[workbookIndex] ?? null;
  const included = useMemo(() => selection?.included ?? [], [selection]);
  const signature = useMemo(() => (selection ? selectionSignature(workbook, included) : null), [selection, workbook, included]);
  const uploadBytes = (selection?.totalBytes ?? 0) + (workbook?.size ?? 0);

  return {
    selection,
    workbook,
    workbookIndex,
    setWorkbookIndex,
    included,
    signature,
    uploadBytes,
    tooBig: uploadBytes > MIGRATION_MAX_BYTES,
    pick,
    clear,
  };
}
