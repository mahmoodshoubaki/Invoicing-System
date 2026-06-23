'use client';

import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  UserPlus,
  Search,
  Edit2,
  UserX,
  UserCheck,
  Users,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { mockUsers } from '@/mock/users';
import { ROLES, ROLE_LIST } from '@/constants/roles';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/Modal';
import { Input, Select, Checkbox } from '@/components/forms/FormField';
import Card from '@/components/common/Card';

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

const EMPTY_FORM = {
  name: '',
  email: '',
  employeeNumber: '',
  department: '',
  roles: [],
  isActive: true,
};

let nextId = 100;

export default function UsersPage() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState(() =>
    mockUsers.map((u) => ({ ...u }))
  );

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const roleCounts = useMemo(() => {
    const counts = {};
    ROLE_LIST.forEach((r) => (counts[r] = 0));
    users.forEach((u) => u.roles.forEach((r) => counts[r]++));
    return counts;
  }, [users]);

  // Filtered
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.employeeNumber.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.roles.includes(roleFilter);
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  function openAdd() {
    setFormData(EMPTY_FORM);
    setAddModal(true);
  }

  function openEdit(user) {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      employeeNumber: user.employeeNumber,
      department: user.department,
      roles: [...user.roles],
      isActive: user.isActive,
    });
    setEditModal(true);
  }

  function openDeactivate(user) {
    setSelectedUser(user);
    setDeactivateModal(true);
  }

  function toggleRole(role) {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  }

  async function handleSaveEdit() {
    if (!formData.roles.length) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'At least one role is required.' }));
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, ...formData } : u
      )
    );
    setSaving(false);
    setEditModal(false);
    dispatch(addToast({ type: 'success', title: 'User updated', message: `${formData.name} has been updated.` }));
  }

  async function handleSaveAdd() {
    if (!formData.name || !formData.email || !formData.roles.length) {
      dispatch(addToast({ type: 'error', title: 'Validation', message: 'Name, email, and at least one role are required.' }));
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const newUser = {
      id: `usr-${++nextId}`,
      ...formData,
      avatar: null,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setSaving(false);
    setAddModal(false);
    dispatch(addToast({ type: 'success', title: 'User added', message: `${formData.name} has been added.` }));
  }

  async function handleDeactivate() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, isActive: !u.isActive } : u
      )
    );
    setSaving(false);
    setDeactivateModal(false);
    const action = selectedUser.isActive ? 'deactivated' : 'activated';
    dispatch(addToast({ type: 'success', title: `User ${action}`, message: `${selectedUser.name} has been ${action}.` }));
  }

  function handleToggleStatus(user) {
    setSelectedUser(user);
    setDeactivateModal(true);
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800">{val}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'employeeNumber',
      label: 'Employee #',
      render: (val) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">{val}</span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
    },
    {
      key: 'roles',
      label: 'Roles',
      sortable: false,
      render: (val) => (
        <div className="flex flex-wrap gap-1">
          {val.map((r) => (
            <Badge key={r} variant={ROLE_BADGE_VARIANT[r] || 'default'} size="sm">
              {r}
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
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="xs" icon={Edit2} onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            icon={row.isActive ? UserX : UserCheck}
            onClick={(e) => { e.stopPropagation(); openDeactivate(row); }}
            className={row.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
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
          <Button icon={UserPlus} onClick={openAdd}>
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
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Admins</p>
              <p className="text-xl font-bold text-primary">{roleCounts[ROLES.ADMIN] || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Project Mgrs</p>
              <p className="text-xl font-bold text-blue-700">{roleCounts[ROLES.PROJECT_MANAGER] || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Role counts row */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROLE_LIST.slice(2).map((role) => (
          <div key={role} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
            <Badge variant={ROLE_BADGE_VARIANT[role] || 'default'} size="sm">{role}</Badge>
            <span className="font-semibold text-gray-600">{roleCounts[role] || 0}</span>
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
            {ROLE_LIST.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        emptyMessage="No users match your search"
      />

      {/* Edit Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit User — ${selectedUser?.name}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditModal(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveEdit} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Employee #" value={formData.employeeNumber} onChange={(e) => setFormData((p) => ({ ...p, employeeNumber: e.target.value }))} />
            <Input label="Department" value={formData.department} onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Roles <span className="text-primary">*</span></p>
            <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              {ROLE_LIST.map((role) => (
                <Checkbox
                  key={role}
                  label={role}
                  checked={formData.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
              ))}
            </div>
          </div>
          <Checkbox
            label="Active Account"
            description="User can log in and access the system"
            checked={formData.isActive}
            onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
          />
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add New User"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddModal(false)} disabled={saving}>Cancel</Button>
            <Button icon={UserPlus} onClick={handleSaveAdd} loading={saving}>Add User</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Ahmed Al-Rashidi" />
          <Input label="Email Address" required type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="a.name@devoteam.com" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Employee Number" value={formData.employeeNumber} onChange={(e) => setFormData((p) => ({ ...p, employeeNumber: e.target.value }))} placeholder="EMP-1001" />
            <Input label="Department" value={formData.department} onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. Finance" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Roles <span className="text-primary">*</span></p>
            <div className="grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
              {ROLE_LIST.map((role) => (
                <Checkbox
                  key={role}
                  label={role}
                  checked={formData.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
              ))}
            </div>
          </div>
          <Checkbox
            label="Active Account"
            description="User can log in immediately after creation"
            checked={formData.isActive}
            onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
          />
        </div>
      </Modal>

      {/* Deactivate / Activate Confirm Modal */}
      <ConfirmModal
        open={deactivateModal}
        onClose={() => setDeactivateModal(false)}
        onConfirm={handleDeactivate}
        loading={saving}
        title={selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
        message={
          selectedUser?.isActive
            ? `Are you sure you want to deactivate ${selectedUser?.name}? They will lose access to the system immediately.`
            : `Are you sure you want to activate ${selectedUser?.name}? They will regain access to the system.`
        }
        confirmLabel={selectedUser?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={selectedUser?.isActive ? 'danger' : 'success'}
      />
    </div>
  );
}
