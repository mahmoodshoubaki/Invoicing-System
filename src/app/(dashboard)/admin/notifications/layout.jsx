'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CHROME } from '@/theme/vizPalette';
import { usePermission } from '@/hooks/usePermission';
import { allow } from '@/constants/workflowPermissions';
import { NOTIFICATION_ADMIN_TABS } from '@/components/notifications/admin/adminTabs';

/**
 * The notifications admin area: one tab bar over every page, showing only the
 * pages this person may open. Each page still checks its own permission (the
 * route guard does too) — the bar only decides what is offered.
 */
export default function NotificationsAdminLayout({ children }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const tabs = NOTIFICATION_ADMIN_TABS.filter((t) => allow(can, t.permission));

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
        Notifications
      </p>
      <nav className="mb-5 flex flex-wrap gap-1 border-b border-[#eceae4]" aria-label="Notifications admin">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className="-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                borderColor: active ? '#d03b3b' : 'transparent',
                color: active ? CHROME.textPrimary : CHROME.textMuted,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
