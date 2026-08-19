'use client';

import {
  LayoutDashboard, FolderKanban, Receipt,
  GitBranch, Bell, BarChart3, Users, Shield, Settings,
  X, Menu,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import NavItem from './NavItem';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    labelAr: 'لوحة التحكم',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    label: 'Projects',
    labelAr: 'المشاريع',
    href: '/projects',
    icon: FolderKanban,
    permission: { module: 'Projects', action: 'View' },
  },
  {
    label: 'Invoice Requests',
    labelAr: 'طلبات الفاتورة',
    href: '/invoices',
    icon: Receipt,
    permission: { module: 'Invoices', action: 'View' },
  },
  {
    label: 'Workflow',
    labelAr: 'سير العمل',
    href: '/workflow',
    icon: GitBranch,
    permission: { module: 'Workflow', action: 'View' },
  },
  {
    label: 'Notifications',
    labelAr: 'الإشعارات',
    href: '/notifications',
    icon: Bell,
    permission: null,
    badge: 'unread',
  },
  {
    label: 'Reports',
    labelAr: 'التقارير',
    href: '/reports',
    icon: BarChart3,
    permission: null,
  },
  {
    label: 'Admin',
    labelAr: 'الإدارة',
    href: '/admin',
    icon: Shield,
    permission: [
      { module: 'System', action: 'Administrator' },
      { module: 'Role', action: 'View' },
      { module: 'Workflow', action: 'Manage' },
    ],
    children: [
      { label: 'Users', labelAr: 'المستخدمون', href: '/admin/users', icon: Users, permission: { module: 'System', action: 'Administrator' } },
      { label: 'Roles & Permissions', labelAr: 'الأدوار والصلاحيات', href: '/admin/roles', icon: Shield, permission: { module: 'Role', action: 'View' } },
      { label: 'Workflow Management', labelAr: 'إدارة سير العمل', href: '/admin/workflow', icon: GitBranch, permission: { module: 'Workflow', action: 'Manage' } },
      { label: 'System Settings', labelAr: 'إعدادات النظام', href: '/admin/settings', icon: Settings, permission: { module: 'System', action: 'Administrator' } },
    ],
  },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-full bg-white z-30 flex flex-col
          transition-all duration-300 ease-in-out border-r border-gray-100
          ${sidebarOpen ? 'w-64' : 'w-16'}
          lg:translate-x-0
        `}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
      >
        <div className={`flex items-center h-12 px-4 border-b border-gray-100 shrink-0 ${sidebarOpen ? 'justify-end' : 'justify-center'}`}>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Toggle sidebar"
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
              Enterprise Invoicing v1.0.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
