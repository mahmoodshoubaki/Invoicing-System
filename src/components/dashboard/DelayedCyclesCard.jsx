'use client';

import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import DashboardListCard from './DashboardListCard';
import LateBadge from './LateBadge';
import { sourceNote } from './sourceNote';

/**
 * @param {{ source: { status: string, data: Object|null, error: Error|null, reload: () => void }, href: string }} props
 */
export default function DelayedCyclesCard({ source, href }) {
  const t = useTranslations('dashboard');
  const format = useLocaleFormat();
  const data = source.data;
  const cycles = data?.cycles ?? [];
  const subtitle = sourceNote(t, source, t('delayed.subtitle', { cycles: data?.total ?? 0, boqs: data?.boqCount ?? 0 }));

  return (
    <DashboardListCard
      title={t('delayed.cardTitle')}
      icon={CalendarX}
      subtitle={subtitle}
      source={source}
      isEmpty={cycles.length === 0}
      forbiddenText={t('delayed.forbidden')}
      emptyTitle={t('delayed.emptyTitle')}
      emptyText={t('delayed.emptyText')}
      href={href}
    >
      {cycles.map((c) => (
        <li key={`${c.boqItemId}-${c.cycleNumber}`}>
          <Link
            href={ROUTES.PROJECT_BOQ_ITEM(encodeURIComponent(c.projectCode), c.boqItemId)}
            className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#faf9f8]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{c.itemName}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
                <span dir="ltr" className="font-mono">{c.projectCode}</span>
                {c.projectName && ` · ${c.projectName}`}
              </p>
              <p className="mt-1 text-xs" style={{ color: CHROME.textSecondary }}>
                {t('delayed.cycleOf', { number: c.cycleNumber, total: c.totalCycles, date: format.date(c.plannedDate) })}
              </p>
            </div>
            <LateBadge days={c.daysLate} />
          </Link>
        </li>
      ))}
    </DashboardListCard>
  );
}
