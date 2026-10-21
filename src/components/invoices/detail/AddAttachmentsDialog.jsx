'use client';

import { useState } from 'react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * Adding files to an invoice after it was created (2026-10-11) — at any stage
 * while it is open, not once it is Collected or Cancelled (INV-013). The same
 * limits as creating one, checked by the uploader as files are picked.
 *
 * @param {{ invoiceId: string, onClose: () => void, onAdded: () => void }} props
 */
export default function AddAttachmentsDialog({ invoiceId, onClose, onAdded }) {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const ready = files.filter((f) => f.status === 'done');
  const stillReading = files.some((f) => f.status !== 'done');

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const ids = await invoiceRepository.addInvoiceAttachments(invoiceId, files);
      toast.success(`${ids.length || ready.length} file${(ids.length || ready.length) === 1 ? '' : 's'} added`);
      onAdded?.();
      onClose();
    } catch (err) {
      setError(err?.message ?? 'Could not add the files.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Add attachments"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy} disabled={ready.length === 0 || stillReading}>
            Add {ready.length > 0 ? ready.length : ''} file{ready.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <AttachmentUploader files={files} onChange={setFiles} onRejected={setRejected} disabled={busy} />
      {rejected.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5">
          {rejected.map(({ file, reason }) => (
            <li key={`${file.name}-${reason}`} className="text-[11px]" style={{ color: STATUS.critical }}>
              {file.name}: {reason}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs" style={{ color: STATUS.critical }}>{error}</p>}
      <p className="mt-3 text-[11px]" style={{ color: CHROME.textMuted }}>
        The files are added to the invoice as they are. Nothing else about it changes.
      </p>
    </Modal>
  );
}
