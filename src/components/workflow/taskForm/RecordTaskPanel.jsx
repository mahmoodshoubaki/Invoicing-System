'use client';

import { ClipboardCheck } from 'lucide-react';

import Card from '@/components/common/Card';
import TaskForm from '@/components/workflow/taskForm/TaskForm';
import { useRunTasks } from '@/components/workflow/taskForm/useRunTasks';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { allow, WORKFLOW_TASK_PERMISSIONS } from '@/constants/workflowPermissions';
import { faultAfterCompleting } from '@/store/slices/workflowTasksSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';

/**
 * The tasks a record's runs are waiting on, when they are the signed-in
 * person's to answer (2026-10-11) — the same form as My Tasks, on the record
 * itself. Everyone else sees the record read-only. Shared by the invoice page
 * and, since 2026-10-13, the BOQ item page.
 *
 * @param {{
 *   instanceIds: string|string[]|null,
 *   context?: Object|null,  what the form knows of the record (see TaskForm)
 *   onAnswered?: () => void, reloads the record — the task's fields are now on it
 * }} props
 */
export default function RecordTaskPanel({ instanceIds, context = null, onAnswered }) {
  const { can } = usePermission();
  const toast = useToast();
  const { tasks, reload } = useRunTasks(instanceIds, allow(can, WORKFLOW_TASK_PERMISSIONS.VIEW));

  if (tasks.length === 0) return null;

  const completed = ({ task, instance }) => {
    const fault = faultAfterCompleting(instance);
    if (fault) toast.error('Your answer was saved, but the run stopped', fault.message);
    else toast.success('Task completed', task.title ?? undefined);
    reload();
    onAnswered?.();
  };

  return tasks.map((task) => (
    <Card key={task.taskId}>
      <div className="mb-4 flex items-start gap-3 border-b border-gray-100 pb-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: withAlpha(STATUS.info, 0.12), color: STATUS.info }}
        >
          <ClipboardCheck size={15} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: STATUS.info }}>Your task</p>
          <h3 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{task.title}</h3>
          {task.dueOn && (
            <p className="text-xs" style={{ color: task.isOverdue ? STATUS.critical : CHROME.textMuted }}>
              {task.isOverdue ? 'Overdue — was due ' : 'Due '}{formatDateTime(task.dueOn)}
            </p>
          )}
        </div>
      </div>
      <TaskForm key={task.taskId} task={task} onCompleted={completed} context={context} />
    </Card>
  ));
}
