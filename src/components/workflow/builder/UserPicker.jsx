'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { useDebounce } from '@/hooks/useDebounce';
import { identityRepository } from '@/repositories/identityRepository';

/** Enough to scan without scrolling; narrowing further is what typing is for. */
const TAKE = 20;

/** Stable identity for "no directory cache supplied". */
const NO_USERS = {};

/**
 * Picks people for a `humanTask`'s `assignToUserIds`.
 *
 * A **server-side typeahead**, not a filter over a preloaded list. The
 * directory is not something to pull into the browser wholesale, and
 * `GetAuthorizedUsers` takes `search` and `take` precisely so it does not have
 * to be.
 *
 * Two different lookups are in play, and the distinction matters:
 *
 * - **Suggestions** come from `?search=&take=`, which returns *active* users —
 *   you should not be able to newly assign work to a deactivated account.
 * - **The chips** are resolved by the parent through `?ids=`, which returns
 *   people *whether or not they are still active* — a workflow saved last year
 *   may name somebody who has since left, and their name is more useful than
 *   their GUID.
 *
 * So a person can appear as a chip who could not be found by searching. That is
 * correct, not a bug.
 *
 * `single` is the person-variable case — a start-form field, a variable's
 * starting value, a condition's value — where exactly one person is held. The
 * search box gives way to the chip once somebody is picked, and removing the
 * chip brings it back.
 *
 * `resolvedById` is optional: whoever is picked from the suggestions is
 * remembered here, so a screen with no directory cache of its own (the start
 * form) still shows a name rather than a guid.
 *
 * `onChange(ids, user)` — the second argument (2026-10-20) is the person just
 * picked, for a caller that saves their username rather than their id.
 */
function UserPicker({
  selectedIds, resolvedById = NO_USERS, onChange, single = false, placeholder = 'Search people by name or username…',
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  // Results carry the query they answer, so "still searching" is derived rather
  // than tracked. A separate `searching` flag would have to be raised
  // synchronously in the effect body, which cascades a render for something
  // already knowable from the data.
  const [results, setResults] = useState({ query: null, users: [] });
  const [picked, setPicked] = useState({});
  const ref = useRef(null);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    identityRepository
      .getAuthorizedUsers({ search: debouncedQuery.trim() || undefined, take: TAKE })
      .then((users) => {
        if (!cancelled) setResults({ query: debouncedQuery, users });
      })
      .catch(() => {
        if (!cancelled) setResults({ query: debouncedQuery, users: [] });
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  const searching = results.query !== debouncedQuery;

  const selected = useMemo(
    () => selectedIds.map((id) => resolvedById[id] ?? picked[id] ?? { id, displayName: null }),
    [selectedIds, resolvedById, picked]
  );

  const suggestions = useMemo(
    () => results.users.filter((u) => u.id && !selectedIds.includes(u.id)),
    [results.users, selectedIds]
  );

  const add = (user) => {
    setPicked((prev) => ({ ...prev, [user.id]: user }));
    onChange(single ? [user.id] : [...selectedIds, user.id], user);
    setQuery('');
    if (single) setOpen(false);
  };

  // One person held: the chip is the whole control until it is removed.
  const searchable = !single || selectedIds.length === 0;

  return (
    <div ref={ref}>
      {selected.length > 0 && (
        <ul className={`${searchable ? 'mb-1.5 ' : ''}flex flex-wrap gap-1.5`} data-motion>
          {selected.map((user) => {
            const known = Boolean(user.displayName);
            const inactive = known && user.isActive === false;
            return (
              <li key={user.id}>
                <span
                  className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: known && !inactive ? withAlpha(STATUS.info, 0.14) : withAlpha(STATUS.warning, 0.14),
                    color: known && !inactive ? STATUS.info : STATUS.warning,
                  }}
                  title={
                    !known
                      ? 'This id is not in the directory any more'
                      : inactive
                        ? `${user.username} — deactivated, so they cannot answer a task`
                        : user.username
                  }
                >
                  {/* A definition can name somebody who has since left or been
                      deactivated. Say so rather than dropping them silently. */}
                  {user.displayName ?? `Unknown (${String(user.id).slice(0, 8)}…)`}
                  {inactive && ' · inactive'}
                  <button
                    type="button"
                    onClick={() => onChange(selectedIds.filter((id) => id !== user.id))}
                    aria-label={`Remove ${user.displayName ?? 'user'}`}
                    className="rounded-full p-0.5 hover:bg-black/10"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {searchable && (
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"
            style={{ color: CHROME.textMuted }}
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label="Search people"
            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs outline-none focus:border-primary"
          />
  
          {open && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#e1e0d9] bg-white shadow-lg">
              {searching && suggestions.length === 0 ? (
                <p className="px-3 py-2 text-[11px]" style={{ color: CHROME.textMuted }}>Searching…</p>
              ) : suggestions.length === 0 ? (
                <p className="px-3 py-2 text-[11px]" style={{ color: CHROME.textMuted }}>
                  {query.trim() ? `Nobody active matches “${query.trim()}”.` : 'No active users found.'}
                </p>
              ) : (
                <ul className="max-h-56 overflow-auto" data-motion>
                  {suggestions.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => add(user)}
                        className="flex w-full flex-col items-start px-3 py-1.5 text-left transition-colors hover:bg-[#fbfaf9]"
                      >
                        <span className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>
                          {user.displayName || user.username}
                        </span>
                        {user.displayName && user.username && (
                          <span className="font-mono text-[10px]" style={{ color: CHROME.textMuted }}>
                            {user.username}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(UserPicker);
