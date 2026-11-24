'use client';

import { useState } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import AttachmentList from '@/components/common/AttachmentList';
import AttachmentUploader from '@/components/invoices/AttachmentUploader';
import { boqRepository } from '@/repositories/boqRepository';
import { useToast } from '@/hooks/useToast';
import { BOQ_FILE_LIMITS, FILE_NOT_FOUND } from '@/constants/files';
import { CHROME } from '@/theme/vizPalette';

const NONE = [];
const firstMessage = (err) => Object.values(err?.errors ?? {}).flat().filter(Boolean)[0] ?? err?.message;

/**
 * @param {{ boq: { id: string, attachments: Array }, canUpdate: boolean, onChanged: () => void }} props
 */
export default function BoqFilesPanel({ boq, canUpdate, onChanged }) {
  const t = useTranslations('boq.files');
  const tf = useTranslations('files');
  const toast = useToast();
  const [added, setAdded] = useState(NONE);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const files = boq.attachments ?? NONE;
  const ready = added.length > 0 && added.every((f) => f.status === 'done');
  const existing = { count: files.length, size: files.reduce((n, f) => n + (f.fileSize ?? 0), 0) };

  const upload = async () => {
    setUploading(true);
    try {
      const ids = await boqRepository.addBoqAttachments(boq.id, added);
      toast.success(t('added', { count: ids.length || added.length }));
      setAdded(NONE);
      onChanged();
    } catch (err) {
      toast.error(t('notAdded'), firstMessage(err) ?? tf('pleaseTryAgain'));
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await boqRepository.deleteBoqAttachment(boq.id, deleting.id);
      toast.success(t('deleted'), deleting.fileName);
    } catch (err) {
      toast.error(err?.code === FILE_NOT_FOUND ? t('gone') : t('deleteFailed'), err?.message ?? undefined);
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
      onChanged();
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
        <Paperclip size={15} style={{ color: CHROME.textMuted }} aria-hidden="true" />
        {t('title')}
        <span className="font-normal" style={{ color: CHROME.textMuted }}>({files.length})</span>
      </p>

      <AttachmentList
        files={files}
        download={(file) => boqRepository.downloadBoqAttachment(boq.id, file.contentId, file.fileName)}
        onDelete={canUpdate ? setDeleting : null}
        emptyText={t('empty')}
      />

      {canUpdate && (
        <div className="mt-4">
          <AttachmentUploader
            files={added}
            onChange={setAdded}
            limits={BOQ_FILE_LIMITS}
            existing={existing}
            disabled={uploading}
            onRejected={(rejected) => rejected.forEach(({ file, reason }) => toast.error(t('fileNotAdded'), `${file.name}: ${reason}`))}
          />
          {added.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" icon={Upload} loading={uploading} disabled={!ready} onClick={upload}>
                {t('upload', { count: added.length })}
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title={t('deleteTitle')}
        message={deleting ? t('deleteMessage', { name: deleting.fileName }) : ''}
        confirmLabel={t('deleteConfirm')}
      />
    </section>
  );
}
