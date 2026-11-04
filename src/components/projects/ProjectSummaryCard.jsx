'use client';

import { useSelector } from 'react-redux';
import { AlertCircle, FolderKanban } from 'lucide-react';

import { formatCurrency, formatDate } from '@/utils';
import { colors } from '@/theme';

function Flag({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
      <AlertCircle size={11} aria-hidden="true" />
      {children}
    </span>
  );
}

function Fact({ label, value, missing = 'Not set in EPM', loading = false, failed = false }) {
  let shown;
  if (loading) shown = <span className="text-sm text-white/80">Loading…</span>;
  else if (failed) shown = <Flag>Couldn&rsquo;t load</Flag>;
  else if (value) shown = <span className="text-sm font-semibold text-white">{value}</span>;
  else shown = <Flag>{missing}</Flag>;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/85">{label}</dt>
      <dd className="mt-0.5 truncate">{shown}</dd>
    </div>
  );
}

/**
 * @param {{ projectCode: string, header: Object|null, status: 'loading'|'ready'|'error' }} props
 */
export default function ProjectSummaryCard({ projectCode, header, status }) {
  const currency = useSelector((s) => s.ui.currency);
  const loading = status === 'loading';
  const failed = status === 'error';
  const fact = { loading, failed };

  let title;
  if (loading) title = 'Loading…';
  else if (failed) title = <Flag>Couldn&rsquo;t load the project</Flag>;
  else title = header.contractName || <Flag>No contract name in EPM</Flag>;

  let value;
  if (loading) value = 'Loading…';
  else if (failed) value = <Flag>Couldn&rsquo;t load</Flag>;
  else value = header.projectValue != null ? formatCurrency(header.projectValue, currency) : <Flag>Not set in EPM</Flag>;

  return (
    <section
      aria-label="Project"
      className="mb-5 rounded-2xl px-5 py-4 text-white shadow-[0_12px_28px_-14px_rgb(248_72_94/0.55)]"
      style={{ background: colors.primary }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <FolderKanban size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-xs text-white/85">{projectCode}</p>
            {/* White named here: the global heading colour would win over the card's. */}
            <h2 className="truncate text-base font-semibold leading-snug" style={{ color: '#fff' }}>{title}</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">Project value</p>
          <p className="mt-0.5 text-lg font-semibold">{value}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/20 pt-3 sm:grid-cols-3 lg:grid-cols-5">
        <Fact label="Contract start" value={formatDate(header?.contractStartDate)} {...fact} />
        <Fact label="Contract end" value={formatDate(header?.contractFinishDate)} {...fact} />
        <Fact label="BDM" value={header?.bdm} {...fact} />
        <Fact label="BU head" value={header?.buHead} {...fact} />
        <Fact label="CRP" value={header?.crp} {...fact} />
      </dl>
    </section>
  );
}
