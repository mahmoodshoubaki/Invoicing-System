'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSelector } from 'react-redux';
import { usePermission } from '@/hooks/usePermission';
import { selectMyTaskCount } from '@/store/slices/workflowTasksSlice';
import { selectUnseenCount } from '@/store/slices/notificationsSlice';

function isAllowed(can, permission) {
  if (!permission) return true;
  const checks = Array.isArray(permission) ? permission : [permission];
  return checks.some(({ module, action }) => can(module, action));
}

export default function NavItem({ item, depth = 0, collapsed }) {
  const pathname = usePathname();
  const { can } = usePermission();

  const matches = (href) => pathname === href || pathname.startsWith(href + '/');
  const hasChildren = item.children?.length > 0;
  const childActive = hasChildren && item.children.some((child) => matches(child.href));

  const [open, setOpen] = useState(null);
  const expanded = open ?? childActive;

  const isActive = childActive || (item.exact ? pathname === item.href : matches(item.href));
  const { icon: Icon } = item;

  const t = useTranslations('nav');
  const label = t(item.labelKey);

  const badgeCount = useSelector((s) => {
    if (item.badge === 'unseen') return selectUnseenCount(s);
    if (item.badge === 'workflowTasks') return selectMyTaskCount(s);
    return 0;
  });

  if (!isAllowed(can, item.permission)) return null;

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setOpen(!expanded)}
          aria-expanded={expanded}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
            ${isActive
              ? 'bg-primary text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
        >
          <Icon size={18} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-start">{label}</span>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} className="rtl:-scale-x-100" />}
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <ul className="mt-1 ms-4 space-y-0.5 border-s-2 border-gray-100 ps-3">
            {item.children.map((child) => (
              <NavItem key={child.href} item={child} depth={depth + 1} collapsed={collapsed} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative
          ${isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
        title={collapsed ? label : undefined}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="flex-1">{label}</span>}
        {!collapsed && badgeCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
        {collapsed && badgeCount > 0 && (
          <span className="absolute top-1 inset-e-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Link>
    </li>
  );
}
