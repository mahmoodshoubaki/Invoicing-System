'use client';

import { memo, useMemo } from 'react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { DELIVERY_STATUS } from '@/constants/notifications';

const DONE = [DELIVERY_STATUS.SENT, DELIVERY_STATUS.DELIVERED];
const WAITING = [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.PROCESSING, DELIVERY_STATUS.FAILED];
const STUCK = [DELIVERY_STATUS.DEAD_LETTERED, DELIVERY_STATUS.FAULTED, DELIVERY_STATUS.INVALID, DELIVERY_STATUS.REFUSED];

function Tile({ label, value, hint, tone }) {
  return (
    <div className="rounded-xl border border-[#f1f0ee] bg-white px-4 py-3">
      <p className="text-[11px] font-medium" style={{ color: CHROME.textMuted }}>{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: tone ?? CHROME.textPrimary }}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>{hint}</p>}
    </div>
  );
}

// A fraction, not a percent: formatPercentage reads anything up to 1 as a
// fraction, so "1%" passed as 1 would come out as 100%.
const pct = (part, whole) => (whole > 0 ? formatPercentage(part / whole, 0) : '—');

/**
 * The monitor's totals for the chosen period: how much went, how much is
 * waiting, how much is stuck and needs a person, and how email and the bell
 * are being read. Opens and clicks are hints — mail programs open things by
 * themselves and link scanners click first — so they say "approx.".
 *
 * @param {{ stats: Object|null, statuses: Record<number, Object>, onPickStatus: (key: number) => void }} props
 */
function DeliveryStats({ stats, statuses, onPickStatus }) {
  const summary = useMemo(() => {
    if (!stats) return null;
    const count = (keys) => stats.byStatus.filter((s) => keys.includes(s.key)).reduce((n, s) => n + s.count, 0);
    const total = stats.byStatus.reduce((n, s) => n + s.count, 0);
    const emailsSent = stats.byChannel.find((c) => c.key === 1)?.count ?? 0;
    return {
      total,
      done: count(DONE),
      waiting: count(WAITING),
      stuck: count(STUCK),
      emailsSent,
      inAppTotal: stats.inAppRead + stats.inAppUnread,
    };
  }, [stats]);

  if (!stats || !summary) return null;

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Delivered or sent" value={formatNumber(summary.done)} hint={`of ${formatNumber(summary.total)} deliveries`} />
        <Tile label="Waiting" value={formatNumber(summary.waiting)} hint="pending, being sent, or retrying" />
        <Tile
          label="Stuck"
          value={formatNumber(summary.stuck)}
          hint={summary.stuck > 0 ? 'need a person — can be sent again' : 'nothing needs attention'}
          tone={summary.stuck > 0 ? STATUS.critical : undefined}
        />
        <Tile
          label="Read"
          value={pct(stats.inAppRead, summary.inAppTotal)}
          hint={`in the bell · emails opened ${pct(stats.emailsOpened, summary.emailsSent)} (approx.)`}
        />
      </div>

      {/* The status mix as one bar — click a part to filter the list to it. */}
      {summary.total > 0 && (
        <div className="rounded-xl border border-[#f1f0ee] bg-white px-4 py-3">
          <div className="flex h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: '#f1f0ee' }}>
            {stats.byStatus.filter((s) => s.count > 0).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onPickStatus(s.key)}
                title={`${s.name}: ${formatNumber(s.count)}`}
                className="h-full transition-opacity hover:opacity-80"
                style={{ width: `${(s.count / summary.total) * 100}%`, backgroundColor: statuses[s.key]?.colorHex || CHROME.textMuted }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {stats.byStatus.filter((s) => s.count > 0).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onPickStatus(s.key)}
                className="inline-flex items-center gap-1 text-[11px] transition-colors hover:underline"
                style={{ color: CHROME.textSecondary }}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: statuses[s.key]?.colorHex || CHROME.textMuted }} aria-hidden="true" />
                {s.name} <span className="tabular-nums" style={{ color: CHROME.textMuted }}>{formatNumber(s.count)}</span>
              </button>
            ))}
          </div>
          {stats.faultedByReason.length > 0 && (
            <p className="mt-2 text-[11px]" style={{ color: CHROME.textMuted }}>
              Faulted because of the sender:{' '}
              {stats.faultedByReason.map((r, i) => (
                <span key={r.key}>
                  <strong style={{ color: CHROME.textSecondary }}>{r.name}</strong> {formatNumber(r.count)}
                  {i < stats.faultedByReason.length - 1 ? ' · ' : ''}
                </span>
              ))}
              {' '}— fixing the sender sends them again by itself.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(DeliveryStats);
