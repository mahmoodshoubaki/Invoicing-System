'use client';

import { memo } from 'react';
import { Plus } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { catchAllAt } from '@/lib/workflowBuilderState';
import SortableList, { SortableItem } from '@/components/workflow/builder/Sortable';
import TransitionRow from './TransitionRow';
import OtherwiseRow from './OtherwiseRow';

/**
 * Where a stage goes once its steps are done — its panel's "Then go to".
 * On the canvas, the same rules are the labelled connector below the stage.
 *
 * @param {{
 *   stage: Object, stages: Array, fields: Array,
 *   editing: ReturnType<import('../page/useBuilderEditing').useBuilderEditing>,
 * }} props
 */
function StageTransitions({ stage, stages, fields, editing }) {
  const { onAddTransition, onUpdateTransition, onRemoveTransition, onMoveTransition, onSetCatchAll } = editing;
  const transitions = stage.transitions ?? [];

  /*
   * An empty condition matches everything, so a transition holding one IS the
   * otherwise arm. The list splits on it: everything before is an if/else-if
   * chain, and the arm itself is drawn separately below.
   *
   * A definition saved before this rule existed can hold one mid-list. Those
   * rows stay exactly where they are rather than being silently reordered —
   * validateDefinition reports them, and the row renders in its error state.
   */
  const catchAllIndex = catchAllAt(transitions);
  const catchAll = catchAllIndex === -1 ? null : transitions[catchAllIndex];

  // Every row except the arm, carrying its index in the real array — the
  // update/remove/move actions address the wire order, not the screen order.
  const conditional = transitions
    .map((transition, at) => ({ transition, at }))
    .filter(({ at }) => at !== catchAllIndex);

  const strandedAfterCatchAll = catchAllIndex === -1 ? 0 : transitions.length - catchAllIndex - 1;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Then go to</h4>
        <button
          type="button"
          onClick={() => onAddTransition(stage.id)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          <Plus size={12} aria-hidden="true" />
          Add a condition
        </button>
      </div>

      {conditional.length > 0 && (
        <SortableList
          ids={conditional.map(({ at }) => `t-${at}`)}
          onReorder={(from, to) => onMoveTransition(stage.id, conditional[from].at, conditional[to].at)}
        >
          <ul className="flex flex-col gap-1.5" data-motion>
            {conditional.map(({ transition, at }, i) => (
              <SortableItem key={`t-${at}`} id={`t-${at}`}>
                <TransitionRow
                  transition={transition}
                  index={i}
                  total={conditional.length}
                  stages={stages}
                  currentStageId={stage.id}
                  fields={fields}
                  onUpdate={(patch) => onUpdateTransition(stage.id, at, patch)}
                  onRemove={() => onRemoveTransition(stage.id, at)}
                  onMove={(delta) => onMoveTransition(stage.id, at, at + delta)}
                />
              </SortableItem>
            ))}
          </ul>
        </SortableList>
      )}

      {/*
        The otherwise arm, always drawn — set or not. A run whose conditions
        all fail simply stops, which is a real outcome rather than an
        oversight, but it is invisible unless it is written down.
      */}
      <OtherwiseRow
        transition={catchAll}
        hasConditions={conditional.length > 0}
        stages={stages}
        currentStageId={stage.id}
        onSet={(toStageId) => onSetCatchAll(stage.id, true, toStageId)}
        onRemove={() => onSetCatchAll(stage.id, false)}
      />

      {/* Only reachable by loading a definition saved before the arm was
          forced last — the builder cannot produce this state. */}
      {strandedAfterCatchAll > 0 && (
        <p
          className="mt-2 rounded-lg px-2.5 py-2 text-[11px] leading-snug"
          style={{ backgroundColor: withAlpha(STATUS.critical, 0.1), color: CHROME.textSecondary }}
        >
          {strandedAfterCatchAll} transition{strandedAfterCatchAll === 1 ? '' : 's'} in this stage sit below a
          row that matches everything, so they can never be taken. Give that row a condition, or delete it.
        </p>
      )}

      {conditional.length > 1 && (
        <p className="mt-2 text-[11px]" style={{ color: CHROME.textMuted }}>
          Checked in order — the first whose condition matches wins.
        </p>
      )}
    </section>
  );
}

export default memo(StageTransitions);
