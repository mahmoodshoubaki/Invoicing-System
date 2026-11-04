'use client';

import { motion } from 'motion/react';
import { Ban, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

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
};

/**
 * @param {{ statuses: Array<{ id: number, label: string, colorHex: string }>, invoices: { status: string, data: Object|null }, money: (v: number) => string }} props
 */
export default function InvoicePipelineCard({ statuses, invoices, money }) {
  const loading = invoices.status === 'loading';
  const total = invoices.data?.total ?? 0;
  const data = (invoices.data?.byStatus ?? [])
    .filter((s) => s.count > 0)
    .map((s) => {
      const status = statuses.find((x) => x.id === s.statusId);
      return {
        name: status?.label ?? `Status ${s.statusId}`,
        value: s.count,
        detail: money(s.amount),
        color: status?.colorHex || STATUS.neutral,
        icon: ICONS[s.statusId] ?? FileText,
      };
    });

  return (
    <motion.section variants={revealItem} className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]">
      <header className="mb-5">
        <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>Invoice pipeline</h2>
        <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
          {loading ? 'Loading…' : `${total} invoice${total === 1 ? '' : 's'} by current status · amounts before VAT`}
        </p>
      </header>
      {invoices.status === 'forbidden' && <NotAvailable text="You don't have access to invoices." />}
      {invoices.status === 'error' && <NotAvailable text="The invoices could not be loaded." />}
      {invoices.status === 'ready' && (data.length === 0
        ? <p className="py-8 text-center text-xs" style={{ color: CHROME.textMuted }}>No invoices yet.</p>
        : <StatusBreakdown data={data} />)}
    </motion.section>
  );
}
