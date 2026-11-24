'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CHROME } from '@/theme/vizPalette';
import DashboardListCard from './DashboardListCard';
import PendingStatusBadge from './lists/PendingStatusBadge';
import { pendingHref, pendingTitle, pendingType, pendingTypeName } from './lists/pendingTypes';
import { sourceNote } from './sourceNote';

/**
 * @param {{ source: { status: string, data: Object|null, error: Error|null, reload: () => void }, money: (v: number) => string, href: string, }} props
 */
export default function PendingApprovalsCard({ source, money, href }) {
  const t = useTranslations('dashboard');
  const items = source.data?.items ?? [];
  const all = (source.data?.byType ?? []).reduce((sum, t) => sum + t.count, 0);

  return (
    <DashboardListCard
      title={t('pending.cardTitle')}
      icon={Clock}
      subtitle={sourceNote(t, source, t('pending.subtitle', { count: all }))}
      source={source}
      isEmpty={items.length === 0}
      forbiddenText={t('pending.forbidden')}
      emptyTitle={t('pending.emptyTitle')}
      emptyText={t('pending.emptyText')}
      href={href}
    >
      {items.map((item) => {
        const kind = pendingType(item.type);
        const Icon = kind?.icon;
        return (
          <li key={`${item.type}-${item.id}`}>
            <Link href={pendingHref(item)} className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#faf9f8]">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                  {Icon && <Icon size={13} className="shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />}
                  <span dir="ltr" className="truncate font-mono">{pendingTitle(t, item)}</span>
                </p>
                <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
                  <span dir="ltr" className="font-mono">{item.projectCode}</span>
                  {item.projectName && ` · ${item.projectName}`}
                </p>
                <p className="mt-1 truncate text-xs" style={{ color: CHROME.textSecondary }}>
                  {pendingTypeName(t, item.type, 'single')}
                  {item.stageTitle && ` · ${item.stageTitle}`}
                  {item.amount != null && <span className="font-semibold text-[#f8485e] tabular-nums"> · <span dir="ltr">{money(item.amount)}</span></span>}
                </p>
              </div>
              <PendingStatusBadge type={item.type} statusId={item.statusId} />
            </Link>
          </li>
        );
      })}
    </DashboardListCard>
  );
}
