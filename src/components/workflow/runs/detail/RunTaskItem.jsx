import { AlarmClock, UserPlus } from 'lucide-react';

import AssigneeList from '@/components/workflow/AssigneeList';
import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { TASK_STATUS, TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/constants/workflow';

/**
 * @param {{ task: Object, canReassign: boolean, onReassign: (task) => void }} props
 */
export default function RunTaskItem({ task, canReassign, onReassign }) {
  const tone = TASK_STATUS_COLORS[task.statusKey] ?? CHROME.textMuted;
  const pending = task.statusKey === TASK_STATUS.PENDING;

  return (
    <li className="rounded-lg border p-2.5" style={{ borderColor: pending ? withAlpha(tone, 0.35) : '#f1f0ee' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs font-medium" style={{ color: CHROME.textPrimary }}>
          {task.title}
        </p>
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: withAlpha(tone, 0.12), color: tone }}
        >
          {TASK_STATUS_LABELS[task.statusKey] ?? task.status}
        </span>
      </div>

      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>
        <span className="font-mono">{task.stepId}</span>
        {pending && task.dueOn && (
          <span className="inline-flex items-center gap-1">
            <AlarmClock size={10} aria-hidden="true" />
            due {formatDateTime(task.dueOn)}
          </span>
        )}
        {task.completedOn && <span>{formatDateTime(task.completedOn)}</span>}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <AssigneeList users={task.assignedUsers} roles={task.assignedRoles} groups={task.assignedGroups} compact />
        {pending && canReassign && (
          <button
            type="button"
            onClick={() => onReassign(task)}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textSecondary }}
            title="Hand this task to somebody else"
          >
            <UserPlus size={11} aria-hidden="true" />
            Reassign
          </button>
        )}
      </div>

      {task.statusKey === TASK_STATUS.REASSIGNED && task.reassignedToName && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
          Handed to <strong style={{ color: CHROME.textPrimary }}>{task.reassignedToName}</strong>
        </p>
      )}

      {task.outcome && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
          <strong style={{ color: tone }}>{task.outcome}</strong>
          {task.completedByName && <> by {task.completedByName}</>}
        </p>
      )}

      {task.reason && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
          Reason: <strong style={{ color: CHROME.textPrimary }}>{task.reason}</strong>
        </p>
      )}

      {task.comment && (
        <p className="mt-1 rounded-md px-2 py-1 text-[11px] leading-snug" style={{ backgroundColor: '#fbfaf9', color: CHROME.textSecondary }}>
          {task.comment}
        </p>
      )}

      {pending && (task.outcomes ?? []).length > 0 && (
        <p className="mt-1.5 flex flex-wrap gap-1">
          {task.outcomes.map((outcome) => (
            <span
              key={outcome}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: '#f1f0ee', color: CHROME.textSecondary }}
            >
              {outcome}
            </span>
          ))}
        </p>
      )}
    </li>
  );
}
