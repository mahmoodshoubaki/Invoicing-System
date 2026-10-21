'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, UserCheck } from 'lucide-react';

import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_TASK_PERMISSIONS } from '@/constants/workflowPermissions';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ROUTES } from '@/constants/routes';
import { TASK_STATUS, TASK_STATUS_COLORS } from '@/constants/workflow';
import RunTaskItem from './RunTaskItem';

/** The engine's four task statuses, by their own names, plus everything. */
const TASK_TABS = [
  { key: 'all', label: 'All', statusKey: null },
  { key: 'pending', label: 'Pending', statusKey: TASK_STATUS.PENDING },
  { key: 'completed', label: 'Completed', statusKey: TASK_STATUS.COMPLETED },
  { key: 'cancelled', label: 'Cancelled', statusKey: TASK_STATUS.CANCELLED },
  { key: 'reassigned', label: 'Reassigned', statusKey: TASK_STATUS.REASSIGNED },
];

/**
 * EVERY task this run created, not just the open ones — `GetInstanceTasks`
 * since 2026-09-13. Before it, a screen could say what a run was waiting for
 * but never what anybody had already decided, and a to-do cancelled by a stage
 * deadline vanished without trace.
 *
 * @param {{
 *   grouped: { open: Array, settled: Array, total: number },  from groupTasks
 *   loaded: boolean,
 *   onReassign: (task) => void,
 * }} props
 */
export default function RunTasksPanel({ grouped, loaded, onReassign }) {
  const { can } = usePermission();
  /*
   * Handing on a pending to-do from here. Its own permission with no ownership
   * check behind it, so somebody covering for a colleague can pass on a task
   * that is not in their own list — which is the only way to reach the live
   * copy of a to-do that was already reassigned once.
   */
  const canReassign = allow(can, WORKFLOW_TASK_PERMISSIONS.REASSIGN);
  /** Which task status the panel is filtered to. */
  const [taskTab, setTaskTab] = useState('all');

  const { open: openTasks, settled: settledTasks, total: taskCount } = grouped;
  // Open first, then settled newest-first — the order holds inside every tab.
  const orderedTasks = [...openTasks, ...settledTasks];
  const statusCounts = orderedTasks.reduce((acc, t) => {
    acc[t.statusKey] = (acc[t.statusKey] ?? 0) + 1;
    return acc;
  }, {});
  const activeTaskTab = TASK_TABS.find((t) => t.key === taskTab) ?? TASK_TABS[0];
  const shownTasks = activeTaskTab.statusKey == null
    ? orderedTasks
    : orderedTasks.filter((t) => t.statusKey === activeTaskTab.statusKey);

  return (
    <Card className="lg:col-span-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
          <UserCheck size={14} style={{ color: CHROME.textMuted }} aria-hidden="true" />
          Human tasks
        </h2>
        {taskCount > 0 && (
          <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
            {taskCount} in total
          </span>
        )}
      </div>

      {/*
        The engine's four task statuses, each with its count — including the
        ones at zero, so "nothing was cancelled" is something the screen says
        rather than something a reader has to infer from an absence. Filtering
        is local: `GetInstanceTasks` already returned all of them.
      */}
      {loaded && taskCount > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {TASK_TABS.map((tab) => {
            const on = taskTab === tab.key;
            const count = tab.statusKey == null ? taskCount : (statusCounts[tab.statusKey] ?? 0);
            const tone = tab.statusKey == null ? STATUS.info : (TASK_STATUS_COLORS[tab.statusKey] ?? CHROME.textMuted);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTaskTab(tab.key)}
                aria-pressed={on}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: on ? withAlpha(tone, 0.14) : '#f6f5f3',
                  color: on ? tone : CHROME.textMuted,
                }}
              >
                {tab.label}
                <span className="ml-1 tabular-nums" style={{ opacity: count === 0 ? 0.5 : 1 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {!loaded ? (
        <div className="flex justify-center py-6"><LoadingSpinner /></div>
      ) : taskCount === 0 ? (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          This run has never asked anybody anything.
        </p>
      ) : shownTasks.length === 0 ? (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          No {activeTaskTab.label.toLowerCase()} tasks on this run.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shownTasks.map((task) => (
            <RunTaskItem key={task.taskId} task={task} canReassign={canReassign} onReassign={onReassign} />
          ))}
        </ul>
      )}

      {/* Answering happens where a person's own queue is, not here — this
          screen is for watching a run, and acting on somebody else's to-do
          needs `WorkflowTasks.ActAll` anyway. */}
      {openTasks.length > 0 && (
        <Link
          href={ROUTES.WORKFLOW_TASKS}
          className="mt-3 inline-flex items-center gap-1 text-[11px] underline-offset-2 hover:underline"
          style={{ color: STATUS.info }}
        >
          Answer these in My Tasks
          <ArrowRight size={11} aria-hidden="true" />
        </Link>
      )}
    </Card>
  );
}
