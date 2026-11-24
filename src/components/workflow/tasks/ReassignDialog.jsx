'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlarmClock, Info, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import UserPicker from '@/components/workflow/builder/UserPicker';
import RoleChips from '@/components/workflow/builder/RoleChips';
import GroupChips from '@/components/workflow/builder/GroupChips';
import AssigneeList from '@/components/workflow/AssigneeList';
import ProjectLink from '@/components/workflow/ProjectLink';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { fetchAllRoles, selectRoles, selectRolesLoading } from '@/store/slices/rolesSlice';
import { fetchGroups, selectGroups, selectGroupsLoading } from '@/store/slices/groupsSlice';
import { resolveAssignees, selectAssigneesById } from '@/store/slices/workflowSlice';

export default function ReassignDialog({ task, open, busy, onClose, onConfirm }) {
  const t = useTranslations('tasks.reassign');
  const format = useLocaleFormat();
  const dispatch = useDispatch();

  const roles = useSelector(selectRoles);
  const rolesLoading = useSelector(selectRolesLoading);
  const groups = useSelector(selectGroups);
  const groupsLoading = useSelector(selectGroupsLoading);
  const resolvedById = useSelector(selectAssigneesById);

  const [userIds, setUserIds] = useState([]);
  const [roleIds, setRoleIds] = useState([]);
  const [groupIds, setGroupIds] = useState([]);

  useEffect(() => {
    dispatch(fetchAllRoles());
    dispatch(fetchGroups());
  }, [dispatch]);

  const userKey = userIds.join(',');
  useEffect(() => {
    if (userIds.length > 0) dispatch(resolveAssignees(userIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, dispatch]);

  const ready = userIds.length > 0 || roleIds.length > 0 || groupIds.length > 0;

  const overdueNote = useMemo(() => Boolean(task?.dueOn), [task]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('cancel')}</Button>
          <Button
            icon={UserPlus}
            loading={busy}
            disabled={!ready}
            onClick={() => onConfirm({ toUserIds: userIds, toRoleIds: roleIds, toGroupIds: groupIds })}
          >
            {t('handOn')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{task?.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px]" style={{ color: CHROME.textMuted }}>
            <span>
              {task?.definitionCode}
              {task?.currentStageTitle && ` · ${task.currentStageTitle}`}
            </span>
            <ProjectLink projectCode={task?.projectCode} size="xs" />
          </p>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            {t('currentlyAssigned')}
          </p>
          <AssigneeList
            users={task?.assignedUsers ?? []}
            roles={task?.assignedRoles ?? []}
            groups={task?.assignedGroups ?? []}
            emptyText={t('notReported')}
          />
        </div>

        {overdueNote && (
          <p
            className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
            style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
          >
            <AlarmClock size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            <span>
              {t.rich('dueStays', { date: format.dateTime(task.dueOn), b: (chunks) => <strong>{chunks}</strong> })}
            </span>
          </p>
        )}

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>{t('people')}</p>
          <UserPicker selectedIds={userIds} resolvedById={resolvedById} onChange={setUserIds} />
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>{t('roles')}</p>
          <RoleChips roles={roles} loading={rolesLoading} selectedIds={roleIds} onChange={setRoleIds} />
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>{t('groups')}</p>
          <GroupChips groups={groups} loading={groupsLoading} selectedIds={groupIds} onChange={setGroupIds} />
        </div>

        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: '#fbfaf9', color: CHROME.textSecondary }}
        >
          <Info size={11} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <span>
            {t.rich('closesAs', { b: (chunks) => <strong>{chunks}</strong> })}
          </span>
        </p>

        {!ready && (
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
            {t('nameOne')}
          </p>
        )}
      </div>
    </Modal>
  );
}
