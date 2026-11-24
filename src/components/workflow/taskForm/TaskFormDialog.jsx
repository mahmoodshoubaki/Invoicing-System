'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/common/Modal';
import TargetLinks from '@/components/workflow/TargetLinks';
import { CHROME } from '@/theme/vizPalette';
import { asksForChanges, changeRequestTaskParts } from '@/lib/changeRequest/taskFields';
import TaskForm from './TaskForm';

/**
 * @param {{ task: Object, onClose: () => void, onCompleted: (result) => void }} props
 */
export default function TaskFormDialog({ task, onClose, onCompleted }) {
  const t = useTranslations('tasks.form');
  return (
    <Modal open onClose={onClose} title={task.title || t('task')} size={asksForChanges(changeRequestTaskParts(task)) ? 'xl' : 'lg'}>
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
