'use client';

import { useSelector } from 'react-redux';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorNote from '@/components/ui/ErrorNote';
import { DatePicker, NumberInput } from '@/components/forms/FormField';
import { isPartiallyCollected } from '@/lib/markCollectedForm';
import { collectedSoFar } from '@/models/invoice';
import { useToast } from '@/hooks/useToast';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';
import { useInvoiceToCollect } from './useInvoiceToCollect';
import { useMarkCollectedForm } from './useMarkCollectedForm';

function Figure({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide" style={{ color: CHROME.textMuted }}>{label}</p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{value}</p>
    </div>
  );
}

/**
 * @param {{ invoice: { id: string, invoiceNumber?: string|null }, onClose: () => void, onCollected: () => void }} props
 */
export default function MarkCollectedDialog({ invoice: row, onClose, onCollected }) {
  const tc = useTranslations('common');
  const t = useTranslations('invoices.collect');
  const format = useLocaleFormat();
  const toast = useToast();
  const { invoice, loading, error, reload } = useInvoiceToCollect(row.id);
  const form = useMarkCollectedForm(invoice, () => {
    toast.success(t('markedTitle'), t('markedBody', { name: row.invoiceNumber || t('theInvoice') }));
    onCollected();
  });

  const currency = useSelector((s) => s.ui.currency);
  const money = (value) => formatCurrency(value, currency);
  const ready = invoice != null && isPartiallyCollected(invoice);
  const close = () => {
    if (!form.saving) onClose();
  };

  let body;
  if (loading && !invoice) {
    body = <div className="py-6"><LoadingSpinner size="sm" message={t('loadingInvoice')} /></div>;
  } else if (error) {
    body = <ErrorNote error={error} onRetry={reload} compact />;
  } else if (!ready) {
    body = (
      <p className="rounded-lg px-3 py-2.5 text-sm" style={{ backgroundColor: '#f6f5f3', color: CHROME.textSecondary }}>
        {t('noLonger')}
      </p>
    );
  } else {
    const { min, max } = form.limits;
    body = (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#f6f5f3' }}>
          <Figure label={t('invoice')} value={<span dir="auto" className="font-mono text-xs">{invoice.invoiceNumber || t('pendingNumber')}</span>} />
          <Figure label={t('amount')} value={money(invoice.totalAmount)} />
          <Figure label={t('collectedSoFar')} value={money(collectedSoFar(invoice))} />
        </div>
        <NumberInput
          label={t('collectedAmount')}
          required
          value={form.values.collectedAmount}
          onChange={(e) => form.change('collectedAmount', e.target.value)}
          hint={<>{t('amountHint')}<br />{tc('amountsInUsd')}</>}
          error={form.errors.collectedAmount}
        />
        <DatePicker
          label={t('collectedDate')}
          required
          value={form.values.collectedDate}
          onChange={(e) => form.change('collectedDate', e.target.value)}
          min={min ?? undefined}
          max={max}
          hint={min ? t('dateHint', { date: format.date(min) }) : undefined}
          error={form.errors.collectedDate}
        />
        {form.errors.general && <p className="text-xs" style={{ color: STATUS.critical }}>{form.errors.general}</p>}
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={close}
      title={t('markCollected')}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={form.saving}>{t('cancel')}</Button>
          <Button variant="success" icon={CheckCircle2} loading={form.saving} disabled={!ready} onClick={form.save}>
            {t('markCollected')}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
