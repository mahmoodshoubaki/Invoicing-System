'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RotateCw, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { DatePicker, Select, Textarea } from '@/components/forms/FormField';
import { CLAIM_NOTES_MAX } from '@/constants/financialClaims';
import { localName } from '@/utils/localName';
import { selectLanguage } from '@/store/slices/uiSlice';
import { STATUS } from '@/theme/vizPalette';
import { useClaimActionForm } from './useClaimActionForm';
import { useClaimStages } from './useClaimStages';

/**
 * @param {{ invoiceId: string, entry: object|null, onClose: () => void, onSaved: (result: { gone?: boolean, message?: string }) => void, onConflict: () => void }} props
 */
export default function ClaimActionDialog({ invoiceId, entry, onClose, onSaved, onConflict }) {
  const language = useSelector(selectLanguage);
  const t = useTranslations('claims.dialog');
  const { stages, status, retry } = useClaimStages();
  const form = useClaimActionForm(invoiceId, entry, onSaved, onConflict);

  const options = useMemo(() => {
    const list = stages.map((s) => ({ value: String(s.key), label: localName(s.nameEn, s.nameAr, language) }));
    if (entry?.stageKey != null && !stages.some((s) => s.key === entry.stageKey)) {
      list.push({ value: String(entry.stageKey), label: localName(entry.stageNameEn, entry.stageNameAr, language) });
    }
    return list;
  }, [stages, entry, language]);

  const notesLength = form.values.notes.length;

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? t('editEntry', { number: entry.rowNumber ?? '' }) : t('newEntry')}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={form.saving}>{t('cancel')}</Button>
          <Button icon={Save} loading={form.saving} onClick={form.save}>{entry ? t('save') : t('addEntry')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label={t('stage')}
          required
          value={form.values.stageKey}
          onChange={(e) => form.change('stageKey', e.target.value)}
          options={options}
          placeholder={status === 'loading' ? t('loadingStages') : t('chooseStage')}
          disabled={status === 'loading'}
          error={form.errors.stageKey}
        />
        {status === 'failed' && (
          <div className="-mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2">
            <p className="text-xs text-red-700">{t('stagesFailed')}</p>
            <Button variant="ghost" size="xs" icon={RotateCw} onClick={retry}>{t('tryAgain')}</Button>
          </div>
        )}
        <DatePicker
          label={t('date')}
          value={form.values.actionDate}
          onChange={(e) => form.change('actionDate', e.target.value)}
          error={form.errors.actionDate}
        />
        <Textarea
          label={t('notes')}
          rows={4}
          dir="auto"
          maxLength={CLAIM_NOTES_MAX}
          value={form.values.notes}
          onChange={(e) => form.change('notes', e.target.value)}
          hint={`${notesLength}/${CLAIM_NOTES_MAX}`}
          error={form.errors.notes}
        />
        {form.errors.general && <p className="text-xs" style={{ color: STATUS.critical }}>{form.errors.general}</p>}
      </div>
    </Modal>
  );
}
