'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Calendar, CheckCircle2, Lock, MessageSquare, PauseCircle, TextCursorInput, UserPlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Table from '@/components/common/Table';
import EmptyState from '@/components/common/EmptyState';
import AssigneeList from '@/components/workflow/AssigneeList';
import ProjectLink from '@/components/workflow/ProjectLink';
import TargetLinks from '@/components/workflow/TargetLinks';
import { pageInfo } from '@/lib/pageInfo';
import { readableTextOn, withAlpha } from '@/utils/color';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { ROUTES } from '@/constants/routes';
import {
  INSTANCE_STATUS, TASK_STATUS, TASK_STATUS_COLORS,
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

const TASK_STATUS_KEYS = {
  [TASK_STATUS.PENDING]: 'pending',
  [TASK_STATUS.COMPLETED]: 'completed',
  [TASK_STATUS.CANCELLED]: 'cancelled',
  [TASK_STATUS.REASSIGNED]: 'reassigned',
};

const RUN_STATUS_KEYS = {
  [INSTANCE_STATUS.RUNNING]: 'running',
  [INSTANCE_STATUS.COMPLETED]: 'completed',
  [INSTANCE_STATUS.CANCELLED]: 'cancelled',
  [INSTANCE_STATUS.FAULTED]: 'faulted',
  [INSTANCE_STATUS.PAUSED]: 'paused',
};

function dueLabel(dueOn, isOverdue, t, format) {
  if (!dueOn) return null;
  if (isOverdue) return t('due.overdue');

  const days = Math.ceil((new Date(dueOn) - Date.now()) / 86400000);
  if (days <= 0) return t('due.today');
  if (days === 1) return t('due.tomorrow');
  if (days <= 14) return t('due.inDays', { days });
  return t('due.on', { date: format.date(dueOn) });
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
    const t = useTranslations('tasks.table');
  const format = useLocaleFormat();
  const columns = useMemo(() => [
    {
      key: 'title',
      label: t('columns.task'),
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
                  {task.title ?? t('untitled')}
                </Link>
              ) : (
                <span className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
                  {task.title ?? t('untitled')}
                </span>
              )}
              {settled && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: withAlpha(tone ?? CHROME.textMuted, 0.12), color: tone ?? CHROME.textMuted }}
                >
                  {t(`status.${TASK_STATUS_KEYS[task.statusKey] ?? 'settled'}`)}
                </span>
              )}
              {task.statusKey === TASK_STATUS.REASSIGNED && task.reassignedToName && (
                <span className="text-[11px]" style={{ color: CHROME.textSecondary }}>
                  {t('reassignedTo', { name: task.reassignedToName })}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>
              <bdi className="font-mono">{task.definitionName}</bdi> - <span dir="ltr">v{task.definitionVersion}</span>
              {task.currentStageTitle && ` · ${task.currentStageTitle}`}
            </p>
          </div>
        );
      },
    },
    {
      key: 'projectCode',
      label: t('columns.request'),
      render: (code, task) => (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <TargetLinks targetTypeKey={task.targetTypeKey} targetIds={task.targetIds} projectCode={code} size="xs" />
          <ProjectLink projectCode={code} size="xs" />
        </span>
      ),
    },
    {
      key: 'assignees',
      label: t('columns.assignedTo'),
      sortable: false,
      render: (_, task) => (
        <AssigneeList users={task.assignedUsers} roles={task.assignedRoles} groups={task.assignedGroups} compact />
      ),
    },
    {
      key: 'createdOn',
      label: t('columns.created'),
      sortable: true,
      render: (createdOn) => (createdOn ? (
        <span className="whitespace-nowrap text-[11px]" style={{ color: CHROME.textSecondary }}>
          {format.dateTime(createdOn)}
        </span>
      ) : (
        <span className="text-[11px]" style={{ color: CHROME.textMuted }}>—</span>
      )),
    },
    {
      key: 'dueOn',
      label: t('columns.due'),
      render: (dueOn, task) => {
        const due = dueLabel(dueOn, task.isOverdue, t, format);
        if (!due) return <span className="text-[11px]" style={{ color: CHROME.textMuted }}>—</span>;
        return (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={
              task.isOverdue
                ? { backgroundColor: withAlpha(STATUS.critical, 0.1), color: STATUS.critical }
                : { backgroundColor: '#f6f5f3', color: CHROME.textSecondary }
            }
            title={format.dateTime(dueOn)}
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
              {t('nothingLeft')}
            </span>
          );
        } else if (runStopped) {
          answer = (
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: CHROME.textMuted }}
              title={t('runStoppedHint')}
            >
              <PauseCircle size={11} aria-hidden="true" />
              {t(`run.${RUN_STATUS_KEYS[task.runStatusKey] ?? 'stopped'}`)}
            </span>
          );
        } else if (readOnly) {
          answer = (
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: CHROME.textMuted }}
              title={t('readOnlyHint')}
            >
              <Lock size={11} aria-hidden="true" />
              {t('readOnly')}
            </span>
          );
        } else if (task.buttons.length === 0) {
          answer = <span className="text-[11px]" style={{ color: CHROME.textMuted }}>{t('noOutcomes')}</span>;
        } else if ((task.fields?.length ?? 0) > 0) {
          answer = (
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpenForm?.(task)}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              title={t('fillTitle', { count: task.fields.length })}
            >
              <TextCursorInput size={11} aria-hidden="true" />
              {t('fillIn')}
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
                  title={button.reasons ? t('asksReason', { label: button.label }) : button.requiresComment ? t('asksComment', { label: button.label }) : button.label}
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
                title={t('handHint')}
              >
                <UserPlus size={11} aria-hidden="true" />
                {t('handOn')}
              </button>
            )}
          </div>
        );
      },
    },
  ], [canAct, canReassign, canViewRuns, completingTaskId, onAsk, onComplete, onOpenForm, onReassign, t, format]);

  if (!isLoading && total === 0) {
    const empty = {
      [TASK_FILTERS.COMPLETED]: {
        title: t('noCompleted'),
        message: t('noCompletedBody'),
      },
    }[filter] ?? {
      title: t('nothingWaiting'),
      message: t('nothingWaitingBody'),
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
      emptyMessage={t('emptyPage')}
      pagination={pageInfo(page, pageSize, total, onPageChange, onPageSizeChange)}
    />
  );
}

export default memo(TaskTable);
