'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Archive, Bell, ChevronDown, ChevronRight, Inbox, Mail, RefreshCw, RotateCcw, SlidersHorizontal, X } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Pager from '@/components/ui/Pager';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import LookupBadge from '@/components/ui/LookupBadge';
import DeliveryStats from '@/components/notifications/admin/DeliveryStats';
import TestBadge from '@/components/notifications/admin/TestBadge';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils/formatters';
import { relativeTime } from '@/utils/relativeTime';
import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { usePermission } from '@/hooks/usePermission';
import { useNotificationLookup } from '@/hooks/useNotificationLookup';
import { allow } from '@/constants/workflowPermissions';
import { CHANNEL, NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { TARGET_TYPE_LABELS } from '@/constants/workflow';
import { ROUTES } from '@/constants/routes';
import { notificationRepository } from '@/repositories/notificationRepository';

const PAGE_SIZE = 50;

/** Every filter the list takes; the ones a link may pre-set are read from the URL. */
const EMPTY_FILTERS = {
  statusKey: '', channelKey: '', typeKey: '', recipientEmail: '', fromDate: '', toDate: '',
  correlationId: '', workflowInstanceId: '', notificationId: '', targetTypeKey: '', targetId: '',
};
const FROM_URL = ['statusKey', 'channelKey', 'typeKey', 'correlationId', 'workflowInstanceId', 'notificationId', 'targetTypeKey', 'targetId', 'recipientEmail'];

const DeliveryRow = memo(function DeliveryRow({ row, statuses, now, checked, onCheck, onOpen }) {
  const status = statuses[row.statusKey];
  const email = row.channelKey === CHANNEL.EMAIL;
  return (
    <tr onClick={() => onOpen(row)} className="cursor-pointer border-b border-[#f1f0ee] transition-colors last:border-0 hover:bg-[#fbfaf9]">
      <td className="w-8 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={checked} onChange={() => onCheck(row)} aria-label="Select this delivery" />
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }} title={formatDateTime(row.createdOn)}>
        {relativeTime(row.createdOn, now)}
      </td>
      <td className="px-2 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CHROME.textPrimary }}>
          {row.isTest && <TestBadge />}
          {row.typeName}
        </p>
        {row.isArchived && <span className="text-[10px]" style={{ color: CHROME.textMuted }}>archived</span>}
      </td>
      <td className="px-2 py-2.5">
        <p className="text-xs" style={{ color: CHROME.textPrimary }}>{row.recipientName ?? row.recipientEmail ?? '—'}</p>
        {row.recipientName && row.recipientEmail && (
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{row.recipientEmail}</p>
        )}
      </td>
      <td className="px-2 py-2.5">
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
          {email ? <Mail size={11} aria-hidden="true" /> : <Bell size={11} aria-hidden="true" />}
          {row.channel}
        </span>
      </td>
      <td className="px-2 py-2.5">
        <LookupBadge label={row.status || status?.value || '—'} colorHex={row.statusColorHex || status?.colorHex} title={status?.description ?? undefined} />
        {(row.faultReason || row.errorMessage) && (
          <p className="mt-0.5 max-w-56 truncate text-[11px]" style={{ color: CHROME.textMuted }} title={row.faultReason ?? row.errorMessage}>
            {row.faultReason ?? row.errorMessage}
          </p>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }}>
        {row.maxRetries > 0 ? `${row.retryCount} of ${row.maxRetries}` : '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[11px]" style={{ color: CHROME.textMuted }}>
        {email
          ? [row.openedAt && 'opened', row.clickedAt && 'clicked'].filter(Boolean).join(', ') || '—'
          : row.readAt ? 'read' : 'unread'}
      </td>
    </tr>
  );
});

function MonitorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { can } = usePermission();
  const canReadTypes = allow(can, NOTIFICATION_PERMISSIONS.VIEW);

  const statuses = useNotificationLookup('deliveryStatuses');
  const channels = useNotificationLookup('channels', canReadTypes);

  const [filters, setFilters] = useState(() => {
    const initial = { ...EMPTY_FILTERS };
    for (const key of FROM_URL) if (params.get(key)) initial[key] = params.get(key);
    return initial;
  });
  const [moreOpen, setMoreOpen] = useState(() => FROM_URL.slice(3).some((k) => params.get(k)));
  const [skip, setSkip] = useState(0);
  // Rows a page, as the reader chooses (2026-10-21) — PAGE_SIZE to start with.
  const [take, setTake] = useState(PAGE_SIZE);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [types, setTypes] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState(() => new Map());
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (canReadTypes) notificationRepository.getTypes().then(setTypes).catch(() => setTypes(null));
  }, [canReadTypes]);

  const query = useMemo(() => {
    const q = {};
    for (const [k, v] of Object.entries(filters)) if (String(v).trim()) q[k] = String(v).trim();
    // targetId only travels with its type — an id alone matches every kind of record.
    if (!q.targetTypeKey) delete q.targetId;
    if (!q.targetId) delete q.targetTypeKey;
    return q;
  }, [filters]);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const [page, totals] = await Promise.all([
        notificationRepository.getDeliveries({ ...query, skip, take }),
        // Totals follow the period only; the list filters do not change them.
        notificationRepository.getStatistics({ fromDate: query.fromDate, toDate: query.toDate }).catch(() => null),
      ]);
      if (request !== requestRef.current) return;
      setData(page);
      if (totals) setStats(totals);
      setNow(Date.now());
      setLoaded(true);
    } catch (err) {
      if (request === requestRef.current) setError(err);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [query, skip, take]);

  useLoadOnChange(load);

  const setFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setSkip(0);
    setSelected(new Map());
  };

  const toggle = useCallback((row) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.deliveryId)) next.delete(row.deliveryId); else next.set(row.deliveryId, row);
      return next;
    });
  }, []);

  const pageAllChecked = data.items.length > 0 && data.items.every((r) => selected.has(r.deliveryId));
  const togglePage = () => setSelected((prev) => {
    const next = new Map(prev);
    if (pageAllChecked) data.items.forEach((r) => next.delete(r.deliveryId));
    else data.items.forEach((r) => next.set(r.deliveryId, r));
    return next;
  });

  const picked = [...selected.values()];
  const requeueable = picked.filter((r) => r.canBeRequeued && !r.isArchived);
  const archivable = [...new Set(picked.filter((r) => !r.isArchived).map((r) => r.notificationId))];

  const requeue = async () => {
    setBusy('requeue');
    setActionError(null);
    try {
      const done = await notificationRepository.requeue({ deliveryIds: requeueable.map((r) => r.deliveryId) });
      // Anything not in a stopped state is skipped, not refused — say how many went.
      toast.success(`${done.length} of ${requeueable.length} sent again`, done.length < requeueable.length ? 'The rest were no longer stopped.' : undefined);
      setSelected(new Map());
      load();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(null);
    }
  };

  const archive = async () => {
    setBusy('archive');
    setActionError(null);
    try {
      const done = await notificationRepository.archive(archivable);
      toast.success(`${done.length} of ${archivable.length} archived`, done.length < archivable.length ? 'Ones still being sent, or already archived, were skipped.' : undefined);
      setSelected(new Map());
      load();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(null);
    }
  };

  const open = useCallback((row) => router.push(ROUTES.MONITORING_DELIVERY(row.notificationId)), [router]);
  const activeFilters = Object.keys(query).length;

  return (
    <div>
      <PageHeader
        title="Notifications Delivery Monitor"
        subtitle="Every notification on every channel — live and archived — and what happened to it."
        actions={<Button variant="outline" size="sm" icon={RefreshCw} onClick={load} loading={loading && loaded}>Refresh</Button>}
      />

      <DeliveryStats stats={stats} statuses={statuses.byKey} onPickStatus={(key) => setFilter({ statusKey: String(key) })} />

      {actionError && <div className="mb-4"><ErrorNote error={actionError} /></div>}

      <Card padding={false}>
        <div className="flex flex-col gap-2 border-b border-[#f1f0ee] px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={filters.statusKey} onChange={(e) => setFilter({ statusKey: e.target.value })} aria-label="Status" className={controlClass}>
              <option value="">Any status</option>
              {statuses.list.map((s) => <option key={s.key} value={s.key}>{s.value}</option>)}
            </select>
            <select value={filters.channelKey} onChange={(e) => setFilter({ channelKey: e.target.value })} aria-label="Channel" className={controlClass}>
              <option value="">Any channel</option>
              {(channels.list.length ? channels.list : [{ key: CHANNEL.EMAIL, value: 'Email' }, { key: CHANNEL.IN_APP, value: 'In-app' }]).map((c) => (
                <option key={c.key} value={c.key}>{c.value}</option>
              ))}
            </select>
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
            <input
              value={filters.recipientEmail}
              onChange={(e) => setFilter({ recipientEmail: e.target.value })}
              placeholder="Email contains…"
              aria-label="Recipient email contains"
              className={`${controlClass} w-44`}
            />
            <input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(e) => setFilter({ fromDate: e.target.value })} aria-label="From date" className={controlClass} />
            <span className="text-[11px]" style={{ color: CHROME.textMuted }}>to</span>
            <input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(e) => setFilter({ toDate: e.target.value })} aria-label="To date" className={controlClass} />
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
              style={{ color: CHROME.textSecondary }}
            >
              <SlidersHorizontal size={12} aria-hidden="true" />
              More
              {moreOpen ? <ChevronDown size={11} aria-hidden="true" /> : <ChevronRight size={11} aria-hidden="true" />}
            </button>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => setFilter({ ...EMPTY_FILTERS })}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] transition-colors hover:bg-[#f1f0ee]"
                style={{ color: CHROME.textMuted }}
              >
                <X size={11} aria-hidden="true" /> Clear {activeFilters}
              </button>
            )}
          </div>

          {moreOpen && (
            <div className="flex flex-wrap items-center gap-1.5">
              <input value={filters.correlationId} onChange={(e) => setFilter({ correlationId: e.target.value })} placeholder="Tracking number" aria-label="Tracking number" className={`${controlClass} w-56 font-mono`} />
              <input value={filters.workflowInstanceId} onChange={(e) => setFilter({ workflowInstanceId: e.target.value })} placeholder="Workflow run id" aria-label="Workflow run id" className={`${controlClass} w-64 font-mono`} />
              <span className="text-[11px]" style={{ color: CHROME.textMuted }}>Everything about</span>
              <select value={filters.targetTypeKey} onChange={(e) => setFilter({ targetTypeKey: e.target.value })} aria-label="Record type" className={controlClass}>
                <option value="">a record…</option>
                {Object.entries(TARGET_TYPE_LABELS).filter(([k]) => Number(k) !== 1).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
              <input
                value={filters.targetId}
                onChange={(e) => setFilter({ targetId: e.target.value })}
                placeholder="its id"
                aria-label="Record id"
                disabled={!filters.targetTypeKey}
                className={`${controlClass} w-56 font-mono`}
              />
            </div>
          )}
        </div>

        {picked.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f0ee] bg-[#fbfaf9] px-4 py-2">
            <span className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>{picked.length} selected</span>
            <Button size="sm" icon={RotateCcw} onClick={requeue} loading={busy === 'requeue'} disabled={requeueable.length === 0 || Boolean(busy)}>
              Send again{requeueable.length !== picked.length ? ` (${requeueable.length})` : ''}
            </Button>
            <Button size="sm" variant="outline" icon={Archive} onClick={archive} loading={busy === 'archive'} disabled={archivable.length === 0 || Boolean(busy)}>
              Archive{archivable.length ? ` (${archivable.length})` : ''}
            </Button>
            <button type="button" onClick={() => setSelected(new Map())} className="text-[11px] underline-offset-2 hover:underline" style={{ color: CHROME.textMuted }}>
              Clear
            </button>
            <span className="ml-auto text-[11px]" style={{ color: CHROME.textMuted }}>
              Only stopped ones (failed for good, faulted, invalid, refused) can be sent again — the same text, with every try back.
            </span>
          </div>
        )}

        {error && !loaded ? (
          <div className="p-4"><ErrorNote error={error} onRetry={load} /></div>
        ) : !loaded ? (
          <div className="p-4"><Skeleton rows={8} height={46} /></div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Inbox size={24} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            <p className="text-sm" style={{ color: CHROME.textSecondary }}>{activeFilters ? 'Nothing matches these filters.' : 'Nothing has been sent yet.'}</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-[#f1f0ee] text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
                  <th className="w-8 px-3 py-2">
                    <input type="checkbox" checked={pageAllChecked} onChange={togglePage} aria-label="Select this page" />
                  </th>
                  <th className="px-2 py-2 font-semibold">When</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">To</th>
                  <th className="px-2 py-2 font-semibold">Channel</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Tries</th>
                  <th className="px-3 py-2 font-semibold">Seen</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <DeliveryRow
                    key={row.deliveryId}
                    row={row}
                    statuses={statuses.byKey}
                    now={now}
                    checked={selected.has(row.deliveryId)}
                    onCheck={toggle}
                    onOpen={open}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 pb-3">
          <Pager skip={skip} take={take} total={data.total} onChange={setSkip} onTakeChange={(next) => { setTake(next); setSkip(0); }} busy={loading} />
          <p className="pt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
            Email opens and clicks are hints, not proof: some mail programs open everything by themselves, and link
            scanners can click first.
          </p>
        </div>
      </Card>
    </div>
  );
}

/** `useSearchParams` needs a Suspense boundary above it in the App Router. */
export default function DeliveryMonitorPage() {
  return (
    <Suspense fallback={null}>
      <MonitorContent />
    </Suspense>
  );
}
