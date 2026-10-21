'use client';

import { memo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, CornerDownRight, SlidersHorizontal, Trash2 } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { describeFilterGroup, isEmptyGroup } from '@/lib/filterDescription';
import ConditionBuilder from '@/components/workflow/builder/conditions/ConditionBuilder';
import { END_RUN, IconButton } from './stageParts';

const ordinal = (n) => `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/**
 * One CONDITIONAL transition out of a stage — an `if` or an `else if`.
 *
 * Order is meaningful — the engine takes the FIRST whose condition matches — so
 * these are numbered and movable rather than rendered as an unordered set.
 *
 * The otherwise arm is deliberately NOT one of these. A transition with an
 * empty condition matches everything, so rendering it in this list as though it
 * were an ordinary row is what allowed a stage to hold an unconditional "go to
 * Stage 1" with more transitions underneath that could never be taken. It gets
 * its own row at the bottom instead (OtherwiseRow), where it cannot be
 * reordered or repeated.
 *
 * Two lines, so it fits the side panel: the condition, then where it goes.
 */
function TransitionRow({ transition, index, total, stages, currentStageId, fields, onUpdate, onRemove, onMove }) {
  const [editingCondition, setEditingCondition] = useState(false);

  // A stage cannot transition back to itself, so it is not offered. A loaded
  // definition that already contains one keeps it visible and flagged rather
  // than having the select silently coerce it to some other stage.
  const targets = stages.filter((s) => s.id !== currentStageId);
  const isSelfLoop = transition.toStageId === currentStageId;

  const summary = describeFilterGroup(transition.condition, fields);
  const isCatchAll = isEmptyGroup(transition.condition);

  return (
    <li className="rounded-lg border border-[#f1f0ee] bg-[#fbfaf9]">
      <div className="flex items-center gap-2 px-2.5 pt-2">
        <span
          className="w-10 shrink-0 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: CHROME.textMuted }}
          title={index === 0 ? 'Checked first' : `Checked ${ordinal(index + 1)}`}
        >
          {index === 0 ? 'If' : 'Else if'}
        </span>

        {/* The condition as a sentence, and a real control. It reads far more
            often than it is edited, so it stays a summary — but it has to LOOK
            clickable, or the condition editor goes unnoticed. */}
        <button
          type="button"
          onClick={() => setEditingCondition((v) => !v)}
          aria-expanded={editingCondition}
          className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-left text-xs transition-colors hover:border-[#c9c7bf] hover:bg-[#fbfaf9]"
          style={{
            borderColor: isCatchAll ? STATUS.critical : editingCondition ? CHROME.textSecondary : '#e6e4dd',
            color: isCatchAll ? STATUS.critical : CHROME.textPrimary,
          }}
          title={
            isCatchAll
              ? 'This row has no condition, so it matches everything and shadows the rows below it. Give it a condition, or delete it and use the otherwise arm.'
              : `${summary} — click to edit`
          }
        >
          <SlidersHorizontal size={11} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            {isCatchAll ? 'no condition — matches everything' : summary}
          </span>
          {editingCondition ? (
            <ChevronDown size={11} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          ) : (
            <ChevronRight size={11} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          )}
        </button>

        <div className="flex shrink-0 items-center">
          <IconButton icon={ArrowUp} label="Check earlier" onClick={() => onMove(-1)} disabled={index === 0} />
          <IconButton icon={ArrowDown} label="Check later" onClick={() => onMove(1)} disabled={index === total - 1} />
          <IconButton icon={Trash2} label="Remove this condition" onClick={onRemove} danger />
        </div>
      </div>

      <div className="flex items-center gap-2 px-2.5 pb-2 pt-1.5">
        <span className="flex w-10 shrink-0 justify-end" style={{ color: CHROME.textMuted }}>
          <CornerDownRight size={13} aria-hidden="true" />
        </span>
        <select
          value={transition.toStageId ?? END_RUN}
          onChange={(e) => onUpdate({ toStageId: e.target.value === END_RUN ? null : e.target.value })}
          aria-label={`Where condition ${index + 1} goes`}
          className="min-w-0 flex-1 rounded-md bg-white px-2 py-1 text-xs outline-none focus:border-primary"
          style={{ border: `1px solid ${isSelfLoop ? STATUS.critical : '#e5e7eb'}` }}
        >
          {isSelfLoop && <option value={currentStageId}>Back to this stage — not allowed</option>}
          {targets.map((s) => (
            <option key={s.id} value={s.id}>{s.title || s.id}</option>
          ))}
          <option value={END_RUN}>— End the run —</option>
        </select>
      </div>

      {editingCondition && (
        <div className="border-t border-[#f1f0ee] p-2.5">
          <ConditionBuilder
            value={transition.condition}
            onChange={(condition) => onUpdate({ condition })}
            fields={fields}
          />
        </div>
      )}
    </li>
  );
}

export default memo(TransitionRow);
