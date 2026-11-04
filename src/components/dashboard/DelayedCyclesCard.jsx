'use client';

import Link from 'next/link';
import { CalendarX } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { formatDate } from '@/utils/formatters';
import DashboardListCard from './DashboardListCard';
import LateBadge from './LateBadge';
import { plural, sourceNote } from './sourceNote';

/**
 * @param {{ source: { status: string, data: Object|null, error: Error|null, reload: () => void }, href: string }} props
 */
export default function DelayedCyclesCard({ source, href }) {
  const data = source.data;
  const cycles = data?.cycles ?? [];
  const subtitle = sourceNote(
    source,
    `${plural(data?.total ?? 0, 'cycle')} late across ${plural(data?.boqCount ?? 0, 'BOQ')}`
  );

  return (
    <DashboardListCard
      title="Delayed BOQ cycles"
      icon={CalendarX}
      subtitle={subtitle}
      source={source}
      isEmpty={cycles.length === 0}
      forbiddenText="You don't have access to BOQs."
      emptyTitle="Nothing late"
      emptyText="Every cycle due so far has an invoice."
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
                <span className="font-mono">{c.projectCode}</span>
                {c.projectName && ` · ${c.projectName}`}
              </p>
              <p className="mt-1 text-xs" style={{ color: CHROME.textSecondary }}>
                Cycle {c.cycleNumber} of {c.totalCycles} · planned {formatDate(c.plannedDate)}
              </p>
            </div>
            <LateBadge days={c.daysLate} />
          </Link>
        </li>
      ))}
    </DashboardListCard>
  );
}
