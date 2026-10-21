'use client';

import { memo, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { FIRST_CUSTOM_TYPE_KEY } from '@/constants/notifications';

const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary disabled:bg-[#fbfaf9]';

/**
 * Picks a notification type. Workflows save its KEY (the number), never its id.
 *
 * The list is `GetTypes`, which needs `Notifications.View`. Somebody who can
 * draw workflows but not read that list gets a number box instead of a dead
 * dropdown — the save still checks the key (WF-050) — and is told why.
 *
 * Any type may be picked anywhere; the standard one for the slot is marked so
 * the sensible default is easy to find.
 *
 * @param {{
 *   value: number|null, onChange: (key: number|null) => void,
 *   types: Array|null,  null = the list could not be read
 *   standardType?: number, disabled?: boolean, ariaLabel?: string, placeholder?: string,
 * }} props
 */
function NotificationTypeSelect({ value, onChange, types, standardType, disabled = false, ariaLabel = 'Notification type', placeholder = 'Choose a notification type…' }) {
  // Standard types first (in key order), then the admin-made ones by category.
  const groups = useMemo(() => {
    if (!types) return [];
    const standard = types.filter((t) => t.key < FIRST_CUSTOM_TYPE_KEY).sort((a, b) => a.key - b.key);
    const byCategory = new Map();
    for (const t of types.filter((x) => x.key >= FIRST_CUSTOM_TYPE_KEY)) {
      const cat = t.category || 'Other';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(t);
    }
    return [
      ...(standard.length ? [{ label: 'Standard', items: standard }] : []),
      ...[...byCategory.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({ label, items: items.sort((a, b) => a.englishName.localeCompare(b.englishName)) })),
    ];
  }, [types]);

  if (types == null) {
    return (
      <div>
        <input
          type="number"
          min={1}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          disabled={disabled}
          aria-label={ariaLabel}
          placeholder="Type number"
          className={`${controlClass} w-32 font-mono`}
        />
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          The list of notification types needs the &ldquo;View notifications&rdquo; permission, so type the
          number. {standardType ? `The standard one here is ${standardType}.` : ''}
        </p>
      </div>
    );
  }

  const selected = types.find((t) => t.key === value) ?? null;
  const missing = value != null && !selected;
  const silent = selected && (selected.isPaused || selected.liveChannelKeys.length === 0);

  return (
    <div className="min-w-0">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${controlClass} w-full`}
        style={missing ? { borderColor: STATUS.critical } : undefined}
      >
        <option value="">{placeholder}</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.items.map((t) => (
              <option key={t.key} value={t.key}>
                {t.englishName}{t.key === standardType ? ' (standard)' : ''}
                {t.isPaused ? ' — paused' : t.liveChannelKeys.length === 0 ? ' — sends nothing yet' : ''}
              </option>
            ))}
          </optgroup>
        ))}
        {/* A saved key that no longer exists stays visible rather than resetting. */}
        {missing && <option value={value}>Type {value} — deleted or never existed</option>}
      </select>

      {missing && (
        <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>
          There is no notification type {value} any more, so saving would be refused. Pick another.
        </p>
      )}
      {silent && (
        <p className="mt-1 flex items-start gap-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          {selected.isPaused
            ? 'This type is paused, so nothing is sent until it is resumed.'
            : 'This type has no published words yet, so nothing is sent until some are published.'}
        </p>
      )}
    </div>
  );
}

export default memo(NotificationTypeSelect);
