'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight, History, Search } from 'lucide-react';

import Pager from '@/components/ui/Pager';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { relativeTime } from '@/utils/relativeTime';
import { ROUTES } from '@/constants/routes';
import { usePermission } from '@/hooks/usePermission';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

const PAGE_SIZE = 25;

/**
 * Actions get a quiet tone each so a column of them can be scanned by shape:
 * additions green, removals red, switches amber, everything else slate.
 */
const ACTION_TONE = {
  Created: STATUS.good,
  Approved: STATUS.good,
  Published: STATUS.good,
  Enabled: STATUS.good,
  'Switched on': STATUS.good,
  Deleted: STATUS.critical,
  'Stood down': STATUS.warning,
  Disabled: STATUS.warning,
  'Switched off': STATUS.warning,
};

const EMPTY = { items: [], total: 0 };

/** One change: the summary on a line, the before → after underneath on demand. */
const ChangeRow = memo(function ChangeRow({ change, now, canTrace, traceHref }) {
  const [open, setOpen] = useState(false);
  const tone = ACTION_TONE[change.action] ?? STATUS.info;
  const hasFields = change.fields.length > 0;

  return (
    <li className="border-b border-[#f1f0ee] last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={!hasFields}
          aria-expanded={open}
          aria-label={open ? 'Hide what changed' : 'Show what changed'}
          className="mt-0.5 rounded p-0.5 transition-colors hover:bg-[#f1f0ee] disabled:invisible"
          style={{ color: CHROME.textMuted }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: CHROME.textPrimary }}>
            <span
              className="rounded-full px-1.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: withAlpha(tone, 0.12), color: CHROME.textPrimary }}
            >
              {change.action}
            </span>
            <span className="font-medium">{change.itemName || '—'}</span>
            <span className="text-[11px]" style={{ color: CHROME.textMuted }}>{change.area}</span>
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
            {change.changedByName ?? 'Someone'} {change.summary}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }} title={formatDateTime(change.changedOn)}>
            {relativeTime(change.changedOn, now)}
          </p>
          {change.correlationId && canTrace && (
            <Link
              href={traceHref(change.correlationId)}
              className="text-[11px] underline-offset-2 hover:underline"
              style={{ color: STATUS.info }}
              title={`Tracking number ${change.correlationId}`}
            >
              What else it did
            </Link>
          )}
        </div>
      </div>

      {open && hasFields && (
        <div className="px-4 pb-3 pl-11">
          <table className="w-full text-[11px]">
            <tbody>
              {change.fields.map((f) => (
                <tr key={f.field} className="align-top">
                  <td className="w-40 py-1 pr-3 font-mono" style={{ color: CHROME.textMuted }}>{f.field}</td>
                  <td className="py-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <code
                        className="rounded px-1.5 py-0.5 font-mono"
                        style={{ backgroundColor: withAlpha(STATUS.critical, 0.07), color: CHROME.textSecondary }}
                      >
                        {f.before ?? '—'}
                      </code>
                      <ArrowRight size={11} style={{ color: CHROME.textMuted }} aria-hidden="true" />
                      <code
                        className="rounded px-1.5 py-0.5 font-mono"
                        style={{ backgroundColor: withAlpha(STATUS.good, 0.08), color: CHROME.textPrimary }}
                      >
                        {f.after ?? '—'}
                      </code>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
});

/**
 * Who changed what, newest first — the same shape in Workflow and in
 * Notifications, so one view serves both and they read alike.
 *
 * @param {{
 *   load: (filters: Object) => Promise<{ items: Array, total: number }>,
 *   areas: string[],
 *   initialCorrelationId?: string,
 * }} props
 */
function ConfigChangesView({ load, areas, initialCorrelationId = '' }) {
  const traceHref = ROUTES.MONITORING_TRACE;
  const { can } = usePermission();
  const canTrace = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  const [filters, setFilters] = useState({ area: '', fromDate: '', toDate: '', correlationId: initialCorrelationId });
  const [draftCorrelation, setDraftCorrelation] = useState(initialCorrelationId);
  const [skip, setSkip] = useState(0);
  // Rows a page, as the reader chooses (2026-10-21) — PAGE_SIZE to start with.
  const [take, setTake] = useState(PAGE_SIZE);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const requestRef = useRef(0);

  const fetchPage = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await load({
        area: filters.area || null,
        fromDate: filters.fromDate || null,
        toDate: filters.toDate || null,
        correlationId: filters.correlationId.trim() || null,
        skip,
        take,
      });
      if (request !== requestRef.current) return;
      setData(result);
      setNow(Date.now());
      setLoaded(true);
    } catch (err) {
      if (request === requestRef.current) setError(err);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [filters, load, skip, take]);

  useLoadOnChange(fetchPage);

  const setFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setSkip(0);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#f1f0ee] px-4 py-3">
        <select
          value={filters.area}
          onChange={(e) => setFilter({ area: e.target.value })}
          aria-label="Area"
          className={controlClass}
        >
          <option value="">Every area</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          type="date"
          value={filters.fromDate}
          max={filters.toDate || undefined}
          onChange={(e) => setFilter({ fromDate: e.target.value })}
          aria-label="From date"
          className={controlClass}
        />
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>to</span>
        <input
          type="date"
          value={filters.toDate}
          min={filters.fromDate || undefined}
          onChange={(e) => setFilter({ toDate: e.target.value })}
          aria-label="To date"
          className={controlClass}
        />
        <form
          className="relative ml-auto"
          onSubmit={(e) => { e.preventDefault(); setFilter({ correlationId: draftCorrelation }); }}
        >
          <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <input
            value={draftCorrelation}
            onChange={(e) => setDraftCorrelation(e.target.value)}
            onBlur={() => draftCorrelation !== filters.correlationId && setFilter({ correlationId: draftCorrelation })}
            placeholder="Tracking number"
            aria-label="Tracking number"
            className={`${controlClass} w-56 pl-6 font-mono`}
          />
        </form>
      </div>

      {error ? (
        <div className="p-4"><ErrorNote error={error} onRetry={fetchPage} /></div>
      ) : !loaded ? (
        <div className="p-4"><Skeleton rows={6} height={50} /></div>
      ) : data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <History size={24} style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <p className="text-sm font-medium" style={{ color: CHROME.textSecondary }}>No changes recorded</p>
          <p className="text-xs" style={{ color: CHROME.textMuted }}>
            {filters.area || filters.fromDate || filters.toDate || filters.correlationId
              ? 'Nothing matches these filters.'
              : 'Changes appear here as soon as somebody makes one.'}
          </p>
        </div>
      ) : (
        <ul className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {data.items.map((change, i) => (
            // Two changes can share a time and a tracking number; position keeps keys unique.
            <ChangeRow key={`${change.changedOn}-${change.itemName}-${i}`} change={change} now={now} canTrace={canTrace} traceHref={traceHref} />
          ))}
        </ul>
      )}

      <div className="px-4 pb-3">
        <Pager skip={skip} take={take} total={data.total} onChange={setSkip} onTakeChange={(next) => { setTake(next); setSkip(0); }} busy={loading} />
      </div>
    </div>
  );
}

export default memo(ConfigChangesView);
