'use client';

/** Pieces every container-step editor uses: the field look, labels, notes, and the nested step list. */

import { Info } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/** Shared empty list so an absent catalog keeps a stable identity. */
export const EMPTY_LISTS = [];

export const EMPTY_FIELDS = [];

export const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

export function Label({ children, hint }) {
  return (
    <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
      {children}
      {hint && <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>{hint}</span>}
    </p>
  );
}

export function Note({ tone = CHROME.textMuted, icon: Icon = Info, children }) {
  return (
    <p
      className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
      style={{ backgroundColor: tone === CHROME.textMuted ? '#fbfaf9' : withAlpha(tone, 0.1), color: CHROME.textSecondary }}
    >
      <Icon size={11} className="mt-0.5 shrink-0" style={{ color: tone }} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Shared props every nested StepList needs. */
export function nested(props, list, extra = {}) {
  const { stageId, container, index, ctx, insideParallelBranch, insideCut } = props;
  return {
    stageId,
    container: [...container, { index, list, ...extra }],
    ctx,
    insideParallelBranch,
    // Inside a step being moved, at any depth — not a place it can move to.
    insideCut,
    compact: true,
  };
}
