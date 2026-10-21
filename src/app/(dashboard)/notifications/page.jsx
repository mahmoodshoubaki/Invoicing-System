'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BellOff, CheckCheck } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import NotificationItem from '@/components/notifications/NotificationItem';
import PillTabs from '@/components/ui/PillTabs';
import Pager from '@/components/ui/Pager';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';
import { PRIORITY } from '@/constants/notifications';
import { notificationRepository } from '@/repositories/notificationRepository';
import { markAllSeen } from '@/store/slices/notificationsSlice';
import { useOpenNotification } from '@/hooks/useOpenNotification';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';

const PAGE_SIZE = 20;

const PRIORITY_OPTIONS = [
  { value: '', label: 'Any priority' },
  { value: PRIORITY.CRITICAL, label: 'Critical' },
  { value: PRIORITY.URGENT, label: 'Urgent' },
  { value: PRIORITY.HIGH, label: 'High' },
  { value: PRIORITY.NORMAL, label: 'Normal' },
  { value: PRIORITY.LOW, label: 'Low' },
];

const EMPTY = { items: [], total: 0, unreadCount: 0 };

/** "Today", "Yesterday", or the date — the headings a long list is read by. */
function dayLabel(value, now) {
  const d = new Date(value);
  const today = new Date(now);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

/**
 * Everything in the person's bell, a page at a time.
 *
 * Same rows as the bell panel, given room: full text instead of two lines,
 * grouped by day, filterable. Arriving here counts as opening the bell, so it
 * marks everything seen and the badge empties.
 */
export default function NotificationsPage() {
  const dispatch = useDispatch();
  const language = useSelector((s) => s.ui.language);
  const openNotification = useOpenNotification();

  const [filters, setFilters] = useState({ tab: 'all', priorityKey: '', fromDate: '', toDate: '' });
  const [skip, setSkip] = useState(0);
  // Rows a page, as the reader chooses (2026-10-21) — PAGE_SIZE to start with.
  const [take, setTake] = useState(PAGE_SIZE);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const requestRef = useRef(0);
  const seenOnce = useRef(false);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await notificationRepository.getMyNotifications({
        isRead: filters.tab === 'unread' ? false : null,
        priorityKey: filters.priorityKey || null,
        fromDate: filters.fromDate || null,
        toDate: filters.toDate || null,
        skip,
        take,
      });
      if (request !== requestRef.current) return;
      setData(result);
      setNow(Date.now());
      setLoaded(true);
      if (!seenOnce.current) {
        seenOnce.current = true;
        dispatch(markAllSeen());
      }
    } catch (err) {
      if (request === requestRef.current) setError(err);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [dispatch, filters, skip, take]);

  useLoadOnChange(load);

  const setFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setSkip(0);
  };

  const markRead = useCallback((deliveryId) => {
    setData((prev) => ({
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      items: prev.items.map((n) => (n.deliveryId === deliveryId ? { ...n, isRead: true } : n)),
    }));
  }, []);

  const handleOpen = useCallback((n) => openNotification(n, markRead), [markRead, openNotification]);

  const markAllRead = async () => {
    const before = data;
    setData((prev) => ({ ...prev, unreadCount: 0, items: prev.items.map((n) => ({ ...n, isRead: true })) }));
    try {
      await notificationRepository.markAllRead();
      if (filters.tab === 'unread') load();
    } catch (err) {
      setData(before);
      setError(err);
    }
  };

  // Rows under their day, in the order the server sent them (newest first).
  const groups = useMemo(() => {
    const out = [];
    for (const n of data.items) {
      const label = dayLabel(n.createdOn, now);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [data.items, now]);

  const actions = (
    <Button variant="outline" icon={CheckCheck} onClick={markAllRead} disabled={data.unreadCount === 0}>
      Mark all as read
    </Button>
  );

  const filtered = filters.tab !== 'all' || filters.priorityKey || filters.fromDate || filters.toDate;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={
          !loaded ? 'Loading…' : data.unreadCount > 0 ? `${data.unreadCount} unread` : 'All read'
        }
        actions={actions}
      />

      <Card padding={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f0ee] px-4 py-3">
          <PillTabs
            tabs={[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread', count: loaded ? data.unreadCount : null },
            ]}
            value={filters.tab}
            onChange={(tab) => setFilter({ tab })}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={filters.priorityKey}
              onChange={(e) => setFilter({ priorityKey: e.target.value })}
              aria-label="Priority"
              className={controlClass}
            >
              {PRIORITY_OPTIONS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
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
          </div>
        </div>

        <div className="px-2 py-2">
          {error ? (
            <div className="p-2"><ErrorNote error={error} onRetry={load} /></div>
          ) : !loaded ? (
            <div className="p-2"><Skeleton rows={6} height={64} /></div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <BellOff size={26} style={{ color: CHROME.textMuted }} aria-hidden="true" />
              <p className="text-sm font-medium" style={{ color: CHROME.textSecondary }}>
                {filtered ? 'Nothing matches these filters.' : 'No notifications yet.'}
              </p>
              <p className="text-xs" style={{ color: CHROME.textMuted }}>
                {filtered ? 'Try another tab or clear the dates.' : 'When something needs you, it shows up here and in the bell.'}
              </p>
            </div>
          ) : (
            <div className={`flex flex-col transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {groups.map((group) => (
                <section key={group.label} className="mb-1">
                  <h2
                    className="sticky top-0 z-1 bg-white px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: CHROME.textMuted }}
                  >
                    {group.label}
                  </h2>
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((n) => (
                      <li key={n.deliveryId}>
                        <NotificationItem notification={n} language={language} now={now} onOpen={handleOpen} full />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#f1f0ee] px-4 pb-3">
          <Pager skip={skip} take={take} total={data.total} onChange={setSkip} onTakeChange={(next) => { setTake(next); setSkip(0); }} busy={loading} />
          <p className="pt-2 text-[11px]" style={{ color: CHROME.textMuted }}>
            Only recent notifications are listed. Older ones are not lost — the administrators can still find them.
          </p>
        </div>
      </Card>
    </div>
  );
}
