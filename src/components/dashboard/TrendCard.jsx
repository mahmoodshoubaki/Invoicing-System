'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';

import RevenueAreaChart from '@/components/charts/RevenueAreaChart';
import ErrorNote from '@/components/ui/ErrorNote';
import { revealItem } from '@/components/motion/Reveal';
import { monthLabel } from '@/models/dashboard';
import { CHROME } from '@/theme/vizPalette';
import NotAvailable from './NotAvailable';

/**
 * @param {{ source: { status: string, data: Array|null, error: Error|null, reload: () => void }, months: number, periodLabel: string, className?: string, }} props
 */
export default function TrendCard({ source, months, periodLabel, className = '' }) {
  const t = useTranslations('dashboard.trend');
  const locale = useLocale();
  const data = useMemo(
    () => (source.data ?? []).map((row) => ({ ...row, month: monthLabel(row.key, locale) })),
    [source.data, locale]
  );

  return (
    <motion.section variants={revealItem} className={`rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>{t('title')}</h2>
        <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>{t('subtitle', { months, period: periodLabel })}</p>
      </header>
      {source.status === 'loading' && (
        <div className="grid h-[300px] animate-pulse place-items-center rounded-xl bg-[#f6f5f3]">
          <p className="text-xs" style={{ color: CHROME.textMuted }}>{t('loading')}</p>
        </div>
      )}
      {source.status === 'forbidden' && <NotAvailable text={t('forbidden')} />}
      {source.status === 'error' && <ErrorNote error={source.error} onRetry={source.reload} compact />}
      {source.status === 'ready' && (
        <>
          <RevenueAreaChart data={data} />
          <p className="mt-3 text-[11px]" style={{ color: CHROME.textMuted }}>{t('note')}</p>
        </>
      )}
    </motion.section>
  );
}
