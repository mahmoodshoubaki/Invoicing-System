'use client';

import Modal from '@/components/common/Modal';
import TargetLinks from '@/components/workflow/TargetLinks';
import { CHROME } from '@/theme/vizPalette';
import { asksForChanges, changeRequestTaskParts } from '@/lib/changeRequest/taskFields';
import TaskForm from './TaskForm';

/**
 * A task with fields to fill, answered from My Tasks (2026-10-11) — the same
 * form as on the record's own page, in a dialog. Mounted per task, so nothing
 * typed for one carries into the next.
 *
 * The record the task is about is linked at the top (2026-10-14) — "View
 * Invoice" — in a new tab, so the request can be read without losing what has
 * been typed here.
 *
 * A task that changes a change request's items (2026-10-20) opens wider: it
 * draws the request's item cards and invoicing plans.
 *
 * @param {{ task: Object, onClose: () => void, onCompleted: (result) => void }} props
 */
export default function TaskFormDialog({ task, onClose, onCompleted }) {
  return (
    <Modal open onClose={onClose} title={task.title || 'Task'} size={asksForChanges(changeRequestTaskParts(task)) ? 'xl' : 'lg'}>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs" style={{ color: CHROME.textMuted }}>
          {task.definitionName}
          {task.projectCode ? ` · ${task.projectCode}` : ''}
          {task.currentStageTitle ? ` · ${task.currentStageTitle}` : ''}
        </p>
        <TargetLinks
          targetTypeKey={task.targetTypeKey}
          targetIds={task.targetIds ?? []}
          projectCode={task.projectCode}
          size="xs"
          newTab
        />
      </div>
      <TaskForm task={task} onCompleted={onCompleted} />
    </Modal>
  );
}
