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
import TaskCommentDialog from '@/components/workflow/tasks/TaskCommentDialog';
import TaskFormDialog from '@/components/workflow/taskForm/TaskFormDialog';
import ReassignDialog from '@/components/workflow/tasks/ReassignDialog';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
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

/** How often the open screen re-asks. There is no push, so this is the only way it learns. */
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

  // One page, in the server's order. See TaskTable for why nothing re-sorts it.
  const tasks = useSelector(selectMyTasks);
  const total = useSelector(selectMyTasksTotal);
  const pendingCount = useSelector(selectPendingTaskCount);
  const isLoading = useSelector(selectMyTasksLoading);
  const loaded = useSelector(selectMyTasksLoaded);
  const error = useSelector(selectMyTasksError);
  const completingTaskId = useSelector(selectCompletingTaskId);

  /*
   * The tab and the page, together. A new tab always starts at page 1, set in
   * the same update as the tab rather than by an effect after it.
   */
  const [view, setView] = useState({ filter: TASK_FILTERS.ALL, page: 1 });
  const filter = view.filter;
  // Rows a page, as the reader chooses (2026-10-21); a new size starts at page 1.
  const [pageSize, setPageSize] = useState(TASK_PAGE_SIZE);

  /*
   * The page actually asked for — clamped to the last page there is.
   *
   * Answering the only task on the last page leaves that page empty; the
   * refetch brings back a smaller `total`, this drops to the new last page, and
   * `load` changing fetches it. Derived rather than corrected in an effect, so
   * there is never a render showing an empty page with a pager beneath it.
   */
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(view.page, lastPage);

  const onFilterChange = useCallback((next) => setView({ filter: next, page: 1 }), []);
  const onPageChange = useCallback((next) => setView((v) => ({ ...v, page: next })), []);
  const onPageSizeChange = useCallback((next) => {
    setPageSize(next);
    setView((v) => ({ ...v, page: 1 }));
  }, []);
  /** Which to-do the hand-on dialog is open for. */
  const [handingOn, setHandingOn] = useState(null);
  /** The to-do and outcome waiting on a comment before they can be sent. */
  const [commentFor, setCommentFor] = useState(null);
  /** The to-do whose fields are being filled in (2026-10-11). */
  const [formFor, setFormFor] = useState(null);

  const canView = allow(can, WORKFLOW_TASK_PERMISSIONS.VIEW);
  const canAct = allow(can, WORKFLOW_TASK_PERMISSIONS.ACT);
  // Its own permission, with NO ownership check behind it: covering for a
  // colleague means passing their work on, not deciding it. So this is granted
  // independently of ACT and of ACT_ALL.
  const canReassign = allow(can, WORKFLOW_TASK_PERMISSIONS.REASSIGN);
  /*
   * Opening the run behind a to-do is a different permission — seeing your own
   * work does not imply seeing the whole workflow it belongs to. Without it the
   * task title is not a link, rather than one that always refuses.
   */
  const canViewRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  /*
   * The page on screen — and the ONLY thing that loads the list. The sidebar's
   * background sync asks for a count and never touches it.
   *
   * Every response also carries `pendingCount`, so the Pending tab and the
   * sidebar badge are refreshed by the same call: after answering or handing on
   * a task, the reload below is all it takes.
   */
  const statusKey = TASK_FILTER_STATUS[filter];
  const load = useCallback(() => {
    dispatch(fetchMyTasks({ statusKey, skip: (page - 1) * pageSize, take: pageSize }));
  }, [dispatch, statusKey, page, pageSize]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  usePolling(load, POLL_INTERVAL_MS, canView);

  const handleReassign = useCallback(async ({ toUserIds, toRoleIds }) => {
    const task = handingOn;
    const result = await dispatch(reassignTask({
      instanceId: task.instanceId,
      taskId: task.taskId,
      toUserIds,
      toRoleIds,
    }));

    if (reassignTask.rejected.match(result)) {
      // WF-005 lands here when somebody answered it first — which is why the
      // list is reloaded below rather than left showing a to-do that is gone.
      toast.error('Could not hand this task on', result.payload);
      load();
      return;
    }

    setHandingOn(null);
    toast.success('Task handed on', 'It has moved to their list, keeping its original due date.');

    /*
     * A refetch, NOT a local patch.
     *
     * The handover creates a to-do with a NEW id — the old one closes as
     * Reassigned — so the row on screen no longer refers to anything that can
     * be answered. Whether the replacement belongs in this list at all depends
     * on who it went to and on whether this person can see everybody's to-dos,
     * which is not a question the client can answer.
     */
    load();
  }, [dispatch, handingOn, load, toast]);

  const handleComplete = useCallback(
    async ({ task, outcomeKey, comment }) => {
      const result = await dispatch(
        completeTask({ instanceId: task.instanceId, taskId: task.taskId, outcomeKey, comment })
      );

      if (completeTask.rejected.match(result)) {
        toast.error('Could not complete this task', result.payload);
        // Refetched whatever the reason. Most failures here mean this list is
        // already out of date — somebody answered it first, or the run moved
        // on without it — and with no live push there was no way to have known.
        load();
        return;
      }

      /*
       * A 200 is not the end of the story. The answer is recorded and then the
       * engine walks on, so a step AFTER this one can fail — a placeholder that
       * resolves to nothing, a condition that matches no transition, a step
       * deleted from under a running instance — and that arrives as a
       * successful completion carrying a Faulted run.
       *
       * Saying "Task completed" there would be true and useless: the person
       * would walk away believing the work moved on. So the fault is what gets
       * reported, with the engine's own reason, which is written to be read.
       */
      const fault = faultAfterCompleting(result.payload?.instance);
      if (fault) toast.error('Your answer was saved, but the run stopped', fault.message);
      else toast.success('Task completed', task.title ?? undefined);

      // The response says where the run went, but not what else changed:
      // answering one task can cancel others — a parallel step's joinWhen
      // firing, or a stage deadline — and those rows are still on screen.
      load();
    },
    [dispatch, load, toast]
  );

  // Outcomes that demand a reason open a dialog; the rest submit straight away.
  // That split is the workflow author's, expressed as `requiresComment`.
  const handleRequireComment = useCallback((task, outcome) => {
    setCommentFor({ task, outcome });
  }, []);

  /*
   * A task answered from its form. The form called the server itself (it needs
   * the refusal's errors by field), so here it only reports and reloads — the
   * same as an answer from a row, fault check included.
   */
  const handleFormCompleted = useCallback(({ task, instance }) => {
    setFormFor(null);
    const fault = faultAfterCompleting(instance);
    if (fault) toast.error('Your answer was saved, but the run stopped', fault.message);
    else toast.success('Task completed', task.title ?? undefined);
    load();
  }, [load, toast]);

  const handleCommentConfirm = useCallback(async ({ comment }) => {
    const { task, outcome } = commentFor;
    await handleComplete({ task, outcomeKey: outcome.key, comment });
    setCommentFor(null);
  }, [commentFor, handleComplete]);

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

      {/*
        The "N tasks are past due" banner used to sit here. It counted the rows
        on screen, and with the list paged that is one page — so it would have
        said "2 past due" to somebody with forty. It comes back if GetMyTasks
        ever carries an overdue count the way it carries `pendingCount`; until
        then overdue is shown on each row it applies to.
      */}
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
              {/*
                Keyed on `loaded`, not `isLoading && tasks.length === 0`. That
                pair is false in the first render, before the effect has fired
                the request — so the page used to open on "Nothing waiting on
                you" for a moment before any question had been asked. The same
                bug the monitoring page had, fixed the same way.
              */}
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
                  onRequireComment={handleRequireComment}
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

      {/* Keyed per task and outcome, so a comment typed for one answer never
          rides along with a different one. */}
      {commentFor && (
        <TaskCommentDialog
          key={`${commentFor.task.taskId}:${commentFor.outcome.key}`}
          task={commentFor.task}
          outcome={commentFor.outcome}
          open
          busy={completingTaskId === commentFor.task.taskId}
          onClose={() => setCommentFor(null)}
          onConfirm={handleCommentConfirm}
        />
      )}

      {/* Keyed per task so the pickers start empty each time — people chosen
          for one to-do must never carry over to another. */}
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

/**
 * Filter tabs. Split out so changing a filter re-renders the toolbar and the
 * list, not the page header above them.
 *
 * Only the counts the server has actually given are shown. **Pending** always
 * has one — `pendingCount` rides on every response, whatever the filter, so
 * "Pending (12)" needs no call of its own. The ACTIVE tab's is `total`. The
 * others would each need a call of their own to count, so they show none rather
 * than a stale number from whenever they were last opened.
 */
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
