'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { controlClass } from '@/components/ui/kit';

/**
 * @param {{ filters: ReturnType<import('./useDashboard').useDashboardFilters> }} props
 */
export default function PeriodPicker({ filters }) {
  const t = useTranslations('dashboard.monthly');
  const locale = useLocale();
  const months = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => format.format(new Date(2000, i, 1)));
  }, [locale]);

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={t('month')}
        value={filters.month}
        onChange={(e) => filters.setPeriod({ month: Number(e.target.value), year: filters.year })}
        className={controlClass}
      >
        {months.slice(0, filters.lastMonth).map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select
        aria-label={t('year')}
        value={filters.year}
        onChange={(e) => filters.setPeriod({ month: filters.month, year: Number(e.target.value) })}
        className={controlClass}
      >
        {filters.years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
