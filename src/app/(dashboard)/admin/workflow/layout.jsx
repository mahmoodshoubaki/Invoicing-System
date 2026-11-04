'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CHROME } from '@/theme/vizPalette';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants/routes';
import { canOpenWorkflowTab, WORKFLOW_ADMIN_TABS } from '@/components/workflow/admin/workflowAdminTabs';

export default function WorkflowAdminLayout({ children }) {
  const pathname = usePathname();
  const { can } = usePermission();

  if (pathname === ROUTES.WORKFLOW_BUILDER || pathname.startsWith(`${ROUTES.WORKFLOW_BUILDER}/`)) return children;

  const tabs = WORKFLOW_ADMIN_TABS.filter((t) => canOpenWorkflowTab(can, t));

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
        Workflow
      </p>
      <nav className="mb-5 flex flex-wrap gap-1 border-b border-[#eceae4]" aria-label="Workflow">
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
