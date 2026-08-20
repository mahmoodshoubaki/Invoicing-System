'use client';

import { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus } from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import {
  createUser,
  fetchUnregisteredADUsers,
  clearAdCandidates,
  selectAdCandidates,
  selectAdCandidatesLoading,
} from '@/store/slices/usersSlice';
import { selectRoles } from '@/store/slices/rolesSlice';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { Checkbox } from '@/components/forms/FormField';
import ADUserSearchInput from './ADUserSearchInput';

const EMPTY_FORM = {
  displayName: '',
  roleIds: [],
};

/**
 * Owns every bit of "Add User" form state itself (candidate search, role
 * checkboxes, saving) instead of that living in the parent UsersPage. Typing
 * in the AD search box or toggling a role checkbox now only re-renders this
 * modal — the parent's stat cards, filters, and user table are untouched
 * until `onCreated` actually fires (a user was successfully added).
 *
 * memo only pays off here because the parent passes `onClose`/`onCreated`
 * as useCallback-wrapped (stable) references — without that, this would
 * still re-render every time UsersPage does (e.g. typing in its unrelated
 * user-search box while this modal happens to be open), since memo's
 * shallow prop check would see "new function" every time otherwise.
 */
function AddUserModal({ open, onClose, onCreated }) {
  const dispatch = useDispatch();
  const roles = useSelector(selectRoles);
  const adCandidates = useSelector(selectAdCandidates);
  const adCandidatesLoading = useSelector(selectAdCandidatesLoading);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchUnregisteredADUsers());
    } else {
      setFormData(EMPTY_FORM);
      setSelectedCandidate(null);
      dispatch(clearAdCandidates());
    }
  }, [open, dispatch]);

  function selectCandidate(candidate) {
    setSelectedCandidate(candidate);
    setFormData((prev) => ({ ...prev, displayName: candidate.username }));
  }

  function clearCandidate() {
    setSelectedCandidate(null);
    setFormData((prev) => ({ ...prev, displayName: '' }));
  }

  function toggleRole(roleId) {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  async function handleSave() {
    if (!selectedCandidate || !formData.roleIds.length) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'Select a user from the list and at least one role.' }));
      return;
    }
    setSaving(true);
    try {
      await dispatch(createUser(formData)).unwrap();
      dispatch(addToast({ type: 'success', title: 'User added', message: `${selectedCandidate.displayName} has been added.` }));
      onCreated();
      onClose();
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Failed to add user', message: err ?? 'Please try again.' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New User"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button icon={UserPlus} onClick={handleSave} loading={saving}>Add User</Button>
        </>
      }
    >
      <div className="space-y-4">
        <ADUserSearchInput
          candidates={adCandidates}
          loading={adCandidatesLoading}
          selected={selectedCandidate}
          onSelect={selectCandidate}
          onClear={clearCandidate}
        />
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Roles <span className="text-primary">*</span></p>
          <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
            {roles.map((role) => (
              <Checkbox
                key={role.id}
                label={role.name}
                checked={formData.roleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default memo(AddUserModal);
