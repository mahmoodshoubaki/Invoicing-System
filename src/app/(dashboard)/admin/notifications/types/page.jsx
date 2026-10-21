'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Bell, Lock, Mail, PauseCircle, Plus, Search } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import PillTabs from '@/components/ui/PillTabs';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import LookupBadge from '@/components/ui/LookupBadge';
import TypeFormModal from '@/components/notifications/admin/TypeFormModal';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { usePermission } from '@/hooks/usePermission';
import { useNotificationLookup } from '@/hooks/useNotificationLookup';
import { allow } from '@/constants/workflowPermissions';
import { CHANNEL, NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';
import { notificationRepository } from '@/repositories/notificationRepository';

/** What a type does today, in one word — the column people scan. */
function stateOf(type) {
  if (type.isPaused) return 'paused';
  if (type.liveChannelKeys.length === 0) return 'silent';
  return 'sending';
}

const CHANNELS = [
  { key: CHANNEL.EMAIL, label: 'Email', icon: Mail },
  { key: CHANNEL.IN_APP, label: 'In-app', icon: Bell },
];

const TypeRow = memo(function TypeRow({ type, priority, onOpen }) {
  const state = stateOf(type);
  return (
    <tr
      onClick={() => onOpen(type)}
      className="cursor-pointer border-b border-[#f1f0ee] transition-colors last:border-0 hover:bg-[#fbfaf9]"
    >
      <td className="px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
          {type.englishName}
          {type.isSystemType && (
            <Lock size={11} style={{ color: CHROME.textMuted }} aria-label="Standard type — sent by the system, cannot be deleted" />
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px]" style={{ color: CHROME.textMuted }}>
          <span dir="rtl">{type.arabicName}</span>
          <code className="font-mono">{type.code}</code>
        </p>
      </td>
      <td className="px-3 py-3 font-mono text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }}>{type.key}</td>
      <td className="px-3 py-3">
        {priority ? <LookupBadge label={priority.value} colorHex={priority.colorHex} /> : <span className="text-[11px]" style={{ color: CHROME.textMuted }}>—</span>}
      </td>
      <td className="px-3 py-3">
        <span className="flex gap-1">
          {CHANNELS.map(({ key, label, icon: Icon }) => {
            const live = type.liveChannelKeys.includes(key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px]"
                style={{
                  backgroundColor: live ? withAlpha(STATUS.good, 0.1) : '#f6f5f3',
                  color: live ? CHROME.textPrimary : CHROME.textMuted,
                  textDecoration: live ? 'none' : 'line-through',
                }}
                title={live ? `${label}: published words are being sent` : `${label}: off — no published words`}
              >
                <Icon size={10} aria-hidden="true" />
                {label}
              </span>
            );
          })}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {state === 'paused' && (
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
            <PauseCircle size={12} style={{ color: STATUS.warning }} aria-hidden="true" /> Paused
          </span>
        )}
        {state === 'silent' && (
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
            <AlertTriangle size={12} style={{ color: STATUS.warning }} aria-hidden="true" /> Sends nothing yet
          </span>
        )}
        {state === 'sending' && <span className="text-[11px]" style={{ color: CHROME.textMuted }}>Sending</span>}
      </td>
    </tr>
  );
});

/**
 * Every kind of message the system can send. Reading is `Notifications.View`;
 * adding one is `Manage`. The words live on each type's own page.
 */
export default function NotificationTypesPage() {
  const router = useRouter();
  const toast = useToast();
  const { can } = usePermission();
  const canManage = allow(can, NOTIFICATION_PERMISSIONS.MANAGE);

  const priorities = useNotificationLookup('priorities');

  const [types, setTypes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [state, setState] = useState('all');
  const [adding, setAdding] = useState(false);
  const [senders, setSenders] = useState(null);

  const load = useCallback(async () => {
    try {
      setTypes(await notificationRepository.getTypes());
      setLoaded(true);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useLoadOnChange(load);

  // The sender list for the form — Manage can read it; without it the form says so.
  useEffect(() => {
    if (!adding || !canManage || senders) return;
    notificationRepository.getEmailSenders().then(setSenders).catch(() => setSenders(null));
  }, [adding, canManage, senders]);

  const categories = useMemo(() => [...new Set(types.map((t) => t.category).filter(Boolean))].sort(), [types]);

  const counts = useMemo(() => {
    const c = { all: types.length, sending: 0, silent: 0, paused: 0 };
    for (const t of types) c[stateOf(t)] += 1;
    return c;
  }, [types]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return types
      .filter((t) => !category || t.category === category)
      .filter((t) => state === 'all' || stateOf(t) === state)
      .filter((t) => !q
        || t.englishName.toLowerCase().includes(q)
        || t.arabicName.includes(query.trim())
        || t.code.toLowerCase().includes(q)
        || String(t.key) === q)
      .sort((a, b) => a.key - b.key);
  }, [types, category, state, query]);

  const open = useCallback((type) => router.push(ROUTES.NOTIFICATION_TYPE_DETAIL(type.notificationTypeId)), [router]);

  return (
    <div>
      <PageHeader
        title="Notification types"
        subtitle="Every kind of message the system sends, and on which channels it is live."
        actions={canManage && <Button icon={Plus} onClick={() => setAdding(true)}>New type</Button>}
      />

      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f0ee] px-4 py-3">
          <PillTabs
            tabs={[
              { key: 'all', label: 'All', count: loaded ? counts.all : null },
              { key: 'sending', label: 'Sending', count: loaded ? counts.sending : null, tone: STATUS.good },
              { key: 'silent', label: 'Sends nothing yet', count: loaded ? counts.silent : null, tone: STATUS.warning },
              { key: 'paused', label: 'Paused', count: loaded ? counts.paused : null, tone: STATUS.warning },
            ]}
            value={state}
            onChange={setState}
          />
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className={controlClass}>
              <option value="">Every category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" style={{ color: CHROME.textMuted }} aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, code or number"
                aria-label="Search types"
                className={`${controlClass} w-52 pl-6`}
              />
            </div>
          </div>
        </div>

        {error && !loaded ? (
          <div className="p-4"><ErrorNote error={error} onRetry={load} /></div>
        ) : !loaded ? (
          <div className="p-4"><Skeleton rows={8} height={48} /></div>
        ) : shown.length === 0 ? (
          <p className="px-4 py-12 text-center text-xs" style={{ color: CHROME.textMuted }}>
            {types.length === 0 ? 'No notification types yet.' : 'No type matches these filters.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-[#f1f0ee] text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Key</th>
                  <th className="px-3 py-2 font-semibold">Priority</th>
                  <th className="px-3 py-2 font-semibold">Channels</th>
                  <th className="px-4 py-2 text-right font-semibold">Today</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((type) => (
                  <TypeRow key={type.notificationTypeId} type={type} priority={priorities.byKey[type.priorityKey]} onOpen={open} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {adding && (
        <TypeFormModal
          type={null}
          categories={categories}
          priorities={priorities.list}
          senders={canManage ? senders : null}
          onClose={() => setAdding(false)}
          onSaved={({ notificationTypeId, key }) => {
            setAdding(false);
            toast.success('Type added', `Number ${key}. Write its words next, then publish them.`);
            router.push(ROUTES.NOTIFICATION_TYPE_DETAIL(notificationTypeId));
          }}
        />
      )}
    </div>
  );
}
