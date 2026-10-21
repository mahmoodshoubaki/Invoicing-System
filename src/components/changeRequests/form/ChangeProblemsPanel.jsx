'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, LayoutList } from 'lucide-react';

import { groupProblems } from '@/lib/changeRequest/problemText';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/** Items shown before "Show N more". */
const FIRST_ITEMS = 3;

/**
 * What stops the request as a whole (2026-10-21) — the form's own checks and
 * the server's refusal — in one panel: a heading with how many things there
 * are, the request-wide ones first, then one block per item with what is
 * wrong and what to do. A long list folds after a few items.
 *
 * @param {{ messages: string[], itemNames: string[] }} props
 */
export default function ChangeProblemsPanel({ messages, itemNames }) {
  const [expanded, setExpanded] = useState(false);
  const grouped = useMemo(() => groupProblems(messages, { inRequest: itemNames }), [messages, itemNames]);
  if (grouped.count === 0) return null;

  const items = expanded ? grouped.items : grouped.items.slice(0, FIRST_ITEMS);
  const hidden = grouped.items.length - items.length;

  return (
    <div
      data-problem
      role="alert"
      className="mt-4 overflow-hidden rounded-xl border"
      style={{ borderColor: withAlpha(STATUS.critical, 0.25), backgroundColor: withAlpha(STATUS.critical, 0.04) }}
    >
      <p
        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold"
        style={{ backgroundColor: withAlpha(STATUS.critical, 0.08), color: STATUS.critical }}
      >
        <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
        This request can&rsquo;t be sent yet — {grouped.count} thing{grouped.count === 1 ? '' : 's'} to fix
      </p>

      <div className="flex flex-col gap-3 px-4 py-3">
        {grouped.general.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-4 text-xs" style={{ color: CHROME.textPrimary }}>
            {grouped.general.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}

        {items.map((item) => (
          <div key={item.name} className="rounded-lg border border-[#eceae4] bg-white px-3 py-2">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
              <LayoutList size={12} style={{ color: CHROME.textMuted }} aria-hidden="true" />
              {item.name}
              <span
                className="rounded-full px-1.5 py-px text-[10px] font-medium"
                style={item.inRequest
                  ? { backgroundColor: withAlpha(STATUS.info, 0.1), color: STATUS.info }
                  : { backgroundColor: '#f1f0ee', color: CHROME.textMuted }}
              >
                {item.inRequest ? 'in this request' : 'not in this request'}
              </span>
            </p>
            <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-5 text-xs" style={{ color: CHROME.textSecondary }}>
              {item.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
            {item.hint && <p className="mt-1 pl-5 text-[11px]" style={{ color: CHROME.textMuted }}>{item.hint}</p>}
          </div>
        ))}

        {(hidden > 0 || expanded) && grouped.items.length > FIRST_ITEMS && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 self-start text-xs font-medium underline-offset-2 hover:underline"
            style={{ color: STATUS.info }}
          >
            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            {expanded ? 'Show fewer' : `Show ${hidden} more item${hidden === 1 ? '' : 's'}`}
          </button>
        )}
      </div>
    </div>
  );
}
