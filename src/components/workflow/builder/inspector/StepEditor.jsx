'use client';

import { memo } from 'react';

import { AUTOMATED_MODE, STEP_TYPE } from '@/constants/workflow';
import { CHROME } from '@/theme/vizPalette';
import HumanTaskEditor from '@/components/workflow/builder/HumanTaskEditor';
import TaskNotificationsPanel from '@/components/workflow/builder/TaskNotificationsPanel';
import TaskFieldsPanel from '@/components/workflow/builder/TaskFieldsPanel';
import AutomatedEditor from '@/components/workflow/builder/automated/AutomatedEditor';
import DelayEditor from '@/components/workflow/builder/DelayEditor';
import SetVariableEditor from '@/components/workflow/builder/SetVariableEditor';
import SendMessageFields from '@/components/workflow/builder/notifications/SendMessageFields';
import SendRecipientsFields from '@/components/workflow/builder/notifications/SendRecipientsFields';
import { BranchEditor } from '@/components/workflow/builder/containers/BranchEditor';
import { ForEachEditor } from '@/components/workflow/builder/containers/ForEachEditor';
import { ParallelEditor } from '@/components/workflow/builder/containers/ParallelEditor';
import { QueryEditor } from '@/components/workflow/builder/containers/QueryEditor';
import { RepeatEditor } from '@/components/workflow/builder/containers/RepeatEditor';

/**
 * The settings of one step, at one of its panel's tabs (stepTabs).
 *
 * `ctx` is the context AT the step — inside a For each it includes the loop
 * item's fields — so conditions and value menus here offer what the step can
 * really read.
 *
 * @param {{
 *   step: Object, tab: string, ctx: Object, stageId: string,
 *   insideParallelBranch: boolean, onChange: (patch: Object) => void,
 * }} props
 */
function StepEditor({ step, tab, ctx, stageId, insideParallelBranch, onChange }) {
  const fields = ctx.fields;

  switch (step.type) {
    case STEP_TYPE.HUMAN_TASK:
      if (tab === 'fields') return <TaskFieldsPanel step={step} fields={fields} taskFields={ctx.taskFields} onChange={onChange} />;
      return tab === 'notifications' ? (
        <TaskNotificationsPanel step={step} types={ctx.notificationTypes ?? null} fields={fields} onChange={onChange} />
      ) : (
        <HumanTaskEditor
          step={step}
          roles={ctx.roles}
          rolesLoading={ctx.rolesLoading}
          resolvedById={ctx.resolvedById}
          stageId={stageId}
          stages={ctx.stages}
          fields={fields}
          onChange={onChange}
        />
      );

    case STEP_TYPE.SEND_NOTIFICATION:
      return tab === 'recipients'
        ? <SendRecipientsFields step={step} ctx={ctx} onChange={onChange} />
        : <SendMessageFields step={step} ctx={ctx} onChange={onChange} />;

    case STEP_TYPE.AUTOMATED:
      return (
        <div className="flex flex-col gap-2">
          <AutomatedEditor
            step={step}
            actions={ctx.actions}
            approvedHosts={ctx.approvedHosts}
            fields={fields}
            insideParallelBranch={insideParallelBranch}
            onChange={onChange}
          />
          {step.mode === AUTOMATED_MODE.QUEUE_AND_RETRY && (
            <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
              A parked run stays <em>Running</em> and keeps its current stage. After repeated failures
              it becomes Faulted, and the reason names this step.
            </p>
          )}
        </div>
      );

    case STEP_TYPE.DELAY:
      return <DelayEditor step={step} onChange={onChange} />;

    case STEP_TYPE.SET_VARIABLE:
      return <SetVariableEditor step={step} ctx={ctx} insideParallelBranch={insideParallelBranch} onChange={onChange} />;

    case STEP_TYPE.BRANCH:
      return <BranchEditor step={step} fields={fields} onChange={onChange} />;

    case STEP_TYPE.FOR_EACH:
      return <ForEachEditor step={step} ctx={ctx} onChange={onChange} />;

    case STEP_TYPE.REPEAT:
      return <RepeatEditor step={step} fields={fields} onChange={onChange} />;

    case STEP_TYPE.PARALLEL:
      return <ParallelEditor step={step} fields={fields} onChange={onChange} />;

    case STEP_TYPE.QUERY:
      return <QueryEditor step={step} ctx={ctx} fields={fields} onChange={onChange} />;

    default:
      return (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          This kind of step has nothing to set here.
        </p>
      );
  }
}

export default memo(StepEditor);
