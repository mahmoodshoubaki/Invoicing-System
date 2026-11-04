'use client';

import { controlClass } from '@/components/ui/kit';

const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString('en-GB', { month: 'long' }));

/**
 * @param {{ filters: ReturnType<import('./useDashboard').useDashboardFilters> }} props
 */
export default function PeriodPicker({ filters }) {
  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Month"
        value={filters.month}
        onChange={(e) => filters.setPeriod({ month: Number(e.target.value), year: filters.year })}
        className={controlClass}
      >
        {MONTHS.slice(0, filters.lastMonth).map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select
        aria-label="Year"
        value={filters.year}
        onChange={(e) => filters.setPeriod({ month: filters.month, year: Number(e.target.value) })}
        className={controlClass}
      >
        {filters.years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
