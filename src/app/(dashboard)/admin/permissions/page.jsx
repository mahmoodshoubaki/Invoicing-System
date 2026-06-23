'use client';

import { useState, useMemo } from 'react';
import { Download, Check, Minus, Filter } from 'lucide-react';
import { ROLES, ROLE_LIST } from '@/constants/roles';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/constants/permissions';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';

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

const ROLE_COL_COLORS = {
  [ROLES.ADMIN]: 'bg-red-50 text-primary border-primary/20',
  [ROLES.PROJECT_MANAGER]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ROLES.INVOICING_TEAM]: 'bg-green-50 text-green-700 border-green-200',
  [ROLES.BDM]: 'bg-purple-50 text-purple-700 border-purple-200',
  [ROLES.DRM]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [ROLES.CRP]: 'bg-amber-50 text-amber-700 border-amber-200',
  [ROLES.BU_HEAD]: 'bg-gray-100 text-gray-800 border-gray-300',
  [ROLES.VIEWER]: 'bg-gray-50 text-gray-500 border-gray-200',
};

const ROLE_CHECK_COLORS = {
  [ROLES.ADMIN]: 'bg-primary text-white',
  [ROLES.PROJECT_MANAGER]: 'bg-blue-500 text-white',
  [ROLES.INVOICING_TEAM]: 'bg-green-500 text-white',
  [ROLES.BDM]: 'bg-purple-500 text-white',
  [ROLES.DRM]: 'bg-yellow-500 text-white',
  [ROLES.CRP]: 'bg-amber-500 text-white',
  [ROLES.BU_HEAD]: 'bg-gray-700 text-white',
  [ROLES.VIEWER]: 'bg-gray-400 text-white',
};

export default function PermissionsPage() {
  const [moduleFilter, setModuleFilter] = useState('All');

  const moduleOptions = ['All', ...Object.keys(PERMISSION_MODULES)];

  const filteredModules = useMemo(() => {
    if (moduleFilter === 'All') return Object.entries(PERMISSION_MODULES);
    return Object.entries(PERMISSION_MODULES).filter(([mod]) => mod === moduleFilter);
  }, [moduleFilter]);

  function exportCSV() {
    const allPerms = Object.values(PERMISSION_MODULES).flat();
    const header = ['Permission', 'Module', ...ROLE_LIST].join(',');
    const rows = allPerms.map((perm) => {
      const module = Object.entries(PERMISSION_MODULES).find(([, perms]) => perms.includes(perm))?.[0] || '';
      const cells = ROLE_LIST.map((role) => (ROLE_PERMISSIONS[role]?.includes(perm) ? 'Yes' : 'No'));
      return [PERMISSION_LABELS[perm] || perm, module, ...cells].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permission-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        subtitle="Read-only overview of all role permissions across modules"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Permissions' }]}
        actions={
          <Button variant="outline" icon={Download} onClick={exportCSV}>
            Export CSV
          </Button>
        }
      />

      {/* Module Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter size={15} className="text-gray-400" />
        {moduleOptions.map((mod) => (
          <button
            key={mod}
            onClick={() => setModuleFilter(mod)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              moduleFilter === mod
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {ROLE_LIST.map((role) => (
          <div key={role} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${ROLE_CHECK_COLORS[role]}`} />
            <span className="text-xs text-gray-600">{role}</span>
          </div>
        ))}
      </div>

      <Card padding={false} className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-52 border-r border-gray-100">
                Permission
              </th>
              {ROLE_LIST.map((role) => (
                <th key={role} className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide whitespace-nowrap border-r border-gray-100 last:border-r-0 ${ROLE_COL_COLORS[role]}`}>
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredModules.map(([module, perms]) => (
              <>
                <tr key={`header-${module}`} className="bg-gray-50/70">
                  <td
                    colSpan={ROLE_LIST.length + 1}
                    className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-100"
                  >
                    {module}
                  </td>
                </tr>
                {perms.map((perm) => (
                  <tr key={perm} className="hover:bg-gray-50/50 transition-colors">
                    <td className="sticky left-0 bg-white z-10 px-4 py-3 font-medium text-gray-700 border-r border-gray-100 whitespace-nowrap">
                      {PERMISSION_LABELS[perm] || perm}
                      <span className="block text-xs font-normal text-gray-400 font-mono">{perm}</span>
                    </td>
                    {ROLE_LIST.map((role) => {
                      const granted = ROLE_PERMISSIONS[role]?.includes(perm);
                      return (
                        <td key={role} className="px-3 py-3 text-center border-r border-gray-50 last:border-r-0">
                          {granted ? (
                            <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${ROLE_CHECK_COLORS[role]}`}>
                              <Check size={12} strokeWidth={2.5} />
                            </div>
                          ) : (
                            <Minus size={14} className="mx-auto text-gray-200" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Summary footer */}
      <div className="mt-4 flex flex-wrap gap-3">
        {ROLE_LIST.map((role) => {
          const count = ROLE_PERMISSIONS[role]?.length || 0;
          const total = Object.values(PERMISSIONS).length;
          return (
            <div key={role} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${ROLE_COL_COLORS[role]}`}>
              <span className="font-semibold">{role}</span>
              <span>{count}/{total} permissions</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
