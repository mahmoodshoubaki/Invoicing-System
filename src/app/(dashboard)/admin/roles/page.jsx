'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Shield,
  Plus,
  Trash2,
  Save,
  Check,
  Users,
  ChevronRight,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { usePermission } from '@/hooks/usePermission';
import {
  fetchAllPermissions,
  fetchAllRoles,
  updateRole,
  createRole,
  deleteRole,
  selectPermissionsByModule,
  selectPermissionsLoading,
  selectRoles,
  selectRolesLoading,
} from '@/store/slices/rolesSlice';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/Modal';
import { Input, Textarea, Checkbox } from '@/components/forms/FormField';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function RolesPage() {
  const dispatch = useDispatch();
  const { can } = usePermission();
  const canManage = can('Role', 'Manage');
  const permissionsByModule = useSelector(selectPermissionsByModule);
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const fetchedRoles = useSelector(selectRoles);
  const rolesLoading = useSelector(selectRolesLoading);
  const [roles, setRoles] = useState({});
  const [roleList, setRoleList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchAllPermissions());
    dispatch(fetchAllRoles());
  }, [dispatch]);

  // Seed the local editable copy once real roles arrive.
  useEffect(() => {
    if (fetchedRoles.length === 0) return;
    const state = {};
    fetchedRoles.forEach((r) => {
      state[r.name] = { id: r.id, name: r.name, description: r.description, permissions: [...r.permissionCodes] };
    });
    setRoles(state);
    setRoleList(fetchedRoles.map((r) => r.name));
    setSelectedRole((prev) => prev ?? fetchedRoles[0].name);
  }, [fetchedRoles]);

  const currentRole = roles[selectedRole];

  function togglePermission(code) {
    setRoles((prev) => {
      const perms = prev[selectedRole].permissions;
      const updated = perms.includes(code) ? perms.filter((c) => c !== code) : [...perms, code];
      return { ...prev, [selectedRole]: { ...prev[selectedRole], permissions: updated } };
    });
  }

  function toggleNewRolePerm(code) {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter((c) => c !== code)
        : [...prev.permissions, code],
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await dispatch(updateRole({
        name: currentRole.name,
        description: currentRole.description,
        permissionCodes: currentRole.permissions,
      })).unwrap();
      dispatch(addToast({ type: 'success', title: 'Permissions saved', message: `${selectedRole} permissions have been updated.` }));
      dispatch(fetchAllRoles());
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Failed to save permissions', message: err ?? 'Please try again.' }));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await dispatch(deleteRole(currentRole.id)).unwrap();
      setDeleteModal(false);
      dispatch(addToast({ type: 'success', title: 'Role deleted', message: `Role "${selectedRole}" has been removed.` }));
      setSelectedRole(null);
      dispatch(fetchAllRoles());
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Failed to delete role', message: err ?? 'Please try again.' }));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!newRole.name.trim()) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'Role name is required.' }));
      return;
    }
    if (roleList.includes(newRole.name.trim())) {
      dispatch(addToast({ type: 'error', title: 'Duplicate', message: 'A role with this name already exists.' }));
      return;
    }
    const name = newRole.name.trim();
    setCreating(true);
    try {
      await dispatch(createRole({
        name,
        description: newRole.description,
        permissionCodes: newRole.permissions,
      })).unwrap();
      setSelectedRole(name);
      setCreateModal(false);
      setNewRole({ name: '', description: '', permissions: [] });
      dispatch(addToast({ type: 'success', title: 'Role created', message: `"${name}" has been created.` }));
      dispatch(fetchAllRoles());
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Failed to create role', message: err ?? 'Please try again.' }));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define roles and manage what each role can access"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Roles & Permissions' }]}
        actions={
          canManage ? (
            <Button icon={Plus} onClick={() => { setNewRole({ name: '', description: '', permissions: [] }); setCreateModal(true); }}>
              Create New Role
            </Button>
          ) : null
        }
      />

      {rolesLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
      <div className="flex gap-6 min-h-[600px]">
        {/* Left Panel */}
        <div className="w-1/3 space-y-2">
          {roleList.map((role) => {
            const isSelected = role === selectedRole;
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-red-50 border-primary shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary' : 'bg-gray-100'}`}>
                      <Shield size={15} className={isSelected ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-gray-800'}`}>{role}</p>
                      
                    </div>
                  </div>
                  {isSelected && <ChevronRight size={14} className="text-primary shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Panel */}
        <div className="flex-1">
          {currentRole ? (
            <Card className="h-full">
              {/* Role header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">{selectedRole}</h2>
                  <p className="text-sm text-gray-500 max-w-xl">{currentRole.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {currentRole.permissions.length} permission{currentRole.permissions.length !== 1 ? 's' : ''} granted
                  </p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setDeleteModal(true)}
                      title="Delete role"
                    >
                      Delete
                    </Button>
                    <Button size="sm" icon={Save} onClick={handleSave} loading={saving}>
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {/* Permission Matrix */}
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(permissionsByModule).map(([module, perms]) => (
                    <div key={module}>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{module}</p>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400">
                          {perms.filter((p) => currentRole.permissions.includes(p.code)).length}/{perms.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const granted = currentRole.permissions.includes(perm.code);
                          return (
                            <button
                              key={perm.code}
                              type="button"
                              onClick={() => canManage && togglePermission(perm.code)}
                              disabled={!canManage}
                              title={perm.description}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                                granted
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                              } ${!canManage ? 'cursor-default' : ''}`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${granted ? 'bg-green-500' : 'bg-gray-200'}`}>
                                {granted && <Check size={10} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className="text-xs font-medium">{perm.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64 text-gray-400">
              Select a role to view details
            </Card>
          )}
        </div>
      </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${selectedRole}"? This cannot be undone. Users with this role will need to be reassigned.`}
        confirmLabel="Delete Role"
        confirmVariant="danger"
      />

      {/* Create Role Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Role"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModal(false)} disabled={creating}>Cancel</Button>
            <Button icon={Plus} onClick={handleCreate} loading={creating}>Create Role</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Role Name"
            required
            value={newRole.name}
            onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Finance Reviewer"
          />
          <Textarea
            label="Description"
            value={newRole.description}
            onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe the responsibilities of this role..."
            rows={2}
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Initial Permissions</p>
            <div className="space-y-4">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{module}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <Checkbox
                        key={perm.code}
                        label={perm.name}
                        checked={newRole.permissions.includes(perm.code)}
                        onChange={() => toggleNewRolePerm(perm.code)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
