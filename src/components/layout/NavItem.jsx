'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { usePermission } from '@/hooks/usePermission';

/** item.permission is a single { module, action } or an array of them (OR logic). */
function isAllowed(can, permission) {
  if (!permission) return true;
  const checks = Array.isArray(permission) ? permission : [permission];
  return checks.some(({ module, action }) => can(module, action));
}

export default function NavItem({ item, depth = 0, collapsed }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const [open, setOpen] = useState(false);

  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children?.length > 0;
  const { icon: Icon } = item;

  const language = useSelector((s) => s.ui.language);
  const label = language === 'ar' && item.labelAr ? item.labelAr : item.label;

  const unreadCount = useSelector((s) =>
    item.badge === 'unread' ? s.notifications.unreadCount : 0
  );

  if (!isAllowed(can, item.permission)) return null;

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setOpen((v) => !v)}
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
              <span className="flex-1 text-left">{label}</span>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <ul className="mt-1 ml-4 space-y-0.5 border-l-2 border-gray-100 pl-3">
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
        {!collapsed && unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {collapsed && unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Link>
    </li>
  );
}
