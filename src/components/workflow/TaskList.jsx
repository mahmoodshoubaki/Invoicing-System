'use client';

import { memo, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2, Inbox } from 'lucide-react';

import EmptyState from '@/components/common/EmptyState';
import TaskCard from './TaskCard';

/**
 * The to-do list itself.
 *
 * Deliberately a component that takes `tasks`, not a screen that fetches them.
 * `WorkflowTasks.ViewAll` and `ActAll` already exist in the permission catalog
 * with no endpoint behind them yet, so a supervisor's "every user's tasks" view
 * is clearly coming. When it arrives it should be a different `tasks` array and
 * a different `filter` passed to this same component — not a second screen that
 * duplicates the card, the comment rule and the outcome buttons.
 */
export const TASK_FILTERS = {
  ALL: 'all',
  OVERDUE: 'overdue',
  ACTIONABLE: 'actionable',
  COMPLETED: 'completed',
};

function TaskList({ tasks, filter = TASK_FILTERS.ALL, onComplete, completingTaskId, canAct, canReassign, onReassign }) {
  const visible = useMemo(() => {
    if (filter === TASK_FILTERS.OVERDUE) return tasks.filter((t) => t.isOverdue);
    if (filter === TASK_FILTERS.ACTIONABLE) return tasks.filter((t) => t.canAct);
    return tasks;
  }, [tasks, filter]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nothing waiting on you"
        message="Tasks appear here when a workflow reaches a step assigned to you or one of your roles."
      />
    );
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nothing matches this filter"
        message={
          filter === TASK_FILTERS.OVERDUE
            ? 'No task on your list is past its due date.'
            : 'Every task on your list is read-only.'
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-motion>
      {/* AnimatePresence lets a completed card animate out rather than vanish,
          which is the difference between "that worked" and "did I click it?" */}
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            onComplete={onComplete}
            isCompleting={completingTaskId === task.taskId}
            canAct={canAct}
            canReassign={canReassign}
            onReassign={onReassign}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}

export default memo(TaskList);
