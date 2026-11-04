'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Calendar, CheckCircle2, Lock, MessageSquare, PauseCircle, TextCursorInput, UserPlus,
} from 'lucide-react';

import Table from '@/components/common/Table';
import EmptyState from '@/components/common/EmptyState';
import AssigneeList from '@/components/workflow/AssigneeList';
import ProjectLink from '@/components/workflow/ProjectLink';
import TargetLinks from '@/components/workflow/TargetLinks';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { pageInfo } from '@/lib/pageInfo';
import { readableTextOn, withAlpha } from '@/utils/color';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';
import {
  INSTANCE_STATUS, INSTANCE_STATUS_LABELS, TASK_STATUS, TASK_STATUS_COLORS, TASK_STATUS_LABELS,
} from '@/constants/workflow';

export const TASK_FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export const TASK_FILTER_STATUS = {
  [TASK_FILTERS.ALL]: null,
  [TASK_FILTERS.PENDING]: TASK_STATUS.PENDING,
  [TASK_FILTERS.COMPLETED]: TASK_STATUS.COMPLETED,
};

export const TASK_PAGE_SIZE = 10;

function dueLabel(dueOn, isOverdue) {
  if (!dueOn) return null;
  if (isOverdue) return 'Overdue';

  const days = Math.ceil((new Date(dueOn) - Date.now()) / 86400000);
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${formatDate(dueOn)}`;
}

function rowState(task, canAct) {
  const settled = task.statusKey != null && task.statusKey !== TASK_STATUS.PENDING;
  const runStopped = task.runStatusKey != null && task.runStatusKey !== INSTANCE_STATUS.RUNNING;
  const readOnly = !canAct || !task.canAct;
  return { settled, runStopped, readOnly, answerable: !settled && !runStopped && !readOnly };
}

function TaskTable({
  tasks, filter = TASK_FILTERS.ALL, total = 0, page = 1, onPageChange, pageSize = TASK_PAGE_SIZE, onPageSizeChange = null, isLoading = false,
  onComplete, onAsk, onOpenForm, completingTaskId, canAct, canReassign, canViewRuns, onReassign,
}) {
  const columns = useMemo(() => [
    {
      key: 'title',
      label: 'Task',
      render: (_, task) => {
        const { settled } = rowState(task, canAct);
        const tone = TASK_STATUS_COLORS[task.statusKey];
        return (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {canViewRuns ? (
                <Link
                  href={ROUTES.MONITORING_RUN(task.instanceId)}
                  className="text-xs font-semibold underline-offset-2 hover:underline"
                  style={{ color: CHROME.textPrimary }}
                >
                  {task.title ?? 'Untitled task'}
                </Link>
              ) : (
                <span className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
                  {task.title ?? 'Untitled task'}
                </span>
              )}
              {settled && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: withAlpha(tone ?? CHROME.textMuted, 0.12), color: tone ?? CHROME.textMuted }}
                >
                  {TASK_STATUS_LABELS[task.statusKey] ?? 'Settled'}
                </span>
              )}
              {task.statusKey === TASK_STATUS.REASSIGNED && task.reassignedToName && (
                <span className="text-[11px]" style={{ color: CHROME.textSecondary }}>
                  to {task.reassignedToName}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>
              <span className="font-mono">{task.definitionName}</span> - v{task.definitionVersion}
              {task.currentStageTitle && ` · ${task.currentStageTitle}`}
            </p>
          </div>
        );
      },
    },
    {
      key: 'projectCode',
      label: 'Request / Project',
      render: (code, task) => (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <TargetLinks targetTypeKey={task.targetTypeKey} targetIds={task.targetIds} projectCode={code} size="xs" />
          <ProjectLink projectCode={code} size="xs" />
        </span>
      ),
    },
    {
      key: 'assignees',
      label: 'Assigned to',
      sortable: false,
      render: (_, task) => (
        <AssigneeList users={task.assignedUsers} roles={task.assignedRoles} groups={task.assignedGroups} compact />
      ),
    },
    {
      key: 'createdOn',
      label: 'Created',
      sortable: true,
      render: (createdOn) => (createdOn ? (
        <span className="whitespace-nowrap text-[11px]" style={{ color: CHROME.textSecondary }}>
          {formatDateTime(createdOn)}
        </span>
      ) : (
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>—</span>
      )),
    },
    {
      key: 'dueOn',
      label: 'Due',
      render: (dueOn, task) => {
        const due = dueLabel(dueOn, task.isOverdue);
        if (!due) return <span className="text-[11px]" style={{ color: CHROME.textMuted }}>—</span>;
        return (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={
              task.isOverdue
                ? { backgroundColor: withAlpha(STATUS.critical, 0.1), color: STATUS.critical }
                : { backgroundColor: '#f6f5f3', color: CHROME.textSecondary }
            }
            title={formatDateTime(dueOn)}
          >
            {task.isOverdue ? <AlertTriangle size={10} aria-hidden="true" /> : <Calendar size={10} aria-hidden="true" />}
            {due}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, task) => {
        const { settled, runStopped, readOnly } = rowState(task, canAct);
        const busy = completingTaskId === task.taskId;

        let answer;
        if (settled) {
          answer = (
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: CHROME.textMuted }}>
              <CheckCircle2 size={11} aria-hidden="true" />
              Nothing left to answer
            </span>
          );
        } else if (runStopped) {
          answer = (
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: CHROME.textMuted }}
              title="The run is not going, so this cannot be answered until it is resumed."
            >
              <PauseCircle size={11} aria-hidden="true" />
              Run {(INSTANCE_STATUS_LABELS[task.runStatusKey] ?? 'stopped').toLowerCase()}
            </span>
          );
        } else if (readOnly) {
          answer = (
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: CHROME.textMuted }}
              title="You can follow this task but are not able to answer it."
            >
              <Lock size={11} aria-hidden="true" />
              Read-only
            </span>
          );
        } else if (task.buttons.length === 0) {
          answer = <span className="text-[11px]" style={{ color: CHROME.textMuted }}>No outcomes defined</span>;
        } else if ((task.fields?.length ?? 0) > 0) {
          answer = (
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpenForm?.(task)}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              title={`Fill in ${task.fields.length} field${task.fields.length === 1 ? '' : 's'} and answer`}
            >
              <TextCursorInput size={11} aria-hidden="true" />
              Fill in &amp; answer
            </button>
          );
        } else {
          answer = (
            <span className="flex flex-wrap items-center justify-end gap-1.5">
              {task.buttons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  disabled={busy}
                  onClick={() => (button.requiresComment || button.reasons
                    ? onAsk?.(task, button)
                    : onComplete({ task, outcomeKey: button.key, comment: null }))}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: button.colorHex ?? '#f1f0ee',
                    color: readableTextOn(button.colorHex, CHROME.textPrimary),
                  }}
                  title={button.reasons ? `${button.label} — asks for a reason` : button.requiresComment ? `${button.label} — asks for a comment` : button.label}
                >
                  {(button.requiresComment || button.reasons) && <MessageSquare size={10} aria-hidden="true" />}
                  {button.label}
                </button>
              ))}
            </span>
          );
        }

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {answer}
            {canReassign && !settled && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onReassign?.(task)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: CHROME.textSecondary }}
                title="Hand this task to somebody else"
              >
                <UserPlus size={11} aria-hidden="true" />
                Hand on
              </button>
            )}
          </div>
        );
      },
    },
  ], [canAct, canReassign, canViewRuns, completingTaskId, onAsk, onComplete, onOpenForm, onReassign]);

  if (!isLoading && total === 0) {
    const empty = {
      [TASK_FILTERS.COMPLETED]: {
        title: 'No completed tasks',
        message: 'Tasks you have answered appear here.',
      },
    }[filter] ?? {
      title: 'Nothing waiting on you',
      message: 'When a workflow reaches a step assigned to you or your role, it appears here.',
    };
    return <EmptyState icon={CheckCircle2} title={empty.title} message={empty.message} />;
  }

  return (
    <Table
      columns={columns}
      data={tasks}
      sortable={false}
      rowKey="taskId"
      compact
      isLoading={isLoading}
      emptyMessage="Nothing on this page."
      pagination={pageInfo(page, pageSize, total, onPageChange, onPageSizeChange)}
    />
  );
}

export default memo(TaskTable);
