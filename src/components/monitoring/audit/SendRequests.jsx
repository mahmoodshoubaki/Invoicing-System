'use client';

/** Every request to send, from code or a workflow — including who got nothing, and why. */

import { memo, useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Fingerprint, GitBranch, Send } from 'lucide-react';

import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass } from '@/components/ui/kit';
import Pager from '@/components/ui/Pager';
import Skeleton from '@/components/ui/Skeleton';
import { REQUEST_OUTCOME } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { notificationRepository } from '@/repositories/notificationRepository';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { relativeTime } from '@/utils/relativeTime';

const PAGE_SIZE = 25;

const OUTCOME_TONE = {
  [REQUEST_OUTCOME.CREATED]: STATUS.good,
  [REQUEST_OUTCOME.ALREADY_SENT]: STATUS.info,
  [REQUEST_OUTCOME.SKIPPED]: STATUS.warning,
};

/** One request to send, with what happened for each person it named. */
const RequestRow = memo(function RequestRow({ request, now }) {
  const [open, setOpen] = useState(request.skippedCount > 0 && request.recipients.length <= 3);
  const created = request.recipients.filter((r) => r.outcomeKey === REQUEST_OUTCOME.CREATED).length;

  return (
    <li className="border-b border-[#f1f0ee] last:border-0">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fbfaf9]">
        <span className="mt-0.5" style={{ color: CHROME.textMuted }}>{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium" style={{ color: CHROME.textPrimary }}>{request.typeName}</span>
            <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
              by {request.requestedByName ?? (request.workflowInstanceId ? 'a workflow' : 'the system')}
            </span>
          </span>
          <span className="mt-0.5 flex flex-wrap gap-2 text-[11px]">
            <span style={{ color: CHROME.textSecondary }}>{created} created</span>
            {request.skippedCount > 0 && (
              <span className="rounded-full px-1.5 font-medium" style={{ backgroundColor: withAlpha(STATUS.warning, 0.15), color: CHROME.textPrimary }}>
                {request.skippedCount} got nothing
              </span>
            )}
          </span>
        </span>
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }} title={formatDateTime(request.requestedOn)}>
          {relativeTime(request.requestedOn, now)}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3 pl-11">
          <ul className="flex flex-col gap-1">
            {request.recipients.map((r, i) => (
              <li key={`${r.recipientUserId ?? r.recipientEmail}-${i}`} className="flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  className="rounded-full px-1.5 py-0.5 font-medium"
                  style={{ backgroundColor: withAlpha(OUTCOME_TONE[r.outcomeKey] ?? CHROME.textMuted, 0.13), color: CHROME.textPrimary }}
                >
                  {r.outcome}
                </span>
                <span style={{ color: CHROME.textPrimary }}>{r.recipientName ?? r.recipientEmail ?? 'Someone'}</span>
                {r.recipientName && r.recipientEmail && <span style={{ color: CHROME.textMuted }}>{r.recipientEmail}</span>}
                {r.reason && <span style={{ color: CHROME.textSecondary }}>— {r.reason}</span>}
                {r.notificationId && (
                  <Link href={ROUTES.MONITORING_DELIVERY(r.notificationId)} className="underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 flex flex-wrap gap-3 text-[11px]">
            {request.workflowInstanceId && (
              <Link href={ROUTES.MONITORING_RUN(request.workflowInstanceId)} className="inline-flex items-center gap-1 underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                <GitBranch size={11} aria-hidden="true" /> The run
              </Link>
            )}
            {request.correlationId && (
              <Link href={ROUTES.MONITORING_TRACE(request.correlationId)} className="inline-flex items-center gap-1 font-mono underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                <Fingerprint size={11} aria-hidden="true" /> {request.correlationId}
              </Link>
            )}
          </p>
        </div>
      )}
    </li>
  );
});

/** Every request to send, from code or a workflow — including who got nothing, and why. */
export function SendRequests({ types }) {
  const [filters, setFilters] = useState({ typeKey: '', recipientEmail: '', fromDate: '', toDate: '', correlationId: '', onlyWithSkipped: false });
  const [skip, setSkip] = useState(0);
  // Rows a page, as the reader chooses (2026-10-21) — PAGE_SIZE to start with.
  const [take, setTake] = useState(PAGE_SIZE);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await notificationRepository.getSendRequests({
        typeKey: filters.typeKey || null,
        recipientEmail: filters.recipientEmail.trim() || null,
        fromDate: filters.fromDate || null,
        toDate: filters.toDate || null,
        correlationId: filters.correlationId.trim() || null,
        onlyWithSkipped: filters.onlyWithSkipped || null,
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
  }, [filters, skip, take]);

  useLoadOnChange(load);

  const setFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setSkip(0);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#f1f0ee] px-4 py-3">
        {types ? (
          <select value={filters.typeKey} onChange={(e) => setFilter({ typeKey: e.target.value })} aria-label="Type" className={`${controlClass} max-w-52`}>
            <option value="">Any type</option>
            {[...types].sort((a, b) => a.englishName.localeCompare(b.englishName)).map((t) => (
              <option key={t.key} value={t.key}>{t.englishName}</option>
            ))}
          </select>
        ) : (
          <input value={filters.typeKey} onChange={(e) => setFilter({ typeKey: e.target.value })} placeholder="Type number" aria-label="Type number" className={`${controlClass} w-28`} />
        )}
        <input value={filters.recipientEmail} onChange={(e) => setFilter({ recipientEmail: e.target.value })} placeholder="Email" aria-label="Recipient email" className={`${controlClass} w-44`} />
        <input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(e) => setFilter({ fromDate: e.target.value })} aria-label="From date" className={controlClass} />
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>to</span>
        <input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(e) => setFilter({ toDate: e.target.value })} aria-label="To date" className={controlClass} />
        <input value={filters.correlationId} onChange={(e) => setFilter({ correlationId: e.target.value })} placeholder="Tracking number" aria-label="Tracking number" className={`${controlClass} w-48 font-mono`} />
        <label className="ml-auto flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
          <input type="checkbox" checked={filters.onlyWithSkipped} onChange={(e) => setFilter({ onlyWithSkipped: e.target.checked })} />
          Only where somebody got nothing
        </label>
      </div>

      {error && !loaded ? (
        <div className="p-4"><ErrorNote error={error} onRetry={load} /></div>
      ) : !loaded ? (
        <div className="p-4"><Skeleton rows={6} height={50} /></div>
      ) : data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Send size={22} style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <p className="text-sm" style={{ color: CHROME.textSecondary }}>No requests match.</p>
        </div>
      ) : (
        <ul className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {data.items.map((r) => <RequestRow key={r.requestId} request={r} now={now} />)}
        </ul>
      )}

      <div className="px-4 pb-3">
        <Pager skip={skip} take={take} total={data.total} onChange={setSkip} onTakeChange={(next) => { setTake(next); setSkip(0); }} busy={loading} />
      </div>
    </div>
  );
}
