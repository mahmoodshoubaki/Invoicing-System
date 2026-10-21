'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CHROME } from '@/theme/vizPalette';
import { usePermission } from '@/hooks/usePermission';
import { canOpenTab, MONITORING_TABS } from '@/components/monitoring/monitoringTabs';

/**
 * Admin › Monitoring: one tab bar over every page, showing only the pages this
 * person may open. Each page still checks its own permission (the route guard
 * does too) — the bar only decides what is offered. A run or a delivery opened
 * from a list keeps its list's tab lit.
 */
export default function MonitoringLayout({ children }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const tabs = MONITORING_TABS.filter((t) => canOpenTab(can, t));

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
        Monitoring
      </p>
      <nav className="mb-5 flex flex-wrap gap-1 border-b border-[#eceae4]" aria-label="Monitoring">
        {tabs.map((tab) => {
          const base = tab.href.split('?')[0];
          const active = pathname === base || pathname.startsWith(`${base}/`);
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
