'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, BellOff, CheckCheck } from 'lucide-react';

import NotificationItem from './NotificationItem';
import PillTabs from '@/components/ui/PillTabs';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { CHROME } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';
import { notificationRepository } from '@/repositories/notificationRepository';
import { markAllSeen, selectUnseenCount } from '@/store/slices/notificationsSlice';
import { useOpenNotification } from '@/hooks/useOpenNotification';

/** What the panel shows at most; the inbox page has the rest. */
const PANEL_TAKE = 15;

const EMPTY = { items: [], total: 0, unreadCount: 0 };

/**
 * The bell in the header, and its panel.
 *
 * The badge counts UNSEEN — things that arrived since the person last opened
 * the bell. Opening it loads the newest notifications and then marks them all
 * seen, so the badge empties the moment the person is looking. READ is a
 * different thing, set one notification at a time by clicking it; that is what
 * the bold rows and the Unread tab are about.
 */
export default function NotificationBell() {
  const dispatch = useDispatch();
  const unseen = useSelector(selectUnseenCount);
  const language = useSelector((s) => s.ui.language);
  const openNotification = useOpenNotification();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // One clock per opening, so "5 min ago" does not tick row by row.
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef(null);
  const requestRef = useRef(0);

  const load = useCallback(async (which) => {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await notificationRepository.getMyNotifications({
        isRead: which === 'unread' ? false : null,
        take: PANEL_TAKE,
      });
      if (request === requestRef.current) setData(result);
    } catch (err) {
      if (request === requestRef.current) setError(err);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setNow(Date.now());
    await load(tab);
    // Seen = the person opened the bell while these were there. After the list
    // has loaded, so what they are shown is what gets marked.
    dispatch(markAllSeen());
  };

  const changeTab = (next) => {
    setTab(next);
    load(next);
  };

  // Outside click and Escape both close it — the two ways people dismiss a popover.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markRead = useCallback((deliveryId) => {
    setData((prev) => ({
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      items: prev.items.map((n) => (n.deliveryId === deliveryId ? { ...n, isRead: true } : n)),
    }));
  }, []);

  const handleOpen = useCallback((notification) => {
    openNotification(notification, markRead);
    if (notification.actionUrl) setOpen(false);
  }, [markRead, openNotification]);

  const markAllRead = async () => {
    const before = data;
    setData((prev) => ({ ...prev, unreadCount: 0, items: prev.items.map((n) => ({ ...n, isRead: true })) }));
    try {
      await notificationRepository.markAllRead();
      if (tab === 'unread') load('unread');
    } catch (err) {
      setData(before);
      setError(err);
    }
  };

  const badge = unseen > 99 ? '99+' : unseen;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
      >
        <Bell size={20} />
        {unseen > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-40 mt-2 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-[#eceae4] bg-white shadow-xl"
          style={{ maxHeight: 'min(70vh, 560px)' }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#f1f0ee] px-3.5 py-2.5">
            <p className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={data.unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ color: CHROME.textSecondary }}
            >
              <CheckCheck size={12} aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          <div className="px-3.5 pt-2.5">
            <PillTabs
              tabs={[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread', count: data.unreadCount },
              ]}
              value={tab}
              onChange={changeTab}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2">
            {error ? (
              <div className="px-2"><ErrorNote error={error} compact onRetry={() => load(tab)} /></div>
            ) : loading && data.items.length === 0 ? (
              <div className="px-2"><Skeleton rows={4} height={52} /></div>
            ) : data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <BellOff size={22} style={{ color: CHROME.textMuted }} aria-hidden="true" />
                <p className="text-xs" style={{ color: CHROME.textMuted }}>
                  {tab === 'unread' ? 'Nothing unread. You are all caught up.' : 'No notifications yet.'}
                </p>
              </div>
            ) : (
              <ul className={`flex flex-col gap-0.5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
                {data.items.map((n) => (
                  <li key={n.deliveryId}>
                    <NotificationItem notification={n} language={language} now={now} onOpen={handleOpen} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href={ROUTES.NOTIFICATIONS}
            onClick={() => setOpen(false)}
            className="border-t border-[#f1f0ee] px-3.5 py-2.5 text-center text-xs font-medium transition-colors hover:bg-[#fbfaf9]"
            style={{ color: CHROME.textSecondary }}
          >
            See all notifications
            {data.total > data.items.length ? ` (${data.total})` : ''}
          </Link>
        </div>
      )}
    </div>
  );
}
