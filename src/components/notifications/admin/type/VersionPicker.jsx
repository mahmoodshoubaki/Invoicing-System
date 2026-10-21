'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, History, Plus } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';

function VersionTag({ tag }) {
  if (!tag) return null;
  const live = tag === 'live';
  return (
    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: withAlpha(live ? STATUS.good : STATUS.info, 0.14), color: CHROME.textPrimary }}>
      {live ? 'Live' : 'Draft'}
    </span>
  );
}

/**
 * The version being edited, with every other one a click away — who wrote each
 * and who published it. Live = what is sent now; Draft = newer than live.
 */
export default function VersionPicker({ versions, live, selected, dirty, canManage, onPick, onBlank }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Closes on any click outside it.
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const tagOf = (v) => (v.isActive ? 'live' : (!live || v.version > live.version) ? 'draft' : null);
  const label = selected ? `Version ${selected.version}` : versions.length > 0 ? 'New version' : 'First version';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e1e0d9] bg-white px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f6f5f3]"
        style={{ color: CHROME.textPrimary }}
      >
        <History size={12} aria-hidden="true" />
        {label}
        {selected && <VersionTag tag={tagOf(selected)} />}
        {dirty && <span className="font-normal" style={{ color: CHROME.textMuted }}>· edited</span>}
        <ChevronDown size={12} aria-hidden="true" style={{ color: CHROME.textMuted }} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-80 rounded-xl border border-[#e9e7e5] bg-white p-1.5 shadow-[0_16px_36px_-14px_rgb(60_60_58/0.35)]">
          {versions.length === 0 ? (
            <p className="px-2 py-3 text-center text-[11px]" style={{ color: CHROME.textMuted }}>
              No versions yet — what you write is saved as version 1.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto" role="listbox" aria-label="Versions">
              {versions.map((v) => {
                const isSelected = v.templateId === selected?.templateId;
                return (
                  <li key={v.templateId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { setOpen(false); onPick(v); }}
                      className="w-full rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-[#fbfaf9]"
                      style={{ borderColor: isSelected ? CHROME.textPrimary : 'transparent' }}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
                        Version {v.version}
                        <VersionTag tag={tagOf(v)} />
                      </span>
                      <span className="mt-0.5 block truncate text-[11px]" style={{ color: CHROME.textSecondary }}>{v.englishSubject}</span>
                      <span className="block text-[10px]" style={{ color: CHROME.textMuted }}>
                        {formatDateTime(v.createdOn)}{v.createdByName ? ` · ${v.createdByName}` : ''}
                      </span>
                      {v.publishedOn && (
                        <span className="block text-[10px]" style={{ color: CHROME.textMuted }}>
                          published {formatDateTime(v.publishedOn)}{v.publishedByName ? ` · ${v.publishedByName}` : ''}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {canManage && versions.length > 0 && (
            <button
              type="button"
              onClick={() => { setOpen(false); onBlank(); }}
              className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t border-[#f1f0ee] px-2.5 py-2 text-left text-[11px] font-medium transition-colors hover:bg-[#fbfaf9]"
              style={{ color: CHROME.textSecondary }}
            >
              <Plus size={11} aria-hidden="true" /> Start from blank
            </button>
          )}
        </div>
      )}
    </div>
  );
}

