'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, UserRound, Loader2 } from 'lucide-react';
import Avatar from '@/components/common/Avatar';

const MAX_VISIBLE = 8;

/**
 * Searchable picker over GetUnregisteredADUsers — search by username, email,
 * or display name, pick one candidate to seed the new-user form.
 */
export default function ADUserSearchInput({ candidates, loading, selected, onSelect, onClear }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? candidates.filter((c) =>
          c.username?.toLowerCase().includes(q) ||
          c.displayName?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
        )
      : candidates;
    return pool.slice(0, MAX_VISIBLE);
  }, [candidates, query]);

  if (selected) {
    return (
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">
          Username <span className="text-primary">*</span>
        </p>
        <div className="flex items-center gap-3 p-2.5 border border-primary/30 bg-red-50/50 rounded-lg">
          <Avatar name={selected.displayName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">{selected.displayName}</p>
            <p className="text-xs text-gray-500 truncate">
              <span className="font-mono">{selected.username}</span>
              {selected.email && <span className="text-gray-400"> · {selected.email}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            title="Change user"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="text-sm font-medium text-gray-700 mb-1.5">
        Username <span className="text-primary">*</span>
      </p>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, username, or email..."
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 animate-spin" />
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" />
              Loading available users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center px-4">
              <UserRound size={20} className="text-gray-300" />
              <p className="text-sm text-gray-500">No matching AD users found</p>
              {!query && <p className="text-xs text-gray-400">All AD users may already be registered</p>}
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {filtered.map((candidate) => (
                <li key={candidate.username}>
                  <button
                    type="button"
                    onClick={() => { onSelect(candidate); setQuery(''); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Avatar name={candidate.displayName} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{candidate.displayName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        <span className="font-mono">{candidate.username}</span>
                        {candidate.email && <span> · {candidate.email}</span>}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && candidates.length > MAX_VISIBLE && filtered.length === MAX_VISIBLE && (
            <p className="text-[11px] text-gray-400 text-center py-1.5 border-t border-gray-50">
              Showing first {MAX_VISIBLE} — keep typing to narrow results
            </p>
          )}
        </div>
      )}
    </div>
  );
}
