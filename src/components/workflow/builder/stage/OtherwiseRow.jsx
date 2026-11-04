'use client';

import { memo } from 'react';
import { CornerDownRight, Trash2 } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';
import { END_RUN, IconButton } from './stageParts';

function OtherwiseRow({ transition, hasConditions, stages, currentStageId, onSet, onRemove }) {
  const targets = stages.filter((s) => s.id !== currentStageId);
  const word = hasConditions ? 'Otherwise' : 'Go to';

  if (!transition) {
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#e1e0d9] px-2.5 py-2">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
          {word}
        </span>
        <CornerDownRight size={12} style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          {hasConditions ? 'nothing matches, so the run stops here' : 'nothing set, so the run stops here'}
        </span>
        <button
          type="button"
          onClick={() => onSet(targets[0]?.id ?? null)}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          Send somewhere instead
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[#e6e4dd] bg-[#fbfaf9] px-2.5 py-2">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: CHROME.textSecondary }}>
        {word}
      </span>
      <CornerDownRight size={12} style={{ color: CHROME.textMuted }} aria-hidden="true" />

      <select
        value={transition.toStageId ?? END_RUN}
        onChange={(e) => onSet(e.target.value === END_RUN ? null : e.target.value)}
        aria-label={`${word}, go to`}
        className="min-w-0 flex-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-xs outline-none focus:border-primary"
      >
        {targets.map((s) => (
          <option key={s.id} value={s.id}>{s.title || s.id}</option>
        ))}
        <option value={END_RUN}>— End the run —</option>
      </select>

      <IconButton icon={Trash2} label="Remove the otherwise arm" onClick={onRemove} danger />
    </div>
  );
}

export default memo(OtherwiseRow);
