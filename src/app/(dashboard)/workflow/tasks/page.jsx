'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, ListChecks, Lock, RefreshCw } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Reveal, { revealItem } from '@/components/motion/Reveal';
import TaskTable, {
  TASK_FILTERS, TASK_FILTER_STATUS, TASK_PAGE_SIZE,
} from '@/components/workflow/tasks/TaskTable';
import TaskAnswerDialog from '@/components/workflow/tasks/TaskAnswerDialog';
import TaskFormDialog from '@/components/workflow/taskForm/TaskFormDialog';
import ReassignDialog from '@/components/workflow/tasks/ReassignDialog';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { reasonToSend } from '@/lib/taskReasons';
import { usePolling } from '@/hooks/usePolling';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS, WORKFLOW_TASK_PERMISSIONS } from '@/constants/workflowPermissions';
import { CHROME } from '@/theme/vizPalette';
import {
  fetchMyTasks,
  completeTask,
  reassignTask,
  faultAfterCompleting,
  selectMyTasks,
  selectMyTasksTotal,
  selectPendingTaskCount,
  selectMyTasksLoading,
  selectMyTasksError,
  selectCompletingTaskId,
  selectMyTasksLoaded,
} from '@/store/slices/workflowTasksSlice';
import { motion } from 'motion/react';

const POLL_INTERVAL_MS = 45_000;

const FILTER_TABS = [
  { key: TASK_FILTERS.ALL, label: 'All' },
  { key: TASK_FILTERS.PENDING, label: 'Pending' },
  { key: TASK_FILTERS.COMPLETED, label: 'Completed' },
];

export default function MyTasksPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { can } = usePermission();

  const tasks = useSelector(selectMyTasks);
  const total = useSelector(selectMyTasksTotal);
  const pendingCount = useSelector(selectPendingTaskCount);
  const isLoading = useSelector(selectMyTasksLoading);
  const loaded = useSelector(selectMyTasksLoaded);
  const error = useSelector(selectMyTasksError);
  const completingTaskId = useSelector(selectCompletingTaskId);

  const [view, setView] = useState({ filter: TASK_FILTERS.ALL, page: 1 });
  const filter = view.filter;
  const [pageSize, setPageSize] = useState(TASK_PAGE_SIZE);

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(view.page, lastPage);

  const onFilterChange = useCallback((next) => setView({ filter: next, page: 1 }), []);
  const onPageChange = useCallback((next) => setView((v) => ({ ...v, page: next })), []);
  const onPageSizeChange = useCallback((next) => {
    setPageSize(next);
    setView((v) => ({ ...v, page: 1 }));
  }, []);
  const [handingOn, setHandingOn] = useState(null);
  const [askFor, setAskFor] = useState(null);
  const [formFor, setFormFor] = useState(null);

  const canView = allow(can, WORKFLOW_TASK_PERMISSIONS.VIEW);
  const canAct = allow(can, WORKFLOW_TASK_PERMISSIONS.ACT);
  const canReassign = allow(can, WORKFLOW_TASK_PERMISSIONS.REASSIGN);
  const canViewRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  const statusKey = TASK_FILTER_STATUS[filter];
  const load = useCallback(() => {
    dispatch(fetchMyTasks({ statusKey, skip: (page - 1) * pageSize, take: pageSize }));
  }, [dispatch, statusKey, page, pageSize]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  usePolling(load, POLL_INTERVAL_MS, canView);

  const handleReassign = useCallback(async ({ toUserIds, toRoleIds, toGroupIds }) => {
    const task = handingOn;
    const result = await dispatch(reassignTask({
      instanceId: task.instanceId,
      taskId: task.taskId,
      toUserIds,
      toRoleIds,
      toGroupIds,
    }));

    if (reassignTask.rejected.match(result)) {
      toast.error('Could not hand this task on', result.payload);
      load();
      return;
    }

    setHandingOn(null);
    toast.success('Task handed on', 'It has moved to their list, keeping its original due date.');

    load();
  }, [dispatch, handingOn, load, toast]);

  const handleComplete = useCallback(
    async ({ task, outcomeKey, comment, reasonKey = null, otherReason = null }) => {
      const result = await dispatch(
        completeTask({ instanceId: task.instanceId, taskId: task.taskId, outcomeKey, comment, reasonKey, otherReason })
      );

      if (completeTask.rejected.match(result)) {
        toast.error('Could not complete this task', result.payload);
        load();
        return;
      }

      const fault = faultAfterCompleting(result.payload?.instance);
      if (fault) toast.error('Your answer was saved, but the run stopped', fault.message);
      else toast.success('Task completed', task.title ?? undefined);

      load();
    },
    [dispatch, load, toast]
  );

  const handleAsk = useCallback((task, outcome) => {
    setAskFor({ task, outcome });
  }, []);

  const handleFormCompleted = useCallback(({ task, instance }) => {
    setFormFor(null);
    const fault = faultAfterCompleting(instance);
    if (fault) toast.error('Your answer was saved, but the run stopped', fault.message);
    else toast.success('Task completed', task.title ?? undefined);
    load();
  }, [load, toast]);

  const handleAnswerConfirm = useCallback(async ({ comment, reasonKey, otherReason }) => {
    const { task, outcome } = askFor;
    const reason = reasonToSend(outcome, { reasonKey, otherReason });
    await handleComplete({ task, outcomeKey: outcome.key, comment, ...reason });
    setAskFor(null);
  }, [askFor, handleComplete]);

  if (!canView) {
    return (
      <div>
        <PageHeader title="My Tasks" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'My Tasks' }]} />
        <Card>
          <EmptyState
            icon={Lock}
            title="You do not have access to workflow tasks"
            message="Ask an administrator to grant you the WorkflowTasks.View permission."
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle="Workflow steps waiting on you"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'My Tasks' },
        ]}
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load} loading={isLoading}>
            Refresh
          </Button>
        }
      />

      <Reveal className="flex flex-col gap-4">
        <motion.div variants={revealItem}>
          <Card padding={false}>
            <TaskToolbar
              filter={filter}
              onFilterChange={onFilterChange}
              total={total}
              pendingCount={pendingCount}
            />

            <div className="p-4">
              {!loaded ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <LoadingSpinner />
                  <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Loading your tasks…</p>
                </div>
              ) : error && tasks.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Could not load your tasks"
                  message={typeof error === 'string' ? error : error?.message}
                  action={
                    <Button variant="outline" size="sm" onClick={load}>
                      Try again
                    </Button>
                  }
                />
              ) : (
                <TaskTable
                  tasks={tasks}
                  filter={filter}
                  total={total}
                  page={page}
                  onPageChange={onPageChange}
                  pageSize={pageSize}
                  onPageSizeChange={onPageSizeChange}
                  isLoading={isLoading}
                  onComplete={handleComplete}
                  onAsk={handleAsk}
                  onOpenForm={setFormFor}
                  completingTaskId={completingTaskId}
                  canAct={canAct}
                  canReassign={canReassign}
                  canViewRuns={canViewRuns}
                  onReassign={setHandingOn}
                />
              )}
            </div>
          </Card>
        </motion.div>
      </Reveal>

      {formFor && (
        <TaskFormDialog
          key={formFor.taskId}
          task={formFor}
          onClose={() => setFormFor(null)}
          onCompleted={handleFormCompleted}
        />
      )}

      {askFor && (
        <TaskAnswerDialog
          key={`${askFor.task.taskId}:${askFor.outcome.key}`}
          task={askFor.task}
          outcome={askFor.outcome}
          open
          busy={completingTaskId === askFor.task.taskId}
          onClose={() => setAskFor(null)}
          onConfirm={handleAnswerConfirm}
        />
      )}

      {handingOn && (
        <ReassignDialog
          key={handingOn.taskId}
          task={handingOn}
          open
          busy={completingTaskId === handingOn.taskId}
          onClose={() => setHandingOn(null)}
          onConfirm={handleReassign}
        />
      )}
    </div>
  );
}

function TaskToolbar({ filter, onFilterChange, total, pendingCount }) {
  const counts = useMemo(
    () => ({
      [filter]: total,
      [TASK_FILTERS.PENDING]: pendingCount ?? undefined,
    }),
    [filter, total, pendingCount]
  );

  return (
    <div className="flex items-center gap-1 border-b border-[#f1f0ee] px-4 py-2.5">
      <ListChecks size={15} style={{ color: CHROME.textMuted }} aria-hidden="true" className="mr-1.5" />
      {FILTER_TABS.map((tab) => {
        const active = filter === tab.key;
        const count = counts[tab.key];
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onFilterChange(tab.key)}
            aria-pressed={active}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: active ? '#f1f0ee' : 'transparent',
              color: active ? CHROME.textPrimary : CHROME.textMuted,
            }}
          >
            {tab.label}
            {count !== undefined && count > 0 && (
              <span className="ml-1.5 tabular-nums" style={{ color: CHROME.textMuted }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
