'use client';

import { memo, useMemo } from 'react';
import { ClipboardPaste, Scissors } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';
import { STEP_ACCENTS, STEP_TYPE_INFO } from '@/constants/workflow';
import StepCard from './StepCard';
import StepPalette from './StepPalette';
import SortableList, { DragPreview, SortableItem } from './Sortable';
import { PasteSlot } from './Selection';

/**
 * A list of steps at one place in the tree, with its own palette.
 *
 * `container` is the path from the stage's own step list inward — see
 * `getStepContainer`. Every level of nesting renders another of these with a
 * longer path, which is what makes the builder recursive: a `branch` inside a
 * `forEach` inside a `parallel` branch needs no special casing.
 *
 * `insideParallelBranch` travels down rather than being recomputed, because a
 * step three levels below a branch is still inside it — and the three types
 * that cannot park a run are just as forbidden down there.
 */
function StepList({
  stageId, container, steps, ctx, insideParallelBranch, insideCut = false,
  label = 'Steps', emptyText = 'No steps yet.', compact = false,
}) {
  // One array for both the drag order and a Shift-click range.
  const ids = useMemo(() => steps.map((s) => s.id), [steps]);

  // Steps that can never go here say so before the click rather than after it:
  // cut steps cannot move inside themselves, and a delay or parallel step
  // cannot run in a parallel branch.
  const verb = ctx.stepClipVerb ?? 'Paste';
  const blockedReason = insideCut && ctx.stepClipIsCut
    ? 'steps cannot be moved inside themselves.'
    : insideParallelBranch ? ctx.stepClipBranchProblem : null;
  const paste = (index) => ctx.onPasteSteps({ stageId, container, index, insideParallelBranch });
  const slot = (index, edge) => ctx.stepClipLabel && (
    <PasteSlot
      verb={verb}
      label={`${verb} ${ctx.stepClipLabel} here`}
      blockedReason={blockedReason}
      onPaste={() => paste(index)}
      edge={edge}
    />
  );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h4
          className={compact ? 'text-[11px] font-semibold' : 'text-xs font-semibold'}
          style={{ color: CHROME.textSecondary }}
        >
          {label}
        </h4>
        <div className="flex items-center">
          {/* Only while steps are copied. Every list has one, because an empty
              arm or branch has no step to select and paste after. */}
          {ctx.stepClipLabel && (
            <button
              type="button"
              onClick={() => paste(steps.length)}
              disabled={Boolean(blockedReason)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ color: CHROME.textSecondary }}
              title={
                blockedReason
                  ? `Can't ${verb.toLowerCase()} here: ${blockedReason}`
                  : `${verb} ${ctx.stepClipLabel} to the end of this list`
              }
            >
              {ctx.stepClipIsCut ? <Scissors size={12} aria-hidden="true" /> : <ClipboardPaste size={12} aria-hidden="true" />}
              {verb} here
            </button>
          )}
          <StepPalette
            insideParallelBranch={insideParallelBranch}
            onAdd={(step) => ctx.onAddStep(stageId, container, step)}
          />
        </div>
      </div>

      {steps.length === 0 ? (
        <div className="relative">
          {/* An empty arm or branch is a place to paste too. */}
          {slot(0, 'top')}
          <p
            className="rounded-lg border border-dashed px-3 py-2 text-[11px]"
            style={{ borderColor: '#e1e0d9', color: CHROME.textMuted }}
          >
            {emptyText}
          </p>
        </div>
      ) : (
        <SortableList
          ids={ids}
          onReorder={(from, to) => ctx.onMoveStep(stageId, container, from, to)}
          renderOverlay={(id) => {
            const step = steps.find((s) => s.id === id);
            if (!step) return null;
            const kind = STEP_TYPE_INFO[step.type]?.label;
            return <DragPreview accent={STEP_ACCENTS[step.type]} title={step.title || kind || step.id} meta={kind} />;
          }}
        >
        <div className="flex flex-col gap-1.5">
          {steps.map((step, index) => (
            <SortableItem key={step.id} id={step.id}>
            {/* Before this step — and, on the last one, after everything. */}
            {slot(index, 'top')}
            {index === steps.length - 1 && slot(steps.length, 'bottom')}
            <StepCard
              step={step}
              index={index}
              total={steps.length}
              stageId={stageId}
              container={container}
              ctx={ctx}
              insideParallelBranch={insideParallelBranch}
              insideCut={insideCut}
              siblingIds={ids}
            />
            </SortableItem>
          ))}
        </div>
        </SortableList>
      )}
    </div>
  );
}

export default memo(StepList);
