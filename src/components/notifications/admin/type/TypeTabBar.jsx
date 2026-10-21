'use client';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { TYPE_TABS } from './typeTabs';

/** A small count on a tab: something there needs fixing before the save goes through. */
function IssueCount({ count }) {
  if (!count) return null;
  return (
    <span
      className="grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold text-white"
      style={{ backgroundColor: STATUS.warning }}
      title={`${count} thing${count === 1 ? '' : 's'} to fix here before saving`}
    >
      {count}
    </span>
  );
}

/**
 * @param {{
 *   value: string, onChange: (key: string) => void,
 *   status: { placeholderIssues: number, bodyIssues: number },  the channel on screen
 * }} props
 */
export default function TypeTabBar({ value, onChange, status }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-[#f1f0ee] px-4 pt-3" aria-label="Notification type">
      {TYPE_TABS.map(({ key, label, icon: Icon, issues }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className="-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-xs font-medium transition-colors"
            style={{ borderColor: active ? '#d03b3b' : 'transparent', color: active ? CHROME.textPrimary : CHROME.textMuted }}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
            {issues && <IssueCount count={status[issues]} />}
          </button>
        );
      })}
    </nav>
  );
}
