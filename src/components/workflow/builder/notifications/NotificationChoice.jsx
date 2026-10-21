'use client';

import { memo } from 'react';

import { CHROME } from '@/theme/vizPalette';
import NotificationTypeSelect from '@/components/workflow/builder/NotificationTypeSelect';
import PlaceholderValues from './PlaceholderValues';

/**
 * One notification a workflow may send: a box to turn it on, the type to send,
 * and values for that type's words. Shared by a task's five and a run's three.
 *
 * What ticking, picking and typing DO is the caller's — a reminder cannot lose
 * its type, an ordinary entry can — so each arrives as its own handler.
 * `children` sit between the type and the values (a reminder's timing).
 *
 * @param {{
 *   label: string, who?: string, entry: Object|null, standardType: number,
 *   types: Array|null, tokens: Array,
 *   onToggle: (on: boolean) => void, onTypeKey: (key: number|null) => void,
 *   onValues: (values: Object) => void, children?: React.ReactNode,
 * }} props
 */
function NotificationChoice({ label, who, entry, standardType, types, tokens, onToggle, onTypeKey, onValues, children }) {
  const on = Boolean(entry);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
        <input type="checkbox" className="mt-0.5" checked={on} onChange={(e) => onToggle(e.target.checked)} />
        <span>
          <span className="font-medium">{label}</span>
          {who && <span className="block" style={{ color: CHROME.textMuted }}>tells {who}</span>}
        </span>
      </label>

      {on && (
        <div className="flex flex-col gap-2 pl-5">
          <NotificationTypeSelect
            value={entry.typeKey ?? null}
            onChange={onTypeKey}
            types={types}
            standardType={standardType}
            ariaLabel={`Notification type — ${label}`}
          />
          {children}
          <PlaceholderValues
            typeKey={entry.typeKey ?? null}
            types={types}
            values={entry.placeholderValues}
            onChange={onValues}
            tokens={tokens}
          />
        </div>
      )}
    </div>
  );
}

export default memo(NotificationChoice);
