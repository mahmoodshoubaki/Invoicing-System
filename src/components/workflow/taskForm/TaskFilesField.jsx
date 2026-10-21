'use client';

import { memo, useState } from 'react';
import { Download, FileText, Info, Undo2, X } from 'lucide-react';

import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import { labelClass } from '@/components/ui/kit';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatDate, formatFileSize } from '@/utils/formatters';
import { saveBlob } from '@/utils/saveBlob';
import { toggleRemoval } from '@/lib/taskFileValue';

/**
 * An invoice's attachments, asked for by a task (2026-10-13): the files on it
 * now — each can be downloaded, or marked to be removed — and new ones to add,
 * with the same picker and limits as the invoice's own form.
 *
 * Downloading needs the invoice's id, which the invoice's own page has
 * (`context.invoiceId`); My Tasks does not, so there the files are listed only.
 * Nothing changes until a button that saves the fields is pressed.
 *
 * @param {{
 *   field: Object, value: { existing: Array, deleteIds: string[], added: Array },
 *   onChange: (next: Object | ((prev: Object) => Object)) => void,
 *   error?: string|null, disabled?: boolean, context?: { invoiceId?: string }|null,
 * }} props
 */
function TaskFilesField({ field, value, onChange, error = null, disabled = false, context = null }) {
  const toast = useToast();
  const [rejected, setRejected] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const invoiceId = context?.invoiceId ?? null;

  const download = async (file) => {
    setDownloading(file.id);
    try {
      const { blob, fileName } = await invoiceRepository.downloadAttachment(invoiceId, file.contentId, file.fileName);
      saveBlob(blob, fileName);
    } catch (err) {
      toast.error('Download failed', err?.message ?? 'Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // The picker updates its list from timers, so it is handed the latest list each time.
  const setAdded = (updater) => onChange((prev) => ({
    ...prev,
    added: typeof updater === 'function' ? updater(prev.added) : updater,
  }));

  return (
    <div>
      <p className={labelClass} style={{ color: CHROME.textSecondary }}>
        {field.label || field.name}
        {field.required && <span style={{ color: STATUS.critical }}> *</span>}
      </p>

      {value.existing.length > 0 && (
        <ul className="mb-2 flex flex-col divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
          {value.existing.map((file) => {
            const removed = value.deleteIds.includes(file.id);
            return (
              <li key={file.id} className="flex items-center gap-2 px-3 py-2">
                <FileText size={14} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs ${removed ? 'line-through' : ''}`}
                    style={{ color: removed ? CHROME.textMuted : CHROME.textPrimary }}
                    title={file.fileName}
                  >
                    {file.fileName}
                  </p>
                  <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
                    {file.fileSize != null && formatFileSize(file.fileSize)}
                    {file.uploadedOn && ` · ${formatDate(file.uploadedOn)}`}
                    {removed && ' · removed when saved'}
                  </p>
                </div>
                {invoiceId && file.contentId && (
                  <button
                    type="button"
                    onClick={() => download(file)}
                    disabled={downloading === file.id}
                    className="rounded-md p-1.5 transition-colors hover:bg-[#f1f0ee] disabled:opacity-40"
                    aria-label={`Download ${file.fileName}`}
                    title="Download"
                    style={{ color: CHROME.textMuted }}
                  >
                    <Download size={13} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange((prev) => toggleRemoval(prev, file.id))}
                  disabled={disabled}
                  className="rounded-md p-1.5 transition-colors hover:bg-[#f1f0ee] disabled:opacity-40"
                  aria-label={removed ? `Keep ${file.fileName}` : `Remove ${file.fileName}`}
                  title={removed ? 'Keep it' : 'Remove it'}
                  style={{ color: removed ? STATUS.info : CHROME.textMuted }}
                >
                  {removed ? <Undo2 size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AttachmentUploader files={value.added} onChange={setAdded} onRejected={setRejected} disabled={disabled} />

      {rejected.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {rejected.map(({ file, reason }) => (
            <li key={`${file.name}-${reason}`} className="text-[11px]" style={{ color: STATUS.critical }}>
              {file.name}: {reason}
            </li>
          ))}
        </ul>
      )}
      {!invoiceId && value.existing.length > 0 && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
          To download a file, answer this task from the invoice&rsquo;s own page.
        </p>
      )}
      {error && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{error}</p>}
    </div>
  );
}

export default memo(TaskFilesField);
