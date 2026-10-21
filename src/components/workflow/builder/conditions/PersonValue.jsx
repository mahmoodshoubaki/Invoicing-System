'use client';

/** The value box for a condition on a person. */

import { useMemo, useState } from 'react';

import UserPicker from '@/components/workflow/builder/UserPicker';
import { VARIABLE_TYPE } from '@/constants/workflow';
import { CHROME } from '@/theme/vizPalette';

import { EMPTY } from './conditionStyles';

/**
 * How a record's person field holds its person (2026-10-20): a user id, or a
 * username like DOMAIN\jdoe — `bdmUsername` does. The catalog does not say
 * which, and a value is never checked for an id's shape, so a field named
 * "…Username" starts as a username; the author can switch. A person variable
 * always holds an id.
 */
function startingMode(field) {
  if (field?.typeKey === VARIABLE_TYPE.USER) return 'id';
  return /username$/i.test(field?.name ?? '') ? 'username' : 'id';
}

/**
 * The value box for a person: pick one from the directory, and their user id —
 * or, for a field that holds usernames, their username — is what is saved.
 * The name comes from the field's `valueLabels` (the page's directory lookups,
 * by id and by username) or, for somebody just picked, from the picker itself.
 */
export function PersonValue({ field, value, onChange }) {
  const [mode, setMode] = useState(() => startingMode(field));
  // Another field chosen: its own starting mode.
  const [seenField, setSeenField] = useState(field?.name);
  if (field?.name !== seenField) {
    setSeenField(field?.name);
    setMode(startingMode(field));
  }
  const byUsername = mode === 'username';
  const recordField = field?.typeKey !== VARIABLE_TYPE.USER;
  const name = field?.valueLabels?.[String(value ?? '').toLowerCase()];
  const resolved = useMemo(
    // Without a known name the value itself is shown — a username reads fine as it is.
    () => (value ? { [value]: { id: value, displayName: name ?? value } } : undefined),
    [value, name]
  );

  const switchMode = (next) => {
    setMode(next);
    // What was picked is an id or a username, not both — pick again.
    if (value) onChange('');
  };

  return (
    <div className="min-w-0 flex-1">
      <UserPicker
        single
        selectedIds={value ? [value] : EMPTY}
        resolvedById={resolved}
        onChange={(ids, user) => onChange(ids.length === 0 ? '' : byUsername ? (user?.username ?? '') : ids[0])}
        placeholder="Search for a person…"
      />
      {recordField && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: CHROME.textMuted }}>
          <span>Match by</span>
          {[['id', 'user id'], ['username', 'username']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              aria-pressed={mode === key}
              className="rounded px-1.5 py-px transition-colors"
              style={mode === key
                ? { backgroundColor: '#eceae4', color: CHROME.textPrimary }
                : { color: CHROME.textMuted }}
            >
              {label}
            </button>
          ))}
          <span className="truncate">— what this field holds</span>
        </div>
      )}
    </div>
  );
}
