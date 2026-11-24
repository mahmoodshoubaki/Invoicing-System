'use client';

import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useProjectStatusLabel } from '@/hooks/useProjectStatusLabel';

/**
 * @param {{ filters: ReturnType<import('./useDashboard').useDashboardFilters> }} props
 */
export default function ProjectStatusFilter({ filters }) {
  const t = useTranslations('dashboard.statusFilter');
  const statusLabel = useProjectStatusLabel();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
        <Filter size={11} aria-hidden="true" />
        {t('label')}
      </span>
      <select
        aria-label={t('label')}
        value={filters.projectStatus}
        onChange={(e) => filters.setProjectStatus(e.target.value)}
        className="min-w-52 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <option value="" className="text-[#17161c]">{t('all')}</option>
        {filters.statuses.map((s) => <option key={s} value={s} className="text-[#17161c]">{statusLabel(s)}</option>)}
      </select>
      <span className="text-[11px] text-white/35">{t('hint')}</span>
    </label>
  );
}
