'use client';

import { useState } from 'react';
import { Download, FileText, Paperclip, Undo2, X } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { useToast } from '@/hooks/useToast';
import { BOQ_FILE_LIMITS } from '@/constants/files';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatFileSize } from '@/utils/formatters';
import { saveBlob } from '@/utils/saveBlob';

/**
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>, changeRequestId?: number|string|null }} props
 */
export default function RequestFilesSection({ form, changeRequestId = null }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);
  const files = form.files;
  if (!files) return null;

  const kept = files.existing.filter((f) => !files.deleteIds.includes(f.id));
  const existing = { count: kept.length, size: kept.reduce((n, f) => n + (f.fileSize ?? 0), 0) };
  const problem = form.shownProblems.files;

  const download = async (file) => {
    setDownloading(file.id);
    try {
      const { blob, fileName } = await changeRequestRepository.downloadAttachment(changeRequestId, file.contentId, file.fileName);
      saveBlob(blob, fileName);
    } catch (err) {
      toast.error('Download failed', err?.message ?? 'Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <FormSection title="Files" subtitle="Supporting documents — at least one is required" icon={Paperclip}>
      {files.existing.length > 0 && (
        <ul className="mb-3 flex flex-col divide-y divide-gray-50 rounded-xl border border-gray-100">
          {files.existing.map((file) => {
            const removing = files.deleteIds.includes(file.id);
            return (
              <li key={file.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                <FileText size={14} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
                <span className={`min-w-0 flex-1 truncate ${removing ? 'line-through' : ''}`} style={{ color: removing ? CHROME.textMuted : CHROME.textPrimary }}>
                  {file.fileName}
                </span>
                <span className="shrink-0 tabular-nums" style={{ color: CHROME.textMuted }}>{formatFileSize(file.fileSize)}</span>
                {changeRequestId != null && !removing && (
                  <button
                    type="button"
                    onClick={() => download(file)}
                    disabled={downloading === file.id}
                    className="press-flat rounded p-1 hover:bg-gray-100"
                    aria-label={`Download ${file.fileName}`}
                  >
                    <Download size={13} aria-hidden="true" />
                  </button>
                )}
                {file.canRemove && (
                  <button
                    type="button"
                    onClick={() => form.toggleFileRemoval(file.id)}
                    className="press-flat rounded p-1 hover:bg-gray-100"
                    aria-label={removing ? `Keep ${file.fileName}` : `Remove ${file.fileName}`}
                    title={removing ? 'Keep it' : 'Remove it'}
                  >
                    {removing ? <Undo2 size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AttachmentUploader
        files={files.added}
        onChange={form.setAddedFiles}
        limits={BOQ_FILE_LIMITS}
        existing={existing}
        disabled={form.submitting}
        onRejected={(rejected) => rejected.forEach(({ file, reason }) => toast.error('File not added', `${file.name}: ${reason}`))}
      />
      {problem && <p data-problem className="mt-2 text-xs" style={{ color: STATUS.critical }}>{problem}</p>}
    </FormSection>
  );
}
