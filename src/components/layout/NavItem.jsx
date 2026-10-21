'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { usePermission } from '@/hooks/usePermission';
import { selectMyTaskCount } from '@/store/slices/workflowTasksSlice';
import { selectUnseenCount } from '@/store/slices/notificationsSlice';

/** item.permission is a single { module, action } or an array of them (OR logic). */
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
  // A group whose pages live at different addresses (Monitoring: /workflow/runs
  // and /trace) is active, and open, while any one of them is showing.
  const childActive = hasChildren && item.children.some((child) => matches(child.href));

  // null until the person toggles it: until then the group follows the page.
  const [open, setOpen] = useState(null);
  const expanded = open ?? childActive;

  // `exact` stops a parent route claiming its children. /workflow and
  // /workflow/tasks are separate destinations with separate permissions, so a
  // prefix match would light both rows up whenever either is open.
  const isActive = childActive || (item.exact ? pathname === item.href : matches(item.href));
  const { icon: Icon } = item;

  const language = useSelector((s) => s.ui.language);
  const label = language === 'ar' && item.labelAr ? item.labelAr : item.label;

  /**
   * Badge counts, keyed by `item.badge`. A nav item opts in by naming a source
   * rather than each one growing its own selector branch here.
   */
  const badgeCount = useSelector((s) => {
    // Unseen, the same number as the bell — not unread, which only the inbox
    // list knows and would cost a list call per poll.
    if (item.badge === 'unseen') return selectUnseenCount(s);
    // Pending to-dos only — see selectMyTaskCount for why settled rows must not count.
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
              <span className="flex-1 text-left">{label}</span>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </button>
        {expanded && !collapsed && (
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
        {!collapsed && badgeCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
        {collapsed && badgeCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Link>
    </li>
  );
}
