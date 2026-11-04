'use client';

import { Filter } from 'lucide-react';

/**
 * The project status every dashboard figure keeps to, styled for the dark header.
 *
 * @param {{ filters: ReturnType<import('./useDashboard').useDashboardFilters> }} props
 */
export default function ProjectStatusFilter({ filters }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
        <Filter size={11} aria-hidden="true" />
        Project status
      </span>
      <select
        aria-label="Project status"
        value={filters.projectStatus}
        onChange={(e) => filters.setProjectStatus(e.target.value)}
        className="min-w-52 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <option value="" className="text-[#17161c]">Every project status</option>
        {filters.statuses.map((s) => <option key={s} value={s} className="text-[#17161c]">{s}</option>)}
      </select>
      <span className="text-[11px] text-white/35">Applies to the whole page</span>
    </label>
  );
}
