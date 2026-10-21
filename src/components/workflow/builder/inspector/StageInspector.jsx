'use client';

import { memo } from 'react';
import { Flag, Layers } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import StageDeadlinePanel from '@/components/workflow/builder/StageDeadlinePanel';
import StageTransitions from '@/components/workflow/builder/stage/StageTransitions';
import InspectorShell from './InspectorShell';
import TitleInput from './TitleInput';
import StepProblems from './StepProblems';

/**
 * One stage, open in the side panel: its name, whether runs begin here, its
 * deadline, and where it goes once its steps are done. Its steps stay on the
 * canvas, where their order is.
 *
 * @param {{
 *   resolved: Object, stages: Array, startStageId: string|null, fields: Array,
 *   problems: string[],  the server's, for this stage and its transitions
 *   editing: ReturnType<import('../page/useBuilderEditing').useBuilderEditing>,
 *   onClose: () => void,
 * }} props
 */
function StageInspector({ resolved, stages, startStageId, fields, editing, problems = [], onClose }) {
  const { stage } = resolved;
  const isStart = startStageId === stage.id;
  const count = (stage.steps ?? []).length;

  return (
    <InspectorShell
      icon={isStart ? Flag : Layers}
      accent={isStart ? STATUS.info : CHROME.textSecondary}
      kicker={isStart ? 'Stage · every run begins here' : 'Stage'}
      title={
        <TitleInput
          value={stage.title}
          placeholder="Stage name"
          label="Stage name"
          onChange={(title) => editing.onUpdateStage(stage.id, { title })}
          onCommit={() => editing.onCommitStageTitle(stage.id)}
        />
      }
      onClose={onClose}
    >
      <StepProblems errors={problems} label="Problems with this stage" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          {count === 0 ? 'No steps yet' : `${count} step${count === 1 ? '' : 's'}`} — add and order them on the canvas.
        </p>
        {/* There is no "unset": a workflow always has exactly one start. */}
        {!isStart && (
          <button
            type="button"
            onClick={() => editing.onSetStart(stage.id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#e6e4dd] px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f6f5f3]"
            style={{ color: CHROME.textSecondary }}
            title="Make this the stage every run begins in"
          >
            <Flag size={11} aria-hidden="true" />
            Make it the start
          </button>
        )}
      </div>

      <StageDeadlinePanel stage={stage} stages={stages} onChange={(d) => editing.onSetDeadline(stage.id, d)} />

      <StageTransitions stage={stage} stages={stages} fields={fields} editing={editing} />
    </InspectorShell>
  );
}

export default memo(StageInspector);
