'use client';

import { useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';

import { useToast } from '@/hooks/useToast';
import { CHROME } from '@/theme/vizPalette';
import { formatFileSize } from '@/utils/formatters';
import { saveBlob } from '@/utils/saveBlob';

/**
 * A record's files, each downloadable and, with `onDelete`, removable unless its `canRemove` is false.
 *
 * @param {{
 *   files: Array<{ id: string, contentId: string, fileName: string, fileSize: number, uploadedBy?: string|null }>,
 *   download: (file) => Promise<{ blob: Blob, fileName: string }>,
 *   onDelete?: ((file) => void)|null, emptyText?: string,
 * }} props
 */
export default function AttachmentList({ files, download, onDelete = null, emptyText = 'No files.' }) {
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const get = async (file) => {
    setBusy(file.id);
    try {
      const { blob, fileName } = await download(file);
      saveBlob(blob, fileName);
    } catch (err) {
      toast.error('Download failed', err?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (files.length === 0) return <p className="text-xs" style={{ color: CHROME.textMuted }}>{emptyText}</p>;

  return (
    <ul className="flex flex-col divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
      {files.map((file) => (
        <li key={file.id} className="flex items-center gap-2 px-3 py-2 text-xs">
          <FileText size={14} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate" style={{ color: CHROME.textPrimary }} title={file.fileName}>{file.fileName}</span>
          {file.uploadedBy && <span className="hidden shrink-0 sm:inline" style={{ color: CHROME.textMuted }}>{file.uploadedBy}</span>}
          <span className="shrink-0 tabular-nums" style={{ color: CHROME.textMuted }}>{formatFileSize(file.fileSize)}</span>
          <button
            type="button"
            onClick={() => get(file)}
            disabled={busy === file.id}
            className="press-flat rounded p-1 hover:bg-gray-100 disabled:opacity-50"
            aria-label={`Download ${file.fileName}`}
          >
            <Download size={13} aria-hidden="true" />
          </button>
          {onDelete && file.canRemove !== false && (
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="press-flat rounded p-1 hover:bg-gray-100"
              aria-label={`Delete ${file.fileName}`}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
