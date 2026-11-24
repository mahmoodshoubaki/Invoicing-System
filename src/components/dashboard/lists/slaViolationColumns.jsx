import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import LateBadge from '../LateBadge';
import ProjectCell from './ProjectCell';
import ViewLink from './ViewLink';

export const slaViolationHref = (row) => ROUTES.MONITORING_RUN(row.instanceId);

/**
 * @param {(key: string, values?: Object) => string} t translator for the `dashboard` namespace
 * @param {ReturnType<import('@/hooks/useLocaleFormat').useLocaleFormat>} format
 */
export function slaViolationColumns(t, format) {
  return [
    {
      key: 'taskTitle',
      label: t('sla.columns.task'),
      render: (val) => <span className="text-sm font-medium" style={{ color: CHROME.textPrimary }}>{val || '—'}</span>,
    },
    { key: 'projectCode', label: t('sla.columns.project'), render: (code, row) => <ProjectCell code={code} name={row.projectName} /> },
    {
      key: 'stage',
      label: t('sla.columns.stage'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>,
    },
    {
      key: 'assignees',
      label: t('sla.columns.assignedTo'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val.length > 0 ? val.join(', ') : t('lists.nobody')}</span>,
    },
    {
      key: 'dueOn',
      label: t('sla.columns.due'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{format.dateTime(val) || '—'}</span>,
    },
    { key: 'daysLate', label: t('sla.columns.late'), render: (val) => <LateBadge days={val} /> },
    { key: 'actions', label: '', resizable: false, render: (_, row) => <ViewLink href={slaViolationHref(row)} label={t('lists.openRun')} /> },
  ];
}
