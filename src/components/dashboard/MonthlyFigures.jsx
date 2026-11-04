'use client';

import { Activity, CalendarRange, CheckCircle2, CircleX, TrendingUp, X } from 'lucide-react';

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
  const fin = financial.data;
  const label = filters.periodLabel;

  const tiles = [
    {
      label: 'Total Revenue',
      value: fin?.revenue ?? null,
      format: money,
      icon: TrendingUp,
      accent: SERIES_ROLE.revenue,
      footnote: sourceNote(financial, `Total Revenue · ${label}`),
    },
    {
      label: 'Collected',
      value: fin?.collected ?? null,
      format: money,
      icon: CheckCircle2,
      accent: SERIES_ROLE.collected,
      footnote: sourceNote(financial, `Collected · ${label}`),
    },
    {
      label: 'Not Collected',
      value: fin?.notCollected ?? null,
      format: money,
      icon: CircleX,
      accent: SERIES_ROLE.nonCollected,
      footnote: sourceNote(financial, `Invoiced but Not Collected · ${label}`),
    },
    {
      label: 'Work in Progress',
      value: fin?.workInProgress ?? null,
      format: money,
      icon: Activity,
      accent: SERIES_ROLE.wip,
      delta: fin && fin.workInProgress < 0 ? 'More collected' : fin && fin.workInProgress > 0 ? 'Less Collected' : null,
      deltaType: fin && fin.workInProgress < 0 ? 'positive' : fin && fin.workInProgress > 0 ? 'negative' : 'neutral',
      footnote: sourceNote(financial, `WIP · ${label}`),
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
            <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>Monthly figures</h2>
            <p className="text-xs" style={{ color: CHROME.textMuted }}>{label}</p>
          </div>
        </div>
        <PeriodPicker filters={filters} />
      </header>

      {financial.status === 'error' && (
        <div className="mb-4"><ErrorNote error={financial.error} onRetry={financial.reload} /></div>
      )}

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => <KpiTile key={tile.label} {...tile} />)}
      </Reveal>

      <Reveal className="mt-4">
        <TrendCard source={trend} months={TREND_MONTHS} periodLabel={label} />
      </Reveal>
    </section>
  );
}
