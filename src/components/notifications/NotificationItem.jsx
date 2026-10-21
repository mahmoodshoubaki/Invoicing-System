'use client';

import { memo } from 'react';
import { ArrowUpRight } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { relativeTime } from '@/utils/relativeTime';
import { notificationText } from '@/utils/notificationText';
import { PRIORITY } from '@/constants/notifications';

/**
 * Priority, as a colour on the row's edge. Kept here rather than read from
 * GetPriorities: that lookup needs a Notifications permission most people do
 * not have, and every signed-in user has a bell. Low and Normal stay quiet —
 * only what is genuinely louder earns a colour.
 */
const PRIORITY_TONE = {
  [PRIORITY.HIGH]: STATUS.warning,
  [PRIORITY.URGENT]: STATUS.serious,
  [PRIORITY.CRITICAL]: STATUS.critical,
};

const PRIORITY_LABEL = {
  [PRIORITY.HIGH]: 'High priority',
  [PRIORITY.URGENT]: 'Urgent',
  [PRIORITY.CRITICAL]: 'Critical',
};

/**
 * One notification, for the bell panel and the inbox page alike.
 *
 * Unread reads as unread three ways at once — a dot, bolder text, a faintly
 * tinted background — so it survives a glance and colour blindness both. The
 * body is plain text (HTML is reduced to its words, never rendered), clamped
 * to two lines in the panel and shown whole on the page.
 *
 * @param {{
 *   notification: Object, language: 'en'|'ar', now: number,
 *   onOpen: (n: Object) => void, full?: boolean,
 * }} props
 */
function NotificationItem({ notification, language, now, onOpen, full = false }) {
  const { subject, body, dir } = notificationText(notification, language);
  const unread = !notification.isRead;
  const tone = PRIORITY_TONE[notification.priorityKey];

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className="group relative flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#f6f5f3]"
      style={{ backgroundColor: unread ? '#fbfaf9' : 'transparent' }}
    >
      {/* Priority on the leading edge — only for High and above. */}
      {tone && (
        <span
          className="absolute inset-y-2 left-0 w-0.5 rounded-full"
          style={{ backgroundColor: tone }}
          aria-hidden="true"
        />
      )}

      <span className="mt-1.5 flex size-2 shrink-0 items-center justify-center" aria-hidden="true">
        {unread && <span className="size-2 rounded-full" style={{ backgroundColor: STATUS.info }} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            dir={dir}
            className={`min-w-0 text-[13px] leading-snug ${unread ? 'font-semibold' : 'font-medium'} ${full ? '' : 'line-clamp-1'}`}
            style={{ color: unread ? CHROME.textPrimary : CHROME.textSecondary }}
          >
            {subject || 'Notification'}
          </span>
          <span
            className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] tabular-nums"
            style={{ color: CHROME.textMuted }}
            title={formatDateTime(notification.createdOn)}
          >
            {relativeTime(notification.createdOn, now)}
          </span>
        </span>

        {body && (
          <span
            dir={dir}
            className={`mt-0.5 block text-xs leading-relaxed ${full ? 'whitespace-pre-line' : 'line-clamp-2'}`}
            style={{ color: unread ? CHROME.textSecondary : CHROME.textMuted }}
          >
            {body}
          </span>
        )}

        {(tone || notification.actionUrl) && (
          <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            {tone && (
              <span
                className="rounded-full px-1.5 py-0.5 font-medium"
                style={{ backgroundColor: withAlpha(tone, 0.12), color: CHROME.textSecondary }}
              >
                {PRIORITY_LABEL[notification.priorityKey]}
              </span>
            )}
            {notification.actionUrl && (
              <span
                className="inline-flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100"
                style={{ color: STATUS.info }}
              >
                Open <ArrowUpRight size={11} aria-hidden="true" />
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}

export default memo(NotificationItem);
