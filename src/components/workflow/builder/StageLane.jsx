'use client';

import { memo, useState } from 'react';
import { AlarmClock, ChevronDown, ChevronRight, Flag, Layers } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { stageProblems } from '@/lib/workflowProblems';
import { CLIP_KIND } from '@/lib/workflowClipboard';
import { STEP_ACCENTS, STEP_TYPE_INFO } from '@/constants/workflow';
import { cutStyle, iconChip, nodeCard, selectedOutline, startNodeCard, withActiveRing } from './canvasStyles';
import StepList from './StepList';
import { useListSorting } from './Sortable';
import { SelectBox, selectOnModifierClick } from './Selection';
import MenuButton from './menu/MenuButton';
import { menuOnRightClick, openOnHeaderClick } from './menu/cardEvents';

const EMPTY_CONTAINER = [];

/**
 * @param {{ stage: Object, index: number, stages: Array, isStart: boolean, ctx: Object, selected?: boolean, cut?: boolean, onSelect: Function, }} props
 */
function StageLane({ stage, index, stages, isStart, ctx, selected = false, cut = false, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const sorting = useListSorting();

  const steps = stage.steps ?? [];
  const accent = isStart ? STATUS.info : CHROME.textSecondary;
  const title = stage.title || 'Untitled stage';

  const kinds = [...new Set(steps.map((s) => s.type))];

  const problems = stageProblems(ctx.serverProblems, stage.id);

  const canvas = ctx.canvas;
  const active = canvas?.inspecting?.kind === 'stage' && canvas.inspecting.id === stage.id;

  const pick = ({ range }) => onSelect(CLIP_KIND.STAGE, stage.id, { range, listIds: stages.map((s) => s.id) });
  const open = ({ focus }) => canvas?.inspect('stage', stage.id, null, { focus });
  const openMenu = (from) => canvas?.openStageMenu(from, { stage, index, isStart });

  const card = isStart ? startNodeCard(STATUS.info) : nodeCard;

  return (
    <div
      onContextMenu={menuOnRightClick(openMenu)}
      style={{
        ...card,
        ...(active ? { boxShadow: withActiveRing(card.boxShadow) } : null),
        ...(selected ? selectedOutline : null),
        ...(cut ? cutStyle : null),
      }}
    >
      <div
        className="flex cursor-pointer items-center gap-2.5 p-3"
        onMouseDown={selectOnModifierClick(pick)}
        onClick={openOnHeaderClick(open)}
      >
        <SelectBox checked={selected} label={`Select "${title}" to copy`} onPick={pick} />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Hide its steps' : 'Show its steps'}
          aria-expanded={expanded}
          className="rounded-md p-0.5 transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textMuted }}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <div style={iconChip(accent, 32)}>
          {isStart ? <Flag size={15} aria-hidden="true" /> : <Layers size={15} aria-hidden="true" />}
        </div>

        <button
          type="button"
          data-open
          className="min-w-0 flex-1 text-left focus:outline-none focus-visible:underline"
          title={`${title} — open its properties`}
          aria-label={`${title}, stage${isStart ? ', where every run begins' : ''}. Open its properties`}
        >
          <span className="block truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
            {title}
          </span>

          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {isStart && (
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: STATUS.info }}>
                Start
              </span>
            )}
            <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
              {steps.length === 0 ? 'no steps' : `${steps.length} step${steps.length === 1 ? '' : 's'}`}
            </span>
            {kinds.map((kind) => (
              <span
                key={kind}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STEP_ACCENTS[kind] ?? CHROME.textMuted }}
                title={STEP_TYPE_INFO[kind]?.label}
              />
            ))}
            {stage.deadline && (
              <span
                className="inline-flex items-center gap-0.5 px-1 text-[10px] font-medium"
                style={{ color: STATUS.warning }}
                title="This stage escalates if nobody acts in time"
              >
                <AlarmClock size={9} aria-hidden="true" />
                deadline
              </span>
            )}
          </span>
        </button>

        {problems.length > 0 && (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: withAlpha(STATUS.critical, 0.12), color: STATUS.critical }}
            title={problems.join(String.fromCharCode(10))}
          >
            {problems.length}
          </span>
        )}

        <MenuButton label={`${title} — actions`} onOpen={openMenu} />
      </div>

      {expanded && !sorting && (
        <div className="border-t border-[#f1f0ee] px-3 py-3">
          <StepList
            stageId={stage.id}
            container={EMPTY_CONTAINER}
            steps={steps}
            ctx={ctx}
            insideParallelBranch={false}
            emptyText="No steps — a run entering this stage moves straight on."
          />
        </div>
      )}
    </div>
  );
}

export default memo(StageLane);
