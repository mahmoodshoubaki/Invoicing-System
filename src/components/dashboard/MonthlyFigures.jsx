'use client';

import { Activity, CalendarRange, CheckCircle2, CircleX, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import ErrorNote from '@/components/ui/ErrorNote';
import Reveal from '@/components/motion/Reveal';
import { CHROME, SERIES_ROLE } from '@/theme/vizPalette';
import KpiTile from './KpiTile';
import PeriodPicker from './PeriodPicker';
import TrendCard from './TrendCard';
import { sourceNote } from './sourceNote';
import { TREND_MONTHS } from './useDashboard';

/**
 * @param {{ filters: ReturnType<import('./useDashboard').useDashboardFilters>, financial: { status: string, data: Object|null, error: Error|null, reload: () => void }, trend: { status: string, data: Array|null, error: Error|null, reload: () => void }, money: (v: number) => string, }} props
 */
export default function MonthlyFigures({ filters, financial, trend, money }) {
  const t = useTranslations('dashboard');
  const fin = financial.data;
  const label = filters.periodLabel;

  const tiles = [
    {
      id: 'revenue',
      label: t('monthly.totalRevenue'),
      value: fin?.revenue ?? null,
      format: money,
      icon: TrendingUp,
      accent: SERIES_ROLE.revenue,
      footnote: sourceNote(t, financial, t('monthly.totalRevenueNote', { period: label })),
    },
    {
      id: 'collected',
      label: t('monthly.collected'),
      value: fin?.collected ?? null,
      format: money,
      icon: CheckCircle2,
      accent: SERIES_ROLE.collected,
      footnote: sourceNote(t, financial, t('monthly.collectedNote', { period: label })),
    },
    {
      id: 'notCollected',
      label: t('monthly.notCollected'),
      value: fin?.notCollected ?? null,
      format: money,
      icon: CircleX,
      accent: SERIES_ROLE.nonCollected,
      footnote: sourceNote(t, financial, t('monthly.notCollectedNote', { period: label })),
    },
    {
      id: 'wip',
      label: t('monthly.wip'),
      value: fin?.workInProgress ?? null,
      format: money,
      icon: Activity,
      accent: SERIES_ROLE.wip,
      delta: fin && fin.workInProgress < 0 ? t('monthly.moreCollected') : fin && fin.workInProgress > 0 ? t('monthly.lessCollected') : null,
      deltaType: fin && fin.workInProgress < 0 ? 'positive' : fin && fin.workInProgress > 0 ? 'negative' : 'neutral',
      footnote: sourceNote(t, financial, t('monthly.wipNote', { period: label })),
    },
  ];

  return (
    <section className="rounded-3xl border border-[#e9e7e5] bg-[#faf9f8] p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-[var(--shadow-card)]">
            <CalendarRange size={15} style={{ color: CHROME.textSecondary }} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>{t('monthly.title')}</h2>
            <p className="text-xs" style={{ color: CHROME.textMuted }}>{label}</p>
          </div>
        </div>
        <PeriodPicker filters={filters} />
      </header>

      {financial.status === 'error' && (
        <div className="mb-4"><ErrorNote error={financial.error} onRetry={financial.reload} /></div>
      )}

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ id, ...tile }) => <KpiTile key={id} {...tile} />)}
      </Reveal>

      <Reveal className="mt-4">
        <TrendCard source={trend} months={TREND_MONTHS} periodLabel={label} />
      </Reveal>
    </section>
  );
}
