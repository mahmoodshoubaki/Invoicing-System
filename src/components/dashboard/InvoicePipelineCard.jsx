'use client';

import { motion } from 'motion/react';
import { Ban, CheckCircle2, Clock, FileText, HandCoins, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import StatusBreakdown from '@/components/charts/StatusBreakdown';
import { revealItem } from '@/components/motion/Reveal';
import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { CHROME, STATUS } from '@/theme/vizPalette';
import NotAvailable from './NotAvailable';

const ICONS = {
  [INVOICE_STATUS_ID.INVOICED]: FileText,
  [INVOICE_STATUS_ID.IN_PROGRESS]: Clock,
  [INVOICE_STATUS_ID.REJECTED]: XCircle,
  [INVOICE_STATUS_ID.COLLECTED]: CheckCircle2,
  [INVOICE_STATUS_ID.CANCELLED]: Ban,
  [INVOICE_STATUS_ID.PARTIALLY_COLLECTED]: HandCoins,
};

/**
 * @param {{ statuses: Array<{ id: number, label: string, colorHex: string }>, invoices: { status: string, data: Object|null }, money: (v: number) => string }} props
 */
export default function InvoicePipelineCard({ statuses, invoices, money }) {
  const t = useTranslations('dashboard');
  const loading = invoices.status === 'loading';
  const total = invoices.data?.total ?? 0;
  const data = (invoices.data?.byStatus ?? [])
    .filter((s) => s.count > 0)
    .map((s) => {
      const status = statuses.find((x) => x.id === s.statusId);
      return {
        name: status?.label ?? t('pipeline.unknownStatus', { id: s.statusId }),
        value: s.count,
        detail: money(s.amount),
        color: status?.colorHex || STATUS.neutral,
        icon: ICONS[s.statusId] ?? FileText,
      };
    });

  return (
    <motion.section variants={revealItem} className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]">
      <header className="mb-5">
        <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>{t('pipeline.title')}</h2>
        <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
          {loading ? t('source.loading') : t('pipeline.subtitle', { count: total })}
        </p>
      </header>
      {invoices.status === 'forbidden' && <NotAvailable text={t('pipeline.forbidden')} />}
      {invoices.status === 'error' && <NotAvailable text={t('pipeline.error')} />}
      {invoices.status === 'ready' && (data.length === 0
        ? <p className="py-8 text-center text-xs" style={{ color: CHROME.textMuted }}>{t('pipeline.empty')}</p>
        : <StatusBreakdown data={data} />)}
    </motion.section>
  );
}
