'use client';

import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
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
import { mockUsers } from '@/mock/users';
import { ROLES, ROLE_LIST } from '@/constants/roles';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/constants/permissions';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/Modal';
import { Input, Textarea, Checkbox } from '@/components/forms/FormField';
import Card from '@/components/common/Card';

const DEFAULT_ROLES = new Set([
  ROLES.ADMIN,
  ROLES.PROJECT_MANAGER,
  ROLES.INVOICING_TEAM,
  ROLES.BDM,
  ROLES.DRM,
  ROLES.CRP,
  ROLES.BU_HEAD,
  ROLES.VIEWER,
]);

const PERMISSION_MODULES = {
  Projects: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_DELETE,
  ],
  BOQ: [
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.BOQ_CREATE,
    PERMISSIONS.BOQ_EDIT,
    PERMISSIONS.BOQ_DELETE,
    PERMISSIONS.BOQ_APPROVE,
  ],
  Invoices: [
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_SUBMIT,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_REJECT,
  ],
  Workflow: [
    PERMISSIONS.WORKFLOW_READ,
    PERMISSIONS.WORKFLOW_MANAGE,
  ],
  Admin: [
    PERMISSIONS.ADMIN_MANAGE,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_ROLES,
  ],
  Notifications: [
    PERMISSIONS.NOTIFICATION_READ,
  ],
  Reports: [
    PERMISSIONS.REPORT_READ,
  ],
};

const PERMISSION_LABELS = {
  [PERMISSIONS.PROJECT_READ]: 'View Projects',
  [PERMISSIONS.PROJECT_CREATE]: 'Create Projects',
  [PERMISSIONS.PROJECT_EDIT]: 'Edit Projects',
  [PERMISSIONS.PROJECT_DELETE]: 'Delete Projects',
  [PERMISSIONS.BOQ_READ]: 'View BOQ Items',
  [PERMISSIONS.BOQ_CREATE]: 'Create BOQ Items',
  [PERMISSIONS.BOQ_EDIT]: 'Edit BOQ Items',
  [PERMISSIONS.BOQ_DELETE]: 'Delete BOQ Items',
  [PERMISSIONS.BOQ_APPROVE]: 'Approve BOQ Items',
  [PERMISSIONS.INVOICE_READ]: 'View Invoices',
  [PERMISSIONS.INVOICE_SUBMIT]: 'Submit Invoices',
  [PERMISSIONS.INVOICE_APPROVE]: 'Approve Invoices',
  [PERMISSIONS.INVOICE_REJECT]: 'Reject Invoices',
  [PERMISSIONS.WORKFLOW_READ]: 'View Workflows',
  [PERMISSIONS.WORKFLOW_MANAGE]: 'Manage Workflows',
  [PERMISSIONS.ADMIN_MANAGE]: 'System Admin',
  [PERMISSIONS.ADMIN_USERS]: 'Manage Users',
  [PERMISSIONS.ADMIN_ROLES]: 'Manage Roles',
  [PERMISSIONS.NOTIFICATION_READ]: 'View Notifications',
  [PERMISSIONS.REPORT_READ]: 'View Reports',
};

const ROLE_BADGE_VARIANT = {
  [ROLES.ADMIN]: 'danger',
  [ROLES.PROJECT_MANAGER]: 'info',
  [ROLES.INVOICING_TEAM]: 'success',
  [ROLES.BDM]: 'purple',
  [ROLES.DRM]: 'warning',
  [ROLES.CRP]: 'accent',
  [ROLES.BU_HEAD]: 'dark',
  [ROLES.VIEWER]: 'default',
};

function buildInitialRoleState() {
  const state = {};
  ROLE_LIST.forEach((role) => {
    state[role] = {
      name: role,
      description: getRoleDescription(role),
      permissions: [...(ROLE_PERMISSIONS[role] || [])],
      isDefault: true,
    };
  });
  return state;
}

function getRoleDescription(role) {
  const desc = {
    [ROLES.ADMIN]: 'Full system access. Can manage all users, roles, workflows, and configurations.',
    [ROLES.PROJECT_MANAGER]: 'Manages projects and BOQ submissions. Can submit invoices for review.',
    [ROLES.INVOICING_TEAM]: 'Reviews and approves BOQ items and invoice requests.',
    [ROLES.BDM]: 'Business Development Manager. Creates projects and monitors revenue.',
    [ROLES.DRM]: 'Delivery & Revenue Manager. Oversees project delivery and commercial reviews.',
    [ROLES.CRP]: 'Client Relationship Partner. Compliance checks on high-value invoices.',
    [ROLES.BU_HEAD]: 'Business Unit Head. Final approval authority for invoices and BOQ.',
    [ROLES.VIEWER]: 'Read-only access across projects, BOQ, and invoices.',
  };
  return desc[role] || '';
}

export default function RolesPage() {
  const dispatch = useDispatch();
  const [roles, setRoles] = useState(buildInitialRoleState);
  const [roleList, setRoleList] = useState(ROLE_LIST);
  const [selectedRole, setSelectedRole] = useState(ROLE_LIST[0]);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] });
  const [creating, setCreating] = useState(false);

  const userCountByRole = useMemo(() => {
    const counts = {};
    roleList.forEach((r) => (counts[r] = 0));
    mockUsers.forEach((u) => u.roles.forEach((r) => { if (counts[r] !== undefined) counts[r]++; }));
    return counts;
  }, [roleList]);

  const currentRole = roles[selectedRole];

  function togglePermission(perm) {
    setRoles((prev) => {
      const perms = prev[selectedRole].permissions;
      const updated = perms.includes(perm) ? perms.filter((p) => p !== perm) : [...perms, perm];
      return { ...prev, [selectedRole]: { ...prev[selectedRole], permissions: updated } };
    });
  }

  function toggleNewRolePerm(perm) {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    dispatch(addToast({ type: 'success', title: 'Permissions saved', message: `${selectedRole} permissions have been updated.` }));
  }

  async function handleDelete() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    const newList = roleList.filter((r) => r !== selectedRole);
    setRoleList(newList);
    const newRoles = { ...roles };
    delete newRoles[selectedRole];
    setRoles(newRoles);
    setSelectedRole(newList[0]);
    setSaving(false);
    setDeleteModal(false);
    dispatch(addToast({ type: 'success', title: 'Role deleted', message: `Role "${selectedRole}" has been removed.` }));
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
    setCreating(true);
    await new Promise((r) => setTimeout(r, 600));
    const name = newRole.name.trim();
    setRoleList((prev) => [...prev, name]);
    setRoles((prev) => ({
      ...prev,
      [name]: { name, description: newRole.description, permissions: [...newRole.permissions], isDefault: false },
    }));
    setSelectedRole(name);
    setCreating(false);
    setCreateModal(false);
    setNewRole({ name: '', description: '', permissions: [] });
    dispatch(addToast({ type: 'success', title: 'Role created', message: `"${name}" has been created.` }));
  }

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define roles and manage what each role can access"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Roles & Permissions' }]}
        actions={
          <Button icon={Plus} onClick={() => { setNewRole({ name: '', description: '', permissions: [] }); setCreateModal(true); }}>
            Create New Role
          </Button>
        }
      />

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
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Users size={11} />
                        {userCountByRole[role] ?? 0} users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {roles[role] && !roles[role].isDefault && (
                      <Badge variant="accent" size="sm">Custom</Badge>
                    )}
                    {isSelected && <ChevronRight size={14} className="text-primary" />}
                  </div>
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
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-800">{selectedRole}</h2>
                    {!currentRole.isDefault && <Badge variant="accent" size="sm">Custom</Badge>}
                    {currentRole.isDefault && DEFAULT_ROLES.has(selectedRole) && <Badge variant="default" size="sm">System Role</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 max-w-xl">{currentRole.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {currentRole.permissions.length} of {Object.values(PERMISSIONS).length} permissions granted
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setDeleteModal(true)}
                    disabled={DEFAULT_ROLES.has(selectedRole)}
                    title={DEFAULT_ROLES.has(selectedRole) ? 'Cannot delete system roles' : 'Delete role'}
                  >
                    Delete
                  </Button>
                  <Button size="sm" icon={Save} onClick={handleSave} loading={saving}>
                    Save
                  </Button>
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="space-y-5">
                {Object.entries(PERMISSION_MODULES).map(([module, perms]) => (
                  <div key={module}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{module}</p>
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400">
                        {perms.filter((p) => currentRole.permissions.includes(p)).length}/{perms.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const granted = currentRole.permissions.includes(perm);
                        return (
                          <button
                            key={perm}
                            onClick={() => togglePermission(perm)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                              granted
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${granted ? 'bg-green-500' : 'bg-gray-200'}`}>
                              {granted && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-xs font-medium">{PERMISSION_LABELS[perm] || perm}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64 text-gray-400">
              Select a role to view permissions
            </Card>
          )}
        </div>
      </div>

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
              {Object.entries(PERMISSION_MODULES).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{module}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <Checkbox
                        key={perm}
                        label={PERMISSION_LABELS[perm] || perm}
                        checked={newRole.permissions.includes(perm)}
                        onChange={() => toggleNewRolePerm(perm)}
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
