'use client';

import { motion } from 'motion/react';

import RevenueAreaChart from '@/components/charts/RevenueAreaChart';
import ErrorNote from '@/components/ui/ErrorNote';
import { revealItem } from '@/components/motion/Reveal';
import { CHROME } from '@/theme/vizPalette';
import NotAvailable from './NotAvailable';

/**
 * Revenue, invoiced and collected for the months up to the picked one.
 *
 * @param {{
 *   source: { status: string, data: Array|null, error: Error|null, reload: () => void },
 *   months: number,
 *   periodLabel: string,
 *   className?: string,
 * }} props
 */
export default function TrendCard({ source, months, periodLabel, className = '' }) {
  return (
    <motion.section variants={revealItem} className={`rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>Revenue, invoiced &amp; collected</h2>
        <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>{months} months to {periodLabel} · amounts before VAT</p>
      </header>
      {source.status === 'loading' && (
        <div className="grid h-[300px] animate-pulse place-items-center rounded-xl bg-[#f6f5f3]">
          <p className="text-xs" style={{ color: CHROME.textMuted }}>Loading the months…</p>
        </div>
      )}
      {source.status === 'forbidden' && <NotAvailable text="You don't have access to project figures." />}
      {source.status === 'error' && <ErrorNote error={source.error} onRetry={source.reload} compact />}
      {source.status === 'ready' && (
        <>
          <RevenueAreaChart data={source.data} />
          <p className="mt-3 text-[11px]" style={{ color: CHROME.textMuted }}>
            Each month&rsquo;s revenue includes the full licenses, logistics, subcontractors and training totals.
          </p>
        </>
      )}
    </motion.section>
  );
}
