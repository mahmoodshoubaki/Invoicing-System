'use client';

import { Calendar, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import InfoItem from './InfoItem';
import { collectedSoFar, hasCollection } from '@/models/invoice';
import { formatCurrency } from '@/utils/formatters';

/**
 * @param {{ invoice: Object, currency: string }} props
 */
export default function CollectedInfoItems({ invoice, currency }) {
  const t = useTranslations('invoices.collected');
  const format = useLocaleFormat();
  if (!hasCollection(invoice)) return null;

  const collected = collectedSoFar(invoice);
  const share = invoice.totalAmount > 0 ? Math.round((collected / invoice.totalAmount) * 100) : null;
  const summary = t.rich('summary', {
    collected: formatCurrency(collected, currency),
    total: formatCurrency(invoice.totalAmount, currency),
    amount: (chunks) => <span dir="ltr">{chunks}</span>,
  });

  return (
    <>
      <InfoItem
        icon={DollarSign}
        label={t('soFar')}
        value={<>{summary}{share != null && ` · ${share}%`}</>}
        valueClass="font-semibold"
      />
      <InfoItem icon={Calendar} label={t('lastDate')} value={format.date(invoice.collectedDate)} />
    </>
  );
}
