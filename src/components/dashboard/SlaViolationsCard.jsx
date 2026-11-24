'use client';

import Link from 'next/link';
import { AlertTriangle, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import DashboardListCard from './DashboardListCard';
import LateBadge from './LateBadge';
import { sourceNote } from './sourceNote';

/**
 * @param {{ source: { status: string, data: Object|null, error: Error|null, reload: () => void }, href: string }} props
 */
export default function SlaViolationsCard({ source, href }) {
  const t = useTranslations('dashboard');
  const tasks = source.data?.tasks ?? [];
  const subtitle = sourceNote(t, source, t('sla.subtitle', { count: source.data?.total ?? 0 }));

  return (
    <DashboardListCard
      title={t('sla.cardTitle')}
      icon={AlertTriangle}
      subtitle={subtitle}
      source={source}
      isEmpty={tasks.length === 0}
      forbiddenText={t('sla.forbidden')}
      emptyTitle={t('sla.emptyTitle')}
      emptyText={t('sla.emptyText')}
      href={href}
    >
      {tasks.map((task) => (
        <li key={task.taskId}>
          <Link
            href={ROUTES.MONITORING_RUN(task.instanceId)}
            className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#faf9f8]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{task.taskTitle}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
                {task.projectCode ? (
                  <>
                    <span dir="ltr" className="font-mono">{task.projectCode}</span>
                    {task.projectName && ` · ${task.projectName}`}
                  </>
                ) : t('lists.noProject')}
                {task.stage && ` · ${task.stage}`}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: CHROME.textSecondary }}>
                <Users size={11} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{task.assignees.length > 0 ? task.assignees.join(', ') : t('lists.nobody')}</span>
              </p>
            </div>
            <LateBadge days={task.daysLate} />
          </Link>
        </li>
      ))}
    </DashboardListCard>
  );
}
