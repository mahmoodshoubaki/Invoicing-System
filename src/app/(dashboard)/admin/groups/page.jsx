'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import ErrorNote from '@/components/ui/ErrorNote';
import GroupsTable from '@/components/admin/groups/GroupsTable';
import GroupFormModal from '@/components/admin/groups/GroupFormModal';
import { identityRepository } from '@/repositories/identityRepository';
import { fetchGroups, selectGroups, selectGroupsError, selectGroupsLoading } from '@/store/slices/groupsSlice';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { allow, GROUP_PERMISSIONS } from '@/constants/workflowPermissions';

export default function GroupsPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { can } = usePermission();
  const canManage = allow(can, GROUP_PERMISSIONS.MANAGE);
  const groups = useSelector(selectGroups);
  const loading = useSelector(selectGroupsLoading);
  const error = useSelector(selectGroupsError);

  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(() => dispatch(fetchGroups()), [dispatch]);
  useEffect(() => { reload(); }, [reload]);

  const saved = ({ gone }) => {
    const wasNew = editing === null;
    setEditing(undefined);
    if (gone) toast.error('This group no longer exists', 'It was deleted by someone else.');
    else toast.success(wasNew ? 'Group created' : 'Group saved');
    reload();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await identityRepository.deleteGroup(deleting.id);
      toast.success('Group deleted', deleting.name);
    } catch (err) {
      toast.error('Could not delete the group', err?.message ?? undefined);
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
      reload();
    }
  };

  return (
    <div>
      <PageHeader
        title="Groups"
        subtitle="Sets of people from any roles that workflow tasks and notifications can be sent to"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Groups' }]}
        actions={canManage ? <Button icon={Plus} onClick={() => setEditing(null)}>New group</Button> : null}
      />

      {error && groups.length === 0 ? (
        <ErrorNote error={new Error(error)} onRetry={reload} />
      ) : (
        <GroupsTable
          groups={groups}
          isLoading={loading && groups.length === 0}
          canManage={canManage}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      {editing !== undefined && (
        <GroupFormModal
          key={editing?.id ?? 'new'}
          group={editing}
          onClose={() => setEditing(undefined)}
          onSaved={saved}
        />
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title="Delete group?"
        message={deleting ? `"${deleting.name}" will be deleted. Open tasks given to it are left with nobody until they are handed on, and workflow steps that name it reach no one.` : ''}
        confirmLabel="Delete group"
      />
    </div>
  );
}
