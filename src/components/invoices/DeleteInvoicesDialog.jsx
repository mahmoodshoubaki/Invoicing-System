'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * @param {{ open: boolean, invoices: Array<{ id: string, invoiceNumber?: string }>, onClose: () => void, onDeleted: (deletedIds: string[]) => void, }} props
 */
export default function DeleteInvoicesDialog({ open, invoices, onClose, onDeleted }) {
  const t = useTranslations('invoices.delete');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const count = invoices.length;
  const names = invoices.map((i) => i.invoiceNumber || t('noNumber'));

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const deleted = await invoiceRepository.deleteInvoices(invoices.map((i) => i.id));
      onDeleted(deleted);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('title', { count })}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>{t('keep', { count })}</Button>
          <Button variant="danger" icon={Trash2} onClick={confirm} loading={busy} disabled={count === 0}>
            {t('delete')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <ul className="flex flex-wrap gap-1.5">
          {names.slice(0, 12).map((name, i) => (
            <li
              key={`${name}-${i}`}
              dir="auto"
              className="rounded-md px-2 py-0.5 font-mono text-[11px]"
              style={{ backgroundColor: '#f6f5f3', color: CHROME.textPrimary }}
            >
              {name}
            </li>
          ))}
          {names.length > 12 && (
            <li className="px-1 text-[11px]" style={{ color: CHROME.textMuted }}>{t('more', { count: names.length - 12 })}</li>
          )}
        </ul>

        <p
          className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
          style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          <span>
            {t('warning', { count })}
          </span>
        </p>

        <ErrorNote error={error} compact />
      </div>
    </Modal>
  );
}
