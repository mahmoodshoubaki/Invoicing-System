'use client';

import {
  LayoutDashboard, FolderKanban, Receipt,
  GitBranch, Bell, Users, Shield, ListChecks, Boxes,
  Activity, X, Menu, BellRing, Timer, HardDriveUpload,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import NavItem from './NavItem';
import { APP_SHORT_NAME, APP_VERSION } from '@/constants/appConfig';

const NAV_ITEMS = [
  {
    labelKey: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    labelKey: 'projects',
    href: '/projects',
    icon: FolderKanban,
    permission: { module: 'Projects', action: 'View' },
  },
  {
    labelKey: 'invoiceRequests',
    href: '/invoices',
    icon: Receipt,
    permission: { module: 'Invoices', action: 'View' },
  },
  {
    labelKey: 'myTasks',
    href: '/workflow/tasks',
    icon: ListChecks,
    permission: { module: 'WorkflowTasks', action: 'View' },
    badge: 'workflowTasks',
  },
  {
    labelKey: 'notifications',
    href: '/notifications',
    icon: Bell,
    permission: null,
    badge: 'unseen',
  },
  {
    labelKey: 'admin',
    href: '/admin',
    icon: Shield,
    permission: [
      { module: 'System', action: 'Administrator' },
      { module: 'Role', action: 'View' },
      { module: 'Group', action: 'View' },
      { module: 'Group', action: 'Manage' },
      { module: 'Workflow', action: 'View' },
      { module: 'Workflow', action: 'Manage' },
      { module: 'Notifications', action: 'View' },
      { module: 'Notifications', action: 'Manage' },
      { module: 'Notifications', action: 'Manage Settings' },
      { module: 'System', action: 'Manage Jobs' },
      { module: 'WorkflowInstances', action: 'View' },
    ],
    children: [
      { labelKey: 'users', href: '/admin/users', icon: Users, permission: { module: 'System', action: 'Administrator' } },
      { labelKey: 'rolesAndPermissions', href: '/admin/roles', icon: Shield, permission: { module: 'Role', action: 'View' } },
      {
        labelKey: 'groups',
        href: '/admin/groups',
        icon: Boxes,
        permission: [
          { module: 'Group', action: 'View' },
          { module: 'Group', action: 'Manage' },
        ],
      },
      {
        labelKey: 'workflow',
        href: '/admin/workflow',
        icon: GitBranch,
        permission: [
          { module: 'Workflow', action: 'View' },
          { module: 'Workflow', action: 'Manage' },
        ],
      },
      {
        labelKey: 'notificationSettings',
        href: '/admin/notifications',
        icon: BellRing,
        permission: [
          { module: 'Notifications', action: 'View' },
          { module: 'Notifications', action: 'Manage' },
        ],
      },
      {
        labelKey: 'monitoring',
        href: '/admin/monitoring',
        icon: Activity,
        permission: [
          { module: 'WorkflowInstances', action: 'View' },
          { module: 'Notifications', action: 'Manage Settings' },
          { module: 'Workflow', action: 'Manage' },
        ],
      },
      { labelKey: 'backgroundJobs', href: '/admin/jobs', icon: Timer, permission: { module: 'System', action: 'Manage Jobs' } },
      { labelKey: 'dataMigration', href: '/admin/migration', icon: HardDriveUpload, permission: { module: 'System', action: 'Administrator' } },
    ],
  },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 bg-black/40 z-20 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={`sticky top-16 max-h-[calc(100vh-4rem)] shrink-0 bg-white z-30 flex flex-col
          transition-all duration-300 ease-in-out border-e border-gray-100
          shadow-[2px_0_8px_rgba(0,0,0,0.06)] rtl:shadow-[-2px_0_8px_rgba(0,0,0,0.06)]
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        <div className={`flex items-center h-12 px-4 border-b border-gray-100 shrink-0 ${sidebarOpen ? 'justify-end' : 'justify-center'}`}>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label={t('toggleSidebar')}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.href} item={item} collapsed={!sidebarOpen} />
            ))}
          </ul>
        </nav>

        {sidebarOpen && (
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <p className="text-[10px] text-gray-400 text-center">
              {APP_SHORT_NAME} v{APP_VERSION}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
