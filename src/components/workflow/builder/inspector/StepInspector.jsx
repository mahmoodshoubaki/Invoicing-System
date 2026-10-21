'use client';

import { memo, useCallback, useMemo } from 'react';

import { CHROME } from '@/theme/vizPalette';
import { STEP_ACCENTS, STEP_TYPE_INFO } from '@/constants/workflow';
import { validateStep } from '@/lib/workflowBuilderState';
import { stepProblems } from '@/lib/workflowProblems';
import { contextWithin } from '@/components/workflow/builder/containers/loopContext';
import { stepIcon } from '@/components/workflow/builder/stepIcons';
import { activeStepTab, stepTabs } from '@/components/workflow/builder/stepTabs';
import InspectorShell from './InspectorShell';
import TitleInput from './TitleInput';
import StepProblems from './StepProblems';
import StepEditor from './StepEditor';

/**
 * One step, open in the side panel: its name, its problems, and its settings.
 *
 * @param {{
 *   resolved: Object,  what resolveTarget found — the step and where it is
 *   ctx: Object,       the workflow-level step context
 *   tab: string|null, onTab: (key: string) => void, onClose: () => void,
 * }} props
 */
function StepInspector({ resolved, ctx, tab, onTab, onClose }) {
  const { step, stageId, container, index, insideParallelBranch, ancestors } = resolved;

  // What the step can read where it sits: a loop it is inside adds its item.
  const here = useMemo(() => contextWithin(ctx, ancestors), [ctx, ancestors]);

  const { onUpdateStep, onCommitStepTitle } = ctx;
  const patch = useCallback(
    (changes) => onUpdateStep(stageId, container, index, changes),
    [container, index, onUpdateStep, stageId]
  );

  const { errors: ownErrors } = validateStep(step, 'This step', here.fields, here.stageIds, false, {
    declaredNames: here.declaredNames,
    actions: here.actions,
    fieldsByTargetType: here.fieldsByTargetType,
    humanTaskIds: here.humanTaskIds,
    notificationTypeKeys: here.notificationTypeKeys ?? null,
    taskFields: here.taskFields ?? null,
  });
  const errors = here.serverProblems ? stepProblems(here.serverProblems, step.id) : ownErrors;

  const typeLabel = STEP_TYPE_INFO[step.type]?.label ?? 'Step';
  const active = activeStepTab(step.type, tab);

  return (
    <InspectorShell
      icon={stepIcon(step.type)}
      accent={STEP_ACCENTS[step.type] ?? CHROME.textMuted}
      kicker={typeLabel}
      title={
        <TitleInput
          value={step.title}
          placeholder={typeLabel}
          label="Step name"
          onChange={(title) => patch({ title })}
          onCommit={() => onCommitStepTitle(stageId, container, index)}
        />
      }
      onClose={onClose}
      tabs={stepTabs(step.type)}
      tab={active}
      onTab={onTab}
    >
      <StepProblems errors={errors} />
      <StepEditor
        step={step}
        tab={active}
        ctx={here}
        stageId={stageId}
        insideParallelBranch={insideParallelBranch}
        onChange={patch}
      />
    </InspectorShell>
  );
}

export default memo(StepInspector);
