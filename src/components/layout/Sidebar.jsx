'use client';

import {
  LayoutDashboard, FolderKanban, Receipt,
  GitBranch, Bell, BarChart3, Users, Shield, Settings,
  Building2, X, Menu,
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
    permission: 'project.read',
  },
  {
    label: 'Invoice Requests',
    labelAr: 'طلبات الفاتورة',
    href: '/invoices',
    icon: Receipt,
    permission: 'invoice.read',
  },
  {
    label: 'Workflow',
    labelAr: 'سير العمل',
    href: '/workflow',
    icon: GitBranch,
    permission: 'workflow.read',
  },
  {
    label: 'Notifications',
    labelAr: 'الإشعارات',
    href: '/notifications',
    icon: Bell,
    permission: 'notification.read',
    badge: 'unread',
  },
  {
    label: 'Reports',
    labelAr: 'التقارير',
    href: '/reports',
    icon: BarChart3,
    permission: 'report.read',
  },
  {
    label: 'Admin',
    labelAr: 'الإدارة',
    href: '/admin',
    icon: Shield,
    permission: 'admin.manage',
    children: [
      { label: 'Users', labelAr: 'المستخدمون', href: '/admin/users', icon: Users },
      { label: 'Roles & Permissions', labelAr: 'الأدوار والصلاحيات', href: '/admin/roles', icon: Shield },
      { label: 'Workflow Management', labelAr: 'إدارة سير العمل', href: '/admin/workflow', icon: GitBranch },
      { label: 'System Settings', labelAr: 'إعدادات النظام', href: '/admin/settings', icon: Settings },
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
        className={`fixed top-0 left-0 h-full bg-white z-30 flex flex-col
          transition-all duration-300 ease-in-out border-r border-gray-100
          ${sidebarOpen ? 'w-64' : 'w-16'}
          lg:translate-x-0
        `}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-dark leading-tight truncate">Devoteam</p>
                <p className="text-[10px] text-gray-400 leading-tight truncate">Invoicing System</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Building2 size={16} className="text-white" />
            </div>
          )}
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
