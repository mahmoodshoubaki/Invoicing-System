'use client';

import { ClipboardPaste, Plus, Scissors } from 'lucide-react';

import Button from '@/components/common/Button';
import StageLane from '@/components/workflow/builder/StageLane';
import FlowConnector from '@/components/workflow/builder/FlowConnector';
import TriggerNode from '@/components/workflow/builder/TriggerNode';
import { canvasSurface } from '@/components/workflow/builder/canvasStyles';
import SortableList, { DragPreview, SortableItem } from '@/components/workflow/builder/Sortable';
import { PasteSlot } from '@/components/workflow/builder/Selection';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { describeFilterGroup, isEmptyGroup } from '@/lib/filterDescription';
import { CLIP_KIND } from '@/lib/workflowClipboard';

/**
 * How a stage's transitions read on the connector below it. Edges carry the
 * condition and the target, because "first match wins" is invisible without them.
 */
function connectorEdges(stage, stages, fields) {
  return (stage.transitions ?? []).map((t, _i, all) => ({
    // The catch-all edge is not a condition, so it must not be labelled as
    // though it were one. With conditions above it it reads "otherwise"; as the
    // only edge, it is simply where the stage goes.
    label: isEmptyGroup(t.condition)
      ? (all.length > 1 ? 'otherwise' : 'go to')
      : describeFilterGroup(t.condition, fields, 2),
    isCatchAll: isEmptyGroup(t.condition),
    target: t.toStageId
      ? stages.find((s) => s.id === t.toStageId)?.title ?? t.toStageId
      : null,
  }));
}

/**
 * The canvas. A recessed, dot-gridded surface so the flow reads as a diagram
 * rather than a form — the shape every workflow tool converges on. Not a
 * free-positioning graph: StageDefinition has no x/y, so any layout an author
 * dragged would be lost on save.
 *
 * Cards here say what things are; what they are set to is in the side panel
 * beside it (2026-10-08). Click a card to open it there, or right-click it —
 * or press its ⋯ — for everything else.
 *
 * @param {{
 *   state: Object, fields: Array, ctx: Object,
 *   editing: ReturnType<import('./useBuilderEditing').useBuilderEditing>,
 *   clip: ReturnType<import('./useBuilderClipboard').useBuilderClipboard>,
 *   className?: string,
 * }} props
 */
export default function FlowCanvas({ state, fields, ctx, editing, clip, className = '' }) {
  const { stages, startStageId } = state.graph;
  const { selection, clipboard, isCut, clipLabel, clipVerb, cutIds, pasteStages, onSelect } = clip;
  const pastingStages = clipboard?.kind === CLIP_KIND.STAGE;
  const canvas = ctx.canvas;

  return (
    <div className={`relative rounded-2xl border border-[#e6e4dd] p-4 sm:p-5 ${className}`} style={canvasSurface}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
            Flow
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: '#ffffff', color: CHROME.textMuted, border: '1px solid #e6e4dd' }}
          >
            {stages.length} stage{stages.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* The flow's own Paste, like every step list's: always the end,
              whatever is selected. Ctrl+V is the one that follows the selection. */}
          {pastingStages && (
            <Button
              variant="outline"
              size="xs"
              icon={isCut ? Scissors : ClipboardPaste}
              onClick={() => pasteStages(stages.length)}
              title={`${clipVerb} ${clipLabel} to the end of the flow`}
            >
              {clipVerb} here
            </Button>
          )}
          <Button variant="outline" size="xs" icon={Plus} onClick={canvas.addStage}>
            Add stage
          </Button>
        </div>
      </div>

      <TriggerNode
        trigger={state.trigger}
        targetTypeKey={state.targetTypeKey}
        onOpen={({ focus }) => canvas.showWorkflow('settings', { focus })}
        onMenu={canvas.openWorkflowMenu}
      />

      <SortableList
        ids={stages.map((s) => s.id)}
        onReorder={editing.onMoveStage}
        // Having a preview is what makes every stage collapse to its header
        // while one is dragged — see SortableList.
        renderOverlay={(id) => {
          const stage = stages.find((s) => s.id === id);
          if (!stage) return null;
          const count = (stage.steps ?? []).length;
          return (
            <DragPreview
              accent={id === startStageId ? STATUS.info : CHROME.textSecondary}
              title={stage.title || stage.id}
              meta={count === 1 ? '1 step' : `${count} steps`}
            />
          );
        }}
      >
        {stages.map((stage, index) => (
          <SortableItem key={stage.id} id={stage.id}>
            {/* "Paste here" before this stage — and after the last one. */}
            {pastingStages && (
              <>
                <PasteSlot verb={clipVerb} label={`${clipVerb} ${clipLabel} here`} onPaste={() => pasteStages(index)} />
                {index === stages.length - 1 && (
                  <PasteSlot
                    verb={clipVerb}
                    label={`${clipVerb} ${clipLabel} here`}
                    onPaste={() => pasteStages(stages.length)}
                    edge="bottom"
                  />
                )}
              </>
            )}
            <StageLane
              stage={stage}
              index={index}
              stages={stages}
              isStart={startStageId === stage.id}
              selected={selection.kind === CLIP_KIND.STAGE && selection.ids.includes(stage.id)}
              cut={pastingStages && cutIds.has(stage.id)}
              onSelect={onSelect}
              ctx={ctx}
            />

            {/* Where it goes next — for every stage, the last too. */}
            <FlowConnector
              edges={connectorEdges(stage, stages, fields)}
              onEdgeClick={() => canvas.inspect('stage', stage.id)}
            />
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
}
