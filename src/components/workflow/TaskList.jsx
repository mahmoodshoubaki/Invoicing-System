'use client';

import { memo, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2, Inbox } from 'lucide-react';

import EmptyState from '@/components/common/EmptyState';
import TaskCard from './TaskCard';

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
