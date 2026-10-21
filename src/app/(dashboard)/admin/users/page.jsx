'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  UserPlus,
  Search,
  Edit2,
  UserX,
  UserCheck,
  Users,
  Filter,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import {
  fetchAuthorizedUsers,
  updateUser,
  selectUsers,
  selectUsersLoading,
} from '@/store/slices/usersSlice';
import { fetchAllRoles, selectRoles, selectRolesLoading } from '@/store/slices/rolesSlice';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import { Checkbox } from '@/components/forms/FormField';
import Card from '@/components/common/Card';
import AddUserModal from '@/components/admin/AddUserModal';

export default function UsersPage() {
  const dispatch = useDispatch();
  const fetchedUsers = useSelector(selectUsers);
  const usersLoading = useSelector(selectUsersLoading);
  const roles = useSelector(selectRoles);
  const rolesLoading = useSelector(selectRolesLoading);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRoleIds, setEditRoleIds] = useState([]);
  // 'Notify the user about this change' — ticked each time a dialog opens.
  const [notifyUser, setNotifyUser] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // GetAuthorizedUsers returns active users by default. This screen is where
    // a user gets reactivated, so it has to ask for the inactive ones too —
    // without this a deactivated account disappears from the only page that
    // could bring it back.
    dispatch(fetchAuthorizedUsers({ includeInactive: true }));
    dispatch(fetchAllRoles());
  }, [dispatch]);

  // Seed the local editable copy once the real list arrives.
  useEffect(() => {
    setUsers(fetchedUsers.map((u) => ({ ...u })));
  }, [fetchedUsers]);

  const roleNameById = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.id, r.name])),
    [roles]
  );

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const roleCounts = useMemo(() => {
    const counts = {};
    roles.forEach((r) => (counts[r.id] = 0));
    users.forEach((u) => u.roleIds.forEach((id) => { if (counts[id] !== undefined) counts[id]++; }));
    return counts;
  }, [users, roles]);

  // Filtered
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.roleIds.includes(roleFilter);
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  // Stable references — AddUserModal is memoized, and without useCallback
  // here it would get a brand-new function on every UsersPage render (e.g.
  // typing in the search box below while the modal happens to be open),
  // which defeats that memo just as surely as not memoizing at all.
  const closeAddModal = useCallback(() => setAddModal(false), []);
  const handleUserCreated = useCallback(() => { dispatch(fetchAuthorizedUsers({ includeInactive: true })); }, [dispatch]);

  function openEdit(user) {
    setSelectedUser(user);
    setEditRoleIds([...user.roleIds]);
    setNotifyUser(true);
    setEditModal(true);
  }

  function closeEdit() {
    setEditModal(false);
    setSelectedUser(null);
  }

  function toggleEditRole(roleId) {
    setEditRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  async function handleSaveEdit() {
    if (!editRoleIds.length) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'At least one role is required.' }));
      return;
    }
    setSaving(true);
    try {
      await dispatch(updateUser({ ...selectedUser, roleIds: editRoleIds, notifyUser })).unwrap();
      dispatch(addToast({ type: 'success', title: 'Roles updated', message: `${selectedUser.username}'s roles have been updated.` }));
      closeEdit();
      dispatch(fetchAuthorizedUsers({ includeInactive: true }));
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Failed to update roles', message: err ?? 'Please try again.' }));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setSaving(true);
    const action = selectedUser.isActive ? 'deactivated' : 'activated';
    try {
      await dispatch(updateUser({ ...selectedUser, isActive: !selectedUser.isActive, notifyUser })).unwrap();
      dispatch(addToast({ type: 'success', title: `User ${action}`, message: `${selectedUser.username} has been ${action}.` }));
      setDeactivateModal(false);
      dispatch(fetchAuthorizedUsers({ includeInactive: true }));
    } catch (err) {
      dispatch(addToast({ type: 'error', title: `Failed to change status`, message: err ?? 'Please try again.' }));
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(user) {
    setSelectedUser(user);
    setNotifyUser(true);
    setDeactivateModal(true);
  }

  const columns = [
    {
      key: 'username',
      label: 'Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'displayName',
      label: 'Username',
      render: (val) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">{val}</span>
      ),
    },
    {
      key: 'roleIds',
      label: 'Roles',
      sortable: false,
      render: (val) => (
        <div className="flex flex-wrap gap-1">
          {val.map((id) => (
            <Badge key={id} size="sm">
              {roleNameById[id] ?? id}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${val ? 'bg-green-500' : 'bg-gray-300'}`}
          title={val ? 'Active — click to deactivate' : 'Inactive — click to activate'}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${val ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <Button variant="ghost" size="xs" icon={Edit2} onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
          Edit Roles
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users, roles, and access control"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={
          <Button icon={UserPlus} onClick={() => setAddModal(true)}>
            Add User
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Users</p>
              <p className="text-xl font-bold text-gray-800">{totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <UserCheck size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-xl font-bold text-green-700">{activeUsers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Role counts row */}
      <div className="flex flex-wrap gap-2 mb-5">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
            <Badge size="sm">{role.name}</Badge>
            <span className="font-semibold text-gray-600">{roleCounts[role.id] || 0}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:border-primary focus:outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        rowKey="email"
        isLoading={usersLoading || rolesLoading}
        emptyMessage="No users match your search"
      />

      <AddUserModal
        open={addModal}
        onClose={closeAddModal}
        onCreated={handleUserCreated}
      />

      {/* Edit Roles Modal */}
      <Modal
        open={editModal}
        onClose={closeEdit}
        title={`Edit Roles — ${selectedUser?.username}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-2.5 border border-gray-100 bg-gray-50 rounded-lg">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{selectedUser?.username}</p>
              <p className="text-xs text-gray-500 truncate">
                <span className="font-mono">{selectedUser?.displayName}</span>
                {selectedUser?.email && <span className="text-gray-400"> · {selectedUser.email}</span>}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Roles <span className="text-primary">*</span></p>
            <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              {roles.map((role) => (
                <Checkbox
                  key={role.id}
                  label={role.name}
                  checked={editRoleIds.includes(role.id)}
                  onChange={() => toggleEditRole(role.id)}
                />
              ))}
            </div>
          </div>
          <Checkbox
            label="Notify the user about this change"
            description="If their roles change, they are told the before and after, by email and in the bell."
            checked={notifyUser}
            onChange={(e) => setNotifyUser(e.target.checked)}
          />
        </div>
      </Modal>

      {/* Deactivate / Activate Confirm Modal */}
      <Modal
        open={deactivateModal}
        onClose={() => setDeactivateModal(false)}
        title={selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeactivateModal(false)} disabled={saving}>Cancel</Button>
            <Button
              variant={selectedUser?.isActive ? 'danger' : 'success'}
              onClick={handleDeactivate}
              loading={saving}
            >
              {selectedUser?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedUser?.isActive
              ? `Are you sure you want to deactivate ${selectedUser?.username}? They will lose access to the system immediately.`
              : `Are you sure you want to activate ${selectedUser?.username}? They will regain access to the system.`}
          </p>
          <Checkbox
            label="Notify the user about this change"
            description={selectedUser?.isActive
              ? 'They get an email saying their access was turned off. Email only, since they can no longer see the bell.'
              : 'They are told their access is back, with their roles, by email and in the bell.'}
            checked={notifyUser}
            onChange={(e) => setNotifyUser(e.target.checked)}
          />
        </div>
      </Modal>
    </div>
  );
}
