'use client';

import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';

import Button from '@/components/common/Button';

/**
 * @param {{ search: string, onSearch: (text: string) => void, status: string, onStatus: (status: string) => void, statuses: string[], filtered: boolean, onClear: () => void, }} props
 */
export default function ProjectFilters({ search, onSearch, status, onStatus, statuses, filtered, onClear }) {
  const options = [{ label: 'All statuses', value: '' }, ...statuses.map((s) => ({ label: s, value: s }))];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#e9e7e5] bg-white p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="group relative min-w-[240px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a0] transition-colors group-focus-within:text-[#f8485e]"
          />
          <input
            type="text"
            placeholder="Search code, project, contract or client…"
            aria-label="Search projects"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-xl border border-[#e4e2e2] bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[#f8485e]"
          />
        </div>
        {filtered && (
          <Button variant="ghost" size="sm" icon={X} onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {statuses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => onStatus(opt.value)}
                aria-pressed={active}
                className={`press-flat rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#f8485e] bg-[#f8485e]/10 text-[#d9304a]'
                    : 'border-[#e9e7e5] bg-white text-[#52514e] hover:border-[#fca2ae] hover:bg-[#f8485e]/5'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
