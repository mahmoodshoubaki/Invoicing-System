'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { useToast } from '@/hooks/useToast';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * @param {{ invoiceId: string, onClose: () => void, onAdded: () => void }} props
 */
export default function AddAttachmentsDialog({ invoiceId, onClose, onAdded }) {
  const t = useTranslations('invoices.attachments');
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
      toast.success(t('added', { count: ids.length || ready.length }));
      onAdded?.();
      onClose();
    } catch (err) {
      setError(err?.message ?? t('addFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={t('title')}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('cancel')}</Button>
          <Button onClick={save} loading={busy} disabled={ready.length === 0 || stillReading}>
            {t('addFiles', { count: ready.length })}
          </Button>
        </>
      }
    >
      <AttachmentUploader files={files} onChange={setFiles} onRejected={setRejected} disabled={busy} />
      {rejected.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5">
          {rejected.map(({ file, reason }) => (
            <li key={`${file.name}-${reason}`} className="text-[11px]" style={{ color: STATUS.critical }}>
              <bdi>{file.name}</bdi>: {reason}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs" style={{ color: STATUS.critical }}>{error}</p>}
      <p className="mt-3 text-[11px]" style={{ color: CHROME.textMuted }}>
        {t('note')}
      </p>
    </Modal>
  );
}
