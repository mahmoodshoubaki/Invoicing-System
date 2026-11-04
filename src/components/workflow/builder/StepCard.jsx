'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { STEP_ACCENTS, STEP_TYPE_INFO } from '@/constants/workflow';
import { validateStep } from '@/lib/workflowBuilderState';
import { CLIP_KIND } from '@/lib/workflowClipboard';
import { stepProblems } from '@/lib/workflowProblems';
import { cutStyle, iconChip, selectedOutline, withActiveRing } from './canvasStyles';
import { useListSorting } from './Sortable';
import { SelectBox, selectOnModifierClick } from './Selection';
import { FALLBACK_STEP_ICON, STEP_ICONS } from './stepIcons';
import { summariseStep } from './stepSummary';
import { CONTAINER_BODIES } from './containers/containerBodies';
import MenuButton from './menu/MenuButton';
import { menuOnRightClick, openOnHeaderClick } from './menu/cardEvents';

function StepCard({ step, index, total, stageId, container, ctx, insideParallelBranch, siblingIds, insideCut = false }) {
  const [bodyOpen, setBodyOpen] = useState(true);
  const sorting = useListSorting();

  const Icon = STEP_ICONS[step.type] ?? FALLBACK_STEP_ICON;
  const Body = CONTAINER_BODIES[step.type] ?? null;
  const typeLabel = STEP_TYPE_INFO[step.type]?.label ?? 'Step';

  const { errors: ownErrors } = validateStep(step, 'This step', ctx.fields, ctx.stageIds, false, {
    declaredNames: ctx.declaredNames,
    actions: ctx.actions,
    fieldsByTargetType: ctx.fieldsByTargetType,
    humanTaskIds: ctx.humanTaskIds,
    notificationTypeKeys: ctx.notificationTypeKeys ?? null,
    taskFields: ctx.taskFields ?? null,
  });
  const errors = ctx.serverProblems ? stepProblems(ctx.serverProblems, step.id) : ownErrors;
  const hasProblem = errors.length > 0;

  const patch = useCallback(
    (changes) => ctx.onUpdateStep(stageId, container, index, changes),
    [container, ctx, index, stageId]
  );

  const where = useMemo(
    () => ({ stageId, container, index, insideParallelBranch }),
    [container, index, insideParallelBranch, stageId]
  );

  const isCut = ctx.cutStepIds?.has(step.id) ?? false;
  const selected = ctx.selectedStepIds?.has(step.id) ?? false;
  const canvas = ctx.canvas;
  const active = canvas?.inspecting?.kind === 'step' && canvas.inspecting.id === step.id;

  const pick = ({ range }) => ctx.onSelect(CLIP_KIND.STEP, step.id, { range, listIds: siblingIds ?? [] });
  const open = ({ focus }) => canvas?.inspect('step', step.id, null, { focus });
  const openMenu = (from) => canvas?.openStepMenu(from, { step, where, total, insideCut: insideCut || isCut });

  const accent = STEP_ACCENTS[step.type] ?? CHROME.textMuted;
  const title = step.title || typeLabel;
  const hairline = `inset 3px 0 0 ${hasProblem ? STATUS.critical : accent}`;

  return (
    <div
      className="rounded-xl bg-white transition-shadow hover:shadow-sm"
      onContextMenu={menuOnRightClick(openMenu)}
      style={{
        border: `1px solid ${hasProblem ? withAlpha(STATUS.critical, 0.4) : '#eceae4'}`,
        boxShadow: active ? withActiveRing(hairline) : hairline,
        ...(selected ? selectedOutline : null),
        ...(isCut ? cutStyle : null),
      }}
    >
      <div
        className="flex cursor-pointer items-center gap-2 py-2 pl-3 pr-1.5"
        onMouseDown={selectOnModifierClick(pick)}
        onClick={openOnHeaderClick(open)}
      >
        <SelectBox checked={selected} label={`Select "${title}" to copy`} onPick={pick} />

        {Body && (
          <button
            type="button"
            onClick={() => setBodyOpen((v) => !v)}
            aria-label={bodyOpen ? 'Hide the steps inside' : 'Show the steps inside'}
            aria-expanded={bodyOpen}
            className="rounded-md p-0.5 transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textMuted }}
          >
            {bodyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        <div style={iconChip(accent, 26)}>
          <Icon size={13} aria-hidden="true" />
        </div>

        <button
          type="button"
          data-open
          className="min-w-0 flex-1 text-left focus:outline-none focus-visible:underline"
          title={`${title} — open its properties`}
          aria-label={`${title}, ${typeLabel}. Open its properties`}
        >
          <span className="block truncate text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
            {title}
          </span>
          <span className="block truncate text-[11px]" style={{ color: CHROME.textMuted }}>
            <span style={{ color: accent, fontWeight: 600 }}>{typeLabel}</span>
            {' · '}
            {summariseStep(step, ctx)}
          </span>
        </button>

        {hasProblem && (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: withAlpha(STATUS.critical, 0.12), color: STATUS.critical }}
            title={errors.join('\n')}
          >
            {errors.length}
          </span>
        )}

        <MenuButton label={`${title} — actions`} onOpen={openMenu} />
      </div>

      {Body && bodyOpen && !sorting && (
        <div className="border-t border-[#f1f0ee] p-2.5">
          <Body
            step={step}
            stageId={stageId}
            container={container}
            index={index}
            ctx={ctx}
            insideParallelBranch={insideParallelBranch}
            insideCut={insideCut || isCut}
            fields={ctx.fields}
            onChange={patch}
          />
        </div>
      )}
    </div>
  );
}

export default memo(StepCard);
