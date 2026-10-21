'use client';

import { useSelector } from 'react-redux';
import { AlertCircle, FolderKanban } from 'lucide-react';

import { contractWindow, hasProjectValue, projectValueTotal } from '@/lib/changeRequest/projectDraft';
import { formatCurrency, formatDate } from '@/utils';
import { useProjectTeam } from './useProjectTeam';
import { colors } from '@/theme';

/**
 * Brand red, a touch see-through — its darker end, so white text on it stays
 * readable (#d9304a is the theme's primary-dark).
 */
const CARD_BACKGROUND = 'linear-gradient(120deg, rgb(217 48 74 / 0.95) 0%, rgb(186 33 57 / 0.93) 100%)';

/** A value EPM does not have, or that could not be read — said, never left blank. */
function Flag({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
      <AlertCircle size={11} aria-hidden="true" />
      {children}
    </span>
  );
}

/** One fact: its label, and its value or why there is none. */
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
 * The project a page is about, at a glance (2026-10-21): its code and
 * contract name, its contract dates and value, and its BDM, BU head and CRP.
 *
 * The dates and the value are worked out from the EPM sub-projects the way a
 * change request is checked — the main project's dates, or else the earliest
 * start to the latest finish; the value is all of them added up. The people
 * need one more call (GetProjectDetails), made here. Anything EPM does not
 * have is flagged rather than left blank.
 *
 * @param {{
 *   projectCode: string, contractName: string|null,
 *   subProjects: Array,  subProjectOriginals'
 *   loading?: boolean,   the page's project data still loading
 * }} props
 */
export default function ProjectSummaryCard({ projectCode, contractName, subProjects, loading = false }) {
  const currency = useSelector((s) => s.ui.currency);
  const team = useProjectTeam(projectCode);
  const dates = contractWindow(subProjects);
  const several = subProjects.length > 1;

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
            <h2 className="truncate text-base font-semibold leading-snug" style={{ color: '#fff' }}>
              {contractName || (loading ? 'Loading…' : <Flag>No contract name in EPM</Flag>)}
            </h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
            Project value{several ? ` · ${subProjects.length} sub-projects` : ''}
          </p>
          <p className="mt-0.5 text-lg font-semibold">
            {loading ? 'Loading…' : hasProjectValue(subProjects)
              ? formatCurrency(projectValueTotal(subProjects), currency)
              : <Flag>Not set in EPM</Flag>}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/20 pt-3 sm:grid-cols-3 lg:grid-cols-5">
        <Fact label="Contract start" value={formatDate(dates.start)} loading={loading} />
        <Fact label="Contract end" value={formatDate(dates.end)} loading={loading} />
        <Fact label="BDM" value={team.bdm} loading={team.status === 'loading'} failed={team.status === 'error'} />
        <Fact label="BU head" value={team.buHead} loading={team.status === 'loading'} failed={team.status === 'error'} />
        <Fact label="CRP" value={team.crp} loading={team.status === 'loading'} failed={team.status === 'error'} />
      </dl>
    </section>
  );
}
