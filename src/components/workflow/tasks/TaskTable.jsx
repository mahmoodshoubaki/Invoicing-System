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

/**
 * The tabs, each a server-side filter.
 *
 * "Overdue" and "Needs an action" were here until 2026-09-30, worked out in the
 * browser from `isOverdue` and `canAct`. With GetMyTasks paged that cannot
 * work: filtering one page shows what is on that page, not what the person has.
 * So every tab is now a `statusKey` the server filters on. Overdue is still on
 * every row, just not a filter.
 */
export const TASK_FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

/** What each tab asks GetMyTasks for. `null` is every status. */
export const TASK_FILTER_STATUS = {
  [TASK_FILTERS.ALL]: null,
  [TASK_FILTERS.PENDING]: TASK_STATUS.PENDING,
  [TASK_FILTERS.COMPLETED]: TASK_STATUS.COMPLETED,
};

/** Rows per page to start with — the reader can choose another (2026-10-21) — and the `take` each page asks the server for. */
export const TASK_PAGE_SIZE = 10;

/**
 * How long until a task is due, in plain words.
 *
 * `isOverdue` comes from the server and is authoritative — clock skew between
 * the browser and the backend would otherwise make a row disagree with itself.
 */
function dueLabel(dueOn, isOverdue) {
  if (!dueOn) return null;
  if (isOverdue) return 'Overdue';

  const days = Math.ceil((new Date(dueOn) - Date.now()) / 86400000);
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${formatDate(dueOn)}`;
}

/**
 * Whether a row can still be answered — the three reasons it cannot, in order.
 *
 * `GetMyTasks` is documented as pending-only, so a row with no `statusKey` is
 * read as pending. A settled row must never offer outcome buttons: they would
 * read as a choice still open, and the server refuses it anyway.
 */
function rowState(task, canAct) {
  const settled = task.statusKey != null && task.statusKey !== TASK_STATUS.PENDING;
  // Null unless the API sends the run's status on the row — see mapMyTask.
  const runStopped = task.runStatusKey != null && task.runStatusKey !== INSTANCE_STATUS.RUNNING;
  const readOnly = !canAct || !task.canAct;
  return { settled, runStopped, readOnly, answerable: !settled && !runStopped && !readOnly };
}

/**
 * My Tasks as a table.
 *
 * A card per to-do read well at five and badly at fifty: every card repeated
 * the same labels and the outcome buttons pushed the next task off screen. A
 * table puts the comparison people actually make — what is this, whose, when —
 * in columns they can scan down.
 *
 * Every rule the card list enforced carries over unchanged:
 *
 * - **Outcome buttons are rendered literally** — label, colour and whether a
 *   comment is required all come from whoever drew the workflow.
 * - **Hand on is offered independently of `canAct`.** `WorkflowTasks.Reassign`
 *   has no ownership check, so a read-only row still gets it: covering for a
 *   colleague means passing their work on, not deciding it.
 * - **A run that is not going blocks the answer** once the row says so, rather
 *   than offering a button that can only fail with WF-001.
 *
 * **It shows the page it is handed, and nothing more.** GetMyTasks is paged, so
 * the filter, the page and the order all belong to the server: `tasks` is one
 * page, `total` counts every match. This table does no filtering, sorting or
 * slicing of its own — any of those over one page would describe the page, not
 * the person's work. That is also why the column headers do not sort: clicking
 * one would reorder ten rows and imply it had reordered the list.
 */
function TaskTable({
  tasks, filter = TASK_FILTERS.ALL, total = 0, page = 1, onPageChange, pageSize = TASK_PAGE_SIZE, onPageSizeChange = null, isLoading = false,
  onComplete, onRequireComment, onOpenForm, completingTaskId, canAct, canReassign, canViewRuns, onReassign,
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
              {/*
                The title opens the run: "why is this on my list, and what has
                happened so far" is answered there, not here.

                A run is `WorkflowInstances.View`, which is NOT implied by being
                able to see your own to-dos — so without it the title is plain
                text. Linked anyway, it was a link that could only ever land on
                "you do not have permission to view workflow runs".
              */}
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
              {/* A reassigned row is the closed copy; the live one is with
                  somebody else. Saying who is the whole point of the row. */}
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
      // The record the task is about beside its project, as on the runs list (2026-10-13).
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
        <AssigneeList users={task.assignedUsers} roles={task.assignedRoles} compact />
      ),
    },
    {
      // Before Due, so a row reads in order: when it arrived, then when it is
      // due. Sorts on the raw ISO string, which orders chronologically.
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
          // A task with fields to fill is answered in its form (2026-10-11): the
          // boxes and the buttons belong together, and a button that saves them
          // has to see what was typed.
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
                  onClick={() => (button.requiresComment
                    ? onRequireComment?.(task, button)
                    : onComplete({ task, outcomeKey: button.key, comment: null }))}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    // The author's colour; only the text colour is ours, for contrast.
                    backgroundColor: button.colorHex ?? '#f1f0ee',
                    color: readableTextOn(button.colorHex, CHROME.textPrimary),
                  }}
                  title={button.requiresComment ? `${button.label} — asks for a comment` : button.label}
                >
                  {button.requiresComment && <MessageSquare size={10} aria-hidden="true" />}
                  {button.label}
                </button>
              ))}
            </span>
          );
        }

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {answer}
            {/* Independent of `canAct` on purpose — see the component note. A
                settled row has nothing left to hand on. */}
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
  ], [canAct, canReassign, canViewRuns, completingTaskId, onComplete, onOpenForm, onReassign, onRequireComment]);

  // Nothing matches this tab at all — not merely an empty page, which the page
  // clamps away. Said per tab, since "nothing waiting on you" under Completed
  // would be answering a different question.
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
      // The server's order, as it came: see the comment on this component.
      sortable={false}
      rowKey="taskId"
      compact
      isLoading={isLoading}
      emptyMessage="Nothing on this page."
      /*
       * An object, never a bare `pagination` flag: the table reads the page, the
       * range and `onChange` off it. The numbers are the SERVER's — `total` is
       * every match, so the pager can offer pages this screen has never loaded.
       * Omitted when everything fits on the smallest page (see pageInfo).
       */
      pagination={pageInfo(page, pageSize, total, onPageChange, onPageSizeChange)}
    />
  );
}

export default memo(TaskTable);
