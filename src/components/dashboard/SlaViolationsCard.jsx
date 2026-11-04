'use client';

import Link from 'next/link';
import { AlertTriangle, Users } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import DashboardListCard from './DashboardListCard';
import LateBadge from './LateBadge';
import { plural, sourceNote } from './sourceNote';

/**
 * The latest workflow tasks past their due date, each opening its run.
 *
 * @param {{ source: { status: string, data: Object|null, error: Error|null, reload: () => void }, href: string }} props
 */
export default function SlaViolationsCard({ source, href }) {
  const tasks = source.data?.tasks ?? [];
  const subtitle = sourceNote(source, `${plural(source.data?.total ?? 0, 'task')} past due`);

  return (
    <DashboardListCard
      title="SLA Violations"
      icon={AlertTriangle}
      subtitle={subtitle}
      source={source}
      isEmpty={tasks.length === 0}
      forbiddenText="You don't have access to workflow runs."
      emptyTitle="Nothing past due"
      emptyText="Every open task is within its due date."
      href={href}
    >
      {tasks.map((t) => (
        <li key={t.taskId}>
          <Link
            href={ROUTES.MONITORING_RUN(t.instanceId)}
            className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#faf9f8]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{t.taskTitle}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
                {t.projectCode ? (
                  <>
                    <span className="font-mono">{t.projectCode}</span>
                    {t.projectName && ` · ${t.projectName}`}
                  </>
                ) : 'No project'}
                {t.stage && ` · ${t.stage}`}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: CHROME.textSecondary }}>
                <Users size={11} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{t.assignees.length > 0 ? t.assignees.join(', ') : 'Nobody'}</span>
              </p>
            </div>
            <LateBadge days={t.daysLate} />
          </Link>
        </li>
      ))}
    </DashboardListCard>
  );
}
